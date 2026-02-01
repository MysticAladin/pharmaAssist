using Domain.Enums;

namespace Application.DTOs.Planning;

/// <summary>
/// Annual plan summary for list views
/// </summary>
public class AnnualPlanSummaryDto
{
    public int Id { get; set; }
    public int RepId { get; set; }
    public string RepName { get; set; } = string.Empty;
    public int Year { get; set; }
    public string Title { get; set; } = string.Empty;
    public PlanStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public decimal? RevenueTarget { get; set; }
    public int? VisitsTarget { get; set; }
    public int? NewCustomersTarget { get; set; }
    public int QuarterlyPlansCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
}

/// <summary>
/// Detailed annual plan with all quarterly plans
/// </summary>
public class AnnualPlanDetailDto
{
    public int Id { get; set; }
    public int RepId { get; set; }
    public string RepName { get; set; } = string.Empty;
    public int Year { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TerritoryDescription { get; set; }
    public string? AssignedCantons { get; set; }
    public decimal? RevenueTarget { get; set; }
    public int? VisitsTarget { get; set; }
    public int? NewCustomersTarget { get; set; }
    public string? MajorEvents { get; set; }
    public string? StrategicPriorities { get; set; }
    public string? FocusProducts { get; set; }
    public PlanStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public IReadOnlyList<QuarterlyPlanSummaryDto> QuarterlyPlans { get; set; } = new List<QuarterlyPlanSummaryDto>();
}

/// <summary>
/// Create a new annual plan
/// </summary>
public class CreateAnnualPlanDto
{
    public int Year { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TerritoryDescription { get; set; }
    public string? AssignedCantons { get; set; }
    public decimal? RevenueTarget { get; set; }
    public int? VisitsTarget { get; set; }
    public int? NewCustomersTarget { get; set; }
    public string? MajorEvents { get; set; }
    public string? StrategicPriorities { get; set; }
    public string? FocusProducts { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Update an existing annual plan
/// </summary>
public class UpdateAnnualPlanDto
{
    public string? Title { get; set; }
    public string? TerritoryDescription { get; set; }
    public string? AssignedCantons { get; set; }
    public decimal? RevenueTarget { get; set; }
    public int? VisitsTarget { get; set; }
    public int? NewCustomersTarget { get; set; }
    public string? MajorEvents { get; set; }
    public string? StrategicPriorities { get; set; }
    public string? FocusProducts { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Submit/approve/reject annual plan
/// </summary>
public class AnnualPlanActionDto
{
    public string? Comments { get; set; }
    public string? RejectionReason { get; set; }
}
