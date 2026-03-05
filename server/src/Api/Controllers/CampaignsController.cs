using Application.DTOs.Common;
using Application.DTOs.Cycles;
using Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Campaigns API Controller — manages campaigns, campaign targets, and campaign expenses
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class CampaignsController : ControllerBase
{
    private readonly ICycleService _cycleService;
    private readonly ILogger<CampaignsController> _logger;

    public CampaignsController(ICycleService cycleService, ILogger<CampaignsController> logger)
    {
        _cycleService = cycleService;
        _logger = logger;
    }

    #region Campaigns

    /// <summary>
    /// Get campaign by ID with full details
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<CampaignDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCampaign(int id, CancellationToken cancellationToken)
    {
        var result = await _cycleService.GetCampaignByIdAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get campaigns with pagination and filtering
    /// </summary>
    [HttpGet("paged")]
    [ProducesResponseType(typeof(PagedResponse<CampaignSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCampaignsPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] int? cycleId = null,
        [FromQuery] int? type = null,
        [FromQuery] int? status = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortDirection = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _cycleService.GetCampaignsPagedAsync(
            page, pageSize, search, cycleId, type, status, sortBy, sortDirection, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Create a new campaign
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<CampaignDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateCampaign([FromBody] CreateCampaignDto dto, CancellationToken cancellationToken)
    {
        var result = await _cycleService.CreateCampaignAsync(dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return CreatedAtAction(nameof(GetCampaign), new { id = result.Data!.Id }, result);
    }

    /// <summary>
    /// Update an existing campaign
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<CampaignDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCampaign(int id, [FromBody] UpdateCampaignDto dto, CancellationToken cancellationToken)
    {
        var result = await _cycleService.UpdateCampaignAsync(id, dto, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Soft delete a campaign
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCampaign(int id, CancellationToken cancellationToken)
    {
        var result = await _cycleService.DeleteCampaignAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Activate a campaign
    /// </summary>
    [HttpPost("{id}/activate")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ActivateCampaign(int id, CancellationToken cancellationToken)
    {
        var result = await _cycleService.ActivateCampaignAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Complete a campaign
    /// </summary>
    [HttpPost("{id}/complete")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CompleteCampaign(int id, CancellationToken cancellationToken)
    {
        var result = await _cycleService.CompleteCampaignAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #endregion

    #region Campaign Targets

    /// <summary>
    /// Add a target to a campaign
    /// </summary>
    [HttpPost("{campaignId}/targets")]
    [ProducesResponseType(typeof(ApiResponse<CampaignTargetDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddCampaignTarget(int campaignId, [FromBody] CreateCampaignTargetDto dto, CancellationToken cancellationToken)
    {
        var result = await _cycleService.AddCampaignTargetAsync(campaignId, dto, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Remove a target from a campaign
    /// </summary>
    [HttpDelete("{campaignId}/targets/{targetId}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveCampaignTarget(int campaignId, int targetId, CancellationToken cancellationToken)
    {
        var result = await _cycleService.RemoveCampaignTargetAsync(campaignId, targetId, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Update a campaign target's status
    /// </summary>
    [HttpPut("{campaignId}/targets/{targetId}/status")]
    [ProducesResponseType(typeof(ApiResponse<CampaignTargetDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCampaignTargetStatus(
        int campaignId, int targetId,
        [FromBody] UpdateCampaignTargetStatusDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _cycleService.UpdateCampaignTargetStatusAsync(campaignId, targetId, dto, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #endregion

    #region Campaign Expenses

    /// <summary>
    /// Create a campaign expense
    /// </summary>
    [HttpPost("~/api/expenses")]
    [ProducesResponseType(typeof(ApiResponse<CampaignExpenseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateExpense([FromBody] CreateCampaignExpenseDto dto, CancellationToken cancellationToken)
    {
        var result = await _cycleService.CreateCampaignExpenseAsync(dto, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Delete a campaign expense
    /// </summary>
    [HttpDelete("~/api/expenses/{id}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteExpense(int id, CancellationToken cancellationToken)
    {
        var result = await _cycleService.DeleteCampaignExpenseAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get expenses for a campaign
    /// </summary>
    [HttpGet("{campaignId}/expenses")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<CampaignExpenseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCampaignExpenses(int campaignId, CancellationToken cancellationToken)
    {
        var result = await _cycleService.GetExpensesByCampaignAsync(campaignId, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Approve a campaign expense
    /// </summary>
    [HttpPost("~/api/expenses/{id}/approve")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ApproveExpense(int id, [FromQuery] string? notes = null, CancellationToken cancellationToken = default)
    {
        var result = await _cycleService.ApproveCampaignExpenseAsync(id, notes, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #endregion
}
