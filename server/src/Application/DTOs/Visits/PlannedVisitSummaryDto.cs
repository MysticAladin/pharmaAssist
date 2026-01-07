namespace Application.DTOs.Visits;

public class PlannedVisitSummaryDto
{
    public int PlannedVisitId { get; set; }
    public int PlanId { get; set; }

    public DateTime PlannedDate { get; set; }
    public TimeSpan? PlannedTime { get; set; }

    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = "";

    public string? Objective { get; set; }
    public int SequenceNumber { get; set; }

    public bool HasExecutedVisit { get; set; }
    public int? ExecutedVisitId { get; set; }
}