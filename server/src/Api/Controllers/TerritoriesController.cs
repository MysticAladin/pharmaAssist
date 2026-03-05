using Application.DTOs.Common;
using Application.DTOs.Territories;
using Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Territories API Controller — manages territories, assignments, customer assignments, and analytics
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class TerritoriesController : ControllerBase
{
    private readonly ITerritoryService _territoryService;
    private readonly ILogger<TerritoriesController> _logger;

    public TerritoriesController(ITerritoryService territoryService, ILogger<TerritoriesController> logger)
    {
        _territoryService = territoryService;
        _logger = logger;
    }

    #region Territories

    /// <summary>
    /// Get territory by ID with full details
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<TerritoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTerritory(int id, CancellationToken cancellationToken)
    {
        var result = await _territoryService.GetTerritoryByIdAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get territories with pagination and filtering
    /// </summary>
    [HttpGet("paged")]
    [ProducesResponseType(typeof(PagedResponse<TerritorySummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTerritoriesPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] int? type = null,
        [FromQuery] bool? activeOnly = true,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortDirection = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _territoryService.GetTerritoriesPagedAsync(
            page, pageSize, search, type, activeOnly, sortBy, sortDirection, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get territory hierarchy tree
    /// </summary>
    [HttpGet("tree")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<TerritoryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTerritoryTree(CancellationToken cancellationToken)
    {
        var result = await _territoryService.GetTerritoryTreeAsync(cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Create a new territory
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<TerritoryDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateTerritory([FromBody] CreateTerritoryDto dto, CancellationToken cancellationToken)
    {
        var result = await _territoryService.CreateTerritoryAsync(dto, cancellationToken);
        return result.Success
            ? CreatedAtAction(nameof(GetTerritory), new { id = result.Data!.Id }, result)
            : BadRequest(result);
    }

    /// <summary>
    /// Update an existing territory
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<TerritoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateTerritory(int id, [FromBody] UpdateTerritoryDto dto, CancellationToken cancellationToken)
    {
        var result = await _territoryService.UpdateTerritoryAsync(id, dto, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Delete (soft-delete) a territory
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTerritory(int id, CancellationToken cancellationToken)
    {
        var result = await _territoryService.DeleteTerritoryAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #endregion

    #region Territory Assignments

    /// <summary>
    /// Assign a rep to a territory
    /// </summary>
    [HttpPost("{territoryId}/assignments")]
    [ProducesResponseType(typeof(ApiResponse<TerritoryAssignmentDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AssignRep(int territoryId, [FromBody] CreateTerritoryAssignmentDto dto, CancellationToken cancellationToken)
    {
        var result = await _territoryService.AssignRepToTerritoryAsync(territoryId, dto, cancellationToken);
        return result.Success ? CreatedAtAction(nameof(GetTerritory), new { id = territoryId }, result) : BadRequest(result);
    }

    /// <summary>
    /// End a territory assignment
    /// </summary>
    [HttpDelete("{territoryId}/assignments/{assignmentId}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveAssignment(int territoryId, int assignmentId, CancellationToken cancellationToken)
    {
        var result = await _territoryService.RemoveAssignmentAsync(territoryId, assignmentId, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get all assignments for a territory
    /// </summary>
    [HttpGet("{territoryId}/assignments")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<TerritoryAssignmentDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTerritoryAssignments(int territoryId, CancellationToken cancellationToken)
    {
        var result = await _territoryService.GetTerritoryAssignmentsAsync(territoryId, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get territories assigned to a specific rep
    /// </summary>
    [HttpGet("rep/{repId}/assignments")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<TerritoryAssignmentDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRepAssignments(int repId, CancellationToken cancellationToken)
    {
        var result = await _territoryService.GetRepAssignmentsAsync(repId, cancellationToken);
        return Ok(result);
    }

    #endregion

    #region Customer Assignment Administration

    /// <summary>
    /// Bulk-assign customers to a rep
    /// </summary>
    [HttpPost("customers/bulk-assign")]
    [ProducesResponseType(typeof(ApiResponse<int>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> BulkAssignCustomers([FromBody] BulkAssignCustomersDto dto, CancellationToken cancellationToken)
    {
        var result = await _territoryService.BulkAssignCustomersAsync(dto, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Transfer customers from one rep to another
    /// </summary>
    [HttpPost("customers/transfer")]
    [ProducesResponseType(typeof(ApiResponse<int>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> TransferCustomers([FromBody] TransferCustomersDto dto, CancellationToken cancellationToken)
    {
        var result = await _territoryService.TransferCustomersAsync(dto, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Analytics

    /// <summary>
    /// Get territory performance analytics
    /// </summary>
    [HttpGet("{territoryId}/performance")]
    [ProducesResponseType(typeof(ApiResponse<TerritoryPerformanceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTerritoryPerformance(
        int territoryId,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _territoryService.GetTerritoryPerformanceAsync(territoryId, fromDate, toDate, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Compare performance across territories
    /// </summary>
    [HttpGet("analytics/compare")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<TerritoryPerformanceDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CompareTerritoryPerformance(
        [FromQuery] List<int>? territoryIds = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _territoryService.CompareTerritoryPerformanceAsync(territoryIds, fromDate, toDate, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get visit frequency analytics per customer-rep pair
    /// </summary>
    [HttpGet("analytics/visit-frequency")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<VisitFrequencyDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVisitFrequency(
        [FromQuery] int? repId = null,
        [FromQuery] int? territoryId = null,
        [FromQuery] bool overdueOnly = false,
        CancellationToken cancellationToken = default)
    {
        var result = await _territoryService.GetVisitFrequencyAsync(repId, territoryId, overdueOnly, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get field work metrics for reps
    /// </summary>
    [HttpGet("analytics/field-work")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<FieldWorkMetricsDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFieldWorkMetrics(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] int? repId = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _territoryService.GetFieldWorkMetricsAsync(fromDate, toDate, repId, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get institution analytics by customer type
    /// </summary>
    [HttpGet("analytics/institutions")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<InstitutionAnalyticsDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInstitutionAnalytics(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _territoryService.GetInstitutionAnalyticsAsync(fromDate, toDate, cancellationToken);
        return Ok(result);
    }

    #endregion
}
