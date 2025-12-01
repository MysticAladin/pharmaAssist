using Application.DTOs.Common;
using Application.DTOs.Products;

namespace Application.Interfaces;

/// <summary>
/// Product service interface
/// </summary>
public interface IProductService
{
    Task<ApiResponse<ProductDto>> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<ProductDto>>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<PagedResponse<ProductSummaryDto>> GetPagedAsync(int page, int pageSize, string? search = null, int? categoryId = null, int? manufacturerId = null, bool? activeOnly = true, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<ProductSummaryDto>>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<ProductDto>>> GetByCategoryAsync(int categoryId, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<ProductDto>>> GetByManufacturerAsync(int manufacturerId, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<ProductDto>>> GetLowStockAsync(int threshold, CancellationToken cancellationToken = default);
    Task<ApiResponse<ProductDto>> CreateAsync(CreateProductDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<ProductDto>> UpdateAsync(int id, UpdateProductDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> ActivateAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeactivateAsync(int id, CancellationToken cancellationToken = default);
    
    // Batch operations
    Task<ApiResponse<ProductBatchDto>> GetBatchByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<ProductBatchDto>>> GetBatchesByProductAsync(int productId, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<ProductBatchDto>>> GetExpiringBatchesAsync(int daysUntilExpiry, CancellationToken cancellationToken = default);
    Task<ApiResponse<ProductBatchDto>> CreateBatchAsync(CreateProductBatchDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<ProductBatchDto>> UpdateBatchAsync(int id, UpdateProductBatchDto dto, CancellationToken cancellationToken = default);
}
