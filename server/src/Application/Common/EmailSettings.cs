namespace Application.Common;

/// <summary>
/// Email configuration settings
/// </summary>
public class EmailSettings
{
    public const string SectionName = "EmailSettings";
    
    /// <summary>
    /// Company email for order notifications (e.g., orders@pharmaassist.com)
    /// </summary>
    public string CompanyOrdersEmail { get; set; } = "orders@pharmaassist.com";
    
    /// <summary>
    /// Support email address
    /// </summary>
    public string SupportEmail { get; set; } = "support@pharmaassist.ba";
    
    /// <summary>
    /// Maximum retry attempts for failed emails
    /// </summary>
    public int MaxRetries { get; set; } = 3;
    
    /// <summary>
    /// Delay in minutes between retry attempts
    /// </summary>
    public int RetryDelayMinutes { get; set; } = 15;
    
    /// <summary>
    /// Number of days to retain email logs
    /// </summary>
    public int LogRetentionDays { get; set; } = 90;
    
    /// <summary>
    /// Batch size for bulk email operations
    /// </summary>
    public int BatchSize { get; set; } = 50;
    
    /// <summary>
    /// Base URL for links in emails
    /// </summary>
    public string BaseUrl { get; set; } = "https://app.pharmaassist.ba";
}

/// <summary>
/// Scheduled jobs configuration
/// </summary>
public class ScheduledJobsSettings
{
    public const string SectionName = "ScheduledJobs";
    
    public JobScheduleConfig WeeklyManagerReport { get; set; } = new()
    {
        Enabled = true,
        CronExpression = "30 7 * * 1", // Every Monday at 7:30 AM
        Description = "Weekly manager visit reports"
    };
    
    public JobScheduleConfig RetryFailedEmails { get; set; } = new()
    {
        Enabled = true,
        CronExpression = "*/15 * * * *", // Every 15 minutes
        Description = "Retry failed email sends"
    };
    
    public JobScheduleConfig CleanupEmailLogs { get; set; } = new()
    {
        Enabled = true,
        CronExpression = "0 2 * * *", // Daily at 2:00 AM
        Description = "Clean up old email logs"
    };
    
    public JobScheduleConfig LowStockAlerts { get; set; } = new()
    {
        Enabled = true,
        CronExpression = "0 8 * * 1-5", // Weekdays at 8:00 AM
        Description = "Check and alert on low stock items"
    };
    
    public JobScheduleConfig DailyVisitReminders { get; set; } = new()
    {
        Enabled = false,
        CronExpression = "0 7 * * 1-5", // Weekdays at 7:00 AM
        Description = "Send daily visit schedule reminders"
    };
    
    public JobScheduleConfig MonthlyReports { get; set; } = new()
    {
        Enabled = true,
        CronExpression = "0 8 1 * *", // 1st of month at 8:00 AM
        Description = "Generate monthly summary reports"
    };
}

/// <summary>
/// Configuration for a single scheduled job
/// </summary>
public class JobScheduleConfig
{
    public bool Enabled { get; set; } = true;
    public string CronExpression { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}
