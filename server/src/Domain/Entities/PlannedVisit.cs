namespace Domain.Entities;

/// <summary>
/// Individual visit scheduled as part of a weekly visit plan
/// </summary>
public class PlannedVisit : BaseEntity
{
    /// <summary>
    /// FK to the visit plan
    /// </summary>
    public int PlanId { get; set; }
    
    /// <summary>
    /// FK to the customer to visit
    /// </summary>
    public int CustomerId { get; set; }
    
    /// <summary>
    /// Planned date for the visit
    /// </summary>
    public DateTime PlannedDate { get; set; }
    
    /// <summary>
    /// Planned time for the visit
    /// </summary>
    public TimeSpan? PlannedTime { get; set; }
    
    /// <summary>
    /// Estimated duration in minutes
    /// </summary>
    public int EstimatedDurationMinutes { get; set; } = 30;
    
    /// <summary>
    /// Objective or purpose of the visit
    /// </summary>
    public string? VisitObjective { get; set; }
    
    /// <summary>
    /// JSON array of product IDs to present during visit
    /// </summary>
    public string? ProductsToPresent { get; set; }
    
    /// <summary>
    /// Additional notes for the visit
    /// </summary>
    public string? Notes { get; set; }
    
    /// <summary>
    /// Sequence number for routing order
    /// </summary>
    public int SequenceNumber { get; set; }
    
    // Navigation properties
    
    /// <summary>
    /// The visit plan this belongs to
    /// </summary>
    public virtual VisitPlan? Plan { get; set; }
    
    /// <summary>
    /// The customer to visit
    /// </summary>
    public virtual Customer? Customer { get; set; }
    
    /// <summary>
    /// The executed visit (if this planned visit was executed)
    /// </summary>
    public virtual ExecutedVisit? ExecutedVisit { get; set; }
}
