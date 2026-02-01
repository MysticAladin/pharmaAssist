using Application.Interfaces;
using Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Application.Services;

/// <summary>
/// Manages scheduled email operations grouped by region
/// </summary>
public interface IEmailSchedulingManager
{
    /// <summary>
    /// Send weekly manager reports for all regions
    /// </summary>
    Task SendWeeklyManagerReportsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Send daily visit reminders to sales reps
    /// </summary>
    Task SendDailyVisitRemindersAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Retry failed emails
    /// </summary>
    Task RetryFailedEmailsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Cleanup old email logs
    /// </summary>
    Task CleanupEmailLogsAsync(int retentionDays, CancellationToken cancellationToken = default);
}
