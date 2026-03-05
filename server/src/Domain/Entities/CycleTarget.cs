namespace Domain.Entities;

/// <summary>
/// Links a cycle to a specific customer-rep pair with visit requirements
/// </summary>
public class CycleTarget : BaseEntity
{
    /// <summary>
    /// The cycle this target belongs to
    /// </summary>
    public int CycleId { get; set; }

    /// <summary>
    /// Target customer
    /// </summary>
    public int CustomerId { get; set; }

    /// <summary>
    /// Assigned sales representative
    /// </summary>
    public int RepId { get; set; }

    /// <summary>
    /// Required number of visits during the cycle
    /// </summary>
    public int RequiredVisits { get; set; }

    /// <summary>
    /// Number of visits completed against this target
    /// </summary>
    public int CompletedVisits { get; set; }

    /// <summary>
    /// Target priority (1 = highest)
    /// </summary>
    public int Priority { get; set; } = 3;

    /// <summary>
    /// JSON array of product IDs to present/discuss
    /// </summary>
    public string? TargetProducts { get; set; }

    /// <summary>
    /// Notes about this target
    /// </summary>
    public string? Notes { get; set; }

    // Navigation properties
    public virtual Cycle Cycle { get; set; } = null!;
    public virtual Customer Customer { get; set; } = null!;
    public virtual SalesRepresentative Rep { get; set; } = null!;
}
