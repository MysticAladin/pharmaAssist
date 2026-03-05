using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Pharmaceutical visit cycle — a time-boxed period with focused brands and customer targets
/// </summary>
public class Cycle : BaseEntity
{
    /// <summary>
    /// Cycle name (e.g., "Q2 2026 - Cardiology Focus")
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Cycle name in local language
    /// </summary>
    public string? NameLocal { get; set; }

    /// <summary>
    /// Cycle start date
    /// </summary>
    public DateTime StartDate { get; set; }

    /// <summary>
    /// Cycle end date
    /// </summary>
    public DateTime EndDate { get; set; }

    /// <summary>
    /// Cycle lifecycle status
    /// </summary>
    public CycleStatus Status { get; set; } = CycleStatus.Draft;

    /// <summary>
    /// JSON array of focus brand IDs for this cycle
    /// </summary>
    public string? FocusBrandIds { get; set; }

    /// <summary>
    /// Cycle description / objectives
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Owner / creator (SalesRepresentative or manager)
    /// </summary>
    public int? OwnerId { get; set; }

    /// <summary>
    /// Planned budget for this cycle (KM)
    /// </summary>
    public decimal? PlannedBudget { get; set; }

    /// <summary>
    /// Whether this cycle is active for planning
    /// </summary>
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual SalesRepresentative? Owner { get; set; }
    public virtual ICollection<CycleTarget> Targets { get; set; } = new List<CycleTarget>();
    public virtual ICollection<Campaign> Campaigns { get; set; } = new List<Campaign>();
}
