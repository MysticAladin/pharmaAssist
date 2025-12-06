using Application.DTOs.Reports;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Manager")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;
    private readonly ILogger<ReportsController> _logger;

    public ReportsController(IReportService reportService, ILogger<ReportsController> logger)
    {
        _reportService = reportService;
        _logger = logger;
    }

    /// <summary>
    /// Generate a report
    /// </summary>
    [HttpPost("generate")]
    public async Task<IActionResult> GenerateReport([FromBody] ReportRequestDto request)
    {
        var result = await _reportService.GenerateReportAsync(request);

        if (!result.Success)
        {
            return BadRequest(new { result.Message });
        }

        return File(result.Content!, result.ContentType!, result.FileName);
    }

    /// <summary>
    /// Get sales report data (JSON)
    /// </summary>
    [HttpGet("sales")]
    public async Task<ActionResult<SalesReportDto>> GetSalesReport(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        var start = startDate ?? DateTime.UtcNow.AddMonths(-1);
        var end = endDate ?? DateTime.UtcNow;

        var data = await _reportService.GetSalesReportDataAsync(start, end);
        return Ok(data);
    }

    /// <summary>
    /// Download sales report
    /// </summary>
    [HttpGet("sales/download")]
    public async Task<IActionResult> DownloadSalesReport(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] ReportFormat format = ReportFormat.Pdf)
    {
        var result = await _reportService.GenerateReportAsync(new ReportRequestDto
        {
            ReportType = ReportType.SalesSummary,
            StartDate = startDate,
            EndDate = endDate,
            Format = format
        });

        if (!result.Success)
        {
            return BadRequest(new { result.Message });
        }

        return File(result.Content!, result.ContentType!, result.FileName);
    }

    /// <summary>
    /// Get inventory report data (JSON)
    /// </summary>
    [HttpGet("inventory")]
    public async Task<ActionResult<InventoryReportDto>> GetInventoryReport()
    {
        var data = await _reportService.GetInventoryReportDataAsync();
        return Ok(data);
    }

    /// <summary>
    /// Download inventory report
    /// </summary>
    [HttpGet("inventory/download")]
    public async Task<IActionResult> DownloadInventoryReport([FromQuery] ReportFormat format = ReportFormat.Pdf)
    {
        var result = await _reportService.GenerateReportAsync(new ReportRequestDto
        {
            ReportType = ReportType.InventoryStatus,
            Format = format
        });

        if (!result.Success)
        {
            return BadRequest(new { result.Message });
        }

        return File(result.Content!, result.ContentType!, result.FileName);
    }

    /// <summary>
    /// Get customer report data (JSON)
    /// </summary>
    [HttpGet("customer/{customerId}")]
    public async Task<ActionResult<CustomerReportDto>> GetCustomerReport(
        int customerId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        var start = startDate ?? DateTime.UtcNow.AddYears(-1);
        var end = endDate ?? DateTime.UtcNow;

        var data = await _reportService.GetCustomerReportDataAsync(customerId, start, end);
        return Ok(data);
    }

    /// <summary>
    /// Download customer report
    /// </summary>
    [HttpGet("customer/{customerId}/download")]
    public async Task<IActionResult> DownloadCustomerReport(
        int customerId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] ReportFormat format = ReportFormat.Pdf)
    {
        var result = await _reportService.GenerateReportAsync(new ReportRequestDto
        {
            ReportType = ReportType.CustomerOrders,
            EntityId = customerId,
            StartDate = startDate,
            EndDate = endDate,
            Format = format
        });

        if (!result.Success)
        {
            return BadRequest(new { result.Message });
        }

        return File(result.Content!, result.ContentType!, result.FileName);
    }

    /// <summary>
    /// Get expiring products report
    /// </summary>
    [HttpGet("expiring-products")]
    public async Task<IActionResult> GetExpiringProductsReport(
        [FromQuery] int days = 90,
        [FromQuery] ReportFormat format = ReportFormat.Csv)
    {
        var result = await _reportService.GenerateReportAsync(new ReportRequestDto
        {
            ReportType = ReportType.ExpiringProducts,
            Format = format,
            Parameters = new Dictionary<string, object> { { "days", days } }
        });

        if (!result.Success)
        {
            return BadRequest(new { result.Message });
        }

        return File(result.Content!, result.ContentType!, result.FileName);
    }

    /// <summary>
    /// Get low stock products report
    /// </summary>
    [HttpGet("low-stock")]
    public async Task<IActionResult> GetLowStockReport([FromQuery] ReportFormat format = ReportFormat.Csv)
    {
        var result = await _reportService.GenerateReportAsync(new ReportRequestDto
        {
            ReportType = ReportType.LowStockProducts,
            Format = format
        });

        if (!result.Success)
        {
            return BadRequest(new { result.Message });
        }

        return File(result.Content!, result.ContentType!, result.FileName);
    }

    /// <summary>
    /// Export data to CSV
    /// </summary>
    [HttpPost("export/csv")]
    public async Task<IActionResult> ExportToCsv([FromBody] ExportRequest request)
    {
        // This would be extended to support various data types
        var data = request.DataType switch
        {
            "products" => await GetProductsForExport(),
            "orders" => await GetOrdersForExport(),
            "customers" => await GetCustomersForExport(),
            _ => new List<object>()
        };

        if (!data.Any())
        {
            return BadRequest(new { Message = "No data to export" });
        }

        var bytes = await _reportService.ExportToCsvAsync(data);
        return File(bytes, "text/csv", $"{request.DataType}-export-{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    private async Task<IEnumerable<object>> GetProductsForExport()
    {
        // Placeholder - would return actual product data
        return await Task.FromResult(new List<object>());
    }

    private async Task<IEnumerable<object>> GetOrdersForExport()
    {
        // Placeholder - would return actual order data
        return await Task.FromResult(new List<object>());
    }

    private async Task<IEnumerable<object>> GetCustomersForExport()
    {
        // Placeholder - would return actual customer data
        return await Task.FromResult(new List<object>());
    }

    #region Customer/Drugstore Sales Reports

    /// <summary>
    /// Get sales report for all customers/drugstores
    /// </summary>
    [HttpGet("customer-sales")]
    public async Task<ActionResult<CustomerSalesReportDto>> GetCustomerSalesReport(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] int? customerId = null,
        [FromQuery] bool includeChildBranches = true,
        [FromQuery] bool groupByCategory = true,
        [FromQuery] bool groupByManufacturer = true,
        [FromQuery] bool groupByProduct = true,
        CancellationToken cancellationToken = default)
    {
        var request = new CustomerSalesReportRequestDto
        {
            StartDate = startDate ?? DateTime.UtcNow.AddMonths(-1),
            EndDate = endDate ?? DateTime.UtcNow,
            CustomerId = customerId,
            IncludeChildBranches = includeChildBranches,
            GroupByCategory = groupByCategory,
            GroupByManufacturer = groupByManufacturer,
            GroupByProduct = groupByProduct
        };

        var data = await _reportService.GetCustomerSalesReportAsync(request, cancellationToken);
        return Ok(data);
    }

    /// <summary>
    /// Get sales report for a specific customer/drugstore
    /// </summary>
    [HttpGet("customer/{customerId}/sales")]
    public async Task<ActionResult<CustomerSalesReportDto>> GetSingleCustomerSalesReport(
        int customerId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] bool includeChildBranches = true,
        CancellationToken cancellationToken = default)
    {
        var request = new CustomerSalesReportRequestDto
        {
            StartDate = startDate ?? DateTime.UtcNow.AddMonths(-1),
            EndDate = endDate ?? DateTime.UtcNow,
            CustomerId = customerId,
            IncludeChildBranches = includeChildBranches
        };

        var data = await _reportService.GetCustomerSalesReportAsync(request, cancellationToken);
        return Ok(data);
    }

    /// <summary>
    /// Get consolidated sales report for a pharmacy chain (parent + all branches)
    /// </summary>
    [HttpGet("chain/{parentCustomerId}/sales")]
    public async Task<ActionResult<ChainSalesReportDto>> GetChainSalesReport(
        int parentCustomerId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        CancellationToken cancellationToken = default)
    {
        var start = startDate ?? DateTime.UtcNow.AddMonths(-1);
        var end = endDate ?? DateTime.UtcNow;

        var data = await _reportService.GetChainSalesReportAsync(parentCustomerId, start, end, cancellationToken);
        return Ok(data);
    }

    /// <summary>
    /// Get sales breakdown by all customers (drugstores)
    /// </summary>
    [HttpGet("sales-by-customer")]
    public async Task<ActionResult<List<CustomerSalesItemDto>>> GetSalesByCustomer(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        CancellationToken cancellationToken = default)
    {
        var start = startDate ?? DateTime.UtcNow.AddMonths(-1);
        var end = endDate ?? DateTime.UtcNow;

        var data = await _reportService.GetSalesByCustomerAsync(start, end, cancellationToken);
        return Ok(data);
    }

    #endregion
}

public class ExportRequest
{
    public string DataType { get; set; } = string.Empty;
    public Dictionary<string, object>? Filters { get; set; }
}
