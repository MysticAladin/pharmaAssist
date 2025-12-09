using Domain.Entities;
using Domain.Enums;

namespace Domain.Interfaces;

/// <summary>
/// Repository interface for feature flag operations
/// </summary>
public interface IFeatureFlagRepository
{
    // System Flags
    Task<SystemFeatureFlag?> GetSystemFlagByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<SystemFeatureFlag?> GetSystemFlagByKeyAsync(string key, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SystemFeatureFlag>> GetAllSystemFlagsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SystemFeatureFlag>> GetSystemFlagsByCategoryAsync(FlagCategory category, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SystemFeatureFlag>> GetSystemFlagsByEnvironmentAsync(string? environment, CancellationToken cancellationToken = default);
    Task<SystemFeatureFlag> AddSystemFlagAsync(SystemFeatureFlag flag, CancellationToken cancellationToken = default);
    Task UpdateSystemFlagAsync(SystemFeatureFlag flag, CancellationToken cancellationToken = default);
    Task DeleteSystemFlagAsync(SystemFeatureFlag flag, CancellationToken cancellationToken = default);
    Task<bool> SystemFlagExistsAsync(string key, CancellationToken cancellationToken = default);
    Task<int> CountSystemFlagsAsync(CancellationToken cancellationToken = default);

    // Client Flags
    Task<ClientFeatureFlag?> GetClientFlagByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ClientFeatureFlag?> GetClientFlagAsync(int customerId, int systemFlagId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ClientFeatureFlag>> GetClientFlagsForCustomerAsync(int customerId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ClientFeatureFlag>> GetClientOverridesForFlagAsync(int systemFlagId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ClientFeatureFlag>> GetAllClientFlagsAsync(CancellationToken cancellationToken = default);
    Task<ClientFeatureFlag> AddClientFlagAsync(ClientFeatureFlag flag, CancellationToken cancellationToken = default);
    Task UpdateClientFlagAsync(ClientFeatureFlag flag, CancellationToken cancellationToken = default);
    Task DeleteClientFlagAsync(ClientFeatureFlag flag, CancellationToken cancellationToken = default);
    Task<int> CountClientOverridesAsync(int systemFlagId, CancellationToken cancellationToken = default);
    Task<int> CountActiveClientOverridesAsync(CancellationToken cancellationToken = default);
    Task CleanupExpiredOverridesAsync(CancellationToken cancellationToken = default);
    
    // Convenience methods for dashboard
    Task<IReadOnlyList<ClientFeatureFlag>> GetAllClientOverridesAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ClientFeatureFlag>> GetClientOverridesForCustomerAsync(int customerId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SystemFeatureFlag>> GetOverridableSystemFlagsAsync(CancellationToken cancellationToken = default);

    // History
    Task<IReadOnlyList<FeatureFlagHistory>> GetHistoryForSystemFlagAsync(int systemFlagId, int take = 50, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<FeatureFlagHistory>> GetHistoryForClientFlagAsync(int clientFlagId, int take = 50, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<FeatureFlagHistory>> GetRecentHistoryAsync(int take = 100, CancellationToken cancellationToken = default);
    Task AddHistoryEntryAsync(FeatureFlagHistory entry, CancellationToken cancellationToken = default);

    // Statistics
    Task<int> CountEnabledSystemFlagsAsync(CancellationToken cancellationToken = default);
    Task<Dictionary<FlagCategory, int>> GetFlagCountByCategoryAsync(CancellationToken cancellationToken = default);
}
