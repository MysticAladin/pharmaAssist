using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Record of an actual visit executed by a sales representative
/// Includes GPS verification and outcome tracking
/// </summary>
public class ExecutedVisit : BaseEntity
{
    /// <summary>
    /// FK to the planned visit (null for ad-hoc visits)
    /// </summary>
    public int? PlannedVisitId { get; set; }
    
    /// <summary>
    /// FK to the sales representative
    /// </summary>
    public int RepId { get; set; }
    
    /// <summary>
    /// FK to the customer visited
    /// </summary>
    public int CustomerId { get; set; }
    
    /// <summary>
    /// Time when the rep checked in
    /// </summary>
    public DateTime CheckInTime { get; set; }
    
    /// <summary>
    /// GPS latitude at check-in
    /// </summary>
    public decimal? CheckInLatitude { get; set; }
    
    /// <summary>
    /// GPS longitude at check-in
    /// </summary>
    public decimal? CheckInLongitude { get; set; }
    
    /// <summary>
    /// Reverse-geocoded address at check-in
    /// </summary>
    public string? CheckInAddress { get; set; }
    
    /// <summary>
    /// Time when the rep checked out
    /// </summary>
    public DateTime? CheckOutTime { get; set; }
    
    /// <summary>
    /// GPS latitude at check-out
    /// </summary>
    public decimal? CheckOutLatitude { get; set; }
    
    /// <summary>
    /// GPS longitude at check-out
    /// </summary>
    public decimal? CheckOutLongitude { get; set; }
    
    /// <summary>
    /// Calculated duration in minutes
    /// </summary>
    public int? ActualDurationMinutes { get; set; }
    
    /// <summary>
    /// Distance from customer location in meters
    /// </summary>
    public int? DistanceFromCustomerMeters { get; set; }
    
    /// <summary>
    /// Whether the location was verified within acceptable range
    /// </summary>
    public bool LocationVerified { get; set; }
    
    /// <summary>
    /// Type of visit (Planned or AdHoc)
    /// </summary>
    public VisitType VisitType { get; set; }
    
    /// <summary>
    /// Outcome of the visit
    /// </summary>
    public VisitOutcome? Outcome { get; set; }
    
    /// <summary>
    /// Summary of the visit
    /// </summary>
    public string? Summary { get; set; }
    
    /// <summary>
    /// JSON array of products discussed during visit
    /// </summary>
    public string? ProductsDiscussed { get; set; }
    
    /// <summary>
    /// Whether follow-up is required
    /// </summary>
    public bool FollowUpRequired { get; set; }
    
    /// <summary>
    /// Date for follow-up action
    /// </summary>
    public DateTime? FollowUpDate { get; set; }
    
    /// <summary>
    /// Suggested date for next visit
    /// </summary>
    public DateTime? NextVisitDate { get; set; }
    
    /// <summary>
    /// Number of attachments (photos, documents)
    /// </summary>
    public int AttachmentsCount { get; set; }
    
    // Navigation properties
    
    /// <summary>
    /// The planned visit this execution corresponds to
    /// </summary>
    public virtual PlannedVisit? PlannedVisit { get; set; }
    
    /// <summary>
    /// The sales representative
    /// </summary>
    public virtual SalesRepresentative? Rep { get; set; }
    
    /// <summary>
    /// The customer visited
    /// </summary>
    public virtual Customer? Customer { get; set; }
    
    /// <summary>
    /// Notes taken during the visit
    /// </summary>
    public virtual ICollection<VisitNote> Notes { get; set; } = new List<VisitNote>();
    
    /// <summary>
    /// Attachments (photos, documents) from the visit
    /// </summary>
    public virtual ICollection<VisitAttachment> Attachments { get; set; } = new List<VisitAttachment>();
}
