using Application.Services;
using Hangfire;
using Hangfire.Storage;
using Infrastructure.Jobs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Controller for managing and triggering scheduled jobs
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class JobsController : ControllerBase
{
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly IRecurringJobManager _recurringJobManager;
    private readonly IEmailSchedulingManager _emailSchedulingManager;
    private readonly ILogger<JobsController> _logger;

    public JobsController(
        IBackgroundJobClient backgroundJobClient,
        IRecurringJobManager recurringJobManager,
        IEmailSchedulingManager emailSchedulingManager,
        ILogger<JobsController> logger)
    {
        _backgroundJobClient = backgroundJobClient;
        _recurringJobManager = recurringJobManager;
        _emailSchedulingManager = emailSchedulingManager;
        _logger = logger;
    }

    /// <summary>
    /// Get all registered recurring jobs
    /// </summary>
    [HttpGet("recurring")]
    public IActionResult GetRecurringJobs()
    {
        using var connection = JobStorage.Current.GetConnection();
        var recurringJobs = StorageConnectionExtensions.GetRecurringJobs(connection);

        var result = recurringJobs.Select(job => new
        {
            job.Id,
            job.Cron,
            job.Queue,
            job.NextExecution,
            job.LastExecution,
            job.LastJobState,
            job.Error
        });

        return Ok(result);
    }

    /// <summary>
    /// Trigger weekly manager reports job immediately
    /// </summary>
    [HttpPost("trigger/weekly-manager-reports")]
    public IActionResult TriggerWeeklyManagerReports()
    {
        _logger.LogInformation("Manual trigger of WeeklyManagerReports by user {User}", User.Identity?.Name);
        
        var jobId = _backgroundJobClient.Enqueue<WeeklyManagerReportJob>(job => job.ExecuteAsync());
        
        return Ok(new { jobId, message = "Weekly manager reports job has been queued" });
    }

    /// <summary>
    /// Trigger daily visit reminders job immediately
    /// </summary>
    [HttpPost("trigger/daily-visit-reminders")]
    public IActionResult TriggerDailyVisitReminders()
    {
        _logger.LogInformation("Manual trigger of DailyVisitReminders by user {User}", User.Identity?.Name);
        
        var jobId = _backgroundJobClient.Enqueue<DailyVisitReminderJob>(job => job.ExecuteAsync());
        
        return Ok(new { jobId, message = "Daily visit reminders job has been queued" });
    }

    /// <summary>
    /// Trigger retry failed emails job immediately
    /// </summary>
    [HttpPost("trigger/retry-failed-emails")]
    public IActionResult TriggerRetryFailedEmails()
    {
        _logger.LogInformation("Manual trigger of RetryFailedEmails by user {User}", User.Identity?.Name);
        
        var jobId = _backgroundJobClient.Enqueue<RetryFailedEmailsJob>(job => job.ExecuteAsync());
        
        return Ok(new { jobId, message = "Retry failed emails job has been queued" });
    }

    /// <summary>
    /// Trigger email log cleanup job immediately
    /// </summary>
    [HttpPost("trigger/cleanup-email-logs")]
    public IActionResult TriggerCleanupEmailLogs()
    {
        _logger.LogInformation("Manual trigger of CleanupEmailLogs by user {User}", User.Identity?.Name);
        
        var jobId = _backgroundJobClient.Enqueue<CleanupEmailLogsJob>(job => job.ExecuteAsync());
        
        return Ok(new { jobId, message = "Email log cleanup job has been queued" });
    }

    /// <summary>
    /// Update recurring job schedule
    /// </summary>
    [HttpPut("recurring/{jobId}/schedule")]
    public IActionResult UpdateJobSchedule(string jobId, [FromBody] UpdateScheduleRequest request)
    {
        if (string.IsNullOrEmpty(request.CronExpression))
        {
            return BadRequest("Cron expression is required");
        }

        _logger.LogInformation("Updating schedule for job {JobId} to {Cron} by user {User}", 
            jobId, request.CronExpression, User.Identity?.Name);

        // Basic cron expression validation (5 or 6 parts)
        var parts = request.CronExpression.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length < 5 || parts.Length > 6)
        {
            return BadRequest("Invalid cron expression: must have 5 or 6 parts");
        }

        // Update based on job ID
        switch (jobId.ToLowerInvariant())
        {
            case "weekly-manager-reports":
                _recurringJobManager.AddOrUpdate<WeeklyManagerReportJob>(
                    jobId,
                    job => job.ExecuteAsync(),
                    request.CronExpression);
                break;
            case "daily-visit-reminders":
                _recurringJobManager.AddOrUpdate<DailyVisitReminderJob>(
                    jobId,
                    job => job.ExecuteAsync(),
                    request.CronExpression);
                break;
            case "retry-failed-emails":
                _recurringJobManager.AddOrUpdate<RetryFailedEmailsJob>(
                    jobId,
                    job => job.ExecuteAsync(),
                    request.CronExpression);
                break;
            case "cleanup-email-logs":
                _recurringJobManager.AddOrUpdate<CleanupEmailLogsJob>(
                    jobId,
                    job => job.ExecuteAsync(),
                    request.CronExpression);
                break;
            default:
                return NotFound($"Job '{jobId}' not found");
        }

        return Ok(new { message = $"Schedule for job '{jobId}' updated successfully" });
    }

    /// <summary>
    /// Remove a recurring job
    /// </summary>
    [HttpDelete("recurring/{jobId}")]
    public IActionResult RemoveRecurringJob(string jobId)
    {
        _logger.LogWarning("Removing recurring job {JobId} by user {User}", jobId, User.Identity?.Name);
        
        _recurringJobManager.RemoveIfExists(jobId);
        
        return Ok(new { message = $"Recurring job '{jobId}' removed" });
    }

    /// <summary>
    /// Get job statistics
    /// </summary>
    [HttpGet("statistics")]
    public IActionResult GetStatistics()
    {
        var stats = JobStorage.Current.GetMonitoringApi();

        return Ok(new
        {
            enqueued = stats.EnqueuedCount("default"),
            scheduled = stats.ScheduledCount(),
            processing = stats.ProcessingCount(),
            succeeded = stats.SucceededListCount(),
            failed = stats.FailedCount(),
            deleted = stats.DeletedListCount()
        });
    }
}

public class UpdateScheduleRequest
{
    public string CronExpression { get; set; } = string.Empty;
}
