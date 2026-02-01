using Domain.Enums;

namespace Application.DTOs.Planning;

/// <summary>
/// Daily activity report for a sales rep
/// </summary>
public class DailyActivityReportDto
{
    public DateTime Date { get; set; }
    public int RepId { get; set; }
    public string RepName { get; set; } = string.Empty;

    // Visit Metrics
    public int PlannedVisits { get; set; }
    public int CompletedVisits { get; set; }
    public int CancelledVisits { get; set; }
    public decimal VisitCompletionRate => PlannedVisits > 0
        ? Math.Round((decimal)CompletedVisits / PlannedVisits * 100, 1)
        : 0;

    // Customer Coverage
    public IReadOnlyList<VisitedCustomerDto> CustomersVisited { get; set; } = new List<VisitedCustomerDto>();

    // Orders
    public int OrdersCollected { get; set; }
    public decimal OrderValue { get; set; }
    public int OrderItems { get; set; }

    // Products
    public IReadOnlyList<string> ProductsPresented { get; set; } = new List<string>();
    public int SamplesDistributed { get; set; }

    // Issues
    public IReadOnlyList<VisitIssueDto> IssuesEncountered { get; set; } = new List<VisitIssueDto>();

    // Travel
    public decimal? TravelDistanceKm { get; set; }
    public TimeSpan TotalVisitTime { get; set; }
    public TimeSpan TotalTravelTime { get; set; }

    // Time utilization
    public TimeUtilizationDto TimeUtilization { get; set; } = new();
}

public class VisitedCustomerDto
{
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerType { get; set; }
    public string? City { get; set; }
    public VisitOutcome? Outcome { get; set; }
    public string OutcomeName => Outcome?.ToString() ?? "Unknown";
    public DateTime CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public TimeSpan Duration => CheckOutTime.HasValue
        ? CheckOutTime.Value - CheckInTime
        : TimeSpan.Zero;
    public bool HasOrder { get; set; }
    public decimal? OrderAmount { get; set; }
    public string? Notes { get; set; }
}

public class VisitIssueDto
{
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string Issue { get; set; } = string.Empty;
    public string? Resolution { get; set; }
}

public class TimeUtilizationDto
{
    public TimeSpan CustomerFacingTime { get; set; }
    public TimeSpan TravelTime { get; set; }
    public TimeSpan AdminTime { get; set; }
    public TimeSpan TotalWorkTime { get; set; }
    public decimal CustomerFacingPercent => TotalWorkTime.TotalMinutes > 0
        ? Math.Round((decimal)(CustomerFacingTime.TotalMinutes / TotalWorkTime.TotalMinutes) * 100, 1)
        : 0;
}

/// <summary>
/// Weekly activity report aggregation
/// </summary>
public class WeeklyActivityReportDto
{
    public DateTime WeekStart { get; set; }
    public DateTime WeekEnd { get; set; }
    public int RepId { get; set; }
    public string RepName { get; set; } = string.Empty;

    // Visit Metrics
    public int PlannedVisits { get; set; }
    public int CompletedVisits { get; set; }
    public decimal VisitCompletionRate => PlannedVisits > 0
        ? Math.Round((decimal)CompletedVisits / PlannedVisits * 100, 1)
        : 0;

    // Customer Coverage by Tier
    public CustomerCoverageDto TierACoverage { get; set; } = new();
    public CustomerCoverageDto TierBCoverage { get; set; } = new();
    public CustomerCoverageDto TierCCoverage { get; set; } = new();

    // Orders
    public decimal OrderValue { get; set; }
    public decimal OrderValuePreviousWeek { get; set; }
    public decimal OrderValueGrowth => OrderValuePreviousWeek > 0
        ? Math.Round((OrderValue - OrderValuePreviousWeek) / OrderValuePreviousWeek * 100, 1)
        : 0;
    public int TotalOrders { get; set; }

    // Pipeline
    public int NewLeads { get; set; }
    public int ConvertedLeads { get; set; }
    public decimal? PipelineValue { get; set; }

    // Highlights
    public IReadOnlyList<string> KeyWins { get; set; } = new List<string>();
    public IReadOnlyList<string> Challenges { get; set; } = new List<string>();
    public IReadOnlyList<string> NextWeekFocus { get; set; } = new List<string>();

    // Daily breakdown
    public IReadOnlyList<DailySummaryDto> DailyBreakdown { get; set; } = new List<DailySummaryDto>();
}

public class CustomerCoverageDto
{
    public int TotalCustomers { get; set; }
    public int VisitedCustomers { get; set; }
    public decimal CoveragePercent => TotalCustomers > 0
        ? Math.Round((decimal)VisitedCustomers / TotalCustomers * 100, 1)
        : 0;
}

public class DailySummaryDto
{
    public DateTime Date { get; set; }
    public string DayName => Date.ToString("dddd");
    public int PlannedVisits { get; set; }
    public int CompletedVisits { get; set; }
    public decimal OrderValue { get; set; }
    public int Orders { get; set; }
}

/// <summary>
/// Monthly activity report with comprehensive analysis
/// </summary>
public class MonthlyActivityReportDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string MonthName => new DateTime(Year, Month, 1).ToString("MMMM yyyy");
    public int RepId { get; set; }
    public string RepName { get; set; } = string.Empty;

    // Plan Information
    public int? MonthlyPlanId { get; set; }
    public PlanStatus? PlanStatus { get; set; }

    // Targets vs Achievement - Revenue
    public decimal RevenueTarget { get; set; }
    public decimal RevenueActual { get; set; }
    public decimal RevenueAchievement => RevenueTarget > 0
        ? Math.Round(RevenueActual / RevenueTarget * 100, 1)
        : 0;

    // Targets vs Achievement - Visits
    public int VisitsTarget { get; set; }
    public int VisitsActual { get; set; }
    public decimal VisitsAchievement => VisitsTarget > 0
        ? Math.Round((decimal)VisitsActual / VisitsTarget * 100, 1)
        : 0;

    // Customer Targets
    public CustomerTargetDto TierATarget { get; set; } = new();
    public CustomerTargetDto TierBTarget { get; set; } = new();
    public CustomerTargetDto TierCTarget { get; set; } = new();

    // Product Performance
    public IReadOnlyList<ProductPerformanceDto> ProductPerformance { get; set; } = new List<ProductPerformanceDto>();

    // Customer Performance
    public IReadOnlyList<CustomerPerformanceDto> TopCustomers { get; set; } = new List<CustomerPerformanceDto>();

    // Territory/Region Analysis
    public IReadOnlyList<TerritoryPerformanceDto> TerritoryPerformance { get; set; } = new List<TerritoryPerformanceDto>();

    // Activity Trends
    public IReadOnlyList<WeeklySummaryDto> WeeklyTrends { get; set; } = new List<WeeklySummaryDto>();

    // Expense Summary
    public decimal? TravelExpenses { get; set; }
    public decimal? OtherExpenses { get; set; }
    public decimal? TotalExpenses => TravelExpenses + OtherExpenses;

    // Training & Development
    public IReadOnlyList<string> TrainingActivities { get; set; } = new List<string>();

    // Competitive Intelligence
    public IReadOnlyList<CompetitiveInsightDto> CompetitiveInsights { get; set; } = new List<CompetitiveInsightDto>();
}

public class CustomerTargetDto
{
    public string Tier { get; set; } = string.Empty;
    public int Target { get; set; }
    public int Actual { get; set; }
    public decimal Achievement => Target > 0
        ? Math.Round((decimal)Actual / Target * 100, 1)
        : 0;
}

public class ProductPerformanceDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? Category { get; set; }
    public decimal? Target { get; set; }
    public decimal Actual { get; set; }
    public decimal? Achievement => Target.HasValue && Target.Value > 0
        ? Math.Round(Actual / Target.Value * 100, 1)
        : null;
    public int UnitsSold { get; set; }
    public int TimesPresented { get; set; }
}

public class CustomerPerformanceDto
{
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? Tier { get; set; }
    public string? City { get; set; }
    public decimal Revenue { get; set; }
    public decimal RevenuePreviousMonth { get; set; }
    public decimal Growth => RevenuePreviousMonth > 0
        ? Math.Round((Revenue - RevenuePreviousMonth) / RevenuePreviousMonth * 100, 1)
        : 0;
    public int OrderCount { get; set; }
    public int VisitCount { get; set; }
}

public class TerritoryPerformanceDto
{
    public string Territory { get; set; } = string.Empty;
    public string? Canton { get; set; }
    public decimal Revenue { get; set; }
    public int CustomerCount { get; set; }
    public int VisitCount { get; set; }
    public decimal RevenuePerVisit => VisitCount > 0
        ? Math.Round(Revenue / VisitCount, 2)
        : 0;
}

public class WeeklySummaryDto
{
    public int WeekNumber { get; set; }
    public DateTime WeekStart { get; set; }
    public int Visits { get; set; }
    public decimal Revenue { get; set; }
    public int Orders { get; set; }
}

public class CompetitiveInsightDto
{
    public string Competitor { get; set; } = string.Empty;
    public string Product { get; set; } = string.Empty;
    public string Insight { get; set; } = string.Empty;
    public DateTime ReportedAt { get; set; }
}

/// <summary>
/// Plan execution comparison report
/// </summary>
public class PlanExecutionReportDto
{
    public int RepId { get; set; }
    public string RepName { get; set; } = string.Empty;
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }

    // Annual Plan Execution
    public AnnualExecutionDto? AnnualExecution { get; set; }

    // Quarterly Plan Execution
    public QuarterlyExecutionDto? QuarterlyExecution { get; set; }

    // Monthly Plan Execution
    public MonthlyExecutionDto? MonthlyExecution { get; set; }

    // Weekly Plan Execution
    public IReadOnlyList<WeeklyExecutionDto> WeeklyExecutions { get; set; } = new List<WeeklyExecutionDto>();

    // Overall Metrics
    public OverallExecutionMetricsDto OverallMetrics { get; set; } = new();
}

public class AnnualExecutionDto
{
    public int PlanId { get; set; }
    public int Year { get; set; }
    public PlanStatus Status { get; set; }

    public decimal RevenueTarget { get; set; }
    public decimal RevenueActual { get; set; }
    public decimal RevenueProgress => RevenueTarget > 0
        ? Math.Round(RevenueActual / RevenueTarget * 100, 1)
        : 0;

    public int VisitsTarget { get; set; }
    public int VisitsActual { get; set; }
    public decimal VisitsProgress => VisitsTarget > 0
        ? Math.Round((decimal)VisitsActual / VisitsTarget * 100, 1)
        : 0;

    public int QuartersCompleted { get; set; }
    public int QuartersTotal { get; set; }
}

public class QuarterlyExecutionDto
{
    public int PlanId { get; set; }
    public int Year { get; set; }
    public int Quarter { get; set; }
    public PlanStatus Status { get; set; }

    public decimal RevenueTarget { get; set; }
    public decimal RevenueActual { get; set; }
    public decimal RevenueProgress => RevenueTarget > 0
        ? Math.Round(RevenueActual / RevenueTarget * 100, 1)
        : 0;

    public int VisitsTarget { get; set; }
    public int VisitsActual { get; set; }
    public decimal VisitsProgress => VisitsTarget > 0
        ? Math.Round((decimal)VisitsActual / VisitsTarget * 100, 1)
        : 0;

    public int MonthsCompleted { get; set; }
    public int MonthsTotal { get; set; }
}

public class MonthlyExecutionDto
{
    public int PlanId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public PlanStatus Status { get; set; }

    public decimal RevenueTarget { get; set; }
    public decimal RevenueActual { get; set; }
    public decimal RevenueProgress => RevenueTarget > 0
        ? Math.Round(RevenueActual / RevenueTarget * 100, 1)
        : 0;

    public int VisitsTarget { get; set; }
    public int VisitsActual { get; set; }
    public decimal VisitsProgress => VisitsTarget > 0
        ? Math.Round((decimal)VisitsActual / VisitsTarget * 100, 1)
        : 0;

    public int WeeksCompleted { get; set; }
    public int WeeksTotal { get; set; }
}

public class WeeklyExecutionDto
{
    public int PlanId { get; set; }
    public DateTime WeekStart { get; set; }
    public string Status { get; set; } = string.Empty;

    public int PlannedVisits { get; set; }
    public int ExecutedVisits { get; set; }
    public decimal CompletionRate => PlannedVisits > 0
        ? Math.Round((decimal)ExecutedVisits / PlannedVisits * 100, 1)
        : 0;

    public decimal? OrdersCollected { get; set; }
}

public class OverallExecutionMetricsDto
{
    public decimal OverallRevenueProgress { get; set; }
    public decimal OverallVisitsProgress { get; set; }
    public decimal PlanAdherence { get; set; }
    public int OnTrackMetrics { get; set; }
    public int BehindMetrics { get; set; }
    public int AheadMetrics { get; set; }
    public string PerformanceRating { get; set; } = string.Empty; // Excellent, Good, Average, Below Average
}

/// <summary>
/// Filter for activity reports
/// </summary>
public class ActivityReportFilterDto
{
    public int? RepId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Period { get; set; } // Daily, Weekly, Monthly
    public bool IncludeProductBreakdown { get; set; }
    public bool IncludeCustomerBreakdown { get; set; }
    public bool IncludeTerritoryBreakdown { get; set; }
}

/// <summary>
/// Team-level execution summary for managers
/// </summary>
public class TeamExecutionSummaryDto
{
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public string PeriodName { get; set; } = string.Empty;
    public int TotalReps { get; set; }

    // Overall Metrics
    public decimal TotalRevenueTarget { get; set; }
    public decimal TotalRevenueActual { get; set; }
    public decimal RevenueProgress => TotalRevenueTarget > 0
        ? Math.Round(TotalRevenueActual / TotalRevenueTarget * 100, 1)
        : 0;

    public int TotalVisitsTarget { get; set; }
    public int TotalVisitsActual { get; set; }
    public decimal VisitsProgress => TotalVisitsTarget > 0
        ? Math.Round((decimal)TotalVisitsActual / TotalVisitsTarget * 100, 1)
        : 0;

    // Rep Performance Distribution
    public int RepsOnTarget { get; set; }
    public int RepsAboveTarget { get; set; }
    public int RepsBelowTarget { get; set; }

    // Individual Rep Summaries
    public IReadOnlyList<RepExecutionSummaryDto> RepSummaries { get; set; } = new List<RepExecutionSummaryDto>();

    // Top/Bottom Performers
    public IReadOnlyList<RepExecutionSummaryDto> TopPerformers { get; set; } = new List<RepExecutionSummaryDto>();
    public IReadOnlyList<RepExecutionSummaryDto> NeedingAttention { get; set; } = new List<RepExecutionSummaryDto>();
}

public class RepExecutionSummaryDto
{
    public int RepId { get; set; }
    public string RepName { get; set; } = string.Empty;
    public string? Territory { get; set; }

    public decimal RevenueTarget { get; set; }
    public decimal RevenueActual { get; set; }
    public decimal RevenueProgress => RevenueTarget > 0
        ? Math.Round(RevenueActual / RevenueTarget * 100, 1)
        : 0;

    public int VisitsTarget { get; set; }
    public int VisitsActual { get; set; }
    public decimal VisitsProgress => VisitsTarget > 0
        ? Math.Round((decimal)VisitsActual / VisitsTarget * 100, 1)
        : 0;

    public int OrderCount { get; set; }
    public string PerformanceStatus { get; set; } = string.Empty; // On Target, Above, Below
    public int Rank { get; set; }
}
