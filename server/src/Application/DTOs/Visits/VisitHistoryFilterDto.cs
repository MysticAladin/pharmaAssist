using Domain.Enums;

namespace Application.DTOs.Visits;

public class VisitHistoryFilterDto
{
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int? CustomerId { get; set; }
    public VisitOutcome? Outcome { get; set; }
    public string? SearchTerm { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class VisitHistoryResultDto
{
    public IReadOnlyList<VisitHistoryItemDto> Items { get; set; } = new List<VisitHistoryItemDto>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}

public class VisitHistoryItemDto
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = "";
    public string? CustomerCity { get; set; }
    public VisitType VisitType { get; set; }
    public DateTime CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public int? DurationMinutes { get; set; }
    public bool LocationVerified { get; set; }
    public int? DistanceFromCustomerMeters { get; set; }
    public VisitOutcome? Outcome { get; set; }
    public string? Summary { get; set; }
    public bool IsCompleted => CheckOutTime.HasValue;
}
