using Application.DTOs.Common;
using Application.DTOs.Wholesaler;
using Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Sales Analytics API Controller — dashboard and analytics for wholesaler sales data
/// </summary>
[ApiController]
[Route("api/sales-analytics")]
[Produces("application/json")]
public class SalesAnalyticsController : ControllerBase
{
    private readonly ISalesAnalyticsService _analyticsService;
    private readonly ILogger<SalesAnalyticsController> _logger;

    public SalesAnalyticsController(ISalesAnalyticsService analyticsService, ILogger<SalesAnalyticsController> logger)
    {
        _analyticsService = analyticsService;
        _logger = logger;
    }

    /// <summary>
    /// Get sales analytics dashboard with KPIs and summaries
    /// </summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(ApiResponse<SalesDashboardDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboard(
        [FromQuery] SalesAnalyticsFilter filter,
        CancellationToken cancellationToken)
    {
        var result = await _analyticsService.GetDashboardAsync(filter, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get sales breakdown by institution (customer)
    /// </summary>
    [HttpGet("by-institution")]
    [ProducesResponseType(typeof(ApiResponse<List<SalesByInstitutionDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSalesByInstitution(
        [FromQuery] SalesAnalyticsFilter filter,
        CancellationToken cancellationToken)
    {
        var result = await _analyticsService.GetSalesByInstitutionAsync(filter, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get sales breakdown by institution type (pharmacy, hospital, etc.)
    /// </summary>
    [HttpGet("by-institution-type")]
    [ProducesResponseType(typeof(ApiResponse<List<SalesByInstitutionTypeDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSalesByInstitutionType(
        [FromQuery] SalesAnalyticsFilter filter,
        CancellationToken cancellationToken)
    {
        var result = await _analyticsService.GetSalesByInstitutionTypeAsync(filter, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get sales breakdown by region (canton)
    /// </summary>
    [HttpGet("by-region")]
    [ProducesResponseType(typeof(ApiResponse<List<SalesByRegionDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSalesByRegion(
        [FromQuery] SalesAnalyticsFilter filter,
        CancellationToken cancellationToken)
    {
        var result = await _analyticsService.GetSalesByRegionAsync(filter, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get sales breakdown by product
    /// </summary>
    [HttpGet("by-product")]
    [ProducesResponseType(typeof(ApiResponse<List<SalesByProductDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSalesByProduct(
        [FromQuery] SalesAnalyticsFilter filter,
        CancellationToken cancellationToken)
    {
        var result = await _analyticsService.GetSalesByProductAsync(filter, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get sales breakdown by brand
    /// </summary>
    [HttpGet("by-brand")]
    [ProducesResponseType(typeof(ApiResponse<List<SalesByBrandDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSalesByBrand(
        [FromQuery] SalesAnalyticsFilter filter,
        CancellationToken cancellationToken)
    {
        var result = await _analyticsService.GetSalesByBrandAsync(filter, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get sales breakdown by sales representative
    /// </summary>
    [HttpGet("by-rep")]
    [ProducesResponseType(typeof(ApiResponse<List<SalesByRepDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSalesByRep(
        [FromQuery] SalesAnalyticsFilter filter,
        CancellationToken cancellationToken)
    {
        var result = await _analyticsService.GetSalesByRepAsync(filter, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get sales trend over time (daily, weekly, monthly, quarterly, yearly)
    /// </summary>
    [HttpGet("trend")]
    [ProducesResponseType(typeof(ApiResponse<List<SalesTrendDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSalesTrend(
        [FromQuery] SalesAnalyticsFilter filter,
        [FromQuery] string granularity = "monthly",
        CancellationToken cancellationToken = default)
    {
        var result = await _analyticsService.GetSalesTrendAsync(filter, granularity, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
