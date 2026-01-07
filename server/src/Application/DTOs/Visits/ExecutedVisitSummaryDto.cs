using Domain.Enums;

namespace Application.DTOs.Visits;

public class ExecutedVisitSummaryDto
{
    public int Id { get; set; }

    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = "";

    public int? PlannedVisitId { get; set; }
    public VisitType VisitType { get; set; }

    public DateTime CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }

    public bool IsCompleted => CheckOutTime.HasValue;
}