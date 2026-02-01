using Application.DTOs.Visits;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers;

/// <summary>
/// Sales Rep endpoints for managing weekly visit plans
/// </summary>
[ApiController]
[Route("api/visit-plans")]
[Authorize(Roles = "SalesRep")]
[Produces("application/json")]
public class VisitPlansController : ControllerBase
{
    private readonly IVisitPlanService _planService;
    private readonly ILogger<VisitPlansController> _logger;

    public VisitPlansController(IVisitPlanService planService, ILogger<VisitPlansController> logger)
    {
        _planService = planService;
        _logger = logger;
    }

    /// <summary>
    /// Get all visit plans for the current rep
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<VisitPlanSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPlans([FromQuery] DateTime? fromWeek, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var plans = await _planService.GetPlansAsync(userId, fromWeek, cancellationToken);
        return Ok(plans);
    }

    /// <summary>
    /// Get a specific plan with all planned visits
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(VisitPlanDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPlan(int id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var plan = await _planService.GetPlanAsync(userId, id, cancellationToken);
        if (plan == null) return NotFound();
        return Ok(plan);
    }

    /// <summary>
    /// Get or create a plan for a specific week
    /// </summary>
    [HttpGet("week/{weekStart:datetime}")]
    [ProducesResponseType(typeof(VisitPlanDetailDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOrCreateWeekPlan(DateTime weekStart, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var plan = await _planService.GetOrCreateWeekPlanAsync(userId, weekStart.Date, cancellationToken);
        return Ok(plan);
    }

    /// <summary>
    /// Add a planned visit to a plan
    /// </summary>
    [HttpPost("{planId:int}/visits")]
    [ProducesResponseType(typeof(PlannedVisitDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddPlannedVisit(int planId, [FromBody] CreatePlannedVisitDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetUserId();
            var visit = await _planService.AddPlannedVisitAsync(userId, planId, dto, cancellationToken);
            return CreatedAtAction(nameof(GetPlan), new { id = planId }, visit);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Add planned visit failed");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update a planned visit
    /// </summary>
    [HttpPut("{planId:int}/visits/{visitId:int}")]
    [ProducesResponseType(typeof(PlannedVisitDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdatePlannedVisit(int planId, int visitId, [FromBody] UpdatePlannedVisitDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetUserId();
            var visit = await _planService.UpdatePlannedVisitAsync(userId, planId, visitId, dto, cancellationToken);
            if (visit == null) return NotFound();
            return Ok(visit);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Update planned visit failed");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Delete a planned visit
    /// </summary>
    [HttpDelete("{planId:int}/visits/{visitId:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeletePlannedVisit(int planId, int visitId, CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetUserId();
            var deleted = await _planService.DeletePlannedVisitAsync(userId, planId, visitId, cancellationToken);
            if (!deleted) return NotFound();
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Delete planned visit failed");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Submit plan for approval
    /// </summary>
    [HttpPost("{id:int}/submit")]
    [ProducesResponseType(typeof(VisitPlanDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitForApproval(int id, CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetUserId();
            var plan = await _planService.SubmitForApprovalAsync(userId, id, cancellationToken);
            if (plan == null) return NotFound();
            return Ok(plan);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Submit plan for approval failed");
            return BadRequest(new { message = ex.Message });
        }
    }

    private string GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new UnauthorizedAccessException("User ID claim missing");
        }
        return userId;
    }
}
