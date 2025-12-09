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

#region Report Builder

/// <summary>
/// Report Builder configuration for creating custom reports
/// </summary>
public class ReportBuilderConfigDto
{
    public int? Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ReportBuilderDataSource DataSource { get; set; }
    public List<ReportColumnDto> Columns { get; set; } = [];
    public List<ReportFilterDto> Filters { get; set; } = [];
    public List<ReportSortDto> SortBy { get; set; } = [];
    public List<string> GroupBy { get; set; } = [];
    public ReportAggregationDto? Aggregation { get; set; }
    public bool IsShared { get; set; }
    public string? Category { get; set; }
}

public enum ReportBuilderDataSource
{
    Orders = 1,
    Products = 2,
    Customers = 3,
    Inventory = 4,
    OrderItems = 5,
    SalesAnalytics = 6
}

public class ReportColumnDto
{
    public string Field { get; set; } = string.Empty;
    public string? Label { get; set; }
    public ReportColumnType Type { get; set; } = ReportColumnType.Text;
    public string? Format { get; set; }
    public bool Visible { get; set; } = true;
    public int Order { get; set; }
    public AggregationType? Aggregation { get; set; }
}

public enum ReportColumnType
{
    Text = 1,
    Number = 2,
    Currency = 3,
    Date = 4,
    DateTime = 5,
    Boolean = 6,
    Percentage = 7
}

public enum AggregationType
{
    Sum = 1,
    Average = 2,
    Count = 3,
    Min = 4,
    Max = 5
}

public class ReportFilterDto
{
    public string Field { get; set; } = string.Empty;
    public FilterOperator Operator { get; set; }
    public object? Value { get; set; }
    public object? Value2 { get; set; } // For Between operator
}

public enum FilterOperator
{
    Equals = 1,
    NotEquals = 2,
    GreaterThan = 3,
    GreaterThanOrEqual = 4,
    LessThan = 5,
    LessThanOrEqual = 6,
    Contains = 7,
    StartsWith = 8,
    EndsWith = 9,
    Between = 10,
    In = 11,
    IsNull = 12,
    IsNotNull = 13
}

public class ReportSortDto
{
    public string Field { get; set; } = string.Empty;
    public bool Descending { get; set; }
}

public class ReportAggregationDto
{
    public List<string> GroupByFields { get; set; } = [];
    public List<ReportColumnDto> AggregatedColumns { get; set; } = [];
}

/// <summary>
/// Request to execute a report builder query
/// </summary>
public class ReportBuilderExecuteRequestDto
{
    public ReportBuilderConfigDto Config { get; set; } = new();
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 100;
    public ReportFormat ExportFormat { get; set; } = ReportFormat.Pdf;
}

/// <summary>
/// Result from executing a report builder query
/// </summary>
public class ReportBuilderResultDto
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public List<Dictionary<string, object?>> Data { get; set; } = [];
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public Dictionary<string, object?>? Totals { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Saved report configuration DTO
/// </summary>
public class SavedReportDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ReportBuilderDataSource DataSource { get; set; }
    public ReportBuilderConfigDto Configuration { get; set; } = new();
    public bool IsShared { get; set; }
    public bool IsTemplate { get; set; }
    public string? Category { get; set; }
    public string? Tags { get; set; }
    public DateTime? LastRunAt { get; set; }
    public int RunCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
}

/// <summary>
/// Available fields for a data source
/// </summary>
public class DataSourceFieldsDto
{
    public ReportBuilderDataSource DataSource { get; set; }
    public List<AvailableFieldDto> Fields { get; set; } = [];
}

public class AvailableFieldDto
{
    public string Field { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public ReportColumnType Type { get; set; }
    public bool Sortable { get; set; } = true;
    public bool Filterable { get; set; } = true;
    public bool Groupable { get; set; }
    public List<FilterOperator> SupportedOperators { get; set; } = [];
}

#endregion
