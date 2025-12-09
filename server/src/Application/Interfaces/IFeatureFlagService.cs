using Application.DTOs.Common;
using Application.DTOs.FeatureFlags;
using Domain.Enums;

namespace Application.Interfaces;

/// <summary>
/// Service interface for feature flag operations
/// </summary>
public interface IFeatureFlagService
{
    // System Flag Operations
    Task<ApiResponse<SystemFeatureFlagDto>> GetSystemFlagByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<SystemFeatureFlagDto>> GetSystemFlagByKeyAsync(string key, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<SystemFeatureFlagDto>>> GetAllSystemFlagsAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<SystemFeatureFlagDto>>> GetSystemFlagsByCategoryAsync(FlagCategory category, CancellationToken cancellationToken = default);
    Task<ApiResponse<SystemFeatureFlagDto>> CreateSystemFlagAsync(CreateSystemFlagDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<SystemFeatureFlagDto>> UpdateSystemFlagAsync(int id, UpdateSystemFlagDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteSystemFlagAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> ToggleSystemFlagAsync(int id, CancellationToken cancellationToken = default);

    // Client Override Operations
    Task<ApiResponse<ClientFeatureFlagDto>> GetClientOverrideAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<ClientFeatureFlagDto>>> GetClientOverridesForCustomerAsync(int customerId, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<ClientFeatureFlagDto>>> GetClientOverridesForFlagAsync(int systemFlagId, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<ClientFeatureFlagDto>>> GetAllClientOverridesAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<ClientFeatureFlagDto>> SetClientOverrideAsync(SetClientOverrideDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> RemoveClientOverrideAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> RemoveClientOverrideAsync(int customerId, int systemFlagId, CancellationToken cancellationToken = default);
    Task<ApiResponse<int>> CleanupExpiredOverridesAsync(CancellationToken cancellationToken = default);

    // Flag Evaluation
    Task<ApiResponse<EvaluatedFlagDto>> EvaluateFlagAsync(string key, int? customerId = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<EvaluateFlagsResponseDto>> EvaluateFlagsAsync(EvaluateFlagsRequestDto request, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> IsFlagEnabledAsync(string key, int? customerId = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<string>> GetFlagValueAsync(string key, int? customerId = null, CancellationToken cancellationToken = default);

    // History & Statistics
    Task<ApiResponse<IEnumerable<FeatureFlagHistoryDto>>> GetHistoryAsync(int? systemFlagId = null, int take = 50, CancellationToken cancellationToken = default);
    Task<ApiResponse<FeatureFlagStatsDto>> GetStatisticsAsync(CancellationToken cancellationToken = default);

    // System Admin Dashboard Operations
    Task<ApiResponse<FeatureFlagMatrixDto>> GetFeatureFlagMatrixAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<BulkUpdateResultDto>> BulkUpdateClientOverridesAsync(BulkUpdateFlagsDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<ConfigurableFlagDto>>> GetConfigurableFlagsForCustomerAsync(int customerId, CancellationToken cancellationToken = default);
}
