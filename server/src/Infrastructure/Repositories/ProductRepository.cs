using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

/// <summary>
/// Product repository implementation
/// </summary>
public class ProductRepository : Repository<Product>, IProductRepository
{
    public ProductRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Product?> GetBySKUAsync(string sku, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(p => p.SKU == sku, cancellationToken);
    }

    public async Task<Product?> GetByBarcodeAsync(string barcode, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(p => p.Barcode == barcode, cancellationToken);
    }

    public async Task<IReadOnlyList<Product>> GetByCategoryAsync(int categoryId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(p => p.CategoryId == categoryId)
            .Include(p => p.Manufacturer)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Product>> GetByManufacturerAsync(int manufacturerId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(p => p.ManufacturerId == manufacturerId)
            .Include(p => p.Category)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Product>> GetActiveProductsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(p => p.IsActive)
            .Include(p => p.Category)
            .Include(p => p.Manufacturer)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Product>> GetFeaturedProductsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(p => p.IsActive && p.IsFeatured)
            .Include(p => p.Category)
            .Include(p => p.Manufacturer)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Product>> GetLowStockProductsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(p => p.IsActive && p.StockQuantity <= p.ReorderLevel)
            .Include(p => p.Category)
            .Include(p => p.Manufacturer)
            .OrderBy(p => p.StockQuantity)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Product>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default)
    {
        var term = searchTerm.ToLower();
        return await _dbSet
            .Where(p => p.Name.ToLower().Contains(term) ||
                        p.NameLocal.ToLower().Contains(term) ||
                        (p.GenericName != null && p.GenericName.ToLower().Contains(term)) ||
                        p.SKU.ToLower().Contains(term) ||
                        (p.Barcode != null && p.Barcode.Contains(term)))
            .Include(p => p.Category)
            .Include(p => p.Manufacturer)
            .ToListAsync(cancellationToken);
    }

    public async Task<Product?> GetWithBatchesAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.Batches.Where(b => b.IsActive))
            .Include(p => p.Category)
            .Include(p => p.Manufacturer)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }
}
