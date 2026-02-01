using Domain.Enums;

namespace Application.DTOs.Visits.Reports;

/// <summary>
/// Visit audit log filter parameters
/// </summary>
public class VisitAuditFilterDto
{
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int? RepId { get; set; }
    public bool? LocationVerified { get; set; }
    public bool? HasLocationAlert { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

public class VisitAuditResultDto
{
    public IReadOnlyList<VisitAuditItemDto> Items { get; set; } = new List<VisitAuditItemDto>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}

public class VisitAuditItemDto
{
    public int VisitId { get; set; }
    public int RepId { get; set; }
    public string RepName { get; set; } = "";
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = "";
    public string? CustomerCity { get; set; }
    
    public DateTime CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    
    public decimal? CheckInLatitude { get; set; }
    public decimal? CheckInLongitude { get; set; }
    
    public decimal? CustomerLatitude { get; set; }
    public decimal? CustomerLongitude { get; set; }
    
    public bool LocationVerified { get; set; }
    public int? DistanceFromCustomerMeters { get; set; }
    
    public VisitOutcome? Outcome { get; set; }
    public bool IsCompleted => CheckOutTime.HasValue;
    
    public string LocationStatus
    {
        get
        {
            if (DistanceFromCustomerMeters == null) return "Unknown";
            if (DistanceFromCustomerMeters < 100) return "Valid";
            if (DistanceFromCustomerMeters < 500) return "Warning";
            return "Alert";
        }
    }
}
