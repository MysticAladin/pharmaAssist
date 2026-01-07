using Domain.Enums;

namespace Application.DTOs.Visits.Reports;

public class TeamVisitPlanSummaryDto
{
    public int PlanId { get; set; }

    public int RepId { get; set; }
    public string RepName { get; set; } = "";

    public DateTime PlanWeek { get; set; }
    public VisitPlanStatus Status { get; set; }

    public int PlannedCount { get; set; }
    public int ExecutedCount { get; set; }
}
