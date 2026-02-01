using Application.DTOs.Planning;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers;

/// <summary>
/// Manager endpoints for reviewing team planning hierarchy
/// </summary>
[ApiController]
[Route("api/manager/planning")]
[Authorize(Roles = "Manager")]
[Produces("application/json")]
public class ManagerPlanningController : ControllerBase
{
    private readonly IPlanningHierarchyService _planningService;
    private readonly ILogger<ManagerPlanningController> _logger;

    public ManagerPlanningController(IPlanningHierarchyService planningService, ILogger<ManagerPlanningController> logger)
    {
        _planningService = planningService;
        _logger = logger;
    }

    /// <summary>
    /// Get all pending annual plans for the manager's team
    /// </summary>
    [HttpGet("annual/pending")]
    [ProducesResponseType(typeof(IReadOnlyList<AnnualPlanSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTeamPendingAnnualPlans(CancellationToken cancellationToken)
    {
        var managerId = GetUserId();
        var plans = await _planningService.GetTeamPendingAnnualPlansAsync(managerId, cancellationToken);
        return Ok(plans);
    }

    /// <summary>
    /// Get all pending quarterly plans for the manager's team
    /// </summary>
    [HttpGet("quarterly/pending")]
    [ProducesResponseType(typeof(IReadOnlyList<QuarterlyPlanSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTeamPendingQuarterlyPlans(CancellationToken cancellationToken)
    {
        var managerId = GetUserId();
        var plans = await _planningService.GetTeamPendingQuarterlyPlansAsync(managerId, cancellationToken);
        return Ok(plans);
    }

    /// <summary>
    /// Get all pending monthly plans for the manager's team
    /// </summary>
    [HttpGet("monthly/pending")]
    [ProducesResponseType(typeof(IReadOnlyList<MonthlyPlanSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTeamPendingMonthlyPlans(CancellationToken cancellationToken)
    {
        var managerId = GetUserId();
        var plans = await _planningService.GetTeamPendingMonthlyPlansAsync(managerId, cancellationToken);
        return Ok(plans);
    }

    /// <summary>
    /// Get a summary of all pending plans across hierarchy
    /// </summary>
    [HttpGet("pending-summary")]
    [ProducesResponseType(typeof(PendingPlansSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPendingPlansSummary(CancellationToken cancellationToken)
    {
        var managerId = GetUserId();
        
        var annualPlans = await _planningService.GetTeamPendingAnnualPlansAsync(managerId, cancellationToken);
        var quarterlyPlans = await _planningService.GetTeamPendingQuarterlyPlansAsync(managerId, cancellationToken);
        var monthlyPlans = await _planningService.GetTeamPendingMonthlyPlansAsync(managerId, cancellationToken);

        var summary = new PendingPlansSummaryDto
        {
            PendingAnnualPlansCount = annualPlans.Count,
            PendingQuarterlyPlansCount = quarterlyPlans.Count,
            PendingMonthlyPlansCount = monthlyPlans.Count,
            TotalPendingCount = annualPlans.Count + quarterlyPlans.Count + monthlyPlans.Count,
            AnnualPlans = annualPlans,
            QuarterlyPlans = quarterlyPlans,
            MonthlyPlans = monthlyPlans
        };

        return Ok(summary);
    }

    private string GetUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? 
               throw new InvalidOperationException("User ID not found in claims");
    }
}

/// <summary>
/// Summary of pending plans across the hierarchy
/// </summary>
public class PendingPlansSummaryDto
{
    public int PendingAnnualPlansCount { get; set; }
    public int PendingQuarterlyPlansCount { get; set; }
    public int PendingMonthlyPlansCount { get; set; }
    public int TotalPendingCount { get; set; }
    public IReadOnlyList<AnnualPlanSummaryDto> AnnualPlans { get; set; } = new List<AnnualPlanSummaryDto>();
    public IReadOnlyList<QuarterlyPlanSummaryDto> QuarterlyPlans { get; set; } = new List<QuarterlyPlanSummaryDto>();
    public IReadOnlyList<MonthlyPlanSummaryDto> MonthlyPlans { get; set; } = new List<MonthlyPlanSummaryDto>();
}
