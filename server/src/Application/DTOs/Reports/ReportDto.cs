namespace Application.DTOs.Reports;

public class ReportRequestDto
{
    public ReportType ReportType { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? EntityId { get; set; }
    public string? EntityType { get; set; }
    public ReportFormat Format { get; set; } = ReportFormat.Pdf;
    public Dictionary<string, object> Parameters { get; set; } = [];
}

public enum ReportType
{
    SalesSummary = 1,
    SalesDetailed = 2,
    InventoryStatus = 3,
    InventoryMovement = 4,
    ExpiringProducts = 5,
    LowStockProducts = 6,
    CustomerOrders = 7,
    CustomerStatement = 8,
    ProductSales = 9,
    ManufacturerSales = 10,
    PrescriptionReport = 11,
    AuditTrail = 12,
    DailyTransactions = 13,
    MonthlyRevenue = 14,
    YearlyAnalysis = 15
}

public enum ReportFormat
{
    Pdf = 1,
    Excel = 2,
    Csv = 3,
    Html = 4
}

public class ReportResultDto
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public string? FileName { get; set; }
    public string? ContentType { get; set; }
    public byte[]? Content { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

public class SalesReportDto
{
    public DateTime ReportDate { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalOrders { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalDiscount { get; set; }
    public decimal NetRevenue { get; set; }
    public decimal AverageOrderValue { get; set; }
    public List<SalesReportItemDto> Items { get; set; } = [];
    public List<DailySalesDto> DailySales { get; set; } = [];
}

public class SalesReportItemDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public int QuantitySold { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal NetAmount { get; set; }
}

public class DailySalesDto
{
    public DateTime Date { get; set; }
    public int OrderCount { get; set; }
    public decimal Revenue { get; set; }
}

public class InventoryReportDto
{
    public DateTime ReportDate { get; set; }
    public int TotalProducts { get; set; }
    public int TotalInStock { get; set; }
    public int TotalOutOfStock { get; set; }
    public int TotalLowStock { get; set; }
    public int TotalExpiringSoon { get; set; }
    public decimal TotalInventoryValue { get; set; }
    public List<InventoryReportItemDto> Items { get; set; } = [];
}

public class InventoryReportItemDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public int CurrentStock { get; set; }
    public int ReorderLevel { get; set; }
    public decimal UnitCost { get; set; }
    public decimal TotalValue { get; set; }
    public DateTime? EarliestExpiry { get; set; }
    public string StockStatus { get; set; } = string.Empty;
}

public class CustomerReportDto
{
    public DateTime ReportDate { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalOrders { get; set; }
    public decimal TotalSpent { get; set; }
    public decimal TotalDiscount { get; set; }
    public List<CustomerOrderSummaryDto> Orders { get; set; } = [];
}

public class CustomerOrderSummaryDto
{
    public int OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public int ItemCount { get; set; }
    public decimal Total { get; set; }
}

#region Customer/Drugstore Sales Reports

/// <summary>
/// Sales report per customer (drugstore) with breakdowns
/// </summary>
public class CustomerSalesReportDto
{
    public DateTime ReportDate { get; set; } = DateTime.UtcNow;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public bool IncludeChildBranches { get; set; } = false;
    
    // Summary
    public int TotalOrders { get; set; }
    public int TotalProducts { get; set; }
    public int TotalQuantity { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalDiscount { get; set; }
    public decimal NetRevenue { get; set; }
    public decimal AverageOrderValue { get; set; }
    
    // Breakdowns
    public List<CustomerSalesItemDto> SalesByCustomer { get; set; } = [];
    public List<ProductSalesItemDto> SalesByProduct { get; set; } = [];
    public List<CategorySalesItemDto> SalesByCategory { get; set; } = [];
    public List<ManufacturerSalesItemDto> SalesByManufacturer { get; set; } = [];
    public List<DailySalesDto> DailySales { get; set; } = [];
}

/// <summary>
/// Sales per customer/branch
/// </summary>
public class CustomerSalesItemDto
{
    public int CustomerId { get; set; }
    public string CustomerCode { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string? BranchCode { get; set; }
    public bool IsHeadquarters { get; set; }
    public int? ParentCustomerId { get; set; }
    public string? ParentCustomerName { get; set; }
    public int OrderCount { get; set; }
    public int TotalQuantity { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalDiscount { get; set; }
    public decimal NetRevenue { get; set; }
}

/// <summary>
/// Sales per product
/// </summary>
public class ProductSalesItemDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public string? CategoryName { get; set; }
    public string? ManufacturerName { get; set; }
    public int QuantitySold { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalDiscount { get; set; }
    public decimal NetRevenue { get; set; }
    public int OrderCount { get; set; }
}

/// <summary>
/// Sales per category
/// </summary>
public class CategorySalesItemDto
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public int ProductCount { get; set; }
    public int QuantitySold { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalDiscount { get; set; }
    public decimal NetRevenue { get; set; }
    public decimal PercentageOfTotal { get; set; }
}

/// <summary>
/// Sales per manufacturer
/// </summary>
public class ManufacturerSalesItemDto
{
    public int ManufacturerId { get; set; }
    public string ManufacturerName { get; set; } = string.Empty;
    public int ProductCount { get; set; }
    public int QuantitySold { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalDiscount { get; set; }
    public decimal NetRevenue { get; set; }
    public decimal PercentageOfTotal { get; set; }
}

/// <summary>
/// Request for customer sales report
/// </summary>
public class CustomerSalesReportRequestDto
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int? CustomerId { get; set; } // Specific customer or null for all
    public bool IncludeChildBranches { get; set; } = true; // Include branches for parent customers
    public bool GroupByCategory { get; set; } = true;
    public bool GroupByManufacturer { get; set; } = true;
    public bool GroupByProduct { get; set; } = true;
}

/// <summary>
/// Consolidated report for pharmacy chains (parent + all children)
/// </summary>
public class ChainSalesReportDto
{
    public DateTime ReportDate { get; set; } = DateTime.UtcNow;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    
    public int ParentCustomerId { get; set; }
    public string ParentCustomerName { get; set; } = string.Empty;
    public string ParentCustomerCode { get; set; } = string.Empty;
    public int BranchCount { get; set; }
    
    // Consolidated totals
    public int TotalOrders { get; set; }
    public int TotalQuantity { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalDiscount { get; set; }
    public decimal NetRevenue { get; set; }
    public decimal AverageOrderValue { get; set; }
    
    // Per-branch breakdown
    public List<CustomerSalesItemDto> BranchSales { get; set; } = [];
    
    // Top products across chain
    public List<ProductSalesItemDto> TopProducts { get; set; } = [];
    
    // Category breakdown
    public List<CategorySalesItemDto> SalesByCategory { get; set; } = [];
}

#endregion
