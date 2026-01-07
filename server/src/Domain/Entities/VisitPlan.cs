using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Weekly visit plan submitted by sales representatives for manager approval
/// </summary>
public class VisitPlan : BaseEntity
{
    /// <summary>
    /// FK to the sales representative
    /// </summary>
    public int RepId { get; set; }
    
    /// <summary>
    /// Monday of the week this plan covers
    /// </summary>
    public DateTime PlanWeek { get; set; }
    
    /// <summary>
    /// Current status of the plan
    /// </summary>
    public VisitPlanStatus Status { get; set; } = VisitPlanStatus.Draft;
    
    /// <summary>
    /// When the plan was submitted for approval
    /// </summary>
    public DateTime? SubmittedAt { get; set; }
    
    /// <summary>
    /// User ID of the manager who approved/rejected
    /// </summary>
    public string? ApprovedBy { get; set; }
    
    /// <summary>
    /// When the plan was approved/rejected
    /// </summary>
    public DateTime? ApprovedAt { get; set; }
    
    /// <summary>
    /// Reason for rejection (if rejected)
    /// </summary>
    public string? RejectionReason { get; set; }
    
    // Navigation properties
    
    /// <summary>
    /// The sales representative who created this plan
    /// </summary>
    public virtual SalesRepresentative? Rep { get; set; }
    
    /// <summary>
    /// Individual visits planned for this week
    /// </summary>
    public virtual ICollection<PlannedVisit> PlannedVisits { get; set; } = new List<PlannedVisit>();
}
