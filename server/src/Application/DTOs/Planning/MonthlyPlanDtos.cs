using Domain.Enums;

namespace Application.DTOs.Planning;

/// <summary>
/// Monthly plan summary for list views
/// </summary>
public class MonthlyPlanSummaryDto
{
    public int Id { get; set; }
    public int? QuarterlyPlanId { get; set; }
    public int RepId { get; set; }
    public string RepName { get; set; } = string.Empty;
    public int Year { get; set; }
    public int Month { get; set; }
    public string MonthName => new DateTime(Year, Month, 1).ToString("MMMM");
    public string Title { get; set; } = string.Empty;
    public PlanStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public decimal? RevenueTarget { get; set; }
    public int? VisitsTarget { get; set; }
    public int WeeklyPlansCount { get; set; }
    public decimal? ActualRevenue { get; set; }
    public int? ActualVisits { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
}

/// <summary>
/// Detailed monthly plan with all weekly plans
/// </summary>
public class MonthlyPlanDetailDto
{
    public int Id { get; set; }
    public int? QuarterlyPlanId { get; set; }
    public int RepId { get; set; }
    public string RepName { get; set; } = string.Empty;
    public int Year { get; set; }
    public int Month { get; set; }
    public string MonthName => new DateTime(Year, Month, 1).ToString("MMMM");
    public string Title { get; set; } = string.Empty;
    public decimal? RevenueTarget { get; set; }
    public int? VisitsTarget { get; set; }
    public int? TierACoverageTarget { get; set; }
    public int? TierBCoverageTarget { get; set; }
    public int? TierCCoverageTarget { get; set; }
    public string? PromotionalActivities { get; set; }
    public string? TrainingSchedule { get; set; }
    public string? FocusProducts { get; set; }
    public string? PriorityCustomers { get; set; }
    public PlanStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
    public string? Notes { get; set; }
    public decimal? ActualRevenue { get; set; }
    public int? ActualVisits { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public IReadOnlyList<WeeklyPlanSummaryDto> WeeklyPlans { get; set; } = new List<WeeklyPlanSummaryDto>();
}

/// <summary>
/// Weekly plan summary (links to existing VisitPlan)
/// </summary>
public class WeeklyPlanSummaryDto
{
    public int Id { get; set; }
    public DateTime PlanWeek { get; set; }
    public string Status { get; set; } = string.Empty;
    public int PlannedVisitsCount { get; set; }
    public int ExecutedVisitsCount { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
}

/// <summary>
/// Create a new monthly plan
/// </summary>
public class CreateMonthlyPlanDto
{
    public int QuarterlyPlanId { get; set; }
    public int Month { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal? RevenueTarget { get; set; }
    public int? VisitsTarget { get; set; }
    public int? TierACoverageTarget { get; set; }
    public int? TierBCoverageTarget { get; set; }
    public int? TierCCoverageTarget { get; set; }
    public string? PromotionalActivities { get; set; }
    public string? TrainingSchedule { get; set; }
    public string? FocusProducts { get; set; }
    public string? PriorityCustomers { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Update an existing monthly plan
/// </summary>
public class UpdateMonthlyPlanDto
{
    public string? Title { get; set; }
    public decimal? RevenueTarget { get; set; }
    public int? VisitsTarget { get; set; }
    public int? TierACoverageTarget { get; set; }
    public int? TierBCoverageTarget { get; set; }
    public int? TierCCoverageTarget { get; set; }
    public string? PromotionalActivities { get; set; }
    public string? TrainingSchedule { get; set; }
    public string? FocusProducts { get; set; }
    public string? PriorityCustomers { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Submit/approve/reject monthly plan
/// </summary>
public class MonthlyPlanActionDto
{
    public string? Comments { get; set; }
    public string? RejectionReason { get; set; }
}

/// <summary>
/// Planning hierarchy overview for dashboard
/// </summary>
public class PlanningHierarchyOverviewDto
{
    public AnnualPlanSummaryDto? CurrentAnnualPlan { get; set; }
    public QuarterlyPlanSummaryDto? CurrentQuarterlyPlan { get; set; }
    public MonthlyPlanSummaryDto? CurrentMonthlyPlan { get; set; }
    public WeeklyPlanSummaryDto? CurrentWeeklyPlan { get; set; }
    public PlanningProgressDto Progress { get; set; } = new();
}

/// <summary>
/// Planning progress metrics
/// </summary>
public class PlanningProgressDto
{
    public decimal AnnualRevenueTarget { get; set; }
    public decimal AnnualRevenueActual { get; set; }
    public decimal AnnualRevenueProgress => AnnualRevenueTarget > 0 ? (AnnualRevenueActual / AnnualRevenueTarget) * 100 : 0;
    public int AnnualVisitsTarget { get; set; }
    public int AnnualVisitsActual { get; set; }
    public decimal AnnualVisitsProgress => AnnualVisitsTarget > 0 ? ((decimal)AnnualVisitsActual / AnnualVisitsTarget) * 100 : 0;
    public int QuarterlyPlansCompleted { get; set; }
    public int MonthlyPlansCompleted { get; set; }
    public int WeeklyPlansCompleted { get; set; }
}
