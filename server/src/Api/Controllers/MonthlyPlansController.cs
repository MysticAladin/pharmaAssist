using Application.DTOs.Planning;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers;

/// <summary>
/// Endpoints for managing monthly plans
/// </summary>
[ApiController]
[Route("api/planning/monthly")]
[Authorize(Roles = "SalesRep,Manager")]
[Produces("application/json")]
public class MonthlyPlansController : ControllerBase
{
    private readonly IPlanningHierarchyService _planningService;
    private readonly ILogger<MonthlyPlansController> _logger;

    public MonthlyPlansController(IPlanningHierarchyService planningService, ILogger<MonthlyPlansController> logger)
    {
        _planningService = planningService;
        _logger = logger;
    }

    /// <summary>
    /// Get all monthly plans for a quarterly plan
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<MonthlyPlanSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMonthlyPlans([FromQuery] int quarterlyPlanId, CancellationToken cancellationToken)
    {
        var plans = await _planningService.GetMonthlyPlansAsync(quarterlyPlanId, cancellationToken);
        return Ok(plans);
    }

    /// <summary>
    /// Get monthly plan by id
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(MonthlyPlanDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMonthlyPlan(int id, CancellationToken cancellationToken)
    {
        var plan = await _planningService.GetMonthlyPlanByIdAsync(id, cancellationToken);
        if (plan == null) return NotFound();
        return Ok(plan);
    }

    /// <summary>
    /// Create a new monthly plan
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "SalesRep")]
    [ProducesResponseType(typeof(MonthlyPlanDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateMonthlyPlan([FromQuery] int repId, [FromBody] CreateMonthlyPlanDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var plan = await _planningService.CreateMonthlyPlanAsync(repId, dto, cancellationToken);
            return CreatedAtAction(nameof(GetMonthlyPlan), new { id = plan.Id }, plan);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Update a monthly plan
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "SalesRep")]
    [ProducesResponseType(typeof(MonthlyPlanDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateMonthlyPlan(int id, [FromBody] UpdateMonthlyPlanDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var plan = await _planningService.UpdateMonthlyPlanAsync(id, dto, cancellationToken);
            return Ok(plan);
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found")) return NotFound(new { error = ex.Message });
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Submit monthly plan for approval
    /// </summary>
    [HttpPost("{id:int}/submit")]
    [Authorize(Roles = "SalesRep")]
    [ProducesResponseType(typeof(MonthlyPlanDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitMonthlyPlan(int id, CancellationToken cancellationToken)
    {
        try
        {
            var plan = await _planningService.SubmitMonthlyPlanAsync(id, cancellationToken);
            return Ok(plan);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Approve monthly plan (Manager only)
    /// </summary>
    [HttpPost("{id:int}/approve")]
    [Authorize(Roles = "Manager")]
    [ProducesResponseType(typeof(MonthlyPlanDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ApproveMonthlyPlan(int id, [FromBody] MonthlyPlanActionDto? dto, CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetUserId();
            var plan = await _planningService.ApproveMonthlyPlanAsync(id, userId, dto?.Comments, cancellationToken);
            return Ok(plan);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Reject monthly plan (Manager only)
    /// </summary>
    [HttpPost("{id:int}/reject")]
    [Authorize(Roles = "Manager")]
    [ProducesResponseType(typeof(MonthlyPlanDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RejectMonthlyPlan(int id, [FromBody] MonthlyPlanActionDto dto, CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(dto.RejectionReason))
            {
                return BadRequest(new { error = "Rejection reason is required" });
            }
            var plan = await _planningService.RejectMonthlyPlanAsync(id, dto.RejectionReason, cancellationToken);
            return Ok(plan);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Delete monthly plan (draft only)
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "SalesRep")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteMonthlyPlan(int id, CancellationToken cancellationToken)
    {
        try
        {
            await _planningService.DeleteMonthlyPlanAsync(id, cancellationToken);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Link a weekly plan to a monthly plan
    /// </summary>
    [HttpPost("{id:int}/link-weekly/{weeklyPlanId:int}")]
    [Authorize(Roles = "SalesRep")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> LinkWeeklyPlan(int id, int weeklyPlanId, CancellationToken cancellationToken)
    {
        try
        {
            await _planningService.LinkWeeklyPlanAsync(id, weeklyPlanId, cancellationToken);
            return Ok(new { message = "Weekly plan linked successfully" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private string GetUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? 
               throw new InvalidOperationException("User ID not found in claims");
    }
}
