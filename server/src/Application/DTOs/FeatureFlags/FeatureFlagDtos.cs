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
