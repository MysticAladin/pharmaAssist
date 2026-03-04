using Application.DTOs.Brands;
using Application.DTOs.Common;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace Application.Services;

/// <summary>
/// Brand management service — handles brands, brand groups, product documents, knowledge articles, and promotion reports
/// </summary>
public class BrandService : IBrandService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<BrandService> _logger;

    public BrandService(IUnitOfWork unitOfWork, ILogger<BrandService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    #region Brand CRUD

    public async Task<ApiResponse<BrandDto>> GetBrandByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var brand = await _unitOfWork.Brands.AsQueryable()
                .Include(b => b.Manufacturer)
                .Include(b => b.Products.Where(p => !p.IsDeleted))
                .Include(b => b.BrandGroupMembers)
                    .ThenInclude(bgm => bgm.BrandGroup)
                .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

            if (brand == null)
                return ApiResponse<BrandDto>.Fail("Brand not found");

            var dto = MapBrandToDto(brand);
            return ApiResponse<BrandDto>.Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting brand {BrandId}", id);
            return ApiResponse<BrandDto>.Fail("An error occurred while retrieving the brand");
        }
    }

    public async Task<PagedResponse<BrandSummaryDto>> GetBrandsPagedAsync(
        int page, int pageSize, string? search = null, int? manufacturerId = null,
        bool? activeOnly = true, string? therapeuticArea = null,
        string? sortBy = null, string? sortDirection = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            IQueryable<Brand> query = _unitOfWork.Brands.AsQueryable()
                .Include(b => b.Manufacturer)
                .Include(b => b.Products.Where(p => !p.IsDeleted));

            if (activeOnly == true)
                query = query.Where(b => b.IsActive);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.ToLower();
                query = query.Where(b =>
                    b.Name.ToLower().Contains(term) ||
                    (b.NameLocal != null && b.NameLocal.ToLower().Contains(term)) ||
                    (b.Manufacturer != null && b.Manufacturer.Name.ToLower().Contains(term)) ||
                    (b.TherapeuticArea != null && b.TherapeuticArea.ToLower().Contains(term)));
            }

            if (manufacturerId.HasValue)
                query = query.Where(b => b.ManufacturerId == manufacturerId.Value);

            if (!string.IsNullOrWhiteSpace(therapeuticArea))
                query = query.Where(b => b.TherapeuticArea != null && b.TherapeuticArea.ToLower().Contains(therapeuticArea.ToLower()));

            // Sorting
            var isDesc = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);
            query = sortBy?.ToLower() switch
            {
                "name" => isDesc ? query.OrderByDescending(b => b.Name) : query.OrderBy(b => b.Name),
                "manufacturer" => isDesc ? query.OrderByDescending(b => b.Manufacturer!.Name) : query.OrderBy(b => b.Manufacturer!.Name),
                "products" => isDesc ? query.OrderByDescending(b => b.Products.Count) : query.OrderBy(b => b.Products.Count),
                _ => query.OrderBy(b => b.Name)
            };

            var totalCount = await query.CountAsync(cancellationToken);
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(b => new BrandSummaryDto
                {
                    Id = b.Id,
                    Name = b.Name,
                    NameLocal = b.NameLocal,
                    ManufacturerName = b.Manufacturer != null ? b.Manufacturer.Name : null,
                    TherapeuticArea = b.TherapeuticArea,
                    LogoPath = b.LogoPath,
                    ProductCount = b.Products.Count(p => p.IsActive && !p.IsDeleted),
                    IsActive = b.IsActive
                })
                .ToListAsync(cancellationToken);

            return PagedResponse<BrandSummaryDto>.Create(items, totalCount, page, pageSize);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting paged brands");
            return PagedResponse<BrandSummaryDto>.Create(new List<BrandSummaryDto>(), 0, page, pageSize);
        }
    }

    public async Task<ApiResponse<IEnumerable<BrandSummaryDto>>> GetBrandsByManufacturerAsync(int manufacturerId, CancellationToken cancellationToken = default)
    {
        try
        {
            var brands = await _unitOfWork.Brands.AsQueryable()
                .Where(b => b.ManufacturerId == manufacturerId && b.IsActive)
                .Include(b => b.Products.Where(p => !p.IsDeleted && p.IsActive))
                .OrderBy(b => b.Name)
                .Select(b => new BrandSummaryDto
                {
                    Id = b.Id,
                    Name = b.Name,
                    NameLocal = b.NameLocal,
                    TherapeuticArea = b.TherapeuticArea,
                    LogoPath = b.LogoPath,
                    ProductCount = b.Products.Count(p => p.IsActive && !p.IsDeleted),
                    IsActive = b.IsActive
                })
                .ToListAsync(cancellationToken);

            return ApiResponse<IEnumerable<BrandSummaryDto>>.Ok(brands);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting brands for manufacturer {ManufacturerId}", manufacturerId);
            return ApiResponse<IEnumerable<BrandSummaryDto>>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<BrandDto>> CreateBrandAsync(CreateBrandDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var manufacturer = await _unitOfWork.Manufacturers.GetByIdAsync(dto.ManufacturerId, cancellationToken);
            if (manufacturer == null)
                return ApiResponse<BrandDto>.Fail("Manufacturer not found");

            var existingBrand = await _unitOfWork.Brands.AnyAsync(
                b => b.Name == dto.Name && b.ManufacturerId == dto.ManufacturerId, cancellationToken);
            if (existingBrand)
                return ApiResponse<BrandDto>.Fail("A brand with this name already exists for this manufacturer");

            var brand = new Brand
            {
                Name = dto.Name,
                NameLocal = dto.NameLocal,
                ManufacturerId = dto.ManufacturerId,
                Description = dto.Description,
                DescriptionLocal = dto.DescriptionLocal,
                LogoPath = dto.LogoPath,
                TherapeuticArea = dto.TherapeuticArea,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Brands.AddAsync(brand, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Reload with includes
            var created = await _unitOfWork.Brands.AsQueryable()
                .Include(b => b.Manufacturer)
                .Include(b => b.Products)
                .FirstAsync(b => b.Id == brand.Id, cancellationToken);

            return ApiResponse<BrandDto>.Ok(MapBrandToDto(created), "Brand created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating brand");
            return ApiResponse<BrandDto>.Fail("An error occurred while creating the brand");
        }
    }

    public async Task<ApiResponse<BrandDto>> UpdateBrandAsync(int id, UpdateBrandDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var brand = await _unitOfWork.Brands.AsQueryable()
                .Include(b => b.Manufacturer)
                .Include(b => b.Products.Where(p => !p.IsDeleted))
                .Include(b => b.BrandGroupMembers)
                    .ThenInclude(bgm => bgm.BrandGroup)
                .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

            if (brand == null)
                return ApiResponse<BrandDto>.Fail("Brand not found");

            brand.Name = dto.Name;
            brand.NameLocal = dto.NameLocal;
            brand.ManufacturerId = dto.ManufacturerId;
            brand.Description = dto.Description;
            brand.DescriptionLocal = dto.DescriptionLocal;
            brand.LogoPath = dto.LogoPath;
            brand.TherapeuticArea = dto.TherapeuticArea;
            brand.IsActive = dto.IsActive;
            brand.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return ApiResponse<BrandDto>.Ok(MapBrandToDto(brand), "Brand updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating brand {BrandId}", id);
            return ApiResponse<BrandDto>.Fail("An error occurred while updating the brand");
        }
    }

    public async Task<ApiResponse<bool>> DeleteBrandAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var brand = await _unitOfWork.Brands.GetByIdAsync(id, cancellationToken);
            if (brand == null)
                return ApiResponse<bool>.Fail("Brand not found");

            brand.IsDeleted = true;
            brand.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return ApiResponse<bool>.Ok(true, "Brand deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting brand {BrandId}", id);
            return ApiResponse<bool>.Fail("An error occurred while deleting the brand");
        }
    }

    public async Task<ApiResponse<bool>> ActivateBrandAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var brand = await _unitOfWork.Brands.GetByIdAsync(id, cancellationToken);
            if (brand == null)
                return ApiResponse<bool>.Fail("Brand not found");

            brand.IsActive = true;
            brand.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return ApiResponse<bool>.Ok(true, "Brand activated");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error activating brand {BrandId}", id);
            return ApiResponse<bool>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<bool>> DeactivateBrandAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var brand = await _unitOfWork.Brands.GetByIdAsync(id, cancellationToken);
            if (brand == null)
                return ApiResponse<bool>.Fail("Brand not found");

            brand.IsActive = false;
            brand.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return ApiResponse<bool>.Ok(true, "Brand deactivated");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deactivating brand {BrandId}", id);
            return ApiResponse<bool>.Fail("An error occurred");
        }
    }

    #endregion

    #region Brand Groups

    public async Task<ApiResponse<BrandGroupDto>> GetBrandGroupByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var group = await _unitOfWork.BrandGroups.AsQueryable()
                .Include(bg => bg.Members)
                    .ThenInclude(m => m.Brand)
                        .ThenInclude(b => b.Products.Where(p => !p.IsDeleted))
                .Include(bg => bg.Members)
                    .ThenInclude(m => m.Brand)
                        .ThenInclude(b => b.Manufacturer)
                .FirstOrDefaultAsync(bg => bg.Id == id, cancellationToken);

            if (group == null)
                return ApiResponse<BrandGroupDto>.Fail("Brand group not found");

            return ApiResponse<BrandGroupDto>.Ok(MapBrandGroupToDto(group));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting brand group {GroupId}", id);
            return ApiResponse<BrandGroupDto>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<IEnumerable<BrandGroupDto>>> GetAllBrandGroupsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var groups = await _unitOfWork.BrandGroups.AsQueryable()
                .Where(bg => bg.IsActive)
                .Include(bg => bg.Members)
                    .ThenInclude(m => m.Brand)
                        .ThenInclude(b => b.Products.Where(p => !p.IsDeleted))
                .Include(bg => bg.Members)
                    .ThenInclude(m => m.Brand)
                        .ThenInclude(b => b.Manufacturer)
                .OrderBy(bg => bg.Name)
                .ToListAsync(cancellationToken);

            var dtos = groups.Select(MapBrandGroupToDto);
            return ApiResponse<IEnumerable<BrandGroupDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting brand groups");
            return ApiResponse<IEnumerable<BrandGroupDto>>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<BrandGroupDto>> CreateBrandGroupAsync(CreateBrandGroupDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var group = new BrandGroup
            {
                Name = dto.Name,
                NameLocal = dto.NameLocal,
                Description = dto.Description,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.BrandGroups.AddAsync(group, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Add brand members
            if (dto.BrandIds?.Any() == true)
            {
                var sortOrder = 0;
                foreach (var brandId in dto.BrandIds)
                {
                    var brandExists = await _unitOfWork.Brands.AnyAsync(b => b.Id == brandId, cancellationToken);
                    if (brandExists)
                    {
                        await _unitOfWork.BrandGroupMembers.AddAsync(new BrandGroupMember
                        {
                            BrandGroupId = group.Id,
                            BrandId = brandId,
                            SortOrder = sortOrder++,
                            CreatedAt = DateTime.UtcNow
                        }, cancellationToken);
                    }
                }
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }

            return await GetBrandGroupByIdAsync(group.Id, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating brand group");
            return ApiResponse<BrandGroupDto>.Fail("An error occurred while creating the brand group");
        }
    }

    public async Task<ApiResponse<BrandGroupDto>> UpdateBrandGroupAsync(int id, UpdateBrandGroupDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var group = await _unitOfWork.BrandGroups.AsQueryable()
                .Include(bg => bg.Members)
                .FirstOrDefaultAsync(bg => bg.Id == id, cancellationToken);

            if (group == null)
                return ApiResponse<BrandGroupDto>.Fail("Brand group not found");

            group.Name = dto.Name;
            group.NameLocal = dto.NameLocal;
            group.Description = dto.Description;
            group.IsActive = dto.IsActive;
            group.UpdatedAt = DateTime.UtcNow;

            // Update brand members if provided
            if (dto.BrandIds != null)
            {
                // Remove existing members
                await _unitOfWork.BrandGroupMembers.DeleteRangeAsync(group.Members);

                // Add new members
                var sortOrder = 0;
                foreach (var brandId in dto.BrandIds)
                {
                    var brandExists = await _unitOfWork.Brands.AnyAsync(b => b.Id == brandId, cancellationToken);
                    if (brandExists)
                    {
                        await _unitOfWork.BrandGroupMembers.AddAsync(new BrandGroupMember
                        {
                            BrandGroupId = group.Id,
                            BrandId = brandId,
                            SortOrder = sortOrder++,
                            CreatedAt = DateTime.UtcNow
                        }, cancellationToken);
                    }
                }
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return await GetBrandGroupByIdAsync(group.Id, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating brand group {GroupId}", id);
            return ApiResponse<BrandGroupDto>.Fail("An error occurred while updating the brand group");
        }
    }

    public async Task<ApiResponse<bool>> DeleteBrandGroupAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var group = await _unitOfWork.BrandGroups.GetByIdAsync(id, cancellationToken);
            if (group == null)
                return ApiResponse<bool>.Fail("Brand group not found");

            group.IsDeleted = true;
            group.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return ApiResponse<bool>.Ok(true, "Brand group deleted");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting brand group {GroupId}", id);
            return ApiResponse<bool>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<bool>> AddBrandToGroupAsync(int groupId, int brandId, CancellationToken cancellationToken = default)
    {
        try
        {
            var exists = await _unitOfWork.BrandGroupMembers.AnyAsync(
                m => m.BrandGroupId == groupId && m.BrandId == brandId, cancellationToken);
            if (exists)
                return ApiResponse<bool>.Fail("Brand is already in this group");

            var maxSort = await _unitOfWork.BrandGroupMembers.AsQueryable()
                .Where(m => m.BrandGroupId == groupId)
                .MaxAsync(m => (int?)m.SortOrder, cancellationToken) ?? 0;

            await _unitOfWork.BrandGroupMembers.AddAsync(new BrandGroupMember
            {
                BrandGroupId = groupId,
                BrandId = brandId,
                SortOrder = maxSort + 1,
                CreatedAt = DateTime.UtcNow
            }, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return ApiResponse<bool>.Ok(true, "Brand added to group");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding brand {BrandId} to group {GroupId}", brandId, groupId);
            return ApiResponse<bool>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<bool>> RemoveBrandFromGroupAsync(int groupId, int brandId, CancellationToken cancellationToken = default)
    {
        try
        {
            var member = await _unitOfWork.BrandGroupMembers.FirstOrDefaultAsync(
                m => m.BrandGroupId == groupId && m.BrandId == brandId, cancellationToken);
            if (member == null)
                return ApiResponse<bool>.Fail("Brand is not in this group");

            await _unitOfWork.BrandGroupMembers.DeleteAsync(member);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return ApiResponse<bool>.Ok(true, "Brand removed from group");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing brand {BrandId} from group {GroupId}", brandId, groupId);
            return ApiResponse<bool>.Fail("An error occurred");
        }
    }

    #endregion

    #region Product Documents

    public async Task<ApiResponse<IEnumerable<ProductDocumentDto>>> GetProductDocumentsAsync(int productId, CancellationToken cancellationToken = default)
    {
        try
        {
            var docs = await _unitOfWork.ProductDocuments.AsQueryable()
                .Where(d => d.ProductId == productId)
                .Include(d => d.Product)
                .OrderByDescending(d => d.IsCurrentVersion)
                .ThenByDescending(d => d.CreatedAt)
                .Select(d => MapDocumentToDto(d))
                .ToListAsync(cancellationToken);

            return ApiResponse<IEnumerable<ProductDocumentDto>>.Ok(docs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting documents for product {ProductId}", productId);
            return ApiResponse<IEnumerable<ProductDocumentDto>>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<ProductDocumentDto>> CreateProductDocumentAsync(CreateProductDocumentDto dto, string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var product = await _unitOfWork.Products.GetByIdAsync(dto.ProductId, cancellationToken);
            if (product == null)
                return ApiResponse<ProductDocumentDto>.Fail("Product not found");

            // Mark previous versions as not current
            var previousDocs = await _unitOfWork.ProductDocuments.FindAsync(
                d => d.ProductId == dto.ProductId && d.DocumentType == dto.DocumentType && d.IsCurrentVersion,
                cancellationToken);

            foreach (var prev in previousDocs)
            {
                prev.IsCurrentVersion = false;
                prev.UpdatedAt = DateTime.UtcNow;
            }

            var document = new ProductDocument
            {
                ProductId = dto.ProductId,
                DocumentType = dto.DocumentType,
                FileName = dto.FileName,
                FilePath = dto.FilePath,
                FileType = dto.FileType,
                FileSize = dto.FileSize,
                Version = dto.Version,
                EffectiveDate = dto.EffectiveDate,
                UploadedBy = userId,
                IsCurrentVersion = true,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.ProductDocuments.AddAsync(document, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var result = new ProductDocumentDto
            {
                Id = document.Id,
                ProductId = document.ProductId,
                ProductName = product.Name,
                DocumentType = document.DocumentType,
                DocumentTypeName = document.DocumentType.ToString(),
                FileName = document.FileName,
                FilePath = document.FilePath,
                FileType = document.FileType,
                FileSize = document.FileSize,
                Version = document.Version,
                EffectiveDate = document.EffectiveDate,
                UploadedBy = document.UploadedBy,
                IsCurrentVersion = document.IsCurrentVersion,
                Notes = document.Notes,
                CreatedAt = document.CreatedAt
            };

            return ApiResponse<ProductDocumentDto>.Ok(result, "Document uploaded successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating product document");
            return ApiResponse<ProductDocumentDto>.Fail("An error occurred while uploading the document");
        }
    }

    public async Task<ApiResponse<bool>> DeleteProductDocumentAsync(int documentId, CancellationToken cancellationToken = default)
    {
        try
        {
            var doc = await _unitOfWork.ProductDocuments.GetByIdAsync(documentId, cancellationToken);
            if (doc == null)
                return ApiResponse<bool>.Fail("Document not found");

            doc.IsDeleted = true;
            doc.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return ApiResponse<bool>.Ok(true, "Document deleted");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting document {DocumentId}", documentId);
            return ApiResponse<bool>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<IEnumerable<ProductDocumentDto>>> GetDocumentVersionHistoryAsync(int productId, int documentType, CancellationToken cancellationToken = default)
    {
        try
        {
            var docType = (ProductDocumentType)documentType;
            var docs = await _unitOfWork.ProductDocuments.AsQueryable()
                .Where(d => d.ProductId == productId && d.DocumentType == docType)
                .Include(d => d.Product)
                .OrderByDescending(d => d.CreatedAt)
                .Select(d => MapDocumentToDto(d))
                .ToListAsync(cancellationToken);

            return ApiResponse<IEnumerable<ProductDocumentDto>>.Ok(docs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting document history for product {ProductId}", productId);
            return ApiResponse<IEnumerable<ProductDocumentDto>>.Fail("An error occurred");
        }
    }

    #endregion

    #region Knowledge Articles

    public async Task<ApiResponse<KnowledgeArticleDto>> GetKnowledgeArticleByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var article = await _unitOfWork.KnowledgeArticles.AsQueryable()
                .Include(a => a.Product)
                .Include(a => a.Brand)
                .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

            if (article == null)
                return ApiResponse<KnowledgeArticleDto>.Fail("Article not found");

            return ApiResponse<KnowledgeArticleDto>.Ok(MapArticleToDto(article));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting knowledge article {ArticleId}", id);
            return ApiResponse<KnowledgeArticleDto>.Fail("An error occurred");
        }
    }

    public async Task<PagedResponse<KnowledgeArticleSummaryDto>> GetKnowledgeArticlesPagedAsync(
        int page, int pageSize, string? search = null, int? productId = null,
        int? brandId = null, int? category = null, bool? publishedOnly = true,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _unitOfWork.KnowledgeArticles.AsQueryable()
                .Include(a => a.Product)
                .Include(a => a.Brand)
                .AsQueryable();

            if (publishedOnly == true)
                query = query.Where(a => a.IsPublished);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.ToLower();
                query = query.Where(a =>
                    a.Title.ToLower().Contains(term) ||
                    (a.TitleLocal != null && a.TitleLocal.ToLower().Contains(term)) ||
                    a.Content.ToLower().Contains(term) ||
                    (a.Tags != null && a.Tags.ToLower().Contains(term)));
            }

            if (productId.HasValue)
                query = query.Where(a => a.ProductId == productId.Value);

            if (brandId.HasValue)
                query = query.Where(a => a.BrandId == brandId.Value);

            if (category.HasValue)
                query = query.Where(a => a.Category == (KnowledgeCategory)category.Value);

            query = query.OrderBy(a => a.SortOrder).ThenBy(a => a.Title);

            var totalCount = await query.CountAsync(cancellationToken);
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new KnowledgeArticleSummaryDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    TitleLocal = a.TitleLocal,
                    Category = a.Category,
                    CategoryName = a.Category.ToString(),
                    ProductName = a.Product != null ? a.Product.Name : null,
                    BrandName = a.Brand != null ? a.Brand.Name : null,
                    IsPublished = a.IsPublished
                })
                .ToListAsync(cancellationToken);

            return PagedResponse<KnowledgeArticleSummaryDto>.Create(items, totalCount, page, pageSize);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting paged knowledge articles");
            return PagedResponse<KnowledgeArticleSummaryDto>.Create(new List<KnowledgeArticleSummaryDto>(), 0, page, pageSize);
        }
    }

    public async Task<ApiResponse<KnowledgeArticleDto>> CreateKnowledgeArticleAsync(CreateKnowledgeArticleDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var article = new KnowledgeArticle
            {
                ProductId = dto.ProductId,
                BrandId = dto.BrandId,
                Title = dto.Title,
                TitleLocal = dto.TitleLocal,
                Content = dto.Content,
                ContentLocal = dto.ContentLocal,
                Category = dto.Category,
                SortOrder = dto.SortOrder,
                IsPublished = dto.IsPublished,
                Tags = dto.Tags,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.KnowledgeArticles.AddAsync(article, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var created = await _unitOfWork.KnowledgeArticles.AsQueryable()
                .Include(a => a.Product)
                .Include(a => a.Brand)
                .FirstAsync(a => a.Id == article.Id, cancellationToken);

            return ApiResponse<KnowledgeArticleDto>.Ok(MapArticleToDto(created), "Knowledge article created");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating knowledge article");
            return ApiResponse<KnowledgeArticleDto>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<KnowledgeArticleDto>> UpdateKnowledgeArticleAsync(int id, UpdateKnowledgeArticleDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var article = await _unitOfWork.KnowledgeArticles.AsQueryable()
                .Include(a => a.Product)
                .Include(a => a.Brand)
                .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

            if (article == null)
                return ApiResponse<KnowledgeArticleDto>.Fail("Article not found");

            article.ProductId = dto.ProductId;
            article.BrandId = dto.BrandId;
            article.Title = dto.Title;
            article.TitleLocal = dto.TitleLocal;
            article.Content = dto.Content;
            article.ContentLocal = dto.ContentLocal;
            article.Category = dto.Category;
            article.SortOrder = dto.SortOrder;
            article.IsPublished = dto.IsPublished;
            article.Tags = dto.Tags;
            article.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return ApiResponse<KnowledgeArticleDto>.Ok(MapArticleToDto(article), "Article updated");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating knowledge article {ArticleId}", id);
            return ApiResponse<KnowledgeArticleDto>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<bool>> DeleteKnowledgeArticleAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var article = await _unitOfWork.KnowledgeArticles.GetByIdAsync(id, cancellationToken);
            if (article == null)
                return ApiResponse<bool>.Fail("Article not found");

            article.IsDeleted = true;
            article.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return ApiResponse<bool>.Ok(true, "Article deleted");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting knowledge article {ArticleId}", id);
            return ApiResponse<bool>.Fail("An error occurred");
        }
    }

    #endregion

    #region Product Promotion Report

    public async Task<ApiResponse<IEnumerable<ProductPromotionReportDto>>> GetProductPromotionReportAsync(
        DateTime? fromDate = null, DateTime? toDate = null,
        int? productId = null, int? brandId = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var from = fromDate ?? DateTime.UtcNow.AddMonths(-3);
            var to = toDate ?? DateTime.UtcNow;

            var visits = await _unitOfWork.ExecutedVisits.AsQueryable()
                .Where(v => v.CheckInTime >= from && v.CheckInTime <= to)
                .Where(v => !string.IsNullOrEmpty(v.ProductsDetailedDiscussion))
                .Include(v => v.Customer)
                .ToListAsync(cancellationToken);

            // Parse all discussion details
            var allDiscussions = new List<(ExecutedVisit Visit, ProductDiscussionDetailDto Detail)>();
            foreach (var visit in visits)
            {
                try
                {
                    var discussions = JsonSerializer.Deserialize<List<ProductDiscussionDetailDto>>(
                        visit.ProductsDetailedDiscussion!,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                    if (discussions != null)
                    {
                        foreach (var d in discussions)
                            allDiscussions.Add((visit, d));
                    }
                }
                catch { /* Skip malformed JSON */ }
            }

            // Filter by product/brand
            if (productId.HasValue)
                allDiscussions = allDiscussions.Where(x => x.Detail.ProductId == productId.Value).ToList();

            // Get product info
            var productIds = allDiscussions.Select(x => x.Detail.ProductId).Distinct().ToList();
            var products = await _unitOfWork.Products.AsQueryable()
                .Where(p => productIds.Contains(p.Id))
                .Include(p => p.Brand)
                .ToDictionaryAsync(p => p.Id, cancellationToken);

            if (brandId.HasValue)
            {
                var brandProductIds = products.Where(kv => kv.Value.BrandId == brandId.Value).Select(kv => kv.Key).ToHashSet();
                allDiscussions = allDiscussions.Where(x => brandProductIds.Contains(x.Detail.ProductId)).ToList();
            }

            // Group by product and build report
            var report = allDiscussions
                .GroupBy(x => x.Detail.ProductId)
                .Select(g =>
                {
                    var product = products.GetValueOrDefault(g.Key);
                    var discussions = g.ToList();
                    var total = discussions.Count;

                    var positive = discussions.Count(d => d.Detail.ReactionType == ProductReactionType.Positive);
                    var neutral = discussions.Count(d => d.Detail.ReactionType == ProductReactionType.Neutral);
                    var negative = discussions.Count(d => d.Detail.ReactionType == ProductReactionType.Negative);

                    // By customer type
                    var byCustomerType = discussions
                        .Where(d => d.Visit.Customer != null)
                        .GroupBy(d => d.Visit.Customer!.CustomerType.ToString())
                        .ToDictionary(cg => cg.Key, cg => cg.Count());

                    // Commitment breakdown
                    var commitments = discussions
                        .GroupBy(d => d.Detail.CommitmentLevel)
                        .Select(cg => new CommitmentBreakdownDto
                        {
                            Level = cg.Key,
                            LevelName = cg.Key.ToString(),
                            Count = cg.Count(),
                            Percentage = total > 0 ? Math.Round((decimal)cg.Count() / total * 100, 1) : 0
                        })
                        .OrderBy(c => c.Level)
                        .ToList();

                    return new ProductPromotionReportDto
                    {
                        ProductId = g.Key,
                        ProductName = product?.Name ?? "Unknown",
                        BrandName = product?.Brand?.Name,
                        TotalPresentations = total,
                        PositiveReactions = positive,
                        NeutralReactions = neutral,
                        NegativeReactions = negative,
                        AcceptanceRate = total > 0 ? Math.Round((decimal)positive / total * 100, 1) : 0,
                        ByCustomerType = byCustomerType,
                        CommitmentBreakdown = commitments
                    };
                })
                .OrderByDescending(r => r.TotalPresentations)
                .ToList();

            return ApiResponse<IEnumerable<ProductPromotionReportDto>>.Ok(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating product promotion report");
            return ApiResponse<IEnumerable<ProductPromotionReportDto>>.Fail("An error occurred");
        }
    }

    #endregion

    #region Private Helpers

    private static BrandDto MapBrandToDto(Brand brand)
    {
        return new BrandDto
        {
            Id = brand.Id,
            Name = brand.Name,
            NameLocal = brand.NameLocal,
            ManufacturerId = brand.ManufacturerId,
            ManufacturerName = brand.Manufacturer?.Name,
            Description = brand.Description,
            DescriptionLocal = brand.DescriptionLocal,
            LogoPath = brand.LogoPath,
            TherapeuticArea = brand.TherapeuticArea,
            IsActive = brand.IsActive,
            ProductCount = brand.Products?.Count(p => p.IsActive && !p.IsDeleted) ?? 0,
            Products = brand.Products?
                .Where(p => !p.IsDeleted)
                .Select(p => new BrandProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    DosageForm = p.DosageForm,
                    Strength = p.Strength,
                    PackageSize = p.PackageSize,
                    UnitPrice = p.UnitPrice,
                    IsActive = p.IsActive
                })
                .ToList() ?? new(),
            BrandGroups = brand.BrandGroupMembers?
                .Where(bgm => bgm.BrandGroup != null && !bgm.BrandGroup.IsDeleted)
                .Select(bgm => bgm.BrandGroup.Name)
                .ToList() ?? new(),
            CreatedAt = brand.CreatedAt,
            UpdatedAt = brand.UpdatedAt
        };
    }

    private static BrandGroupDto MapBrandGroupToDto(BrandGroup group)
    {
        return new BrandGroupDto
        {
            Id = group.Id,
            Name = group.Name,
            NameLocal = group.NameLocal,
            Description = group.Description,
            IsActive = group.IsActive,
            Brands = group.Members?
                .Where(m => m.Brand != null && !m.Brand.IsDeleted)
                .OrderBy(m => m.SortOrder)
                .Select(m => new BrandSummaryDto
                {
                    Id = m.Brand.Id,
                    Name = m.Brand.Name,
                    NameLocal = m.Brand.NameLocal,
                    ManufacturerName = m.Brand.Manufacturer?.Name,
                    TherapeuticArea = m.Brand.TherapeuticArea,
                    LogoPath = m.Brand.LogoPath,
                    ProductCount = m.Brand.Products?.Count(p => p.IsActive && !p.IsDeleted) ?? 0,
                    IsActive = m.Brand.IsActive
                })
                .ToList() ?? new(),
            CreatedAt = group.CreatedAt
        };
    }

    private static ProductDocumentDto MapDocumentToDto(ProductDocument doc)
    {
        return new ProductDocumentDto
        {
            Id = doc.Id,
            ProductId = doc.ProductId,
            ProductName = doc.Product?.Name,
            DocumentType = doc.DocumentType,
            DocumentTypeName = doc.DocumentType.ToString(),
            FileName = doc.FileName,
            FilePath = doc.FilePath,
            FileType = doc.FileType,
            FileSize = doc.FileSize,
            Version = doc.Version,
            EffectiveDate = doc.EffectiveDate,
            UploadedBy = doc.UploadedBy,
            IsCurrentVersion = doc.IsCurrentVersion,
            Notes = doc.Notes,
            CreatedAt = doc.CreatedAt
        };
    }

    private static KnowledgeArticleDto MapArticleToDto(KnowledgeArticle article)
    {
        return new KnowledgeArticleDto
        {
            Id = article.Id,
            ProductId = article.ProductId,
            ProductName = article.Product?.Name,
            BrandId = article.BrandId,
            BrandName = article.Brand?.Name,
            Title = article.Title,
            TitleLocal = article.TitleLocal,
            Content = article.Content,
            ContentLocal = article.ContentLocal,
            Category = article.Category,
            CategoryName = article.Category.ToString(),
            SortOrder = article.SortOrder,
            IsPublished = article.IsPublished,
            Tags = article.Tags,
            CreatedAt = article.CreatedAt,
            UpdatedAt = article.UpdatedAt
        };
    }

    #endregion
}
