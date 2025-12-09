using Domain.Entities;

namespace Application.DTOs.Tenders;

/// <summary>
/// DTO for tender list item
/// </summary>
public class TenderDto
{
    public int Id { get; set; }
    public string TenderNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TenderType Type { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public TenderStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public TenderPriority Priority { get; set; }
    public string PriorityName { get; set; } = string.Empty;
    
    // Customer
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    
    // Dates
    public DateTime? PublishedDate { get; set; }
    public DateTime SubmissionDeadline { get; set; }
    public DateTime? OpeningDate { get; set; }
    public DateTime? ContractStartDate { get; set; }
    public DateTime? ContractEndDate { get; set; }
    public DateTime? AwardedDate { get; set; }
    
    // Values
    public decimal? EstimatedValue { get; set; }
    public decimal? Budget { get; set; }
    public string Currency { get; set; } = "BAM";
    
    // Location & Terms
    public string? DeliveryLocation { get; set; }
    public string? DeliveryTerms { get; set; }
    public string? PaymentTerms { get; set; }
    
    // Contact
    public string? ContactPerson { get; set; }
    public string? ContactEmail { get; set; }
    
    // Assignment
    public string? AssignedUserId { get; set; }
    public string? AssignedUserName { get; set; }
    
    // Stats
    public int ItemCount { get; set; }
    public int BidCount { get; set; }
    public int DocumentCount { get; set; }
    
    // Computed
    public bool IsOpen { get; set; }
    public bool IsOverdue { get; set; }
    public int DaysUntilDeadline { get; set; }
    
    // Winning bid info
    public int? WinningBidId { get; set; }
    public decimal? WinningBidAmount { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// Detailed tender with all related data
/// </summary>
public class TenderDetailDto : TenderDto
{
    public string? SpecialConditions { get; set; }
    public string? EvaluationCriteria { get; set; }
    public string? ContactPhone { get; set; }
    public string? InternalNotes { get; set; }
    public decimal? BidSecurityAmount { get; set; }
    
    public string? CreatedById { get; set; }
    public string? CreatedByName { get; set; }
    
    public List<TenderItemDto> Items { get; set; } = new();
    public List<TenderBidDto> Bids { get; set; } = new();
    public List<TenderDocumentDto> Documents { get; set; } = new();
}

/// <summary>
/// DTO for creating a tender
/// </summary>
public class CreateTenderDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TenderType Type { get; set; } = TenderType.OpenTender;
    public TenderPriority Priority { get; set; } = TenderPriority.Medium;
    public int CustomerId { get; set; }
    
    public DateTime SubmissionDeadline { get; set; }
    public DateTime? OpeningDate { get; set; }
    public DateTime? ContractStartDate { get; set; }
    public DateTime? ContractEndDate { get; set; }
    
    public decimal? EstimatedValue { get; set; }
    public decimal? Budget { get; set; }
    public decimal? BidSecurityAmount { get; set; }
    public string Currency { get; set; } = "BAM";
    
    public string? DeliveryLocation { get; set; }
    public string? DeliveryTerms { get; set; }
    public string? PaymentTerms { get; set; }
    public string? SpecialConditions { get; set; }
    public string? EvaluationCriteria { get; set; }
    
    public string? ContactPerson { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    
    public string? AssignedUserId { get; set; }
    public string? InternalNotes { get; set; }
    
    public List<CreateTenderItemDto> Items { get; set; } = new();
}

/// <summary>
/// DTO for updating a tender
/// </summary>
public class UpdateTenderDto : CreateTenderDto
{
    public TenderStatus? Status { get; set; }
}

/// <summary>
/// DTO for tender item
/// </summary>
public class TenderItemDto
{
    public int Id { get; set; }
    public int TenderId { get; set; }
    public int? ProductId { get; set; }
    public string? ProductName { get; set; }
    public string? ProductSku { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Specification { get; set; }
    public string Unit { get; set; } = "kom";
    public decimal Quantity { get; set; }
    public decimal? EstimatedUnitPrice { get; set; }
    public decimal? EstimatedTotal { get; set; }
    public string? Notes { get; set; }
    public int? SortOrder { get; set; }
}

/// <summary>
/// DTO for creating tender item
/// </summary>
public class CreateTenderItemDto
{
    public int? ProductId { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Specification { get; set; }
    public string Unit { get; set; } = "kom";
    public decimal Quantity { get; set; }
    public decimal? EstimatedUnitPrice { get; set; }
    public string? Notes { get; set; }
    public int? SortOrder { get; set; }
}

/// <summary>
/// DTO for tender bid
/// </summary>
public class TenderBidDto
{
    public int Id { get; set; }
    public int TenderId { get; set; }
    public string BidNumber { get; set; } = string.Empty;
    public TenderBidStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    
    public decimal TotalAmount { get; set; }
    public decimal? DiscountAmount { get; set; }
    public decimal FinalAmount { get; set; }
    public string Currency { get; set; } = "BAM";
    
    public int ValidityDays { get; set; }
    public int? DeliveryDays { get; set; }
    public int? WarrantyMonths { get; set; }
    public string? PaymentTerms { get; set; }
    public string? TechnicalProposal { get; set; }
    public string? Notes { get; set; }
    
    public DateTime? SubmittedDate { get; set; }
    public string? PreparedById { get; set; }
    public string? PreparedByName { get; set; }
    public string? ApprovedById { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedDate { get; set; }
    
    public string? RejectionReason { get; set; }
    public decimal? EvaluationScore { get; set; }
    public string? EvaluationNotes { get; set; }
    
    public bool IsExpired { get; set; }
    public bool IsWinningBid { get; set; }
    
    public List<TenderBidItemDto> Items { get; set; } = new();
    
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO for creating a tender bid
/// </summary>
public class CreateTenderBidDto
{
    public int TenderId { get; set; }
    public int ValidityDays { get; set; } = 30;
    public int? DeliveryDays { get; set; }
    public int? WarrantyMonths { get; set; }
    public string? PaymentTerms { get; set; }
    public string? TechnicalProposal { get; set; }
    public string? Notes { get; set; }
    
    public List<CreateTenderBidItemDto> Items { get; set; } = new();
}

/// <summary>
/// DTO for updating a tender bid
/// </summary>
public class UpdateTenderBidDto : CreateTenderBidDto
{
    public TenderBidStatus? Status { get; set; }
}

/// <summary>
/// DTO for tender bid item
/// </summary>
public class TenderBidItemDto
{
    public int Id { get; set; }
    public int TenderBidId { get; set; }
    public int TenderItemId { get; set; }
    public string TenderItemDescription { get; set; } = string.Empty;
    
    public int? ProductId { get; set; }
    public string? ProductName { get; set; }
    public string? ProductSku { get; set; }
    public string? Description { get; set; }
    
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal? DiscountPercent { get; set; }
    public decimal FinalUnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// DTO for creating tender bid item
/// </summary>
public class CreateTenderBidItemDto
{
    public int TenderItemId { get; set; }
    public int? ProductId { get; set; }
    public string? Description { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal? DiscountPercent { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// DTO for tender document
/// </summary>
public class TenderDocumentDto
{
    public int Id { get; set; }
    public int TenderId { get; set; }
    public string Name { get; set; } = string.Empty;
    public TenderDocumentType DocumentType { get; set; }
    public string DocumentTypeName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string? MimeType { get; set; }
    public string? Description { get; set; }
    public string? UploadedById { get; set; }
    public string? UploadedByName { get; set; }
    public bool IsRequired { get; set; }
    public bool IsTemplate { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO for uploading tender document
/// </summary>
public class CreateTenderDocumentDto
{
    public int TenderId { get; set; }
    public string Name { get; set; } = string.Empty;
    public TenderDocumentType DocumentType { get; set; }
    public string? Description { get; set; }
    public bool IsRequired { get; set; }
    public bool IsTemplate { get; set; }
}

/// <summary>
/// Filter for tender queries
/// </summary>
public class TenderFilterDto
{
    public string? SearchTerm { get; set; }
    public TenderStatus? Status { get; set; }
    public TenderType? Type { get; set; }
    public TenderPriority? Priority { get; set; }
    public int? CustomerId { get; set; }
    public string? AssignedUserId { get; set; }
    public DateTime? DeadlineFrom { get; set; }
    public DateTime? DeadlineTo { get; set; }
    public bool? IsOpen { get; set; }
    public bool? IsOverdue { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string SortBy { get; set; } = "SubmissionDeadline";
    public bool SortDescending { get; set; } = false;
}

/// <summary>
/// Tender statistics
/// </summary>
public class TenderStatsDto
{
    public int TotalTenders { get; set; }
    public int OpenTenders { get; set; }
    public int OverdueTenders { get; set; }
    public int AwardedTenders { get; set; }
    public int WonBids { get; set; }
    public int LostBids { get; set; }
    public int PendingBids { get; set; }
    public decimal TotalEstimatedValue { get; set; }
    public decimal TotalWonValue { get; set; }
    public decimal WinRate { get; set; }
    public Dictionary<TenderStatus, int> ByStatus { get; set; } = new();
    public Dictionary<TenderPriority, int> ByPriority { get; set; } = new();
}

/// <summary>
/// Actions available for a tender
/// </summary>
public class TenderActionsDto
{
    public bool CanEdit { get; set; }
    public bool CanPublish { get; set; }
    public bool CanOpen { get; set; }
    public bool CanClose { get; set; }
    public bool CanCancel { get; set; }
    public bool CanAward { get; set; }
    public bool CanAddBid { get; set; }
    public bool CanAddDocument { get; set; }
}
