using Domain.Enums;

namespace Application.DTOs.Visits;

/// <summary>
/// Summary of a visit plan for list views
/// </summary>
public class VisitPlanSummaryDto
{
    public int Id { get; set; }
    public DateTime PlanWeek { get; set; }
    public VisitPlanStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public int PlannedVisitsCount { get; set; }
    public int ExecutedVisitsCount { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
}

/// <summary>
/// Detailed visit plan with all planned visits
/// </summary>
public class VisitPlanDetailDto
{
    public int Id { get; set; }
    public int RepId { get; set; }
    public DateTime PlanWeek { get; set; }
    public VisitPlanStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public DateTime? SubmittedAt { get; set; }
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
    public IReadOnlyList<PlannedVisitDto> PlannedVisits { get; set; } = new List<PlannedVisitDto>();
}

/// <summary>
/// Detailed planned visit
/// </summary>
public class PlannedVisitDto
{
    public int Id { get; set; }
    public int PlanId { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerCity { get; set; }
    public DateTime PlannedDate { get; set; }
    public string? PlannedTime { get; set; }
    public int EstimatedDurationMinutes { get; set; }
    public string? VisitObjective { get; set; }
    public string? ProductsToPresent { get; set; }
    public string? Notes { get; set; }
    public int SequenceNumber { get; set; }
    public bool HasExecutedVisit { get; set; }
    public int? ExecutedVisitId { get; set; }
}

/// <summary>
/// Create a new planned visit
/// </summary>
public class CreatePlannedVisitDto
{
    public int CustomerId { get; set; }
    public DateTime PlannedDate { get; set; }
    public string? PlannedTime { get; set; }
    public int EstimatedDurationMinutes { get; set; } = 30;
    public string? VisitObjective { get; set; }
    public string? ProductsToPresent { get; set; }
    public string? Notes { get; set; }
    public int SequenceNumber { get; set; }
}

/// <summary>
/// Update an existing planned visit
/// </summary>
public class UpdatePlannedVisitDto
{
    public DateTime? PlannedDate { get; set; }
    public string? PlannedTime { get; set; }
    public int? EstimatedDurationMinutes { get; set; }
    public string? VisitObjective { get; set; }
    public string? ProductsToPresent { get; set; }
    public string? Notes { get; set; }
    public int? SequenceNumber { get; set; }
}

/// <summary>
/// Visit plan summary for manager's team view
/// </summary>
public class TeamVisitPlanDto
{
    public int Id { get; set; }
    public int RepId { get; set; }
    public string RepName { get; set; } = string.Empty;
    public DateTime PlanWeek { get; set; }
    public VisitPlanStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public int PlannedVisitsCount { get; set; }
    public int ExecutedVisitsCount { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
}

/// <summary>
/// Detailed visit plan for manager review
/// </summary>
public class TeamVisitPlanDetailDto
{
    public int Id { get; set; }
    public int RepId { get; set; }
    public string RepName { get; set; } = string.Empty;
    public DateTime PlanWeek { get; set; }
    public VisitPlanStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public DateTime? SubmittedAt { get; set; }
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
    public string? ApprovalComments { get; set; }
    public IReadOnlyList<PlannedVisitDto> PlannedVisits { get; set; } = new List<PlannedVisitDto>();
}
