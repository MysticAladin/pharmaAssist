using Domain.Entities;

namespace Domain.Interfaces;

/// <summary>
/// Manufacturer repository with manufacturer-specific operations
/// </summary>
public interface IManufacturerRepository : IRepository<Manufacturer>
{
    Task<Manufacturer?> GetByNameAsync(string name, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Manufacturer>> GetActiveManufacturersAsync(CancellationToken cancellationToken = default);
    Task<Manufacturer?> GetWithProductsAsync(int id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Manufacturer>> GetByCountryAsync(string country, CancellationToken cancellationToken = default);
}
