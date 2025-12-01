using Application.DTOs.Common;
using Application.DTOs.Dashboard;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Dashboard and Reporting API Controller
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;
    private readonly ILogger<DashboardController> _logger;

    public DashboardController(IDashboardService dashboardService, ILogger<DashboardController> logger)
    {
        _dashboardService = dashboardService;
        _logger = logger;
    }

    /// <summary>
    /// Get dashboard overview statistics
    /// </summary>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(ApiResponse<DashboardStatsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStats(CancellationToken cancellationToken)
    {
        var result = await _dashboardService.GetDashboardStatsAsync(cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get sales summary for a date range
    /// </summary>
    [HttpGet("sales-summary")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<SalesSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSalesSummary(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate,
        CancellationToken cancellationToken)
    {
        var result = await _dashboardService.GetSalesSummaryAsync(startDate, endDate, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get top selling products
    /// </summary>
    [HttpGet("top-products")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<TopProductDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTopProducts(
        [FromQuery] int count = 10,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _dashboardService.GetTopProductsAsync(count, startDate, endDate, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get low stock alerts
    /// </summary>
    [HttpGet("low-stock-alerts")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<LowStockAlertDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLowStockAlerts(CancellationToken cancellationToken)
    {
        var result = await _dashboardService.GetLowStockAlertsAsync(cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get products expiring within threshold days
    /// </summary>
    [HttpGet("expiring-products")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ExpiringProductDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetExpiringProducts(
        [FromQuery] int daysThreshold = 30,
        CancellationToken cancellationToken = default)
    {
        var result = await _dashboardService.GetExpiringProductsAsync(daysThreshold, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get recent orders
    /// </summary>
    [HttpGet("recent-orders")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<RecentOrderDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRecentOrders(
        [FromQuery] int count = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _dashboardService.GetRecentOrdersAsync(count, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get sales breakdown by category
    /// </summary>
    [HttpGet("sales-by-category")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<CategorySalesDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSalesByCategory(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _dashboardService.GetSalesByCategoryAsync(startDate, endDate, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get sales breakdown by region/canton
    /// </summary>
    [HttpGet("sales-by-region")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<RegionalSalesDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSalesByRegion(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _dashboardService.GetSalesByRegionAsync(startDate, endDate, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
