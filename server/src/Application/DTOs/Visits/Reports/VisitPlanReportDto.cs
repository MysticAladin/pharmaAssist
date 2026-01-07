using Application.DTOs.Visits;
using Domain.Enums;

namespace Application.DTOs.Visits.Reports;

public class VisitPlanReportDto
{
    public int PlanId { get; set; }

    public int RepId { get; set; }
    public string RepName { get; set; } = "";

    public DateTime PlanWeek { get; set; }
    public VisitPlanStatus Status { get; set; }

    public IReadOnlyList<PlannedVisitSummaryDto> PlannedVisits { get; set; } = Array.Empty<PlannedVisitSummaryDto>();
}
