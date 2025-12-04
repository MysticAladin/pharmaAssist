using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// System-level feature flag that applies globally
/// </summary>
public class SystemFeatureFlag : BaseEntity
{
    /// <summary>
    /// Unique key for the feature flag (e.g., "portal.splitInvoice", "orders.quickOrder")
    /// </summary>
    public string Key { get; set; } = string.Empty;

    /// <summary>
    /// Human-readable name of the flag
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Detailed description of what this flag controls
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Category for organizing flags
    /// </summary>
    public FlagCategory Category { get; set; }

    /// <summary>
    /// Type of value this flag holds
    /// </summary>
    public FlagType Type { get; set; } = FlagType.Boolean;

    /// <summary>
    /// The flag value stored as string (interpreted based on Type)
    /// </summary>
    public string Value { get; set; } = "false";

    /// <summary>
    /// Default value used when flag is reset
    /// </summary>
    public string DefaultValue { get; set; } = "false";

    /// <summary>
    /// Whether this flag is currently enabled
    /// </summary>
    public bool IsEnabled { get; set; }

    /// <summary>
    /// Whether this flag can be overridden at the client level
    /// </summary>
    public bool AllowClientOverride { get; set; } = true;

    /// <summary>
    /// Optional environment restriction (e.g., "development", "production", null for all)
    /// </summary>
    public string? Environment { get; set; }

    /// <summary>
    /// Navigation property for client-level overrides
    /// </summary>
    public virtual ICollection<ClientFeatureFlag> ClientOverrides { get; set; } = new List<ClientFeatureFlag>();
}
