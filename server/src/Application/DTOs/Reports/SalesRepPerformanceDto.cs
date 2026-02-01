namespace Application.DTOs.Reports;

/// <summary>
/// Filter parameters for Sales Rep Performance Report
/// </summary>
public class SalesRepPerformanceFilterDto
{
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int? RepId { get; set; }
    public int? RepType { get; set; } // 1=Commercial, 2=Medical
    public bool IncludeInactive { get; set; } = false;
}

/// <summary>
/// Sales Rep Performance Report result
/// </summary>
public class SalesRepPerformanceReportDto
{
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    
    // Summary totals
    public int TotalReps { get; set; }
    public int TotalOrders { get; set; }
    public decimal TotalRevenue { get; set; }
    public int TotalVisits { get; set; }
    public int TotalCustomersVisited { get; set; }
    
    // List of rep performances
    public List<SalesRepPerformanceItemDto> Reps { get; set; } = [];
}

/// <summary>
/// Individual sales rep performance metrics
/// </summary>
public class SalesRepPerformanceItemDto
{
    public int RepId { get; set; }
    public string RepName { get; set; } = string.Empty;
    public string RepCode { get; set; } = string.Empty;
    public int RepType { get; set; } // 1=Commercial, 2=Medical
    public string RepTypeName => RepType == 1 ? "Commercial" : "Medical";
    public bool IsActive { get; set; }
    
    // Order metrics
    public int OrderCount { get; set; }
    public decimal OrderRevenue { get; set; }
    public decimal AverageOrderValue => OrderCount > 0 ? OrderRevenue / OrderCount : 0;
    
    // Visit metrics
    public int VisitsPlanned { get; set; }
    public int VisitsExecuted { get; set; }
    public decimal VisitCompletionRate => VisitsPlanned > 0 
        ? Math.Round((decimal)VisitsExecuted / VisitsPlanned * 100, 1) 
        : 0;
    public int VisitsWithLocationVerified { get; set; }
    public decimal LocationVerificationRate => VisitsExecuted > 0 
        ? Math.Round((decimal)VisitsWithLocationVerified / VisitsExecuted * 100, 1) 
        : 0;
    
    // Customer metrics
    public int AssignedCustomers { get; set; }
    public int CustomersVisited { get; set; }
    public decimal CustomerCoverage => AssignedCustomers > 0 
        ? Math.Round((decimal)CustomersVisited / AssignedCustomers * 100, 1) 
        : 0;
    
    // Target metrics
    public int TargetsAssigned { get; set; }
    public int TargetsAchieved { get; set; }
    public decimal TargetAchievementRate => TargetsAssigned > 0 
        ? Math.Round((decimal)TargetsAchieved / TargetsAssigned * 100, 1) 
        : 0;
    
    // Performance score (composite)
    public decimal PerformanceScore => CalculateScore();
    
    private decimal CalculateScore()
    {
        // Weighted score: 40% revenue, 30% visit completion, 20% target achievement, 10% customer coverage
        var revenueScore = OrderRevenue > 0 ? 100 : 0; // Simplified - would use percentile in real impl
        var visitScore = VisitCompletionRate;
        var targetScore = TargetAchievementRate;
        var coverageScore = CustomerCoverage;
        
        return Math.Round(
            revenueScore * 0.4m + 
            visitScore * 0.3m + 
            targetScore * 0.2m + 
            coverageScore * 0.1m, 1);
    }
}
