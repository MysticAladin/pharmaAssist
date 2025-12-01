namespace Application.DTOs.Dashboard;

/// <summary>
/// Dashboard statistics overview
/// </summary>
public class DashboardStatsDto
{
    // Inventory Statistics
    public int TotalProducts { get; set; }
    public int LowStockProducts { get; set; }
    public int ExpiringProducts { get; set; }
    public int ExpiredProducts { get; set; }
    public decimal TotalInventoryValue { get; set; }

    // Order Statistics
    public int TotalOrders { get; set; }
    public int PendingOrders { get; set; }
    public int ProcessingOrders { get; set; }
    public int CompletedOrdersToday { get; set; }
    public decimal TodaySalesAmount { get; set; }
    public decimal WeekSalesAmount { get; set; }
    public decimal MonthSalesAmount { get; set; }

    // Customer Statistics
    public int TotalCustomers { get; set; }
    public int ActiveCustomers { get; set; }
    public int NewCustomersThisMonth { get; set; }

    // Product Statistics
    public int TotalCategories { get; set; }
    public int TotalManufacturers { get; set; }
    public int PrescriptionProducts { get; set; }
    public int OtcProducts { get; set; }
}

/// <summary>
/// Sales summary by period
/// </summary>
public class SalesSummaryDto
{
    public DateTime Date { get; set; }
    public decimal TotalSales { get; set; }
    public int OrderCount { get; set; }
    public decimal AverageOrderValue { get; set; }
}

/// <summary>
/// Top selling products
/// </summary>
public class TopProductDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? Sku { get; set; }
    public int QuantitySold { get; set; }
    public decimal TotalRevenue { get; set; }
}

/// <summary>
/// Low stock alert
/// </summary>
public class LowStockAlertDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? Sku { get; set; }
    public int CurrentStock { get; set; }
    public int MinimumStock { get; set; }
    public int ReorderLevel { get; set; }
}

/// <summary>
/// Expiring product alert
/// </summary>
public class ExpiringProductDto
{
    public int InventoryId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? BatchNumber { get; set; }
    public int Quantity { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int DaysUntilExpiry { get; set; }
    public string LocationName { get; set; } = string.Empty;
}

/// <summary>
/// Recent order for dashboard
/// </summary>
public class RecentOrderDto
{
    public int OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
}

/// <summary>
/// Sales by category
/// </summary>
public class CategorySalesDto
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public int ProductCount { get; set; }
    public int QuantitySold { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal PercentageOfTotal { get; set; }
}

/// <summary>
/// Sales by canton/region
/// </summary>
public class RegionalSalesDto
{
    public int CantonId { get; set; }
    public string CantonName { get; set; } = string.Empty;
    public string Entity { get; set; } = string.Empty;
    public int OrderCount { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal PercentageOfTotal { get; set; }
}
