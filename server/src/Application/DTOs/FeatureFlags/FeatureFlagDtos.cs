using Domain.Enums;

namespace Application.DTOs.FeatureFlags;

/// <summary>
/// DTO for system-level feature flag
/// </summary>
public class SystemFeatureFlagDto
{
    public int Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public FlagCategory Category { get; set; }
    public FlagType Type { get; set; }
    public string Value { get; set; } = string.Empty;
    public string DefaultValue { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public bool AllowClientOverride { get; set; }
    public string? Environment { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int ClientOverrideCount { get; set; }
}

/// <summary>
/// DTO for client-level feature flag override
/// </summary>
public class ClientFeatureFlagDto
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public int SystemFlagId { get; set; }
    public string FlagKey { get; set; } = string.Empty;
    public string FlagName { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public string? Reason { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// Evaluated flag with final value considering hierarchy
/// </summary>
public class EvaluatedFlagDto
{
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public FlagType Type { get; set; }
    public string Value { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public FlagScope Source { get; set; }
    public bool HasClientOverride { get; set; }
}

/// <summary>
/// DTO for creating a new system flag
/// </summary>
public class CreateSystemFlagDto
{
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public FlagCategory Category { get; set; }
    public FlagType Type { get; set; } = FlagType.Boolean;
    public string Value { get; set; } = "false";
    public string DefaultValue { get; set; } = "false";
    public bool IsEnabled { get; set; } = true;
    public bool AllowClientOverride { get; set; } = true;
    public string? Environment { get; set; }
}

/// <summary>
/// DTO for updating a system flag
/// </summary>
public class UpdateSystemFlagDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public FlagCategory? Category { get; set; }
    public FlagType? Type { get; set; }
    public string? Value { get; set; }
    public string? DefaultValue { get; set; }
    public bool? IsEnabled { get; set; }
    public bool? AllowClientOverride { get; set; }
    public string? Environment { get; set; }
}

/// <summary>
/// DTO for creating/updating a client override
/// </summary>
public class SetClientOverrideDto
{
    public int CustomerId { get; set; }
    public int SystemFlagId { get; set; }
    public string Value { get; set; } = string.Empty;
    public bool IsEnabled { get; set; } = true;
    public string? Reason { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

/// <summary>
/// DTO for feature flag history entry
/// </summary>
public class FeatureFlagHistoryDto
{
    public int Id { get; set; }
    public int? SystemFlagId { get; set; }
    public string? SystemFlagKey { get; set; }
    public int? ClientFlagId { get; set; }
    public int? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public string ChangeType { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string ChangedBy { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// DTO for flag statistics
/// </summary>
public class FeatureFlagStatsDto
{
    public int TotalSystemFlags { get; set; }
    public int EnabledSystemFlags { get; set; }
    public int DisabledSystemFlags { get; set; }
    public int TotalClientOverrides { get; set; }
    public int ActiveClientOverrides { get; set; }
    public Dictionary<FlagCategory, int> FlagsByCategory { get; set; } = new();
}

/// <summary>
/// DTO for bulk flag evaluation request
/// </summary>
public class EvaluateFlagsRequestDto
{
    public int? CustomerId { get; set; }
    public List<string>? FlagKeys { get; set; }
    public string? Environment { get; set; }
}

/// <summary>
/// DTO for bulk flag evaluation response
/// </summary>
public class EvaluateFlagsResponseDto
{
    public int? CustomerId { get; set; }
    public List<EvaluatedFlagDto> Flags { get; set; } = new();
    public DateTime EvaluatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Feature flag matrix for System Admin dashboard (flags × customers)
/// </summary>
public class FeatureFlagMatrixDto
{
    public List<FeatureFlagMatrixRowDto> Rows { get; set; } = new();
    public List<CustomerSummaryDto> Customers { get; set; } = new();
}

/// <summary>
/// A row in the feature flag matrix (one system flag with all customer states)
/// </summary>
public class FeatureFlagMatrixRowDto
{
    public int FlagId { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public FlagCategory Category { get; set; }
    public bool IsEnabled { get; set; }
    public bool AllowClientOverride { get; set; }
    /// <summary>
    /// Customer ID -> IsEnabled state for that customer
    /// </summary>
    public Dictionary<int, bool> CustomerStates { get; set; } = new();
}

/// <summary>
/// Basic customer info for the matrix header
/// </summary>
public class CustomerSummaryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

/// <summary>
/// DTO for bulk updating feature flags across multiple clients
/// </summary>
public class BulkUpdateFlagsDto
{
    public List<BulkFlagUpdateItemDto> Updates { get; set; } = new();
    public string? Reason { get; set; }
}

/// <summary>
/// Single item in a bulk update operation
/// </summary>
public class BulkFlagUpdateItemDto
{
    public int SystemFlagId { get; set; }
    public int CustomerId { get; set; }
    public bool IsEnabled { get; set; }
    public string? Value { get; set; }
}

/// <summary>
/// Result of a bulk update operation
/// </summary>
public class BulkUpdateResultDto
{
    public int TotalRequested { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public List<string> Errors { get; set; } = new();
}

/// <summary>
/// Flag that can be configured by client admin (AllowClientOverride = true)
/// </summary>
public class ConfigurableFlagDto
{
    public int SystemFlagId { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public FlagCategory Category { get; set; }
    public FlagType Type { get; set; }
    public string SystemValue { get; set; } = string.Empty;
    public string CurrentValue { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public bool HasOverride { get; set; }
    public int? OverrideId { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
