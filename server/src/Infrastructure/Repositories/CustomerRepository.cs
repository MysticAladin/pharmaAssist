using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

/// <summary>
/// Customer repository implementation
/// </summary>
public class CustomerRepository : Repository<Customer>, ICustomerRepository
{
    public CustomerRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Customer?> GetByCodeAsync(string customerCode, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(c => c.CustomerCode == customerCode, cancellationToken);
    }

    public async Task<Customer?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(c => c.Email == email, cancellationToken);
    }

    public async Task<Customer?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken);
    }

    public async Task<Customer?> GetByTaxIdAsync(string taxId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(c => c.TaxId == taxId, cancellationToken);
    }

    public async Task<IReadOnlyList<Customer>> GetByTypeAsync(CustomerType customerType, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(c => c.CustomerType == customerType && c.IsActive)
            .OrderBy(c => c.LastName)
            .ThenBy(c => c.FirstName)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Customer>> GetByTierAsync(CustomerTier tier, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(c => c.Tier == tier && c.IsActive)
            .OrderBy(c => c.LastName)
            .ThenBy(c => c.FirstName)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Customer>> GetActiveCustomersAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(c => c.IsActive)
            .OrderBy(c => c.LastName)
            .ThenBy(c => c.FirstName)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Customer>> GetVerifiedCustomersAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(c => c.IsActive && c.IsVerified)
            .OrderBy(c => c.LastName)
            .ThenBy(c => c.FirstName)
            .ToListAsync(cancellationToken);
    }

    public async Task<Customer?> GetWithAddressesAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.Addresses.Where(a => a.IsActive))
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<Customer?> GetWithOrdersAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.Orders.OrderByDescending(o => o.OrderDate).Take(10))
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<Customer>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default)
    {
        var term = searchTerm.ToLower();
        return await _dbSet
            .Where(c => c.FirstName.ToLower().Contains(term) ||
                        c.LastName.ToLower().Contains(term) ||
                        (c.CompanyName != null && c.CompanyName.ToLower().Contains(term)) ||
                        c.Email.ToLower().Contains(term) ||
                        c.CustomerCode.ToLower().Contains(term) ||
                        (c.TaxId != null && c.TaxId.Contains(term)))
            .OrderBy(c => c.LastName)
            .ThenBy(c => c.FirstName)
            .ToListAsync(cancellationToken);
    }

    public async Task<string> GenerateCustomerCodeAsync(CustomerType customerType, CancellationToken cancellationToken = default)
    {
        var prefix = customerType switch
        {
            CustomerType.Retail => "RET",
            CustomerType.Pharmacy => "PHR",
            CustomerType.Hospital => "HSP",
            CustomerType.Wholesale => "WSL",
            CustomerType.Clinic => "CLN",
            _ => "OTH"
        };

        var lastCustomer = await _dbSet
            .Where(c => c.CustomerCode.StartsWith(prefix))
            .OrderByDescending(c => c.CustomerCode)
            .FirstOrDefaultAsync(cancellationToken);

        int nextNumber = 1;
        if (lastCustomer != null && lastCustomer.CustomerCode.Length > 3)
        {
            var numberPart = lastCustomer.CustomerCode[3..];
            if (int.TryParse(numberPart, out int currentNumber))
            {
                nextNumber = currentNumber + 1;
            }
        }

        return $"{prefix}{nextNumber:D6}";
    }

    public async Task<IReadOnlyList<Customer>> GetAllHeadquartersAsync(CancellationToken cancellationToken = default)
    {
        // Get all headquarters/main companies (IsHeadquarters = true OR no parent)
        // These are the top-level organizations for feature flag management
        return await _dbSet
            .Where(c => c.IsActive && (c.IsHeadquarters || c.ParentCustomerId == null))
            .Where(c => c.CustomerType != CustomerType.Retail) // Exclude individual retail customers
            .OrderBy(c => c.CompanyName ?? c.LastName)
            .ToListAsync(cancellationToken);
    }
}
