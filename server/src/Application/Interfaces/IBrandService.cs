using Application.DTOs.Brands;
using Application.DTOs.Common;

namespace Application.Interfaces;

/// <summary>
/// Brand management service interface
/// </summary>
public interface IBrandService
{
    // Brand CRUD
    Task<ApiResponse<BrandDto>> GetBrandByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<PagedResponse<BrandSummaryDto>> GetBrandsPagedAsync(
        int page, int pageSize, string? search = null, int? manufacturerId = null,
        bool? activeOnly = true, string? therapeuticArea = null,
        string? sortBy = null, string? sortDirection = null,
        CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<BrandSummaryDto>>> GetBrandsByManufacturerAsync(int manufacturerId, CancellationToken cancellationToken = default);
    Task<ApiResponse<BrandDto>> CreateBrandAsync(CreateBrandDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<BrandDto>> UpdateBrandAsync(int id, UpdateBrandDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteBrandAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> ActivateBrandAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeactivateBrandAsync(int id, CancellationToken cancellationToken = default);

    // Brand Group CRUD
    Task<ApiResponse<BrandGroupDto>> GetBrandGroupByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<BrandGroupDto>>> GetAllBrandGroupsAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<BrandGroupDto>> CreateBrandGroupAsync(CreateBrandGroupDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<BrandGroupDto>> UpdateBrandGroupAsync(int id, UpdateBrandGroupDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteBrandGroupAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> AddBrandToGroupAsync(int groupId, int brandId, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> RemoveBrandFromGroupAsync(int groupId, int brandId, CancellationToken cancellationToken = default);

    // Product Documents (SmPC/PIL management)
    Task<ApiResponse<IEnumerable<ProductDocumentDto>>> GetProductDocumentsAsync(int productId, CancellationToken cancellationToken = default);
    Task<ApiResponse<ProductDocumentDto>> CreateProductDocumentAsync(CreateProductDocumentDto dto, string userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteProductDocumentAsync(int documentId, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<ProductDocumentDto>>> GetDocumentVersionHistoryAsync(int productId, int documentType, CancellationToken cancellationToken = default);

    // Knowledge Articles
    Task<ApiResponse<KnowledgeArticleDto>> GetKnowledgeArticleByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<PagedResponse<KnowledgeArticleSummaryDto>> GetKnowledgeArticlesPagedAsync(
        int page, int pageSize, string? search = null, int? productId = null,
        int? brandId = null, int? category = null, bool? publishedOnly = true,
        CancellationToken cancellationToken = default);
    Task<ApiResponse<KnowledgeArticleDto>> CreateKnowledgeArticleAsync(CreateKnowledgeArticleDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<KnowledgeArticleDto>> UpdateKnowledgeArticleAsync(int id, UpdateKnowledgeArticleDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteKnowledgeArticleAsync(int id, CancellationToken cancellationToken = default);

    // Product Promotion Report
    Task<ApiResponse<IEnumerable<ProductPromotionReportDto>>> GetProductPromotionReportAsync(
        DateTime? fromDate = null, DateTime? toDate = null,
        int? productId = null, int? brandId = null,
        CancellationToken cancellationToken = default);
}
