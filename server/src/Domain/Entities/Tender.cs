namespace Domain.Entities;

/// <summary>
/// Status of a tender
/// </summary>
public enum TenderStatus
{
    Draft = 0,
    Published = 1,
    Open = 2,
    UnderEvaluation = 3,
    Awarded = 4,
    Cancelled = 5,
    Expired = 6,
    Completed = 7
}

/// <summary>
/// Type of tender
/// </summary>
public enum TenderType
{
    OpenTender = 0,          // Open to all suppliers
    RestrictedTender = 1,    // Only invited suppliers
    NegotiatedProcurement = 2, // Direct negotiation
    FrameworkAgreement = 3,   // Long-term agreement
    QuoteRequest = 4          // Simple quote request
}

/// <summary>
/// Priority level for tender
/// </summary>
public enum TenderPriority
{
    Low = 0,
    Medium = 1,
    High = 2,
    Critical = 3
}

/// <summary>
/// Tender/procurement entity for hospital and institutional orders
/// </summary>
public class Tender : BaseEntity
{
    /// <summary>
    /// Unique tender reference number
    /// </summary>
    public string TenderNumber { get; set; } = string.Empty;
    
    /// <summary>
    /// Title of the tender
    /// </summary>
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// Detailed description
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Type of tender
    /// </summary>
    public TenderType Type { get; set; } = TenderType.OpenTender;
    
    /// <summary>
    /// Current status
    /// </summary>
    public TenderStatus Status { get; set; } = TenderStatus.Draft;
    
    /// <summary>
    /// Priority level
    /// </summary>
    public TenderPriority Priority { get; set; } = TenderPriority.Medium;
    
    /// <summary>
    /// Customer (hospital/institution) issuing the tender
    /// </summary>
    public int CustomerId { get; set; }
    public virtual Customer Customer { get; set; } = null!;
    
    /// <summary>
    /// When the tender was published/announced
    /// </summary>
    public DateTime? PublishedDate { get; set; }
    
    /// <summary>
    /// Deadline for submitting bids
    /// </summary>
    public DateTime SubmissionDeadline { get; set; }
    
    /// <summary>
    /// When bids will be opened/evaluated
    /// </summary>
    public DateTime? OpeningDate { get; set; }
    
    /// <summary>
    /// Expected contract start date
    /// </summary>
    public DateTime? ContractStartDate { get; set; }
    
    /// <summary>
    /// Expected contract end date
    /// </summary>
    public DateTime? ContractEndDate { get; set; }
    
    /// <summary>
    /// Estimated total value of the tender
    /// </summary>
    public decimal? EstimatedValue { get; set; }
    
    /// <summary>
    /// Budget allocated for the tender
    /// </summary>
    public decimal? Budget { get; set; }
    
    /// <summary>
    /// Required bid security/deposit amount
    /// </summary>
    public decimal? BidSecurityAmount { get; set; }
    
    /// <summary>
    /// Currency for all monetary values
    /// </summary>
    public string Currency { get; set; } = "BAM";
    
    /// <summary>
    /// Location of delivery (canton/city)
    /// </summary>
    public string? DeliveryLocation { get; set; }
    
    /// <summary>
    /// Delivery terms
    /// </summary>
    public string? DeliveryTerms { get; set; }
    
    /// <summary>
    /// Payment terms
    /// </summary>
    public string? PaymentTerms { get; set; }
    
    /// <summary>
    /// Special requirements or conditions
    /// </summary>
    public string? SpecialConditions { get; set; }
    
    /// <summary>
    /// Evaluation criteria (stored as JSON)
    /// </summary>
    public string? EvaluationCriteria { get; set; }
    
    /// <summary>
    /// Contact person for the tender
    /// </summary>
    public string? ContactPerson { get; set; }
    
    /// <summary>
    /// Contact email
    /// </summary>
    public string? ContactEmail { get; set; }
    
    /// <summary>
    /// Contact phone
    /// </summary>
    public string? ContactPhone { get; set; }
    
    /// <summary>
    /// Internal notes
    /// </summary>
    public string? InternalNotes { get; set; }
    
    /// <summary>
    /// User assigned to manage this tender
    /// </summary>
    public string? AssignedUserId { get; set; }
    public virtual ApplicationUser? AssignedUser { get; set; }
    
    /// <summary>
    /// Who created the tender record
    /// </summary>
    public string? CreatedById { get; set; }
    public virtual ApplicationUser? CreatedByUser { get; set; }
    
    /// <summary>
    /// When the tender was awarded
    /// </summary>
    public DateTime? AwardedDate { get; set; }
    
    /// <summary>
    /// Winning bid ID if awarded
    /// </summary>
    public int? WinningBidId { get; set; }
    
    // Navigation properties
    public virtual ICollection<TenderItem> Items { get; set; } = new List<TenderItem>();
    public virtual ICollection<TenderBid> Bids { get; set; } = new List<TenderBid>();
    public virtual ICollection<TenderDocument> Documents { get; set; } = new List<TenderDocument>();
    
    // Computed properties
    public bool IsOpen => Status == TenderStatus.Open && DateTime.UtcNow <= SubmissionDeadline;
    public bool IsOverdue => Status == TenderStatus.Open && DateTime.UtcNow > SubmissionDeadline;
    public int DaysUntilDeadline => (SubmissionDeadline - DateTime.UtcNow).Days;
}

/// <summary>
/// Item/product within a tender
/// </summary>
public class TenderItem : BaseEntity
{
    public int TenderId { get; set; }
    public virtual Tender Tender { get; set; } = null!;
    
    /// <summary>
    /// Product being requested (optional - may be generic description)
    /// </summary>
    public int? ProductId { get; set; }
    public virtual Product? Product { get; set; }
    
    /// <summary>
    /// Item description (used when no specific product)
    /// </summary>
    public string Description { get; set; } = string.Empty;
    
    /// <summary>
    /// Generic name or specification
    /// </summary>
    public string? Specification { get; set; }
    
    /// <summary>
    /// Unit of measure
    /// </summary>
    public string Unit { get; set; } = "kom";
    
    /// <summary>
    /// Required quantity
    /// </summary>
    public decimal Quantity { get; set; }
    
    /// <summary>
    /// Estimated unit price
    /// </summary>
    public decimal? EstimatedUnitPrice { get; set; }
    
    /// <summary>
    /// Additional notes for this item
    /// </summary>
    public string? Notes { get; set; }
    
    /// <summary>
    /// Item priority within tender
    /// </summary>
    public int? SortOrder { get; set; }
    
    // Computed
    public decimal? EstimatedTotal => EstimatedUnitPrice.HasValue ? EstimatedUnitPrice.Value * Quantity : null;
}

/// <summary>
/// Bid submitted for a tender (usually our company's bid)
/// </summary>
public class TenderBid : BaseEntity
{
    public int TenderId { get; set; }
    public virtual Tender Tender { get; set; } = null!;
    
    /// <summary>
    /// Bid reference number
    /// </summary>
    public string BidNumber { get; set; } = string.Empty;
    
    /// <summary>
    /// Status of the bid
    /// </summary>
    public TenderBidStatus Status { get; set; } = TenderBidStatus.Draft;
    
    /// <summary>
    /// Total bid amount
    /// </summary>
    public decimal TotalAmount { get; set; }
    
    /// <summary>
    /// Discount offered
    /// </summary>
    public decimal? DiscountAmount { get; set; }
    
    /// <summary>
    /// Final amount after discount
    /// </summary>
    public decimal FinalAmount { get; set; }
    
    /// <summary>
    /// Currency
    /// </summary>
    public string Currency { get; set; } = "BAM";
    
    /// <summary>
    /// Validity period of the bid (days)
    /// </summary>
    public int ValidityDays { get; set; } = 30;
    
    /// <summary>
    /// Proposed delivery time (days)
    /// </summary>
    public int? DeliveryDays { get; set; }
    
    /// <summary>
    /// Warranty period offered (months)
    /// </summary>
    public int? WarrantyMonths { get; set; }
    
    /// <summary>
    /// Payment terms offered
    /// </summary>
    public string? PaymentTerms { get; set; }
    
    /// <summary>
    /// Technical proposal summary
    /// </summary>
    public string? TechnicalProposal { get; set; }
    
    /// <summary>
    /// Notes and comments
    /// </summary>
    public string? Notes { get; set; }
    
    /// <summary>
    /// When the bid was submitted
    /// </summary>
    public DateTime? SubmittedDate { get; set; }
    
    /// <summary>
    /// Who prepared the bid
    /// </summary>
    public string? PreparedById { get; set; }
    public virtual ApplicationUser? PreparedBy { get; set; }
    
    /// <summary>
    /// Who approved the bid internally
    /// </summary>
    public string? ApprovedById { get; set; }
    public virtual ApplicationUser? ApprovedBy { get; set; }
    
    /// <summary>
    /// When it was approved
    /// </summary>
    public DateTime? ApprovedDate { get; set; }
    
    /// <summary>
    /// Reason for rejection (if rejected)
    /// </summary>
    public string? RejectionReason { get; set; }
    
    /// <summary>
    /// Evaluation score (if evaluated)
    /// </summary>
    public decimal? EvaluationScore { get; set; }
    
    /// <summary>
    /// Evaluation notes
    /// </summary>
    public string? EvaluationNotes { get; set; }
    
    // Navigation
    public virtual ICollection<TenderBidItem> Items { get; set; } = new List<TenderBidItem>();
    
    // Computed
    public bool IsExpired => SubmittedDate.HasValue && 
        DateTime.UtcNow > SubmittedDate.Value.AddDays(ValidityDays);
}

/// <summary>
/// Status of a tender bid
/// </summary>
public enum TenderBidStatus
{
    Draft = 0,
    PendingApproval = 1,
    Approved = 2,
    Submitted = 3,
    UnderEvaluation = 4,
    ShortListed = 5,
    Won = 6,
    Lost = 7,
    Withdrawn = 8
}

/// <summary>
/// Line item in a bid
/// </summary>
public class TenderBidItem : BaseEntity
{
    public int TenderBidId { get; set; }
    public virtual TenderBid TenderBid { get; set; } = null!;
    
    public int TenderItemId { get; set; }
    public virtual TenderItem TenderItem { get; set; } = null!;
    
    /// <summary>
    /// Product offered (might be alternative to requested)
    /// </summary>
    public int? ProductId { get; set; }
    public virtual Product? Product { get; set; }
    
    /// <summary>
    /// Description of offered item
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Quantity offered
    /// </summary>
    public decimal Quantity { get; set; }
    
    /// <summary>
    /// Unit price offered
    /// </summary>
    public decimal UnitPrice { get; set; }
    
    /// <summary>
    /// Discount percentage on this item
    /// </summary>
    public decimal? DiscountPercent { get; set; }
    
    /// <summary>
    /// Final unit price after discount
    /// </summary>
    public decimal FinalUnitPrice { get; set; }
    
    /// <summary>
    /// Notes about this item
    /// </summary>
    public string? Notes { get; set; }
    
    // Computed
    public decimal TotalPrice => FinalUnitPrice * Quantity;
}

/// <summary>
/// Document attached to a tender
/// </summary>
public class TenderDocument : BaseEntity
{
    public int TenderId { get; set; }
    public virtual Tender Tender { get; set; } = null!;
    
    /// <summary>
    /// Document name
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Document type/category
    /// </summary>
    public TenderDocumentType DocumentType { get; set; }
    
    /// <summary>
    /// File path or URL
    /// </summary>
    public string FilePath { get; set; } = string.Empty;
    
    /// <summary>
    /// Original file name
    /// </summary>
    public string FileName { get; set; } = string.Empty;
    
    /// <summary>
    /// File size in bytes
    /// </summary>
    public long FileSize { get; set; }
    
    /// <summary>
    /// MIME type
    /// </summary>
    public string? MimeType { get; set; }
    
    /// <summary>
    /// Description
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Who uploaded the document
    /// </summary>
    public string? UploadedById { get; set; }
    public virtual ApplicationUser? UploadedBy { get; set; }
    
    /// <summary>
    /// Is this document required for bidding?
    /// </summary>
    public bool IsRequired { get; set; }
    
    /// <summary>
    /// Is this a template to be filled?
    /// </summary>
    public bool IsTemplate { get; set; }
}

/// <summary>
/// Type of tender document
/// </summary>
public enum TenderDocumentType
{
    TenderNotice = 0,
    Specification = 1,
    TechnicalRequirements = 2,
    PriceSchedule = 3,
    Contract = 4,
    BidForm = 5,
    QualificationDocuments = 6,
    FinancialProposal = 7,
    TechnicalProposal = 8,
    Certificate = 9,
    Other = 10
}
