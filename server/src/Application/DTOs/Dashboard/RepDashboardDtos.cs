namespace Application.DTOs.Dashboard;

/// <summary>
/// Main dashboard summary for a sales representative
/// </summary>
public class RepDashboardSummaryDto
{
    public int RepId { get; set; }
    public string RepName { get; set; } = string.Empty;
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }

    // Order metrics
    public int TotalOrders { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal AverageOrderValue { get; set; }
    public int PendingOrders { get; set; }
    public int DeliveredOrders { get; set; }

    // Visit metrics
    public int TotalVisits { get; set; }
    public int PlannedVisits { get; set; }
    public int CompletedVisits { get; set; }
    public decimal VisitCompletionRate { get; set; }

    // Customer metrics
    public int AssignedCustomers { get; set; }
    public int CustomersVisited { get; set; }

    // Growth
    public decimal RevenueGrowthPercent { get; set; }

    // Sync status
    public int PendingOfflineOrders { get; set; }
}

/// <summary>
/// Quick-view widgets for dashboard
/// </summary>
public class RepDashboardWidgetsDto
{
    // Today
    public int TodayOrders { get; set; }
    public decimal TodayRevenue { get; set; }
    public int TodayVisits { get; set; }

    // This week
    public int WeekOrders { get; set; }
    public decimal WeekRevenue { get; set; }

    // This month
    public int MonthOrders { get; set; }
    public decimal MonthRevenue { get; set; }

    // Pending tasks
    public int PlannedVisitsToday { get; set; }
    public int OverdueVisits { get; set; }
}

/// <summary>
/// Today's schedule overview
/// </summary>
public class TodayScheduleDto
{
    public DateTime Date { get; set; }
    public List<ScheduledVisitDto> PlannedVisits { get; set; } = new();
    public List<ExecutedVisitSummaryDto> ExecutedVisits { get; set; } = new();
    public int TotalPlanned { get; set; }
    public int TotalCompleted { get; set; }
}

/// <summary>
/// A scheduled visit for today
/// </summary>
public class ScheduledVisitDto
{
    public int VisitId { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerAddress { get; set; } = string.Empty;
    public TimeSpan? ScheduledTime { get; set; }
    public string VisitType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

/// <summary>
/// An executed visit summary
/// </summary>
public class ExecutedVisitSummaryDto
{
    public int VisitId { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public DateTime CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public int? Duration { get; set; }
    public bool OrderTaken { get; set; }
}

/// <summary>
/// Top performing customer
/// </summary>
public class TopCustomerDto
{
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public int TotalOrders { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal AverageOrderValue { get; set; }
    public DateTime LastOrderDate { get; set; }
}

/// <summary>
/// Sales trends for charts
/// </summary>
public class SalesTrendsDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public List<TrendDataPoint> DataPoints { get; set; } = new();
}

/// <summary>
/// A single data point in trends
/// </summary>
public class TrendDataPoint
{
    public DateTime Date { get; set; }
    public int Orders { get; set; }
    public decimal Revenue { get; set; }
    public int Visits { get; set; }
}

/// <summary>
/// Target progress for the rep
/// </summary>
public class RepTargetProgressDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int DaysElapsed { get; set; }
    public int TotalDays { get; set; }
    public List<TargetItemDto> Targets { get; set; } = new();
}

/// <summary>
/// Individual target item
/// </summary>
public class TargetItemDto
{
    public int TargetId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public decimal TargetValue { get; set; }
    public decimal CurrentValue { get; set; }
    public decimal AchievementPercent { get; set; }
    public bool IsAchieved { get; set; }
    public string Status { get; set; } = string.Empty; // OnTrack, AtRisk, Behind
}
