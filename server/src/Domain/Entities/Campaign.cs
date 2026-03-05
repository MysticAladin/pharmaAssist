using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Marketing campaign within a cycle — tracks targeted outreach and budget
/// </summary>
public class Campaign : BaseEntity
{
    /// <summary>
    /// Optional parent cycle
    /// </summary>
    public int? CycleId { get; set; }

    /// <summary>
    /// Campaign name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Campaign name in local language
    /// </summary>
    public string? NameLocal { get; set; }

    /// <summary>
    /// Campaign type
    /// </summary>
    public CampaignType Type { get; set; }

    /// <summary>
    /// Campaign start date
    /// </summary>
    public DateTime StartDate { get; set; }

    /// <summary>
    /// Campaign end date
    /// </summary>
    public DateTime EndDate { get; set; }

    /// <summary>
    /// Planned budget (KM)
    /// </summary>
    public decimal? PlannedBudget { get; set; }

    /// <summary>
    /// Actual amount spent (KM)
    /// </summary>
    public decimal ActualSpent { get; set; }

    /// <summary>
    /// Campaign lifecycle status
    /// </summary>
    public CampaignStatus Status { get; set; } = CampaignStatus.Draft;

    /// <summary>
    /// JSON targeting criteria (canton, customer type, tier, brand usage)
    /// </summary>
    public string? TargetingCriteria { get; set; }

    /// <summary>
    /// Campaign description / objectives
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Whether this campaign is active
    /// </summary>
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual Cycle? Cycle { get; set; }
    public virtual ICollection<CampaignTarget> Targets { get; set; } = new List<CampaignTarget>();
    public virtual ICollection<CampaignExpense> Expenses { get; set; } = new List<CampaignExpense>();
}
