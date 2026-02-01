using Application.DTOs.Visits;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers;

/// <summary>
/// Manager endpoints for viewing and approving visit plans
/// </summary>
[ApiController]
[Route("api/manager/visit-plans")]
[Authorize(Roles = "SuperAdmin,Admin,Manager")]
[Produces("application/json")]
public class ManagerVisitPlansController : ControllerBase
{
    private readonly IVisitPlanService _planService;
    private readonly ILogger<ManagerVisitPlansController> _logger;

    public ManagerVisitPlansController(IVisitPlanService planService, ILogger<ManagerVisitPlansController> logger)
    {
        _planService = planService;
        _logger = logger;
    }

    /// <summary>
    /// Get all pending visit plans from team members
    /// </summary>
    [HttpGet("pending")]
    [ProducesResponseType(typeof(IReadOnlyList<TeamVisitPlanDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPendingPlans(CancellationToken cancellationToken)
    {
        var managerId = GetUserId();
        var plans = await _planService.GetTeamPendingPlansAsync(managerId, cancellationToken);
        return Ok(plans);
    }

    /// <summary>
    /// Get all visit plans from team (with optional filters)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<TeamVisitPlanDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTeamPlans(
        [FromQuery] DateTime? fromWeek,
        [FromQuery] int? status,
        CancellationToken cancellationToken)
    {
        var managerId = GetUserId();
        var plans = await _planService.GetTeamPlansAsync(managerId, fromWeek, status, cancellationToken);
        return Ok(plans);
    }

    /// <summary>
    /// Get a specific plan for review
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(TeamVisitPlanDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPlan(int id, CancellationToken cancellationToken)
    {
        var managerId = GetUserId();
        var plan = await _planService.GetTeamPlanAsync(managerId, id, cancellationToken);
        if (plan == null) return NotFound();
        return Ok(plan);
    }

    /// <summary>
    /// Approve a visit plan
    /// </summary>
    [HttpPost("{id:int}/approve")]
    [ProducesResponseType(typeof(TeamVisitPlanDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApprovePlan(int id, [FromBody] ApprovePlanDto? dto, CancellationToken cancellationToken)
    {
        try
        {
            var managerId = GetUserId();
            var plan = await _planService.ApprovePlanAsync(managerId, id, dto?.Comments, cancellationToken);
            if (plan == null) return NotFound();
            return Ok(plan);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Approve plan failed for plan {PlanId}", id);
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Reject a visit plan
    /// </summary>
    [HttpPost("{id:int}/reject")]
    [ProducesResponseType(typeof(TeamVisitPlanDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectPlan(int id, [FromBody] RejectPlanDto dto, CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(dto?.Reason))
            {
                return BadRequest(new { message = "Rejection reason is required" });
            }

            var managerId = GetUserId();
            var plan = await _planService.RejectPlanAsync(managerId, id, dto.Reason, cancellationToken);
            if (plan == null) return NotFound();
            return Ok(plan);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Reject plan failed for plan {PlanId}", id);
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

/// <summary>
/// DTO for approving a plan
/// </summary>
public class ApprovePlanDto
{
    public string? Comments { get; set; }
}

/// <summary>
/// DTO for rejecting a plan
/// </summary>
public class RejectPlanDto
{
    public required string Reason { get; set; }
}
