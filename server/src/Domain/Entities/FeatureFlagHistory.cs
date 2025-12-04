namespace Domain.Entities;

/// <summary>
/// Audit history for feature flag changes
/// </summary>
public class FeatureFlagHistory : BaseEntity
{
    /// <summary>
    /// The system flag that was changed (null if client override)
    /// </summary>
    public int? SystemFlagId { get; set; }

    /// <summary>
    /// The client flag that was changed (null if system flag)
    /// </summary>
    public int? ClientFlagId { get; set; }

    /// <summary>
    /// The customer ID if this was a client override change
    /// </summary>
    public int? CustomerId { get; set; }

    /// <summary>
    /// Type of change: Created, Updated, Deleted, Enabled, Disabled
    /// </summary>
    public string ChangeType { get; set; } = string.Empty;

    /// <summary>
    /// Previous value before the change
    /// </summary>
    public string? OldValue { get; set; }

    /// <summary>
    /// New value after the change
    /// </summary>
    public string? NewValue { get; set; }

    /// <summary>
    /// User who made the change
    /// </summary>
    public string ChangedBy { get; set; } = string.Empty;

    /// <summary>
    /// When the change occurred
    /// </summary>
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Optional notes about the change
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Navigation property for the system flag
    /// </summary>
    public virtual SystemFeatureFlag? SystemFlag { get; set; }

    /// <summary>
    /// Navigation property for the client flag
    /// </summary>
    public virtual ClientFeatureFlag? ClientFlag { get; set; }

    /// <summary>
    /// Navigation property for the customer
    /// </summary>
    public virtual Customer? Customer { get; set; }
}
