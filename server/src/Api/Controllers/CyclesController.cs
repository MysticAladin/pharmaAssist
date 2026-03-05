using Application.DTOs.Common;
using Application.DTOs.Cycles;
using Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Cycles API Controller — manages cycles, cycle targets, and budget expenses
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class CyclesController : ControllerBase
{
    private readonly ICycleService _cycleService;
    private readonly ILogger<CyclesController> _logger;

    public CyclesController(ICycleService cycleService, ILogger<CyclesController> logger)
    {
        _cycleService = cycleService;
        _logger = logger;
    }

    #region Cycles

    /// <summary>
    /// Get cycle by ID with full details
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<CycleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCycle(int id, CancellationToken cancellationToken)
    {
        var result = await _cycleService.GetCycleByIdAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get cycles with pagination and filtering
    /// </summary>
    [HttpGet("paged")]
    [ProducesResponseType(typeof(PagedResponse<CycleSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCyclesPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] int? status = null,
        [FromQuery] bool? activeOnly = true,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortDirection = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _cycleService.GetCyclesPagedAsync(
            page, pageSize, search, status, activeOnly, sortBy, sortDirection, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Create a new cycle
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<CycleDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateCycle([FromBody] CreateCycleDto dto, CancellationToken cancellationToken)
    {
        var result = await _cycleService.CreateCycleAsync(dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return CreatedAtAction(nameof(GetCycle), new { id = result.Data!.Id }, result);
    }

    /// <summary>
    /// Update an existing cycle
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<CycleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCycle(int id, [FromBody] UpdateCycleDto dto, CancellationToken cancellationToken)
    {
        var result = await _cycleService.UpdateCycleAsync(id, dto, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Soft delete a cycle
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCycle(int id, CancellationToken cancellationToken)
    {
        var result = await _cycleService.DeleteCycleAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Activate a cycle
    /// </summary>
    [HttpPost("{id}/activate")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ActivateCycle(int id, CancellationToken cancellationToken)
    {
        var result = await _cycleService.ActivateCycleAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Complete a cycle
    /// </summary>
    [HttpPost("{id}/complete")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CompleteCycle(int id, CancellationToken cancellationToken)
    {
        var result = await _cycleService.CompleteCycleAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Copy a cycle with its targets
    /// </summary>
    [HttpPost("{id}/copy")]
    [ProducesResponseType(typeof(ApiResponse<CycleDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CopyCycle(int id, [FromQuery] string newName, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate, CancellationToken cancellationToken)
    {
        var result = await _cycleService.CopyCycleAsync(id, newName, startDate, endDate, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return CreatedAtAction(nameof(GetCycle), new { id = result.Data!.Id }, result);
    }

    #endregion

    #region Cycle Targets

    /// <summary>
    /// Get targets for a cycle
    /// </summary>
    [HttpGet("{cycleId}/targets")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<CycleTargetDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCycleTargets(int cycleId, [FromQuery] int? repId = null, CancellationToken cancellationToken = default)
    {
        var result = await _cycleService.GetCycleTargetsAsync(cycleId, repId, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Add a single target to a cycle
    /// </summary>
    [HttpPost("{cycleId}/targets")]
    [ProducesResponseType(typeof(ApiResponse<CycleTargetDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddCycleTarget(int cycleId, [FromBody] CreateCycleTargetDto dto, CancellationToken cancellationToken)
    {
        var result = await _cycleService.AddCycleTargetAsync(cycleId, dto, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Bulk add targets to a cycle
    /// </summary>
    [HttpPost("{cycleId}/targets/bulk")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<CycleTargetDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> BulkAddCycleTargets(int cycleId, [FromBody] BulkCreateCycleTargetsDto dto, CancellationToken cancellationToken)
    {
        var result = await _cycleService.BulkAddCycleTargetsAsync(cycleId, dto, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Remove a target from a cycle
    /// </summary>
    [HttpDelete("{cycleId}/targets/{targetId}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveCycleTarget(int cycleId, int targetId, CancellationToken cancellationToken)
    {
        var result = await _cycleService.RemoveCycleTargetAsync(cycleId, targetId, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #endregion

    #region Client Investment

    /// <summary>
    /// Get investment summary for a specific customer
    /// </summary>
    [HttpGet("~/api/customers/{customerId}/investment")]
    [ProducesResponseType(typeof(ApiResponse<ClientInvestmentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetClientInvestment(
        int customerId,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _cycleService.GetClientInvestmentAsync(customerId, fromDate, toDate, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get top customers by investment
    /// </summary>
    [HttpGet("~/api/investments/top")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ClientInvestmentDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTopInvestments(
        [FromQuery] int top = 20,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _cycleService.GetTopInvestmentsAsync(top, fromDate, toDate, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion
}
