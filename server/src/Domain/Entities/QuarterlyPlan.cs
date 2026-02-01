using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Quarterly plan (Kvartalni plan) - quarterly breakdown of annual plan
/// Contains quarterly targets, campaign schedules, and resource allocation
/// </summary>
public class QuarterlyPlan : BaseEntity
{
    /// <summary>
    /// FK to parent annual plan (optional - can exist standalone)
    /// </summary>
    public int? AnnualPlanId { get; set; }
    
    /// <summary>
    /// FK to the sales representative
    /// </summary>
    public int RepId { get; set; }
    
    /// <summary>
    /// Year of the quarter
    /// </summary>
    public int Year { get; set; }
    
    /// <summary>
    /// Quarter number (1-4)
    /// </summary>
    public int Quarter { get; set; }
    
    /// <summary>
    /// Plan title
    /// </summary>
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// Quarterly revenue target (KM)
    /// </summary>
    public decimal? RevenueTarget { get; set; }
    
    /// <summary>
    /// Quarterly visits target
    /// </summary>
    public int? VisitsTarget { get; set; }
    
    /// <summary>
    /// New customers target for the quarter
    /// </summary>
    public int? NewCustomersTarget { get; set; }
    
    /// <summary>
    /// Campaigns scheduled this quarter (JSON: [{name, startDate, endDate, products}])
    /// </summary>
    public string? CampaignSchedule { get; set; }
    
    /// <summary>
    /// Training and development activities planned
    /// </summary>
    public string? TrainingSchedule { get; set; }
    
    /// <summary>
    /// Resource allocation notes (budget, samples, promotional materials)
    /// </summary>
    public string? ResourceAllocation { get; set; }
    
    /// <summary>
    /// Key objectives for the quarter
    /// </summary>
    public string? KeyObjectives { get; set; }
    
    /// <summary>
    /// Products to focus on this quarter (comma-separated IDs)
    /// </summary>
    public string? FocusProducts { get; set; }
    
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
    
    // Navigation properties
    
    public virtual AnnualPlan? AnnualPlan { get; set; }
    
    public virtual SalesRepresentative? Rep { get; set; }
    
    /// <summary>
    /// Monthly breakdowns of this quarterly plan
    /// </summary>
    public virtual ICollection<MonthlyPlan> MonthlyPlans { get; set; } = new List<MonthlyPlan>();
}
