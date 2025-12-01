using Domain.Entities;
using Domain.Enums;

namespace Domain.Interfaces;

/// <summary>
/// Customer repository with customer-specific operations
/// </summary>
public interface ICustomerRepository : IRepository<Customer>
{
    Task<Customer?> GetByCodeAsync(string customerCode, CancellationToken cancellationToken = default);
    Task<Customer?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<Customer?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<Customer?> GetByTaxIdAsync(string taxId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Customer>> GetByTypeAsync(CustomerType customerType, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Customer>> GetByTierAsync(CustomerTier tier, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Customer>> GetActiveCustomersAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Customer>> GetVerifiedCustomersAsync(CancellationToken cancellationToken = default);
    Task<Customer?> GetWithAddressesAsync(int id, CancellationToken cancellationToken = default);
    Task<Customer?> GetWithOrdersAsync(int id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Customer>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default);
    Task<string> GenerateCustomerCodeAsync(CustomerType customerType, CancellationToken cancellationToken = default);
}
