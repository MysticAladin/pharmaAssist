using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers;

/// <summary>
/// Manager reporting endpoints for visit plans + execution details.
/// </summary>
[ApiController]
[Route("api/visit-reports")]
[Authorize(Roles = "Manager,Admin,SuperAdmin")]
[Produces("application/json")]
public class VisitReportsController : ControllerBase
{
    private readonly IVisitReportService _service;
    private readonly ILogger<VisitReportsController> _logger;

    public VisitReportsController(IVisitReportService service, ILogger<VisitReportsController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet("week")]
    public async Task<IActionResult> GetWeekPlans([FromQuery] DateTime? weekStartUtc, CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetUserId();
            var start = weekStartUtc?.Date ?? GetCurrentWeekStartUtc();
            var plans = await _service.GetTeamPlansForWeekAsync(userId, start, cancellationToken);
            return Ok(plans);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Visit report week query failed");
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("plans/{planId:int}")]
    public async Task<IActionResult> GetPlan(int planId, CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetUserId();
            var plan = await _service.GetTeamPlanAsync(userId, planId, cancellationToken);
            if (plan == null) return NotFound();
            return Ok(plan);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Visit report plan query failed");
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("executed/{id:int}")]
    public async Task<IActionResult> GetExecuted(int id, CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetUserId();
            var visit = await _service.GetTeamExecutedVisitAsync(userId, id, cancellationToken);
            if (visit == null) return NotFound();
            return Ok(visit);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Visit report executed query failed");
            return BadRequest(new { message = ex.Message });
        }
    }

    private string GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            throw new UnauthorizedAccessException("User ID claim missing");
        return userId;
    }

    private static DateTime GetCurrentWeekStartUtc()
    {
        // Monday-start week in UTC
        var today = DateTime.UtcNow.Date;
        var diff = ((int)today.DayOfWeek + 6) % 7; // Monday=0 ... Sunday=6
        return today.AddDays(-diff);
    }
}
