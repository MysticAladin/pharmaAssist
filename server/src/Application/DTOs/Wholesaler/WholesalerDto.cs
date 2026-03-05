using Domain.Enums;

namespace Application.DTOs.Wholesaler;

// === Import DTOs ===

public class WholesalerDataImportDto
{
    public int Id { get; set; }
    public int WholesalerId { get; set; }
    public string WholesalerName { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public DateTime ImportDate { get; set; }
    public string? Period { get; set; }
    public ImportStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public int RecordCount { get; set; }
    public int ErrorCount { get; set; }
    public int MatchedProductCount { get; set; }
    public int MatchedCustomerCount { get; set; }
    public int UnmatchedProductCount { get; set; }
    public int UnmatchedCustomerCount { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class WholesalerDataImportDetailDto : WholesalerDataImportDto
{
    public string? ColumnMapping { get; set; }
    public string? ErrorLog { get; set; }
    public List<WholesalerSalesRecordDto> SalesRecords { get; set; } = new();
    public List<WholesalerStockRecordDto> StockRecords { get; set; } = new();
}

public class CreateImportRequest
{
    public int WholesalerId { get; set; }
    public string? Period { get; set; }
    public string? ColumnMapping { get; set; }
    public string? Notes { get; set; }
}

public class ColumnMappingTemplate
{
    public string TemplateName { get; set; } = string.Empty;
    public int WholesalerId { get; set; }
    public Dictionary<string, string> Mappings { get; set; } = new();
}

public class ImportPreviewDto
{
    public int TotalRows { get; set; }
    public List<string> DetectedColumns { get; set; } = new();
    public List<Dictionary<string, string>> PreviewRows { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
}

public class ImportResultDto
{
    public int ImportId { get; set; }
    public int TotalRecords { get; set; }
    public int SuccessCount { get; set; }
    public int ErrorCount { get; set; }
    public int MatchedProducts { get; set; }
    public int MatchedCustomers { get; set; }
    public int UnmatchedProducts { get; set; }
    public int UnmatchedCustomers { get; set; }
    public List<string> Errors { get; set; } = new();
}

// === Sales Record DTOs ===

public class WholesalerSalesRecordDto
{
    public int Id { get; set; }
    public int ImportId { get; set; }
    public string? ProductCode { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? CustomerCode { get; set; }
    public string? CustomerName { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime? InvoiceDate { get; set; }
    public string? InvoiceNumber { get; set; }
    public int? ProductId { get; set; }
    public string? MatchedProductName { get; set; }
    public int? CustomerId { get; set; }
    public string? MatchedCustomerName { get; set; }
    public bool IsManuallyMatched { get; set; }
}

public class MatchRecordRequest
{
    public int RecordId { get; set; }
    public int? ProductId { get; set; }
    public int? CustomerId { get; set; }
}

public class BulkMatchRequest
{
    public List<MatchRecordRequest> Matches { get; set; } = new();
}

// === Stock Record DTOs ===

public class WholesalerStockRecordDto
{
    public int Id { get; set; }
    public int WholesalerId { get; set; }
    public string? WholesalerName { get; set; }
    public int? ProductId { get; set; }
    public string? ProductCode { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public DateTime ReportDate { get; set; }
}

// === Sales Analytics DTOs ===

public class SalesAnalyticsFilter
{
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public string? Period { get; set; }
    public int? WholesalerId { get; set; }
    public int? ProductId { get; set; }
    public int? BrandId { get; set; }
    public int? CustomerId { get; set; }
    public int? CantonId { get; set; }
    public int? CustomerType { get; set; }
    public int? RepId { get; set; }
}

public class SalesByInstitutionDto
{
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerType { get; set; } = string.Empty;
    public string? Canton { get; set; }
    public decimal TotalQuantity { get; set; }
    public decimal TotalAmount { get; set; }
    public int InvoiceCount { get; set; }
    public int ProductCount { get; set; }
}

public class SalesByInstitutionTypeDto
{
    public string CustomerType { get; set; } = string.Empty;
    public int InstitutionCount { get; set; }
    public decimal TotalQuantity { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PercentOfTotal { get; set; }
}

public class SalesByRegionDto
{
    public int? CantonId { get; set; }
    public string CantonName { get; set; } = string.Empty;
    public int InstitutionCount { get; set; }
    public decimal TotalQuantity { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PercentOfTotal { get; set; }
}

public class SalesByProductDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? BrandName { get; set; }
    public decimal TotalQuantity { get; set; }
    public decimal TotalAmount { get; set; }
    public int CustomerCount { get; set; }
}

public class SalesByBrandDto
{
    public int BrandId { get; set; }
    public string BrandName { get; set; } = string.Empty;
    public int ProductCount { get; set; }
    public decimal TotalQuantity { get; set; }
    public decimal TotalAmount { get; set; }
    public int CustomerCount { get; set; }
}

public class SalesByRepDto
{
    public int RepId { get; set; }
    public string RepName { get; set; } = string.Empty;
    public string? EmployeeCode { get; set; }
    public decimal TotalSalesAmount { get; set; }
    public int CustomerCount { get; set; }
    public int ProductCount { get; set; }
}

public class SalesTrendDto
{
    public string Period { get; set; } = string.Empty;
    public decimal TotalQuantity { get; set; }
    public decimal TotalAmount { get; set; }
    public int RecordCount { get; set; }
}

public class WholesalerStockSummaryDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public List<WholesalerStockLevelDto> StockLevels { get; set; } = new();
    public decimal TotalStock { get; set; }
}

public class WholesalerStockLevelDto
{
    public int WholesalerId { get; set; }
    public string WholesalerName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public DateTime ReportDate { get; set; }
}

public class SalesDashboardDto
{
    public decimal TotalSalesAmount { get; set; }
    public decimal TotalQuantity { get; set; }
    public int TotalInvoices { get; set; }
    public int TotalCustomers { get; set; }
    public int TotalProducts { get; set; }
    public List<SalesTrendDto> MonthlyTrend { get; set; } = new();
    public List<SalesByInstitutionTypeDto> ByInstitutionType { get; set; } = new();
    public List<SalesByRegionDto> TopRegions { get; set; } = new();
    public List<SalesByProductDto> TopProducts { get; set; } = new();
}
