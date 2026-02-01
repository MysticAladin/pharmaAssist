using Application.Common;
using Application.Interfaces;
using Application.Services;
using Application.DTOs.Email;
using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Infrastructure.Services;

/// <summary>
/// Manages scheduled email operations grouped by region/manager
/// </summary>
public class EmailSchedulingManager : IEmailSchedulingManager
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IFeatureFlagRepository _featureFlags;
    private readonly EmailSettings _emailSettings;
    private readonly ILogger<EmailSchedulingManager> _logger;

    public EmailSchedulingManager(
        ApplicationDbContext context,
        IEmailService emailService,
        IFeatureFlagRepository featureFlags,
        IOptions<EmailSettings> emailSettings,
        ILogger<EmailSchedulingManager> logger)
    {
        _context = context;
        _emailService = emailService;
        _featureFlags = featureFlags;
        _emailSettings = emailSettings.Value;
        _logger = logger;
    }

    /// <summary>
    /// Check if a feature flag is enabled by key
    /// </summary>
    private async Task<bool> IsFeatureEnabledAsync(string flagKey, CancellationToken cancellationToken = default)
    {
        var flag = await _featureFlags.GetSystemFlagByKeyAsync(flagKey, cancellationToken);
        return flag?.IsEnabled ?? false;
    }

    /// <inheritdoc />
    public async Task SendWeeklyManagerReportsAsync(CancellationToken cancellationToken = default)
    {
        // Check feature flags
        if (!await IsFeatureEnabledAsync("email.weeklyManagerReports", cancellationToken))
        {
            _logger.LogInformation("Weekly manager reports feature is disabled");
            return;
        }

        if (!await IsFeatureEnabledAsync("email.globalEnabled", cancellationToken))
        {
            _logger.LogInformation("Email sending is globally disabled");
            return;
        }

        _logger.LogInformation("Starting weekly manager reports job");

        // Get the previous week date range (Monday to Sunday)
        var today = DateTime.UtcNow.Date;
        var daysToMonday = ((int)today.DayOfWeek - 1 + 7) % 7;
        var lastMonday = today.AddDays(-daysToMonday - 7);
        var lastSunday = lastMonday.AddDays(6);

        // Get all managers with assigned reps
        var assignments = await _context.RepManagerAssignments
            .Where(a => a.IsActive)
            .Include(a => a.ManagerUser)
            .Include(a => a.Rep!)
                .ThenInclude(r => r!.User)
            .ToListAsync(cancellationToken);

        var managers = assignments.GroupBy(a => a.ManagerUserId).ToList();

        var successCount = 0;
        var failedCount = 0;

        foreach (var managerGroup in managers)
        {
            var manager = managerGroup.FirstOrDefault()?.ManagerUser;
            if (manager?.Email == null)
            {
                _logger.LogWarning("Manager {ManagerId} has no email address", managerGroup.Key);
                continue;
            }

            try
            {
                var repIds = managerGroup.Select(a => a.RepId).ToList();

                // Get visits for the week grouped by rep
                var visits = await _context.Set<ExecutedVisit>()
                    .Where(v => repIds.Contains(v.RepId) &&
                               v.CheckInTime >= lastMonday &&
                               v.CheckInTime <= lastSunday.AddDays(1).AddSeconds(-1))
                    .Include(v => v.Rep!)
                        .ThenInclude(r => r!.User)
                    .Include(v => v.Customer)
                    .OrderBy(v => v.RepId)
                    .ThenBy(v => v.CheckInTime)
                    .ToListAsync(cancellationToken);

                // Generate Excel attachment
                var excelData = GenerateWeeklyReportExcel(visits, lastMonday, lastSunday, managerGroup.ToList());

                // Build email content
                var visitsByRep = visits.GroupBy(v => v.Rep).ToList();
                var totalVisits = visits.Count;
                var completedVisits = visits.Count(v => v.CheckOutTime != null);

                var emailBody = $@"
                <h2>Weekly Visit Report</h2>
                <p>Dear {manager.FullName},</p>
                <p>Here is the weekly visit summary for your team for the period {lastMonday:yyyy-MM-dd} to {lastSunday:yyyy-MM-dd}.</p>
                
                <h3>Summary</h3>
                <ul>
                    <li><strong>Total Visits:</strong> {totalVisits}</li>
                    <li><strong>Completed Visits:</strong> {completedVisits}</li>
                    <li><strong>Team Members:</strong> {visitsByRep.Count}</li>
                </ul>
                
                <h3>By Representative</h3>
                <table border='1' cellpadding='5' cellspacing='0'>
                    <tr>
                        <th>Representative</th>
                        <th>Total Visits</th>
                        <th>Completed</th>
                        <th>Avg Duration (min)</th>
                    </tr>";

                foreach (var repGroup in visitsByRep)
                {
                    var repName = repGroup.Key?.User?.FullName ?? "Unknown";
                    var repVisits = repGroup.Count();
                    var repCompleted = repGroup.Count(v => v.CheckOutTime != null);
                    var avgDuration = repGroup
                        .Where(v => v.ActualDurationMinutes.HasValue)
                        .Select(v => v.ActualDurationMinutes!.Value)
                        .DefaultIfEmpty(0)
                        .Average();

                    emailBody += $@"
                    <tr>
                        <td>{repName}</td>
                        <td>{repVisits}</td>
                        <td>{repCompleted}</td>
                        <td>{avgDuration:F0}</td>
                    </tr>";
                }

                emailBody += @"
                </table>
                
                <p>Please find the detailed report attached as an Excel file.</p>
                <p>Best regards,<br>PharmaAssist System</p>";

                var attachment = new EmailAttachmentDto
                {
                    FileName = $"Weekly_Visit_Report_{lastMonday:yyyyMMdd}_{lastSunday:yyyyMMdd}.xlsx",
                    Content = excelData,
                    ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                };

                var emailMessage = new EmailMessageDto
                {
                    ToEmail = manager.Email,
                    ToName = manager.FullName,
                    Subject = $"Weekly Visit Report - {lastMonday:yyyy-MM-dd} to {lastSunday:yyyy-MM-dd}",
                    Body = emailBody,
                    IsHtml = true,
                    EmailType = (int)EmailType.WeeklyManagerReport,
                    Attachments = new List<EmailAttachmentDto> { attachment }
                };

                await _emailService.SendEmailAsync(emailMessage);

                successCount++;
                _logger.LogInformation("Sent weekly report to manager {ManagerEmail}", manager.Email);
            }
            catch (Exception ex)
            {
                failedCount++;
                _logger.LogError(ex, "Failed to send weekly report to manager {ManagerId}", managerGroup.Key);
            }
        }

        _logger.LogInformation("Weekly manager reports job completed. Success: {Success}, Failed: {Failed}", 
            successCount, failedCount);
    }

    /// <inheritdoc />
    public async Task SendDailyVisitRemindersAsync(CancellationToken cancellationToken = default)
    {
        // Check feature flags
        if (!await IsFeatureEnabledAsync("email.dailyVisitReminders", cancellationToken))
        {
            _logger.LogInformation("Daily visit reminders feature is disabled");
            return;
        }

        if (!await IsFeatureEnabledAsync("email.globalEnabled", cancellationToken))
        {
            _logger.LogInformation("Email sending is globally disabled");
            return;
        }

        _logger.LogInformation("Starting daily visit reminders job");

        var today = DateTime.UtcNow.Date;

        // Get all planned visits for today
        var plannedVisits = await _context.Set<PlannedVisit>()
            .Where(pv => pv.PlannedDate.Date == today &&
                        pv.ExecutedVisit == null)
            .Include(pv => pv.Plan!)
                .ThenInclude(p => p!.Rep!)
                    .ThenInclude(r => r!.User)
            .Include(pv => pv.Customer)
            .ToListAsync(cancellationToken);

        // Group by sales rep
        var visitsByRep = plannedVisits
            .GroupBy(v => v.Plan?.Rep)
            .Where(g => g.Key?.User?.Email != null);

        var successCount = 0;
        var failedCount = 0;

        foreach (var repGroup in visitsByRep)
        {
            var rep = repGroup.Key;
            var user = rep?.User;
            if (user?.Email == null) continue;

            try
            {
                var visits = repGroup.OrderBy(v => v.PlannedTime).ToList();

                var emailBody = $@"
                <h2>Today's Visit Schedule</h2>
                <p>Good morning {user.FullName},</p>
                <p>Here are your planned visits for today ({today:dddd, MMMM d, yyyy}):</p>
                
                <table border='1' cellpadding='5' cellspacing='0'>
                    <tr>
                        <th>#</th>
                        <th>Time</th>
                        <th>Customer</th>
                        <th>Objective</th>
                    </tr>";

                var index = 1;
                foreach (var visit in visits)
                {
                    emailBody += $@"
                    <tr>
                        <td>{index++}</td>
                        <td>{visit.PlannedTime?.ToString("HH:mm") ?? "TBD"}</td>
                        <td>{visit.Customer?.FullName ?? "Unknown"}</td>
                        <td>{visit.VisitObjective ?? "-"}</td>
                    </tr>";
                }

                emailBody += @"
                </table>
                
                <p>Have a productive day!</p>
                <p>Best regards,<br>PharmaAssist System</p>";

                var emailMessage = new EmailMessageDto
                {
                    ToEmail = user.Email,
                    ToName = user.FullName,
                    Subject = $"Your Visit Schedule for Today - {visits.Count} visits planned",
                    Body = emailBody,
                    IsHtml = true,
                    EmailType = (int)EmailType.VisitReminder
                };

                await _emailService.SendEmailAsync(emailMessage);

                successCount++;
                _logger.LogInformation("Sent daily reminder to rep {RepEmail}", user.Email);
            }
            catch (Exception ex)
            {
                failedCount++;
                _logger.LogError(ex, "Failed to send daily reminder to rep {RepId}", rep?.Id);
            }
        }

        _logger.LogInformation("Daily visit reminders job completed. Success: {Success}, Failed: {Failed}", 
            successCount, failedCount);
    }

    /// <inheritdoc />
    public async Task RetryFailedEmailsAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting retry failed emails job");

        var retryBefore = DateTime.UtcNow.AddMinutes(-_emailSettings.RetryDelayMinutes);
        
        var failedEmails = await _context.Set<EmailLog>()
            .Where(e => e.Status != EmailStatus.Sent && 
                       e.RetryCount < _emailSettings.MaxRetries &&
                       e.CreatedAt < retryBefore)
            .OrderBy(e => e.CreatedAt)
            .Take(_emailSettings.BatchSize)
            .ToListAsync(cancellationToken);

        if (!failedEmails.Any())
        {
            _logger.LogInformation("No failed emails to retry");
            return;
        }

        var successCount = 0;
        var failedCount = 0;

        foreach (var emailLog in failedEmails)
        {
            try
            {
                emailLog.RetryCount++;
                emailLog.LastAttempt = DateTime.UtcNow;

                // Try to resend
                var emailMessage = new EmailMessageDto
                {
                    ToEmail = emailLog.ToEmail,
                    ToName = emailLog.ToName,
                    Subject = emailLog.Subject,
                    Body = emailLog.Body,
                    IsHtml = emailLog.IsHtml,
                    EmailType = (int)emailLog.EmailType
                };

                await _emailService.SendEmailAsync(emailMessage);

                // Mark as sent
                emailLog.Status = EmailStatus.Sent;
                emailLog.SentAt = DateTime.UtcNow;
                emailLog.ErrorMessage = null;
                successCount++;

                _logger.LogInformation("Successfully retried email {EmailId} to {ToEmail}", 
                    emailLog.Id, emailLog.ToEmail);
            }
            catch (Exception ex)
            {
                emailLog.ErrorMessage = ex.Message;
                failedCount++;
                _logger.LogWarning(ex, "Failed to retry email {EmailId}, attempt {Attempt}/{Max}", 
                    emailLog.Id, emailLog.RetryCount, _emailSettings.MaxRetries);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Retry failed emails job completed. Success: {Success}, Failed: {Failed}", 
            successCount, failedCount);
    }

    /// <inheritdoc />
    public async Task CleanupEmailLogsAsync(int retentionDays, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting email log cleanup job with {RetentionDays} days retention", retentionDays);

        var cutoffDate = DateTime.UtcNow.AddDays(-retentionDays);

        var deletedCount = await _context.Set<EmailLog>()
            .Where(e => e.CreatedAt < cutoffDate && e.Status == EmailStatus.Sent)
            .ExecuteDeleteAsync(cancellationToken);

        _logger.LogInformation("Email log cleanup completed. Deleted {Count} old logs", deletedCount);
    }

    /// <summary>
    /// Generate Excel file for weekly visit report (CSV format for now)
    /// In production, use ClosedXML or EPPlus for proper Excel generation
    /// </summary>
    private byte[] GenerateWeeklyReportExcel(
        List<ExecutedVisit> visits, 
        DateTime weekStart, 
        DateTime weekEnd,
        List<RepManagerAssignment> assignments)
    {
        using var ms = new MemoryStream();
        using var writer = new StreamWriter(ms);

        // Header
        writer.WriteLine("Representative,Employee Code,Visit Date,Check-In Time,Check-Out Time,Duration (min),Customer,Location Verified,Outcome,Summary");

        foreach (var visit in visits)
        {
            var repName = visit.Rep?.User?.FullName ?? "Unknown";
            var employeeCode = visit.Rep?.EmployeeCode ?? "";
            var visitDate = visit.CheckInTime.ToString("yyyy-MM-dd");
            var checkIn = visit.CheckInTime.ToString("HH:mm");
            var checkOut = visit.CheckOutTime?.ToString("HH:mm") ?? "";
            var duration = visit.ActualDurationMinutes?.ToString() ?? "";
            var customer = visit.Customer?.FullName?.Replace(",", ";") ?? "Unknown";
            var verified = visit.LocationVerified ? "Yes" : "No";
            var outcome = visit.Outcome?.ToString() ?? "";
            var summary = visit.Summary?.Replace(",", ";").Replace("\n", " ") ?? "";

            writer.WriteLine($"{repName},{employeeCode},{visitDate},{checkIn},{checkOut},{duration},{customer},{verified},{outcome},{summary}");
        }

        writer.Flush();
        return ms.ToArray();
    }
}
