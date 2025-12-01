using Domain.Entities;

namespace Domain.Interfaces;

/// <summary>
/// Product repository with product-specific operations
/// </summary>
public interface IProductRepository : IRepository<Product>
{
    Task<Product?> GetBySKUAsync(string sku, CancellationToken cancellationToken = default);
    Task<Product?> GetByBarcodeAsync(string barcode, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Product>> GetByCategoryAsync(int categoryId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Product>> GetByManufacturerAsync(int manufacturerId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Product>> GetActiveProductsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Product>> GetFeaturedProductsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Product>> GetLowStockProductsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Product>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default);
    Task<Product?> GetWithBatchesAsync(int id, CancellationToken cancellationToken = default);
}
