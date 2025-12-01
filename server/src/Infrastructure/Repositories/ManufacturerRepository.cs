using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

/// <summary>
/// Manufacturer repository implementation
/// </summary>
public class ManufacturerRepository : Repository<Manufacturer>, IManufacturerRepository
{
    public ManufacturerRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Manufacturer?> GetByNameAsync(string name, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(m => m.Name == name, cancellationToken);
    }

    public async Task<IReadOnlyList<Manufacturer>> GetActiveManufacturersAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(m => m.IsActive)
            .OrderBy(m => m.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Manufacturer?> GetWithProductsAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(m => m.Products.Where(p => p.IsActive))
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<Manufacturer>> GetByCountryAsync(string country, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(m => m.Country == country && m.IsActive)
            .OrderBy(m => m.Name)
            .ToListAsync(cancellationToken);
    }
}
