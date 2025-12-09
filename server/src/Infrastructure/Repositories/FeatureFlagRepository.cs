using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

/// <summary>
/// Repository for feature flag operations
/// </summary>
public class FeatureFlagRepository : IFeatureFlagRepository
{
    private readonly ApplicationDbContext _context;

    public FeatureFlagRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    #region System Flags

    public async Task<SystemFeatureFlag?> GetSystemFlagByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.SystemFeatureFlags
            .FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted, cancellationToken);
    }

    public async Task<SystemFeatureFlag?> GetSystemFlagByKeyAsync(string key, CancellationToken cancellationToken = default)
    {
        return await _context.SystemFeatureFlags
            .FirstOrDefaultAsync(f => f.Key == key.ToLowerInvariant() && !f.IsDeleted, cancellationToken);
    }

    public async Task<IReadOnlyList<SystemFeatureFlag>> GetAllSystemFlagsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SystemFeatureFlags
            .Where(f => !f.IsDeleted)
            .OrderBy(f => f.Category)
            .ThenBy(f => f.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<SystemFeatureFlag>> GetSystemFlagsByCategoryAsync(FlagCategory category, CancellationToken cancellationToken = default)
    {
        return await _context.SystemFeatureFlags
            .Where(f => f.Category == category && !f.IsDeleted)
            .OrderBy(f => f.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<SystemFeatureFlag>> GetSystemFlagsByEnvironmentAsync(string? environment, CancellationToken cancellationToken = default)
    {
        return await _context.SystemFeatureFlags
            .Where(f => !f.IsDeleted && (f.Environment == null || f.Environment == environment))
            .OrderBy(f => f.Category)
            .ThenBy(f => f.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<SystemFeatureFlag> AddSystemFlagAsync(SystemFeatureFlag flag, CancellationToken cancellationToken = default)
    {
        await _context.SystemFeatureFlags.AddAsync(flag, cancellationToken);
        return flag;
    }

    public Task UpdateSystemFlagAsync(SystemFeatureFlag flag, CancellationToken cancellationToken = default)
    {
        _context.SystemFeatureFlags.Update(flag);
        return Task.CompletedTask;
    }

    public Task DeleteSystemFlagAsync(SystemFeatureFlag flag, CancellationToken cancellationToken = default)
    {
        flag.IsDeleted = true;
        _context.SystemFeatureFlags.Update(flag);
        return Task.CompletedTask;
    }

    public async Task<bool> SystemFlagExistsAsync(string key, CancellationToken cancellationToken = default)
    {
        return await _context.SystemFeatureFlags
            .AnyAsync(f => f.Key == key.ToLowerInvariant() && !f.IsDeleted, cancellationToken);
    }

    public async Task<int> CountSystemFlagsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SystemFeatureFlags
            .CountAsync(f => !f.IsDeleted, cancellationToken);
    }

    public async Task<int> CountEnabledSystemFlagsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SystemFeatureFlags
            .CountAsync(f => f.IsEnabled && !f.IsDeleted, cancellationToken);
    }

    public async Task<Dictionary<FlagCategory, int>> GetFlagCountByCategoryAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SystemFeatureFlags
            .Where(f => !f.IsDeleted)
            .GroupBy(f => f.Category)
            .Select(g => new { Category = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Category, x => x.Count, cancellationToken);
    }

    #endregion

    #region Client Flags

    public async Task<ClientFeatureFlag?> GetClientFlagByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.ClientFeatureFlags
            .Include(f => f.Customer)
            .Include(f => f.SystemFlag)
            .FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted, cancellationToken);
    }

    public async Task<ClientFeatureFlag?> GetClientFlagAsync(int customerId, int systemFlagId, CancellationToken cancellationToken = default)
    {
        return await _context.ClientFeatureFlags
            .Include(f => f.Customer)
            .Include(f => f.SystemFlag)
            .FirstOrDefaultAsync(f => f.CustomerId == customerId && f.SystemFlagId == systemFlagId && !f.IsDeleted, cancellationToken);
    }

    public async Task<IReadOnlyList<ClientFeatureFlag>> GetClientFlagsForCustomerAsync(int customerId, CancellationToken cancellationToken = default)
    {
        return await _context.ClientFeatureFlags
            .Include(f => f.SystemFlag)
            .Where(f => f.CustomerId == customerId && !f.IsDeleted)
            .OrderBy(f => f.SystemFlag.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ClientFeatureFlag>> GetClientOverridesForFlagAsync(int systemFlagId, CancellationToken cancellationToken = default)
    {
        return await _context.ClientFeatureFlags
            .Include(f => f.Customer)
            .Where(f => f.SystemFlagId == systemFlagId && !f.IsDeleted)
            .OrderBy(f => f.Customer.CompanyName ?? f.Customer.LastName)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ClientFeatureFlag>> GetAllClientFlagsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.ClientFeatureFlags
            .Include(f => f.Customer)
            .Include(f => f.SystemFlag)
            .Where(f => !f.IsDeleted)
            .OrderBy(f => f.Customer.CompanyName ?? f.Customer.LastName)
            .ThenBy(f => f.SystemFlag.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<ClientFeatureFlag> AddClientFlagAsync(ClientFeatureFlag flag, CancellationToken cancellationToken = default)
    {
        await _context.ClientFeatureFlags.AddAsync(flag, cancellationToken);
        return flag;
    }

    public Task UpdateClientFlagAsync(ClientFeatureFlag flag, CancellationToken cancellationToken = default)
    {
        _context.ClientFeatureFlags.Update(flag);
        return Task.CompletedTask;
    }

    public Task DeleteClientFlagAsync(ClientFeatureFlag flag, CancellationToken cancellationToken = default)
    {
        flag.IsDeleted = true;
        _context.ClientFeatureFlags.Update(flag);
        return Task.CompletedTask;
    }

    public async Task<int> CountClientOverridesAsync(int systemFlagId, CancellationToken cancellationToken = default)
    {
        return await _context.ClientFeatureFlags
            .CountAsync(f => f.SystemFlagId == systemFlagId && !f.IsDeleted, cancellationToken);
    }

    public async Task<int> CountActiveClientOverridesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.ClientFeatureFlags
            .CountAsync(f => f.IsEnabled && !f.IsDeleted && 
                (!f.ExpiresAt.HasValue || f.ExpiresAt > DateTime.UtcNow), cancellationToken);
    }

    public async Task CleanupExpiredOverridesAsync(CancellationToken cancellationToken = default)
    {
        var expiredOverrides = await _context.ClientFeatureFlags
            .Where(f => f.ExpiresAt.HasValue && f.ExpiresAt <= DateTime.UtcNow && !f.IsDeleted)
            .ToListAsync(cancellationToken);

        foreach (var @override in expiredOverrides)
        {
            @override.IsDeleted = true;
        }
    }

    #endregion

    #region History

    public async Task<IReadOnlyList<FeatureFlagHistory>> GetHistoryForSystemFlagAsync(int systemFlagId, int take = 50, CancellationToken cancellationToken = default)
    {
        return await _context.FeatureFlagHistory
            .Include(h => h.SystemFlag)
            .Include(h => h.Customer)
            .Where(h => h.SystemFlagId == systemFlagId)
            .OrderByDescending(h => h.ChangedAt)
            .Take(take)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<FeatureFlagHistory>> GetHistoryForClientFlagAsync(int clientFlagId, int take = 50, CancellationToken cancellationToken = default)
    {
        return await _context.FeatureFlagHistory
            .Include(h => h.SystemFlag)
            .Include(h => h.ClientFlag)
            .Include(h => h.Customer)
            .Where(h => h.ClientFlagId == clientFlagId)
            .OrderByDescending(h => h.ChangedAt)
            .Take(take)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<FeatureFlagHistory>> GetRecentHistoryAsync(int take = 100, CancellationToken cancellationToken = default)
    {
        return await _context.FeatureFlagHistory
            .Include(h => h.SystemFlag)
            .Include(h => h.Customer)
            .OrderByDescending(h => h.ChangedAt)
            .Take(take)
            .ToListAsync(cancellationToken);
    }

    public async Task AddHistoryEntryAsync(FeatureFlagHistory entry, CancellationToken cancellationToken = default)
    {
        await _context.FeatureFlagHistory.AddAsync(entry, cancellationToken);
    }

    #endregion

    #region Convenience Methods for Dashboard

    public async Task<IReadOnlyList<ClientFeatureFlag>> GetAllClientOverridesAsync(CancellationToken cancellationToken = default)
    {
        return await GetAllClientFlagsAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ClientFeatureFlag>> GetClientOverridesForCustomerAsync(int customerId, CancellationToken cancellationToken = default)
    {
        return await GetClientFlagsForCustomerAsync(customerId, cancellationToken);
    }

    public async Task<IReadOnlyList<SystemFeatureFlag>> GetOverridableSystemFlagsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SystemFeatureFlags
            .Where(f => f.AllowClientOverride && f.IsEnabled && !f.IsDeleted)
            .OrderBy(f => f.Category)
            .ThenBy(f => f.Name)
            .ToListAsync(cancellationToken);
    }

    #endregion
}
