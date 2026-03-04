using Domain.Enums;

namespace Application.DTOs.SalesReps;

/// <summary>
/// Customer summary for sales representative's assigned customers
/// </summary>
public class RepCustomerDto
{
    public int Id { get; set; }
    public string CustomerCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public CustomerType CustomerType { get; set; }
    public string CustomerTypeName { get; set; } = string.Empty;
    public CustomerTier Tier { get; set; }
    public string TierName { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? Phone { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? City { get; set; }
    public string? FullAddress { get; set; }
    public decimal CreditLimit { get; set; }
    public decimal CreditUsed { get; set; }
    public decimal CreditAvailable { get; set; }
    public bool CreditWarning { get; set; }
    public DateTime? LastVisitDate { get; set; }
    public DateTime? LastOrderDate { get; set; }
    public decimal? LastOrderAmount { get; set; }
    public DateTime AssignedAt { get; set; }
    public bool IsActive { get; set; }
    
    // Visit frequency fields
    public int RequiredVisitsPerMonth { get; set; }
    public int CompletedVisitsThisMonth { get; set; }
    public int? DaysSinceLastVisit { get; set; }
    public bool IsOverdue { get; set; }
    public decimal VisitCompliancePercent { get; set; }
    
    // Location fields (for map views)
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
}

/// <summary>
/// Customer credit status for sales representative
/// </summary>
public class RepCustomerCreditDto
{
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public decimal CreditLimit { get; set; }
    public decimal CreditUsed { get; set; }
    public decimal CreditAvailable { get; set; }
    public decimal CreditUtilization { get; set; }
    public int PaymentTermDays { get; set; }
    public decimal OverdueAmount { get; set; }
    public int OverdueInvoiceCount { get; set; }
    public DateTime? OldestOverdueDate { get; set; }
    public bool CanPlaceOrders { get; set; }
    public string? CreditWarningMessage { get; set; }
}

/// <summary>
/// Customer order history for sales representative
/// </summary>
public class RepCustomerOrderDto
{
    public int OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public OrderStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public int ItemCount { get; set; }
    public bool CreatedByRep { get; set; }
    public bool CreatedDuringVisit { get; set; }
    public int? VisitId { get; set; }
}

/// <summary>
/// Customer visit history for sales representative
/// </summary>
public class RepCustomerVisitDto
{
    public int VisitId { get; set; }
    public DateTime VisitDate { get; set; }
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }
    public VisitType VisitType { get; set; }
    public string VisitTypeName { get; set; } = string.Empty;
    public VisitOutcome? Outcome { get; set; }
    public string OutcomeName { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public bool HasOrders { get; set; }
    public int OrderCount { get; set; }
    public decimal? TotalOrderValue { get; set; }
}

/// <summary>
/// Filter for getting assigned customers
/// </summary>
public class RepCustomerFilterDto
{
    public string? Search { get; set; }
    public CustomerType? CustomerType { get; set; }
    public CustomerTier? Tier { get; set; }
    public bool? NeedsVisit { get; set; }
    public bool? HasCreditWarning { get; set; }
    public string? City { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SortBy { get; set; }
    public bool SortDescending { get; set; }
}

/// <summary>
/// Result for rep customer list
/// </summary>
public class RepCustomerResultDto
{
    public List<RepCustomerDto> Customers { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

/// <summary>
/// Statistics for rep's assigned customers
/// </summary>
public class RepCustomerStatsDto
{
    public int TotalCustomers { get; set; }
    public int ActiveCustomers { get; set; }
    public Dictionary<string, int> CustomersByType { get; set; } = new();
    public Dictionary<string, int> CustomersByTier { get; set; } = new();
    public int CustomersWithCreditWarning { get; set; }
    public int CustomersNeedingVisit { get; set; }
    public int CustomersOverdue { get; set; }
    public int CustomersVisitedThisWeek { get; set; }
    public int CustomersWithOrdersThisMonth { get; set; }
    public decimal TotalOrderValueThisMonth { get; set; }
    public decimal OverallVisitCompliance { get; set; }
}

/// <summary>
/// Photo/attachment from a customer visit
/// </summary>
public class CustomerPhotoDto
{
    public int Id { get; set; }
    public int VisitId { get; set; }
    public DateTime VisitDate { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public DateTime UploadedAt { get; set; }
    public string? ThumbnailUrl { get; set; }
}

/// <summary>
/// Result for customer photo archive
/// </summary>
public class CustomerPhotoArchiveDto
{
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public int TotalPhotos { get; set; }
    public List<CustomerPhotoDto> Photos { get; set; } = new();
}
