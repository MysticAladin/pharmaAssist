namespace Application.DTOs.Visits.Reports;

/// <summary>
/// All visits for a customer across all sales representatives (admin/manager view)
/// </summary>
public class CustomerVisitHistoryDto
{
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerType { get; set; }
    public List<CrossRepVisitDto> Visits { get; set; } = new();
    public int TotalVisits { get; set; }
    public int TotalPages { get; set; }
    public int CurrentPage { get; set; }
    public int PageSize { get; set; }
}

public class CrossRepVisitDto
{
    public int Id { get; set; }
    public int RepId { get; set; }
    public string RepName { get; set; } = string.Empty;
    public DateTime CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public int? ActualDurationMinutes { get; set; }
    public bool LocationVerified { get; set; }
    public string? VisitType { get; set; }
    public string? Outcome { get; set; }
    public string? Summary { get; set; }
    public string? ProductsDiscussed { get; set; }
    public string? CompetitionNotes { get; set; }
    public string? AgreedDeals { get; set; }
    public bool FollowUpRequired { get; set; }
    public DateTime? NextVisitDate { get; set; }
}

/// <summary>
/// Competition intelligence aggregation for weekly manager reports
/// </summary>
public class CompetitionInsightDto
{
    public int RepId { get; set; }
    public string RepName { get; set; } = string.Empty;
    public int VisitId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CompetitionNotes { get; set; } = string.Empty;
    public DateTime VisitDate { get; set; }
}
