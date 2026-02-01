using Application.Services;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Jobs;

/// <summary>
/// Hangfire job for sending weekly manager reports
/// Runs every Monday at 7:30 AM
/// </summary>
public class WeeklyManagerReportJob
{
    private readonly IEmailSchedulingManager _emailSchedulingManager;
    private readonly ILogger<WeeklyManagerReportJob> _logger;

    public WeeklyManagerReportJob(
        IEmailSchedulingManager emailSchedulingManager,
        ILogger<WeeklyManagerReportJob> logger)
    {
        _emailSchedulingManager = emailSchedulingManager;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        _logger.LogInformation("WeeklyManagerReportJob started at {Time}", DateTime.UtcNow);

        try
        {
            await _emailSchedulingManager.SendWeeklyManagerReportsAsync();
            _logger.LogInformation("WeeklyManagerReportJob completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "WeeklyManagerReportJob failed");
            throw; // Let Hangfire handle retry
        }
    }
}

/// <summary>
/// Hangfire job for sending daily visit reminders
/// Runs every weekday at 7:00 AM
/// </summary>
public class DailyVisitReminderJob
{
    private readonly IEmailSchedulingManager _emailSchedulingManager;
    private readonly ILogger<DailyVisitReminderJob> _logger;

    public DailyVisitReminderJob(
        IEmailSchedulingManager emailSchedulingManager,
        ILogger<DailyVisitReminderJob> logger)
    {
        _emailSchedulingManager = emailSchedulingManager;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        _logger.LogInformation("DailyVisitReminderJob started at {Time}", DateTime.UtcNow);

        try
        {
            await _emailSchedulingManager.SendDailyVisitRemindersAsync();
            _logger.LogInformation("DailyVisitReminderJob completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "DailyVisitReminderJob failed");
            throw;
        }
    }
}

/// <summary>
/// Hangfire job for retrying failed emails
/// Runs every 15 minutes
/// </summary>
public class RetryFailedEmailsJob
{
    private readonly IEmailSchedulingManager _emailSchedulingManager;
    private readonly ILogger<RetryFailedEmailsJob> _logger;

    public RetryFailedEmailsJob(
        IEmailSchedulingManager emailSchedulingManager,
        ILogger<RetryFailedEmailsJob> logger)
    {
        _emailSchedulingManager = emailSchedulingManager;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        _logger.LogInformation("RetryFailedEmailsJob started at {Time}", DateTime.UtcNow);

        try
        {
            await _emailSchedulingManager.RetryFailedEmailsAsync();
            _logger.LogInformation("RetryFailedEmailsJob completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "RetryFailedEmailsJob failed");
            throw;
        }
    }
}

/// <summary>
/// Hangfire job for cleaning up old email logs
/// Runs daily at 2:00 AM
/// </summary>
public class CleanupEmailLogsJob
{
    private readonly IEmailSchedulingManager _emailSchedulingManager;
    private readonly ILogger<CleanupEmailLogsJob> _logger;
    private const int DefaultRetentionDays = 90;

    public CleanupEmailLogsJob(
        IEmailSchedulingManager emailSchedulingManager,
        ILogger<CleanupEmailLogsJob> logger)
    {
        _emailSchedulingManager = emailSchedulingManager;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        _logger.LogInformation("CleanupEmailLogsJob started at {Time}", DateTime.UtcNow);

        try
        {
            await _emailSchedulingManager.CleanupEmailLogsAsync(DefaultRetentionDays);
            _logger.LogInformation("CleanupEmailLogsJob completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CleanupEmailLogsJob failed");
            throw;
        }
    }
}
