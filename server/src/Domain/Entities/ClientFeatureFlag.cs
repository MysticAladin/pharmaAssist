using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Client-level feature flag override for specific customers/pharmacies
/// </summary>
public class ClientFeatureFlag : BaseEntity
{
    /// <summary>
    /// The customer/pharmacy this override applies to
    /// </summary>
    public int CustomerId { get; set; }

    /// <summary>
    /// Foreign key to the system flag being overridden
    /// </summary>
    public int SystemFlagId { get; set; }

    /// <summary>
    /// The overriding value (interpreted based on the system flag's Type)
    /// </summary>
    public string Value { get; set; } = string.Empty;

    /// <summary>
    /// Whether this override is currently active
    /// </summary>
    public bool IsEnabled { get; set; } = true;

    /// <summary>
    /// Reason for this override
    /// </summary>
    public string? Reason { get; set; }

    /// <summary>
    /// Optional expiration date for temporary overrides
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// Navigation property for the customer
    /// </summary>
    public virtual Customer Customer { get; set; } = null!;

    /// <summary>
    /// Navigation property for the system flag
    /// </summary>
    public virtual SystemFeatureFlag SystemFlag { get; set; } = null!;
}
