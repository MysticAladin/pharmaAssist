using Application.DTOs.Planning;

namespace Application.Interfaces;

/// <summary>
/// Service for generating plan execution and activity reports
/// </summary>
public interface IPlanExecutionReportService
{
    /// <summary>
    /// Get daily activity report for a specific rep and date
    /// </summary>
    Task<DailyActivityReportDto> GetDailyActivityReportAsync(
        int repId,
        DateTime date,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get weekly activity report for a specific rep
    /// </summary>
    Task<WeeklyActivityReportDto> GetWeeklyActivityReportAsync(
        int repId,
        DateTime weekStart,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get monthly activity report with comprehensive analysis
    /// </summary>
    Task<MonthlyActivityReportDto> GetMonthlyActivityReportAsync(
        int repId,
        int year,
        int month,
        ActivityReportFilterDto? filter = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get plan execution report comparing planned vs actual across hierarchy
    /// </summary>
    Task<PlanExecutionReportDto> GetPlanExecutionReportAsync(
        int repId,
        DateTime? periodStart = null,
        DateTime? periodEnd = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get team execution summary for a manager
    /// </summary>
    Task<TeamExecutionSummaryDto> GetTeamExecutionSummaryAsync(
        string managerUserId,
        DateTime periodStart,
        DateTime periodEnd,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get daily activity reports for a date range (for export)
    /// </summary>
    Task<IReadOnlyList<DailyActivityReportDto>> GetDailyActivityReportsAsync(
        int repId,
        DateTime startDate,
        DateTime endDate,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get activity reports for all reps in a team
    /// </summary>
    Task<IReadOnlyList<DailyActivityReportDto>> GetTeamDailyActivityAsync(
        string managerUserId,
        DateTime date,
        CancellationToken cancellationToken = default);
}
