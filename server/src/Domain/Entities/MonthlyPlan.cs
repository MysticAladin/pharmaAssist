using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Monthly plan (Mjesečni plan) - monthly breakdown
/// Contains monthly targets, promotional activities, and training schedule
/// </summary>
public class MonthlyPlan : BaseEntity
{
    /// <summary>
    /// FK to parent quarterly plan (optional)
    /// </summary>
    public int? QuarterlyPlanId { get; set; }
    
    /// <summary>
    /// FK to the sales representative
    /// </summary>
    public int RepId { get; set; }
    
    /// <summary>
    /// Year of the month
    /// </summary>
    public int Year { get; set; }
    
    /// <summary>
    /// Month number (1-12)
    /// </summary>
    public int Month { get; set; }
    
    /// <summary>
    /// Plan title
    /// </summary>
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// Monthly revenue target (KM)
    /// </summary>
    public decimal? RevenueTarget { get; set; }
    
    /// <summary>
    /// Monthly visits target
    /// </summary>
    public int? VisitsTarget { get; set; }
    
    /// <summary>
    /// A-tier customer coverage target (percentage, 0-100)
    /// </summary>
    public int? TierACoverageTarget { get; set; }
    
    /// <summary>
    /// B-tier customer coverage target (percentage, 0-100)
    /// </summary>
    public int? TierBCoverageTarget { get; set; }
    
    /// <summary>
    /// C-tier customer coverage target (percentage, 0-100)
    /// </summary>
    public int? TierCCoverageTarget { get; set; }
    
    /// <summary>
    /// Promotional activities for the month (JSON)
    /// </summary>
    public string? PromotionalActivities { get; set; }
    
    /// <summary>
    /// Training sessions scheduled
    /// </summary>
    public string? TrainingSchedule { get; set; }
    
    /// <summary>
    /// Focus products for the month (comma-separated IDs)
    /// </summary>
    public string? FocusProducts { get; set; }
    
    /// <summary>
    /// Key customers to prioritize (comma-separated IDs)
    /// </summary>
    public string? PriorityCustomers { get; set; }
    
    /// <summary>
    /// Current status
    /// </summary>
    public PlanStatus Status { get; set; } = PlanStatus.Draft;
    
    /// <summary>
    /// Approved by
    /// </summary>
    public string? ApprovedBy { get; set; }
    
    /// <summary>
    /// Approval date
    /// </summary>
    public DateTime? ApprovedAt { get; set; }
    
    /// <summary>
    /// Rejection reason (if status is Rejected)
    /// </summary>
    public string? RejectionReason { get; set; }
    
    /// <summary>
    /// General notes
    /// </summary>
    public string? Notes { get; set; }
    
    // Actuals (updated as the month progresses)
    
    /// <summary>
    /// Actual revenue achieved (updated periodically)
    /// </summary>
    public decimal? ActualRevenue { get; set; }
    
    /// <summary>
    /// Actual visits completed
    /// </summary>
    public int? ActualVisits { get; set; }
    
    // Navigation properties
    
    public virtual QuarterlyPlan? QuarterlyPlan { get; set; }
    
    public virtual SalesRepresentative? Rep { get; set; }
    
    /// <summary>
    /// Weekly plans under this monthly plan
    /// </summary>
    public virtual ICollection<VisitPlan> WeeklyPlans { get; set; } = new List<VisitPlan>();
}
