using Domain.Enums;

namespace Application.DTOs.Planning;

/// <summary>
/// Quarterly plan summary for list views
/// </summary>
public class QuarterlyPlanSummaryDto
{
    public int Id { get; set; }
    public int? AnnualPlanId { get; set; }
    public int RepId { get; set; }
    public string RepName { get; set; } = string.Empty;
    public int Year { get; set; }
    public int Quarter { get; set; }
    public string Title { get; set; } = string.Empty;
    public PlanStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public decimal? RevenueTarget { get; set; }
    public int? VisitsTarget { get; set; }
    public int? NewCustomersTarget { get; set; }
    public int MonthlyPlansCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
}

/// <summary>
/// Detailed quarterly plan with all monthly plans
/// </summary>
public class QuarterlyPlanDetailDto
{
    public int Id { get; set; }
    public int? AnnualPlanId { get; set; }
    public int RepId { get; set; }
    public string RepName { get; set; } = string.Empty;
    public int Year { get; set; }
    public int Quarter { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal? RevenueTarget { get; set; }
    public int? VisitsTarget { get; set; }
    public int? NewCustomersTarget { get; set; }
    public string? CampaignSchedule { get; set; }
    public string? TrainingSchedule { get; set; }
    public string? ResourceAllocation { get; set; }
    public string? KeyObjectives { get; set; }
    public string? FocusProducts { get; set; }
    public PlanStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public IReadOnlyList<MonthlyPlanSummaryDto> MonthlyPlans { get; set; } = new List<MonthlyPlanSummaryDto>();
}

/// <summary>
/// Create a new quarterly plan
/// </summary>
public class CreateQuarterlyPlanDto
{
    public int AnnualPlanId { get; set; }
    public int Quarter { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal? RevenueTarget { get; set; }
    public int? VisitsTarget { get; set; }
    public int? NewCustomersTarget { get; set; }
    public string? CampaignSchedule { get; set; }
    public string? TrainingSchedule { get; set; }
    public string? ResourceAllocation { get; set; }
    public string? KeyObjectives { get; set; }
    public string? FocusProducts { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Update an existing quarterly plan
/// </summary>
public class UpdateQuarterlyPlanDto
{
    public string? Title { get; set; }
    public decimal? RevenueTarget { get; set; }
    public int? VisitsTarget { get; set; }
    public int? NewCustomersTarget { get; set; }
    public string? CampaignSchedule { get; set; }
    public string? TrainingSchedule { get; set; }
    public string? ResourceAllocation { get; set; }
    public string? KeyObjectives { get; set; }
    public string? FocusProducts { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Submit/approve/reject quarterly plan
/// </summary>
public class QuarterlyPlanActionDto
{
    public string? Comments { get; set; }
    public string? RejectionReason { get; set; }
}
