using Application.DTOs.Common;
using Application.DTOs.Products;
using Application.Interfaces;
using AutoMapper;
using Domain.Entities;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Services;

/// <summary>
/// Product service implementation
/// </summary>
public class ProductService : IProductService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<ProductService> _logger;

    public ProductService(IUnitOfWork unitOfWork, IMapper mapper, ILogger<ProductService> logger)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<ApiResponse<ProductDto>> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var product = await _unitOfWork.Products.GetWithBatchesAsync(id, cancellationToken);
            if (product == null)
            {
                return ApiResponse<ProductDto>.Fail($"Product with ID {id} not found");
            }

            var dto = _mapper.Map<ProductDto>(product);
            dto.EarliestExpiryDate = product.Batches
                .Where(b => b.IsActive && b.RemainingQuantity > 0 && b.ExpiryDate >= DateTime.UtcNow)
                .OrderBy(b => b.ExpiryDate)
                .Select(b => (DateTime?)b.ExpiryDate)
                .FirstOrDefault();
            return ApiResponse<ProductDto>.Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting product by ID {Id}", id);
            return ApiResponse<ProductDto>.Fail("An error occurred while retrieving the product");
        }
    }

    public async Task<ApiResponse<IEnumerable<ProductDto>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var products = await _unitOfWork.Products.GetAllAsync(cancellationToken);
            var dtos = _mapper.Map<IEnumerable<ProductDto>>(products);

            var productIds = products.Select(p => p.Id).ToList();
            var expiryByProductId = await GetEarliestExpiryByProductIdAsync(productIds, cancellationToken);
            foreach (var dto in dtos)
            {
                dto.EarliestExpiryDate = expiryByProductId.GetValueOrDefault(dto.Id);
            }

            return ApiResponse<IEnumerable<ProductDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all products");
            return ApiResponse<IEnumerable<ProductDto>>.Fail("An error occurred while retrieving products");
        }
    }

    public async Task<PagedResponse<ProductSummaryDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? search = null,
        int? categoryId = null,
        int? manufacturerId = null,
        bool? activeOnly = true,
        decimal? minPrice = null,
        decimal? maxPrice = null,
        string? stockStatus = null,
        bool? requiresPrescription = null,
        bool? hasBarcode = null,
        string? expiryStatus = null,
        string? sortBy = null,
        string? sortDirection = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            IQueryable<Product> query = _unitOfWork.Products.AsQueryable()
                .Include(p => p.Category)
                .Include(p => p.Manufacturer);

            // Apply filters
            if (!string.IsNullOrEmpty(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(p => 
                    p.Name.ToLower().Contains(searchLower) ||
                    p.NameLocal.ToLower().Contains(searchLower) ||
                    p.SKU.ToLower().Contains(searchLower) ||
                    (p.Barcode != null && p.Barcode.ToLower().Contains(searchLower)));
            }

            if (categoryId.HasValue)
            {
                query = query.Where(p => p.CategoryId == categoryId.Value);
            }

            if (manufacturerId.HasValue)
            {
                query = query.Where(p => p.ManufacturerId == manufacturerId.Value);
            }

            if (activeOnly == true)
            {
                query = query.Where(p => p.IsActive);
            }

            // Advanced filters
            if (minPrice.HasValue)
            {
                query = query.Where(p => p.UnitPrice >= minPrice.Value);
            }

            if (maxPrice.HasValue)
            {
                query = query.Where(p => p.UnitPrice <= maxPrice.Value);
            }

            if (!string.IsNullOrEmpty(stockStatus))
            {
                query = stockStatus switch
                {
                    "inStock" => query.Where(p => p.StockQuantity > p.ReorderLevel),
                    "lowStock" => query.Where(p => p.StockQuantity > 0 && p.StockQuantity <= p.ReorderLevel),
                    "outOfStock" => query.Where(p => p.StockQuantity <= 0),
                    _ => query
                };
            }

            if (requiresPrescription.HasValue)
            {
                query = query.Where(p => p.RequiresPrescription == requiresPrescription.Value);
            }

            if (hasBarcode.HasValue)
            {
                query = hasBarcode.Value 
                    ? query.Where(p => p.Barcode != null && p.Barcode != "")
                    : query.Where(p => p.Barcode == null || p.Barcode == "");
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync(cancellationToken);

            // Apply sorting
            var isDescending = sortDirection?.ToLower() == "desc";
            query = sortBy?.ToLower() switch
            {
                "name" => isDescending ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
                "unitprice" => isDescending ? query.OrderByDescending(p => p.UnitPrice) : query.OrderBy(p => p.UnitPrice),
                "stockquantity" => isDescending ? query.OrderByDescending(p => p.StockQuantity) : query.OrderBy(p => p.StockQuantity),
                "createdat" => isDescending ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt),
                "categoryname" => isDescending ? query.OrderByDescending(p => p.Category != null ? p.Category.Name : "") : query.OrderBy(p => p.Category != null ? p.Category.Name : ""),
                "manufacturername" => isDescending ? query.OrderByDescending(p => p.Manufacturer != null ? p.Manufacturer.Name : "") : query.OrderBy(p => p.Manufacturer != null ? p.Manufacturer.Name : ""),
                _ => query.OrderBy(p => p.Name)
            };

            // Apply pagination
            var products = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            var dtos = _mapper.Map<List<ProductSummaryDto>>(products);

            var productIds = products.Select(p => p.Id).ToList();
            var expiryByProductId = await GetEarliestExpiryByProductIdAsync(productIds, cancellationToken);
            foreach (var dto in dtos)
            {
                dto.EarliestExpiryDate = expiryByProductId.GetValueOrDefault(dto.Id);
            }

            return PagedResponse<ProductSummaryDto>.Create(dtos, totalCount, page, pageSize);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting paged products");
            return PagedResponse<ProductSummaryDto>.Create(new List<ProductSummaryDto>(), 0, page, pageSize);
        }
    }

    public async Task<ApiResponse<IEnumerable<ProductSummaryDto>>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default)
    {
        try
        {
            var products = await _unitOfWork.Products.SearchAsync(searchTerm, cancellationToken);
            var dtos = _mapper.Map<List<ProductSummaryDto>>(products);

            var productIds = products.Select(p => p.Id).ToList();
            var expiryByProductId = await GetEarliestExpiryByProductIdAsync(productIds, cancellationToken);
            foreach (var dto in dtos)
            {
                dto.EarliestExpiryDate = expiryByProductId.GetValueOrDefault(dto.Id);
            }
            return ApiResponse<IEnumerable<ProductSummaryDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching products with term {SearchTerm}", searchTerm);
            return ApiResponse<IEnumerable<ProductSummaryDto>>.Fail("An error occurred while searching products");
        }
    }

    private async Task<Dictionary<int, DateTime?>> GetEarliestExpiryByProductIdAsync(
        IReadOnlyCollection<int> productIds,
        CancellationToken cancellationToken)
    {
        if (productIds.Count == 0)
            return new Dictionary<int, DateTime?>();

        var now = DateTime.UtcNow;

        var query = _unitOfWork.Products.AsQueryable()
            .SelectMany(p => p.Batches)
            .Where(b => productIds.Contains(b.ProductId) && b.IsActive && b.RemainingQuantity > 0 && b.ExpiryDate >= now)
            .GroupBy(b => b.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                EarliestExpiryDate = (DateTime?)g.Min(b => b.ExpiryDate)
            });

        var rows = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(query, cancellationToken);
        return rows.ToDictionary(x => x.ProductId, x => x.EarliestExpiryDate);
    }

    public async Task<ApiResponse<IEnumerable<ProductDto>>> GetByCategoryAsync(int categoryId, CancellationToken cancellationToken = default)
    {
        try
        {
            var products = await _unitOfWork.Products.GetByCategoryAsync(categoryId, cancellationToken);
            var dtos = _mapper.Map<IEnumerable<ProductDto>>(products);
            return ApiResponse<IEnumerable<ProductDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting products by category {CategoryId}", categoryId);
            return ApiResponse<IEnumerable<ProductDto>>.Fail("An error occurred while retrieving products");
        }
    }

    public async Task<ApiResponse<IEnumerable<ProductDto>>> GetByManufacturerAsync(int manufacturerId, CancellationToken cancellationToken = default)
    {
        try
        {
            var products = await _unitOfWork.Products.GetByManufacturerAsync(manufacturerId, cancellationToken);
            var dtos = _mapper.Map<IEnumerable<ProductDto>>(products);
            return ApiResponse<IEnumerable<ProductDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting products by manufacturer {ManufacturerId}", manufacturerId);
            return ApiResponse<IEnumerable<ProductDto>>.Fail("An error occurred while retrieving products");
        }
    }

    public async Task<ApiResponse<IEnumerable<ProductDto>>> GetLowStockAsync(int threshold, CancellationToken cancellationToken = default)
    {
        try
        {
            // Use repository method and filter by threshold
            var products = await _unitOfWork.Products.GetLowStockProductsAsync(cancellationToken);
            // Filter by threshold if needed (repository returns products below reorder level)
            var dtos = _mapper.Map<IEnumerable<ProductDto>>(products);
            return ApiResponse<IEnumerable<ProductDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting low stock products with threshold {Threshold}", threshold);
            return ApiResponse<IEnumerable<ProductDto>>.Fail("An error occurred while retrieving products");
        }
    }

    public async Task<ApiResponse<ProductDto>> CreateAsync(CreateProductDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            // Check if SKU already exists
            var existingProduct = await _unitOfWork.Products.GetBySKUAsync(dto.SKU, cancellationToken);
            if (existingProduct != null)
            {
                return ApiResponse<ProductDto>.Fail($"Product with SKU '{dto.SKU}' already exists");
            }

            // Validate category exists
            var category = await _unitOfWork.Categories.GetByIdAsync(dto.CategoryId, cancellationToken);
            if (category == null)
            {
                return ApiResponse<ProductDto>.Fail($"Category with ID {dto.CategoryId} not found");
            }

            // Validate manufacturer exists
            var manufacturer = await _unitOfWork.Manufacturers.GetByIdAsync(dto.ManufacturerId, cancellationToken);
            if (manufacturer == null)
            {
                return ApiResponse<ProductDto>.Fail($"Manufacturer with ID {dto.ManufacturerId} not found");
            }

            var product = _mapper.Map<Product>(dto);
            await _unitOfWork.Products.AddAsync(product, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Created product {ProductId} with SKU {SKU}", product.Id, product.SKU);

            var resultDto = _mapper.Map<ProductDto>(product);
            return ApiResponse<ProductDto>.Ok(resultDto, "Product created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating product with SKU {SKU}", dto.SKU);
            return ApiResponse<ProductDto>.Fail("An error occurred while creating the product");
        }
    }

    public async Task<ApiResponse<ProductDto>> UpdateAsync(int id, UpdateProductDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var product = await _unitOfWork.Products.GetByIdAsync(id, cancellationToken);
            if (product == null)
            {
                return ApiResponse<ProductDto>.Fail($"Product with ID {id} not found");
            }

            // Validate category if changed
            if (dto.CategoryId != product.CategoryId)
            {
                var category = await _unitOfWork.Categories.GetByIdAsync(dto.CategoryId, cancellationToken);
                if (category == null)
                {
                    return ApiResponse<ProductDto>.Fail($"Category with ID {dto.CategoryId} not found");
                }
            }

            // Validate manufacturer if changed
            if (dto.ManufacturerId != product.ManufacturerId)
            {
                var manufacturer = await _unitOfWork.Manufacturers.GetByIdAsync(dto.ManufacturerId, cancellationToken);
                if (manufacturer == null)
                {
                    return ApiResponse<ProductDto>.Fail($"Manufacturer with ID {dto.ManufacturerId} not found");
                }
            }

            _mapper.Map(dto, product);
            await _unitOfWork.Products.UpdateAsync(product, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Updated product {ProductId}", id);

            var resultDto = _mapper.Map<ProductDto>(product);
            return ApiResponse<ProductDto>.Ok(resultDto, "Product updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating product {ProductId}", id);
            return ApiResponse<ProductDto>.Fail("An error occurred while updating the product");
        }
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var product = await _unitOfWork.Products.GetByIdAsync(id, cancellationToken);
            if (product == null)
            {
                return ApiResponse<bool>.Fail($"Product with ID {id} not found");
            }

            // Check if product has orders (soft delete instead)
            if (product.OrderItems != null && product.OrderItems.Any())
            {
                product.IsActive = false;
                await _unitOfWork.Products.UpdateAsync(product, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                
                _logger.LogInformation("Soft deleted product {ProductId} (has order history)", id);
                return ApiResponse<bool>.Ok(true, "Product deactivated (has order history)");
            }

            await _unitOfWork.Products.DeleteAsync(product, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Deleted product {ProductId}", id);
            return ApiResponse<bool>.Ok(true, "Product deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting product {ProductId}", id);
            return ApiResponse<bool>.Fail("An error occurred while deleting the product");
        }
    }

    public async Task<ApiResponse<bool>> ActivateAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var product = await _unitOfWork.Products.GetByIdAsync(id, cancellationToken);
            if (product == null)
            {
                return ApiResponse<bool>.Fail($"Product with ID {id} not found");
            }

            product.IsActive = true;
            product.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.Products.UpdateAsync(product, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Activated product {ProductId}", id);
            return ApiResponse<bool>.Ok(true, "Product activated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error activating product {ProductId}", id);
            return ApiResponse<bool>.Fail("An error occurred while activating the product");
        }
    }

    public async Task<ApiResponse<bool>> DeactivateAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var product = await _unitOfWork.Products.GetByIdAsync(id, cancellationToken);
            if (product == null)
            {
                return ApiResponse<bool>.Fail($"Product with ID {id} not found");
            }

            product.IsActive = false;
            product.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.Products.UpdateAsync(product, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Deactivated product {ProductId}", id);
            return ApiResponse<bool>.Ok(true, "Product deactivated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deactivating product {ProductId}", id);
            return ApiResponse<bool>.Fail("An error occurred while deactivating the product");
        }
    }

    // Batch operations
    public async Task<ApiResponse<ProductBatchDto>> GetBatchByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var batches = await _unitOfWork.Products.AsQueryable()
                .SelectMany(p => p.Batches)
                .Where(b => b.Id == id)
                .ToListAsync(cancellationToken);

            var batch = batches.FirstOrDefault();
            if (batch == null)
            {
                return ApiResponse<ProductBatchDto>.Fail($"Product batch with ID {id} not found");
            }

            var dto = _mapper.Map<ProductBatchDto>(batch);
            return ApiResponse<ProductBatchDto>.Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting product batch by ID {Id}", id);
            return ApiResponse<ProductBatchDto>.Fail("An error occurred while retrieving the product batch");
        }
    }

    public async Task<ApiResponse<IEnumerable<ProductBatchDto>>> GetBatchesByProductAsync(int productId, CancellationToken cancellationToken = default)
    {
        try
        {
            var product = await _unitOfWork.Products.GetByIdAsync(productId, cancellationToken);
            if (product == null)
            {
                return ApiResponse<IEnumerable<ProductBatchDto>>.Fail($"Product with ID {productId} not found");
            }

            var dtos = _mapper.Map<IEnumerable<ProductBatchDto>>(product.Batches);
            return ApiResponse<IEnumerable<ProductBatchDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting batches for product {ProductId}", productId);
            return ApiResponse<IEnumerable<ProductBatchDto>>.Fail("An error occurred while retrieving product batches");
        }
    }

    public async Task<ApiResponse<IEnumerable<ProductBatchDto>>> GetExpiringBatchesAsync(int daysUntilExpiry, CancellationToken cancellationToken = default)
    {
        try
        {
            var expiryDate = DateTime.UtcNow.AddDays(daysUntilExpiry);
            var batches = await _unitOfWork.Products.AsQueryable()
                .SelectMany(p => p.Batches)
                .Where(b => b.IsActive && b.ExpiryDate <= expiryDate && b.RemainingQuantity > 0)
                .OrderBy(b => b.ExpiryDate)
                .ToListAsync(cancellationToken);

            var dtos = _mapper.Map<IEnumerable<ProductBatchDto>>(batches);
            return ApiResponse<IEnumerable<ProductBatchDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting expiring batches within {Days} days", daysUntilExpiry);
            return ApiResponse<IEnumerable<ProductBatchDto>>.Fail("An error occurred while retrieving expiring batches");
        }
    }

    public async Task<ApiResponse<ProductBatchDto>> CreateBatchAsync(CreateProductBatchDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var product = await _unitOfWork.Products.GetByIdAsync(dto.ProductId, cancellationToken);
            if (product == null)
            {
                return ApiResponse<ProductBatchDto>.Fail($"Product with ID {dto.ProductId} not found");
            }

            // Check for duplicate batch number
            if (product.Batches.Any(b => b.BatchNumber == dto.BatchNumber))
            {
                return ApiResponse<ProductBatchDto>.Fail($"Batch number '{dto.BatchNumber}' already exists for this product");
            }

            var batch = _mapper.Map<ProductBatch>(dto);
            product.Batches.Add(batch);
            
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Created batch {BatchNumber} for product {ProductId}", dto.BatchNumber, dto.ProductId);

            var resultDto = _mapper.Map<ProductBatchDto>(batch);
            return ApiResponse<ProductBatchDto>.Ok(resultDto, "Product batch created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating batch for product {ProductId}", dto.ProductId);
            return ApiResponse<ProductBatchDto>.Fail("An error occurred while creating the product batch");
        }
    }

    public async Task<ApiResponse<ProductBatchDto>> UpdateBatchAsync(int id, UpdateProductBatchDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var batches = await _unitOfWork.Products.AsQueryable()
                .SelectMany(p => p.Batches)
                .Where(b => b.Id == id)
                .ToListAsync(cancellationToken);

            var batch = batches.FirstOrDefault();
            if (batch == null)
            {
                return ApiResponse<ProductBatchDto>.Fail($"Product batch with ID {id} not found");
            }

            _mapper.Map(dto, batch);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Updated batch {BatchId}", id);

            var resultDto = _mapper.Map<ProductBatchDto>(batch);
            return ApiResponse<ProductBatchDto>.Ok(resultDto, "Product batch updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating batch {BatchId}", id);
            return ApiResponse<ProductBatchDto>.Fail("An error occurred while updating the product batch");
        }
    }
}

// Extension method for ToListAsync since we're using IQueryable
internal static class QueryableExtensions
{
    public static Task<List<T>> ToListAsync<T>(this IQueryable<T> query, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(query.ToList());
    }
}
