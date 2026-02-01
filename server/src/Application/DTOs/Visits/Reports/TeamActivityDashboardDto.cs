using Domain.Enums;

namespace Application.DTOs.Visits.Reports;

/// <summary>
/// Team activity dashboard data for managers
/// </summary>
public class TeamActivityDashboardDto
{
    public DateTime Date { get; set; }
    public IReadOnlyList<RepActivitySummaryDto> RepActivities { get; set; } = new List<RepActivitySummaryDto>();
    public TeamActivityTotalsDto Totals { get; set; } = new();
}

public class RepActivitySummaryDto
{
    public int RepId { get; set; }
    public string RepName { get; set; } = "";
    public RepresentativeType RepType { get; set; }
    public int PlannedVisitsCount { get; set; }
    public int ExecutedVisitsCount { get; set; }
    public int CompletedVisitsCount { get; set; }
    public decimal CompletionRate => PlannedVisitsCount > 0
        ? Math.Round((decimal)ExecutedVisitsCount / PlannedVisitsCount * 100, 1)
        : 0;
    public int LocationVerifiedCount { get; set; }
    public int LocationAlertCount { get; set; }
    public VisitActivityDto? CurrentVisit { get; set; }
    public IReadOnlyList<VisitActivityDto> TodayVisits { get; set; } = new List<VisitActivityDto>();
}

public class VisitActivityDto
{
    public int VisitId { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = "";
    public string? CustomerCity { get; set; }
    public DateTime CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public bool LocationVerified { get; set; }
    public int? DistanceFromCustomerMeters { get; set; }
    public VisitOutcome? Outcome { get; set; }
    public bool IsActive => !CheckOutTime.HasValue;
}

public class TeamActivityTotalsDto
{
    public int TotalReps { get; set; }
    public int ActiveReps { get; set; }
    public int TotalPlannedVisits { get; set; }
    public int TotalExecutedVisits { get; set; }
    public int TotalCompletedVisits { get; set; }
    public decimal OverallCompletionRate => TotalPlannedVisits > 0
        ? Math.Round((decimal)TotalExecutedVisits / TotalPlannedVisits * 100, 1)
        : 0;
    public int LocationVerifiedCount { get; set; }
    public int LocationAlertCount { get; set; }
}
