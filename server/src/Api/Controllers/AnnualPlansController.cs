using Application.DTOs.Planning;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers;

/// <summary>
/// Sales Rep endpoints for managing annual plans
/// </summary>
[ApiController]
[Route("api/planning/annual")]
[Authorize(Roles = "SalesRep,Manager")]
[Produces("application/json")]
public class AnnualPlansController : ControllerBase
{
    private readonly IPlanningHierarchyService _planningService;
    private readonly ILogger<AnnualPlansController> _logger;

    public AnnualPlansController(IPlanningHierarchyService planningService, ILogger<AnnualPlansController> logger)
    {
        _planningService = planningService;
        _logger = logger;
    }

    /// <summary>
    /// Get planning hierarchy overview for current rep
    /// </summary>
    [HttpGet("overview")]
    [ProducesResponseType(typeof(PlanningHierarchyOverviewDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOverview([FromQuery] int repId, CancellationToken cancellationToken)
    {
        var overview = await _planningService.GetOverviewAsync(repId, cancellationToken);
        return Ok(overview);
    }

    /// <summary>
    /// Get all annual plans for a rep
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<AnnualPlanSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAnnualPlans([FromQuery] int repId, CancellationToken cancellationToken)
    {
        var plans = await _planningService.GetAnnualPlansAsync(repId, cancellationToken);
        return Ok(plans);
    }

    /// <summary>
    /// Get annual plan by id
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(AnnualPlanDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAnnualPlan(int id, CancellationToken cancellationToken)
    {
        var plan = await _planningService.GetAnnualPlanByIdAsync(id, cancellationToken);
        if (plan == null) return NotFound();
        return Ok(plan);
    }

    /// <summary>
    /// Get annual plan for a specific year
    /// </summary>
    [HttpGet("year/{year:int}")]
    [ProducesResponseType(typeof(AnnualPlanDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAnnualPlanByYear([FromQuery] int repId, int year, CancellationToken cancellationToken)
    {
        var plan = await _planningService.GetAnnualPlanByYearAsync(repId, year, cancellationToken);
        if (plan == null) return NotFound();
        return Ok(plan);
    }

    /// <summary>
    /// Create a new annual plan
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "SalesRep")]
    [ProducesResponseType(typeof(AnnualPlanDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateAnnualPlan([FromQuery] int repId, [FromBody] CreateAnnualPlanDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var plan = await _planningService.CreateAnnualPlanAsync(repId, dto, cancellationToken);
            return CreatedAtAction(nameof(GetAnnualPlan), new { id = plan.Id }, plan);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Update an annual plan
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "SalesRep")]
    [ProducesResponseType(typeof(AnnualPlanDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAnnualPlan(int id, [FromBody] UpdateAnnualPlanDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var plan = await _planningService.UpdateAnnualPlanAsync(id, dto, cancellationToken);
            return Ok(plan);
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found")) return NotFound(new { error = ex.Message });
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Submit annual plan for approval
    /// </summary>
    [HttpPost("{id:int}/submit")]
    [Authorize(Roles = "SalesRep")]
    [ProducesResponseType(typeof(AnnualPlanDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitAnnualPlan(int id, CancellationToken cancellationToken)
    {
        try
        {
            var plan = await _planningService.SubmitAnnualPlanAsync(id, cancellationToken);
            return Ok(plan);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Approve annual plan (Manager only)
    /// </summary>
    [HttpPost("{id:int}/approve")]
    [Authorize(Roles = "Manager")]
    [ProducesResponseType(typeof(AnnualPlanDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ApproveAnnualPlan(int id, [FromBody] AnnualPlanActionDto? dto, CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetUserId();
            var plan = await _planningService.ApproveAnnualPlanAsync(id, userId, dto?.Comments, cancellationToken);
            return Ok(plan);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Reject annual plan (Manager only)
    /// </summary>
    [HttpPost("{id:int}/reject")]
    [Authorize(Roles = "Manager")]
    [ProducesResponseType(typeof(AnnualPlanDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RejectAnnualPlan(int id, [FromBody] AnnualPlanActionDto dto, CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(dto.RejectionReason))
            {
                return BadRequest(new { error = "Rejection reason is required" });
            }
            var plan = await _planningService.RejectAnnualPlanAsync(id, dto.RejectionReason, cancellationToken);
            return Ok(plan);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Delete annual plan (draft only)
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "SalesRep")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteAnnualPlan(int id, CancellationToken cancellationToken)
    {
        try
        {
            await _planningService.DeleteAnnualPlanAsync(id, cancellationToken);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Generate quarterly plans from annual plan
    /// </summary>
    [HttpPost("{id:int}/generate-quarterly")]
    [Authorize(Roles = "SalesRep")]
    [ProducesResponseType(typeof(IReadOnlyList<QuarterlyPlanDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GenerateQuarterlyPlans(int id, CancellationToken cancellationToken)
    {
        try
        {
            var plans = await _planningService.GenerateQuarterlyPlansFromAnnualAsync(id, cancellationToken);
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
