using Application.DTOs.Planning;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers;

/// <summary>
/// Endpoints for managing quarterly plans
/// </summary>
[ApiController]
[Route("api/planning/quarterly")]
[Authorize(Roles = "SalesRep,Manager")]
[Produces("application/json")]
public class QuarterlyPlansController : ControllerBase
{
    private readonly IPlanningHierarchyService _planningService;
    private readonly ILogger<QuarterlyPlansController> _logger;

    public QuarterlyPlansController(IPlanningHierarchyService planningService, ILogger<QuarterlyPlansController> logger)
    {
        _planningService = planningService;
        _logger = logger;
    }

    /// <summary>
    /// Get all quarterly plans for an annual plan
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<QuarterlyPlanSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetQuarterlyPlans([FromQuery] int annualPlanId, CancellationToken cancellationToken)
    {
        var plans = await _planningService.GetQuarterlyPlansAsync(annualPlanId, cancellationToken);
        return Ok(plans);
    }

    /// <summary>
    /// Get quarterly plan by id
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(QuarterlyPlanDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetQuarterlyPlan(int id, CancellationToken cancellationToken)
    {
        var plan = await _planningService.GetQuarterlyPlanByIdAsync(id, cancellationToken);
        if (plan == null) return NotFound();
        return Ok(plan);
    }

    /// <summary>
    /// Create a new quarterly plan
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "SalesRep")]
    [ProducesResponseType(typeof(QuarterlyPlanDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateQuarterlyPlan([FromQuery] int repId, [FromBody] CreateQuarterlyPlanDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var plan = await _planningService.CreateQuarterlyPlanAsync(repId, dto, cancellationToken);
            return CreatedAtAction(nameof(GetQuarterlyPlan), new { id = plan.Id }, plan);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Update a quarterly plan
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "SalesRep")]
    [ProducesResponseType(typeof(QuarterlyPlanDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateQuarterlyPlan(int id, [FromBody] UpdateQuarterlyPlanDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var plan = await _planningService.UpdateQuarterlyPlanAsync(id, dto, cancellationToken);
            return Ok(plan);
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found")) return NotFound(new { error = ex.Message });
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Submit quarterly plan for approval
    /// </summary>
    [HttpPost("{id:int}/submit")]
    [Authorize(Roles = "SalesRep")]
    [ProducesResponseType(typeof(QuarterlyPlanDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitQuarterlyPlan(int id, CancellationToken cancellationToken)
    {
        try
        {
            var plan = await _planningService.SubmitQuarterlyPlanAsync(id, cancellationToken);
            return Ok(plan);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Approve quarterly plan (Manager only)
    /// </summary>
    [HttpPost("{id:int}/approve")]
    [Authorize(Roles = "Manager")]
    [ProducesResponseType(typeof(QuarterlyPlanDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ApproveQuarterlyPlan(int id, [FromBody] QuarterlyPlanActionDto? dto, CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetUserId();
            var plan = await _planningService.ApproveQuarterlyPlanAsync(id, userId, dto?.Comments, cancellationToken);
            return Ok(plan);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Reject quarterly plan (Manager only)
    /// </summary>
    [HttpPost("{id:int}/reject")]
    [Authorize(Roles = "Manager")]
    [ProducesResponseType(typeof(QuarterlyPlanDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RejectQuarterlyPlan(int id, [FromBody] QuarterlyPlanActionDto dto, CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(dto.RejectionReason))
            {
                return BadRequest(new { error = "Rejection reason is required" });
            }
            var plan = await _planningService.RejectQuarterlyPlanAsync(id, dto.RejectionReason, cancellationToken);
            return Ok(plan);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Delete quarterly plan (draft only)
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "SalesRep")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteQuarterlyPlan(int id, CancellationToken cancellationToken)
    {
        try
        {
            await _planningService.DeleteQuarterlyPlanAsync(id, cancellationToken);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Generate monthly plans from quarterly plan
    /// </summary>
    [HttpPost("{id:int}/generate-monthly")]
    [Authorize(Roles = "SalesRep")]
    [ProducesResponseType(typeof(IReadOnlyList<MonthlyPlanDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GenerateMonthlyPlans(int id, CancellationToken cancellationToken)
    {
        try
        {
            var plans = await _planningService.GenerateMonthlyPlansFromQuarterlyAsync(id, cancellationToken);
            return Ok(plans);
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
