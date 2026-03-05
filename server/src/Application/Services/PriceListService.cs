using Application.DTOs.Common;
using Application.DTOs.PriceLists;
using Application.DTOs.Wholesaler;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Services;

public class PriceListService : IPriceListService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<PriceListService> _logger;

    public PriceListService(IUnitOfWork unitOfWork, ILogger<PriceListService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    #region Price Lists

    public async Task<PagedResponse<PriceListDto>> GetPriceListsAsync(
        PriceListFilterRequest filter, CancellationToken ct = default)
    {
        try
        {
            IQueryable<PriceList> query = _unitOfWork.PriceLists.AsQueryable()
                .Include(pl => pl.Items);

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var term = filter.Search.ToLower();
                query = query.Where(pl =>
                    pl.Name.ToLower().Contains(term) ||
                    (pl.NameLocal != null && pl.NameLocal.ToLower().Contains(term)) ||
                    (pl.Description != null && pl.Description.ToLower().Contains(term)));
            }

            if (filter.Type.HasValue)
                query = query.Where(pl => pl.Type == filter.Type.Value);

            if (filter.ActiveOnly == true)
                query = query.Where(pl => pl.IsActive);

            var totalCount = await query.CountAsync(ct);

            var isDesc = string.Equals(filter.SortDirection, "desc", StringComparison.OrdinalIgnoreCase);
            query = filter.SortBy?.ToLower() switch
            {
                "name" => isDesc ? query.OrderByDescending(pl => pl.Name) : query.OrderBy(pl => pl.Name),
                "type" => isDesc ? query.OrderByDescending(pl => pl.Type) : query.OrderBy(pl => pl.Type),
                "effectivefrom" => isDesc ? query.OrderByDescending(pl => pl.EffectiveFrom) : query.OrderBy(pl => pl.EffectiveFrom),
                "items" => isDesc ? query.OrderByDescending(pl => pl.Items.Count) : query.OrderBy(pl => pl.Items.Count),
                _ => query.OrderByDescending(pl => pl.CreatedAt)
            };

            var priceLists = await query
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync(ct);

            var dtos = priceLists.Select(MapToDto).ToList();
            return PagedResponse<PriceListDto>.Create(dtos, totalCount, filter.Page, filter.PageSize);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting price lists");
            return PagedResponse<PriceListDto>.Create(new List<PriceListDto>(), 0, filter.Page, filter.PageSize);
        }
    }

    public async Task<ApiResponse<PriceListDetailDto>> GetPriceListByIdAsync(int id, CancellationToken ct = default)
    {
        try
        {
            var priceList = await _unitOfWork.PriceLists.AsQueryable()
                .Include(pl => pl.Items)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(pl => pl.Id == id, ct);

            if (priceList == null)
                return ApiResponse<PriceListDetailDto>.Fail("Price list not found");

            var dto = new PriceListDetailDto
            {
                Id = priceList.Id,
                Name = priceList.Name,
                NameLocal = priceList.NameLocal,
                Type = priceList.Type,
                EffectiveFrom = priceList.EffectiveFrom,
                EffectiveTo = priceList.EffectiveTo,
                IsActive = priceList.IsActive,
                Description = priceList.Description,
                ItemCount = priceList.Items.Count,
                CreatedAt = priceList.CreatedAt,
                Items = priceList.Items.Select(i => new PriceListItemDto
                {
                    Id = i.Id,
                    PriceListId = i.PriceListId,
                    ProductId = i.ProductId,
                    ProductName = i.Product?.Name ?? string.Empty,
                    ProductCode = i.Product?.SKU,
                    Price = i.Price,
                    DiscountPercent = i.DiscountPercent,
                    Notes = i.Notes
                }).OrderBy(i => i.ProductName).ToList()
            };

            return ApiResponse<PriceListDetailDto>.Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting price list {PriceListId}", id);
            return ApiResponse<PriceListDetailDto>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<PriceListDto>> CreatePriceListAsync(
        CreatePriceListRequest request, CancellationToken ct = default)
    {
        try
        {
            var priceList = new PriceList
            {
                Name = request.Name,
                NameLocal = request.NameLocal,
                Type = request.Type,
                EffectiveFrom = request.EffectiveFrom,
                EffectiveTo = request.EffectiveTo,
                IsActive = request.IsActive,
                Description = request.Description
            };

            await _unitOfWork.PriceLists.AddAsync(priceList, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            return ApiResponse<PriceListDto>.Ok(MapToDto(priceList), "Price list created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating price list");
            return ApiResponse<PriceListDto>.Fail("An error occurred while creating the price list");
        }
    }

    public async Task<ApiResponse<PriceListDto>> UpdatePriceListAsync(
        int id, UpdatePriceListRequest request, CancellationToken ct = default)
    {
        try
        {
            var priceList = await _unitOfWork.PriceLists.AsQueryable()
                .Include(pl => pl.Items)
                .FirstOrDefaultAsync(pl => pl.Id == id, ct);

            if (priceList == null)
                return ApiResponse<PriceListDto>.Fail("Price list not found");

            priceList.Name = request.Name;
            priceList.NameLocal = request.NameLocal;
            priceList.Type = request.Type;
            priceList.EffectiveFrom = request.EffectiveFrom;
            priceList.EffectiveTo = request.EffectiveTo;
            priceList.IsActive = request.IsActive;
            priceList.Description = request.Description;

            await _unitOfWork.PriceLists.UpdateAsync(priceList, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            return ApiResponse<PriceListDto>.Ok(MapToDto(priceList), "Price list updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating price list {PriceListId}", id);
            return ApiResponse<PriceListDto>.Fail("An error occurred while updating the price list");
        }
    }

    public async Task<ApiResponse<bool>> DeletePriceListAsync(int id, CancellationToken ct = default)
    {
        try
        {
            var priceList = await _unitOfWork.PriceLists.AsQueryable()
                .Include(pl => pl.Items)
                .FirstOrDefaultAsync(pl => pl.Id == id, ct);

            if (priceList == null)
                return ApiResponse<bool>.Fail("Price list not found");

            // Delete items first
            if (priceList.Items.Any())
                await _unitOfWork.PriceListItems.DeleteRangeAsync(priceList.Items, ct);

            await _unitOfWork.PriceLists.DeleteAsync(priceList, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            return ApiResponse<bool>.Ok(true, "Price list deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting price list {PriceListId}", id);
            return ApiResponse<bool>.Fail("An error occurred while deleting the price list");
        }
    }

    #endregion

    #region Items

    public async Task<ApiResponse<PriceListItemDto>> AddItemAsync(
        CreatePriceListItemRequest request, CancellationToken ct = default)
    {
        try
        {
            var priceList = await _unitOfWork.PriceLists.GetByIdAsync(request.PriceListId, ct);
            if (priceList == null)
                return ApiResponse<PriceListItemDto>.Fail("Price list not found");

            var product = await _unitOfWork.Products.GetByIdAsync(request.ProductId, ct);
            if (product == null)
                return ApiResponse<PriceListItemDto>.Fail("Product not found");

            // Check for duplicate
            var exists = await _unitOfWork.PriceListItems.AnyAsync(
                i => i.PriceListId == request.PriceListId && i.ProductId == request.ProductId, ct);
            if (exists)
                return ApiResponse<PriceListItemDto>.Fail("Product already exists in this price list");

            var item = new PriceListItem
            {
                PriceListId = request.PriceListId,
                ProductId = request.ProductId,
                Price = request.Price,
                DiscountPercent = request.DiscountPercent,
                Notes = request.Notes
            };

            await _unitOfWork.PriceListItems.AddAsync(item, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            var dto = new PriceListItemDto
            {
                Id = item.Id,
                PriceListId = item.PriceListId,
                ProductId = item.ProductId,
                ProductName = product.Name,
                ProductCode = product.SKU,
                Price = item.Price,
                DiscountPercent = item.DiscountPercent,
                Notes = item.Notes
            };

            return ApiResponse<PriceListItemDto>.Ok(dto, "Item added successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding item to price list");
            return ApiResponse<PriceListItemDto>.Fail("An error occurred while adding the item");
        }
    }

    public async Task<ApiResponse<PriceListItemDto>> UpdateItemAsync(
        int id, UpdatePriceListItemRequest request, CancellationToken ct = default)
    {
        try
        {
            var item = await _unitOfWork.PriceListItems.AsQueryable()
                .Include(i => i.Product)
                .FirstOrDefaultAsync(i => i.Id == id, ct);

            if (item == null)
                return ApiResponse<PriceListItemDto>.Fail("Item not found");

            item.Price = request.Price;
            item.DiscountPercent = request.DiscountPercent;
            item.Notes = request.Notes;

            await _unitOfWork.PriceListItems.UpdateAsync(item, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            var dto = new PriceListItemDto
            {
                Id = item.Id,
                PriceListId = item.PriceListId,
                ProductId = item.ProductId,
                ProductName = item.Product?.Name ?? string.Empty,
                ProductCode = item.Product?.SKU,
                Price = item.Price,
                DiscountPercent = item.DiscountPercent,
                Notes = item.Notes
            };

            return ApiResponse<PriceListItemDto>.Ok(dto, "Item updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating price list item {ItemId}", id);
            return ApiResponse<PriceListItemDto>.Fail("An error occurred while updating the item");
        }
    }

    public async Task<ApiResponse<bool>> RemoveItemAsync(int id, CancellationToken ct = default)
    {
        try
        {
            var item = await _unitOfWork.PriceListItems.GetByIdAsync(id, ct);
            if (item == null)
                return ApiResponse<bool>.Fail("Item not found");

            await _unitOfWork.PriceListItems.DeleteAsync(item, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            return ApiResponse<bool>.Ok(true, "Item removed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing price list item {ItemId}", id);
            return ApiResponse<bool>.Fail("An error occurred while removing the item");
        }
    }

    public async Task<ApiResponse<int>> BulkAddItemsAsync(
        BulkPriceListItemRequest request, CancellationToken ct = default)
    {
        try
        {
            var priceList = await _unitOfWork.PriceLists.GetByIdAsync(request.PriceListId, ct);
            if (priceList == null)
                return ApiResponse<int>.Fail("Price list not found");

            var existingProductIds = await _unitOfWork.PriceListItems.AsQueryable()
                .Where(i => i.PriceListId == request.PriceListId)
                .Select(i => i.ProductId)
                .ToListAsync(ct);

            var items = new List<PriceListItem>();
            foreach (var itemReq in request.Items)
            {
                if (existingProductIds.Contains(itemReq.ProductId))
                    continue; // Skip duplicates

                items.Add(new PriceListItem
                {
                    PriceListId = request.PriceListId,
                    ProductId = itemReq.ProductId,
                    Price = itemReq.Price,
                    DiscountPercent = itemReq.DiscountPercent,
                    Notes = itemReq.Notes
                });
            }

            if (items.Count > 0)
            {
                await _unitOfWork.PriceListItems.AddRangeAsync(items, ct);
                await _unitOfWork.SaveChangesAsync(ct);
            }

            return ApiResponse<int>.Ok(items.Count, $"{items.Count} items added successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error bulk adding items to price list");
            return ApiResponse<int>.Fail("An error occurred during bulk add");
        }
    }

    #endregion

    #region Comparison

    public async Task<ApiResponse<List<PriceComparisonDto>>> ComparePriceListsAsync(
        List<int> priceListIds, int? productId, CancellationToken ct = default)
    {
        try
        {
            var query = _unitOfWork.PriceListItems.AsQueryable()
                .Include(i => i.PriceList)
                .Include(i => i.Product)
                .Where(i => priceListIds.Contains(i.PriceListId));

            if (productId.HasValue)
                query = query.Where(i => i.ProductId == productId.Value);

            var items = await query.ToListAsync(ct);

            var comparisons = items
                .GroupBy(i => new { i.ProductId, ProductName = i.Product?.Name ?? string.Empty, ProductCode = i.Product?.SKU })
                .Select(g => new PriceComparisonDto
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.ProductName,
                    ProductCode = g.Key.ProductCode,
                    Prices = g.Select(i => new PriceListPriceDto
                    {
                        PriceListId = i.PriceListId,
                        PriceListName = i.PriceList?.Name ?? string.Empty,
                        PriceListType = i.PriceList?.Type ?? PriceListType.Retail,
                        Price = i.Price,
                        DiscountPercent = i.DiscountPercent
                    }).OrderBy(p => p.PriceListName).ToList()
                })
                .OrderBy(c => c.ProductName)
                .ToList();

            return ApiResponse<List<PriceComparisonDto>>.Ok(comparisons);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error comparing price lists");
            return ApiResponse<List<PriceComparisonDto>>.Fail("An error occurred during price comparison");
        }
    }

    #endregion

    #region Private Helpers

    private static PriceListDto MapToDto(PriceList priceList)
    {
        return new PriceListDto
        {
            Id = priceList.Id,
            Name = priceList.Name,
            NameLocal = priceList.NameLocal,
            Type = priceList.Type,
            EffectiveFrom = priceList.EffectiveFrom,
            EffectiveTo = priceList.EffectiveTo,
            IsActive = priceList.IsActive,
            Description = priceList.Description,
            ItemCount = priceList.Items?.Count ?? 0,
            CreatedAt = priceList.CreatedAt
        };
    }

    #endregion
}
