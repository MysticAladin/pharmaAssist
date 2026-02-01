using Application.DTOs.Planning;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers;

/// <summary>
/// Plan execution and activity reporting API
/// </summary>
[ApiController]
[Route("api/reports/plan-execution")]
[Authorize]
[Produces("application/json")]
public class PlanExecutionReportsController : ControllerBase
{
    private readonly IPlanExecutionReportService _reportService;
    private readonly ILogger<PlanExecutionReportsController> _logger;

    public PlanExecutionReportsController(
        IPlanExecutionReportService reportService,
        ILogger<PlanExecutionReportsController> logger)
    {
        _reportService = reportService;
        _logger = logger;
    }

    /// <summary>
    /// Get daily activity report for a sales rep
    /// </summary>
    /// <param name="repId">Sales representative ID</param>
    /// <param name="date">Date for the report (defaults to today)</param>
    [HttpGet("daily/{repId:int}")]
    [ProducesResponseType(typeof(DailyActivityReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DailyActivityReportDto>> GetDailyActivityReport(
        int repId,
        [FromQuery] DateTime? date,
        CancellationToken cancellationToken)
    {
        try
        {
            var reportDate = date?.Date ?? DateTime.UtcNow.Date;
            var report = await _reportService.GetDailyActivityReportAsync(repId, reportDate, cancellationToken);
            return Ok(report);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Daily activity report not found for rep {RepId}", repId);
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating daily activity report for rep {RepId}", repId);
            return StatusCode(500, new { message = "Error generating report" });
        }
    }

    /// <summary>
    /// Get weekly activity report for a sales rep
    /// </summary>
    /// <param name="repId">Sales representative ID</param>
    /// <param name="weekStart">Week start date (Monday, defaults to current week)</param>
    [HttpGet("weekly/{repId:int}")]
    [ProducesResponseType(typeof(WeeklyActivityReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WeeklyActivityReportDto>> GetWeeklyActivityReport(
        int repId,
        [FromQuery] DateTime? weekStart,
        CancellationToken cancellationToken)
    {
        try
        {
            var startDate = weekStart?.Date ?? GetCurrentWeekStart();
            var report = await _reportService.GetWeeklyActivityReportAsync(repId, startDate, cancellationToken);
            return Ok(report);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Weekly activity report not found for rep {RepId}", repId);
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating weekly activity report for rep {RepId}", repId);
            return StatusCode(500, new { message = "Error generating report" });
        }
    }

    /// <summary>
    /// Get monthly activity report with comprehensive analysis
    /// </summary>
    /// <param name="repId">Sales representative ID</param>
    /// <param name="year">Year (defaults to current year)</param>
    /// <param name="month">Month (defaults to current month)</param>
    /// <param name="includeProducts">Include product breakdown</param>
    /// <param name="includeCustomers">Include customer breakdown</param>
    /// <param name="includeTerritories">Include territory breakdown</param>
    [HttpGet("monthly/{repId:int}")]
    [ProducesResponseType(typeof(MonthlyActivityReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MonthlyActivityReportDto>> GetMonthlyActivityReport(
        int repId,
        [FromQuery] int? year,
        [FromQuery] int? month,
        [FromQuery] bool includeProducts = true,
        [FromQuery] bool includeCustomers = true,
        [FromQuery] bool includeTerritories = true,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var reportYear = year ?? DateTime.UtcNow.Year;
            var reportMonth = month ?? DateTime.UtcNow.Month;

            var filter = new ActivityReportFilterDto
            {
                IncludeProductBreakdown = includeProducts,
                IncludeCustomerBreakdown = includeCustomers,
                IncludeTerritoryBreakdown = includeTerritories
            };

            var report = await _reportService.GetMonthlyActivityReportAsync(
                repId, reportYear, reportMonth, filter, cancellationToken);
            return Ok(report);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Monthly activity report not found for rep {RepId}", repId);
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating monthly activity report for rep {RepId}", repId);
            return StatusCode(500, new { message = "Error generating report" });
        }
    }

    /// <summary>
    /// Get plan execution report comparing planned vs actual across hierarchy
    /// </summary>
    /// <param name="repId">Sales representative ID</param>
    /// <param name="startDate">Period start date</param>
    /// <param name="endDate">Period end date</param>
    [HttpGet("execution/{repId:int}")]
    [ProducesResponseType(typeof(PlanExecutionReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PlanExecutionReportDto>> GetPlanExecutionReport(
        int repId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        CancellationToken cancellationToken)
    {
        try
        {
            var report = await _reportService.GetPlanExecutionReportAsync(
                repId, startDate, endDate, cancellationToken);
            return Ok(report);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Plan execution report not found for rep {RepId}", repId);
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating plan execution report for rep {RepId}", repId);
            return StatusCode(500, new { message = "Error generating report" });
        }
    }

    /// <summary>
    /// Get team execution summary for a manager
    /// </summary>
    /// <param name="startDate">Period start date (defaults to start of current month)</param>
    /// <param name="endDate">Period end date (defaults to end of current month)</param>
    [HttpGet("team")]
    [Authorize(Roles = "Manager,Admin,SuperAdmin")]
    [ProducesResponseType(typeof(TeamExecutionSummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<TeamExecutionSummaryDto>> GetTeamExecutionSummary(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetUserId();
            var start = startDate?.Date ?? new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            var end = endDate?.Date ?? start.AddMonths(1).AddDays(-1);

            var report = await _reportService.GetTeamExecutionSummaryAsync(userId, start, end, cancellationToken);
            return Ok(report);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Team execution summary query failed");
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating team execution summary");
            return StatusCode(500, new { message = "Error generating report" });
        }
    }

    /// <summary>
    /// Get team daily activity for a manager
    /// </summary>
    /// <param name="date">Date for the report (defaults to today)</param>
    [HttpGet("team/daily")]
    [Authorize(Roles = "Manager,Admin,SuperAdmin")]
    [ProducesResponseType(typeof(IReadOnlyList<DailyActivityReportDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<DailyActivityReportDto>>> GetTeamDailyActivity(
        [FromQuery] DateTime? date,
        CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetUserId();
            var reportDate = date?.Date ?? DateTime.UtcNow.Date;

            var reports = await _reportService.GetTeamDailyActivityAsync(userId, reportDate, cancellationToken);
            return Ok(reports);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Team daily activity query failed");
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating team daily activity");
            return StatusCode(500, new { message = "Error generating report" });
        }
    }

    /// <summary>
    /// Get daily activity reports for a date range (for export)
    /// </summary>
    /// <param name="repId">Sales representative ID</param>
    /// <param name="startDate">Start date</param>
    /// <param name="endDate">End date</param>
    [HttpGet("daily/{repId:int}/range")]
    [ProducesResponseType(typeof(IReadOnlyList<DailyActivityReportDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<DailyActivityReportDto>>> GetDailyActivityReportsRange(
        int repId,
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate,
        CancellationToken cancellationToken)
    {
        try
        {
            if ((endDate - startDate).TotalDays > 31)
            {
                return BadRequest(new { message = "Date range cannot exceed 31 days" });
            }

            var reports = await _reportService.GetDailyActivityReportsAsync(
                repId, startDate, endDate, cancellationToken);
            return Ok(reports);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Daily activity reports range not found for rep {RepId}", repId);
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating daily activity reports range for rep {RepId}", repId);
            return StatusCode(500, new { message = "Error generating reports" });
        }
    }

    private string GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            throw new UnauthorizedAccessException("User ID claim missing");
        return userId;
    }

    private static DateTime GetCurrentWeekStart()
    {
        var today = DateTime.UtcNow.Date;
        var diff = ((int)today.DayOfWeek + 6) % 7;
        return today.AddDays(-diff);
    }
}
