using Application.Common;
using Application.DTOs.Email;
using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Net.Mail;

namespace Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;
    private readonly SmtpSettings _smtpSettings;

    public EmailService(
        ApplicationDbContext context,
        IConfiguration configuration,
        ILogger<EmailService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
        _smtpSettings = configuration.GetSection("SmtpSettings").Get<SmtpSettings>() ?? new SmtpSettings();
    }

    public async Task<SendEmailResultDto> SendEmailAsync(EmailMessageDto message)
    {
        var emailLog = new EmailLog
        {
            ToEmail = message.ToEmail,
            ToName = message.ToName,
            CcEmail = message.CcEmail,
            BccEmail = message.BccEmail,
            Subject = message.Subject,
            Body = message.Body,
            IsHtml = message.IsHtml,
            EmailType = (EmailType)message.EmailType,
            RelatedEntityType = message.RelatedEntityType,
            RelatedEntityId = message.RelatedEntityId,
            Status = EmailStatus.Pending
        };

        _context.EmailLogs.Add(emailLog);
        await _context.SaveChangesAsync();

        try
        {
            await SendSmtpEmailAsync(emailLog);
            
            emailLog.Status = EmailStatus.Sent;
            emailLog.SentAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Email sent successfully to {ToEmail}: {Subject}", message.ToEmail, message.Subject);
            
            return new SendEmailResultDto
            {
                Success = true,
                Message = "Email sent successfully",
                EmailLogId = emailLog.Id
            };
        }
        catch (Exception ex)
        {
            emailLog.Status = EmailStatus.Failed;
            emailLog.ErrorMessage = ex.Message;
            await _context.SaveChangesAsync();

            _logger.LogError(ex, "Failed to send email to {ToEmail}: {Subject}", message.ToEmail, message.Subject);
            
            return new SendEmailResultDto
            {
                Success = false,
                Message = $"Failed to send email: {ex.Message}",
                EmailLogId = emailLog.Id
            };
        }
    }

    public async Task<SendEmailResultDto> SendTemplateEmailAsync(
        string templateName, 
        string toEmail, 
        string? toName, 
        Dictionary<string, string> placeholders)
    {
        var template = GetEmailTemplate(templateName);
        if (template == null)
        {
            return new SendEmailResultDto { Success = false, Message = $"Template '{templateName}' not found" };
        }

        var subject = ReplacePlaceholders(template.Subject, placeholders);
        var body = ReplacePlaceholders(template.Body, placeholders);

        return await SendEmailAsync(new EmailMessageDto
        {
            ToEmail = toEmail,
            ToName = toName,
            Subject = subject,
            Body = body,
            IsHtml = true,
            EmailType = GetEmailTypeFromTemplate(templateName)
        });
    }

    public async Task<PagedResult<EmailLogDto>> GetEmailLogsAsync(EmailQueryParams queryParams)
    {
        var query = _context.EmailLogs.AsQueryable();

        if (!string.IsNullOrEmpty(queryParams.ToEmail))
            query = query.Where(e => e.ToEmail.Contains(queryParams.ToEmail));

        if (queryParams.Status.HasValue)
            query = query.Where(e => e.Status == (EmailStatus)queryParams.Status.Value);

        if (queryParams.EmailType.HasValue)
            query = query.Where(e => e.EmailType == (EmailType)queryParams.EmailType.Value);

        if (queryParams.StartDate.HasValue)
            query = query.Where(e => e.CreatedAt >= queryParams.StartDate.Value);

        if (queryParams.EndDate.HasValue)
            query = query.Where(e => e.CreatedAt <= queryParams.EndDate.Value);

        var totalCount = await query.CountAsync();

        var logs = await query
            .OrderByDescending(e => e.CreatedAt)
            .Skip((queryParams.Page - 1) * queryParams.PageSize)
            .Take(queryParams.PageSize)
            .Select(e => new EmailLogDto
            {
                Id = e.Id,
                ToEmail = e.ToEmail,
                ToName = e.ToName,
                Subject = e.Subject,
                Status = e.Status.ToString(),
                ErrorMessage = e.ErrorMessage,
                RetryCount = e.RetryCount,
                CreatedAt = e.CreatedAt,
                SentAt = e.SentAt,
                EmailType = e.EmailType.ToString()
            })
            .ToListAsync();

        return new PagedResult<EmailLogDto>
        {
            Items = logs,
            TotalCount = totalCount,
            Page = queryParams.Page,
            PageSize = queryParams.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)queryParams.PageSize)
        };
    }

    public async Task<EmailLogDto?> GetEmailLogByIdAsync(int id)
    {
        var log = await _context.EmailLogs.FindAsync(id);
        if (log == null) return null;

        return new EmailLogDto
        {
            Id = log.Id,
            ToEmail = log.ToEmail,
            ToName = log.ToName,
            Subject = log.Subject,
            Status = log.Status.ToString(),
            ErrorMessage = log.ErrorMessage,
            RetryCount = log.RetryCount,
            CreatedAt = log.CreatedAt,
            SentAt = log.SentAt,
            EmailType = log.EmailType.ToString()
        };
    }

    public async Task<EmailStatisticsDto> GetStatisticsAsync()
    {
        var today = DateTime.UtcNow.Date;
        var weekStart = today.AddDays(-(int)today.DayOfWeek);
        var monthStart = new DateTime(today.Year, today.Month, 1);

        var stats = new EmailStatisticsDto
        {
            TotalSent = await _context.EmailLogs.CountAsync(e => e.Status == EmailStatus.Sent),
            TotalFailed = await _context.EmailLogs.CountAsync(e => e.Status == EmailStatus.Failed),
            TotalPending = await _context.EmailLogs.CountAsync(e => e.Status == EmailStatus.Pending),
            TotalToday = await _context.EmailLogs.CountAsync(e => e.CreatedAt >= today),
            TotalThisWeek = await _context.EmailLogs.CountAsync(e => e.CreatedAt >= weekStart),
            TotalThisMonth = await _context.EmailLogs.CountAsync(e => e.CreatedAt >= monthStart)
        };

        var byType = await _context.EmailLogs
            .GroupBy(e => e.EmailType)
            .Select(g => new { Type = g.Key.ToString(), Count = g.Count() })
            .ToListAsync();

        stats.ByType = byType.ToDictionary(x => x.Type, x => x.Count);

        return stats;
    }

    public async Task<int> RetryFailedEmailsAsync()
    {
        var failedEmails = await _context.EmailLogs
            .Where(e => e.Status == EmailStatus.Failed && e.RetryCount < 3)
            .ToListAsync();

        int retried = 0;

        foreach (var email in failedEmails)
        {
            email.Status = EmailStatus.Retrying;
            email.RetryCount++;
            await _context.SaveChangesAsync();

            try
            {
                await SendSmtpEmailAsync(email);
                email.Status = EmailStatus.Sent;
                email.SentAt = DateTime.UtcNow;
                retried++;
            }
            catch (Exception ex)
            {
                email.Status = EmailStatus.Failed;
                email.ErrorMessage = ex.Message;
            }

            await _context.SaveChangesAsync();
        }

        _logger.LogInformation("Retried {Count} failed emails", retried);
        return retried;
    }

    public async Task<SendEmailResultDto> SendWelcomeEmailAsync(string toEmail, string userName)
    {
        return await SendTemplateEmailAsync("welcome", toEmail, userName, new Dictionary<string, string>
        {
            { "UserName", userName },
            { "AppName", "PharmaAssist" }
        });
    }

    public async Task<SendEmailResultDto> SendPasswordResetEmailAsync(string toEmail, string userName, string resetLink)
    {
        return await SendTemplateEmailAsync("password-reset", toEmail, userName, new Dictionary<string, string>
        {
            { "UserName", userName },
            { "ResetLink", resetLink },
            { "ExpiryHours", "24" }
        });
    }

    public async Task<SendEmailResultDto> SendOrderConfirmationAsync(string toEmail, string customerName, string orderNumber, decimal orderTotal)
    {
        return await SendTemplateEmailAsync("order-confirmation", toEmail, customerName, new Dictionary<string, string>
        {
            { "CustomerName", customerName },
            { "OrderNumber", orderNumber },
            { "OrderTotal", orderTotal.ToString("C") }
        });
    }

    public async Task<SendEmailResultDto> SendOrderShippedAsync(string toEmail, string customerName, string orderNumber, string? trackingNumber)
    {
        return await SendTemplateEmailAsync("order-shipped", toEmail, customerName, new Dictionary<string, string>
        {
            { "CustomerName", customerName },
            { "OrderNumber", orderNumber },
            { "TrackingNumber", trackingNumber ?? "N/A" }
        });
    }

    public async Task<SendEmailResultDto> SendLowStockAlertAsync(string toEmail, string productName, int currentStock, int reorderLevel)
    {
        return await SendTemplateEmailAsync("low-stock-alert", toEmail, null, new Dictionary<string, string>
        {
            { "ProductName", productName },
            { "CurrentStock", currentStock.ToString() },
            { "ReorderLevel", reorderLevel.ToString() }
        });
    }

    public async Task<SendEmailResultDto> SendExpiryAlertAsync(string toEmail, string productName, DateTime expiryDate, int quantity)
    {
        return await SendTemplateEmailAsync("expiry-alert", toEmail, null, new Dictionary<string, string>
        {
            { "ProductName", productName },
            { "ExpiryDate", expiryDate.ToString("yyyy-MM-dd") },
            { "Quantity", quantity.ToString() }
        });
    }

    private async Task SendSmtpEmailAsync(EmailLog email)
    {
        if (!_smtpSettings.Enabled)
        {
            _logger.LogInformation("SMTP is disabled. Email would be sent to: {ToEmail}", email.ToEmail);
            return;
        }

        using var client = new SmtpClient(_smtpSettings.Host, _smtpSettings.Port)
        {
            EnableSsl = _smtpSettings.EnableSsl,
            Credentials = new NetworkCredential(_smtpSettings.Username, _smtpSettings.Password)
        };

        var mailMessage = new MailMessage
        {
            From = new MailAddress(_smtpSettings.FromEmail, _smtpSettings.FromName),
            Subject = email.Subject,
            Body = email.Body,
            IsBodyHtml = email.IsHtml
        };

        mailMessage.To.Add(new MailAddress(email.ToEmail, email.ToName));

        if (!string.IsNullOrEmpty(email.CcEmail))
        {
            foreach (var cc in email.CcEmail.Split(',', StringSplitOptions.RemoveEmptyEntries))
            {
                mailMessage.CC.Add(cc.Trim());
            }
        }

        if (!string.IsNullOrEmpty(email.BccEmail))
        {
            foreach (var bcc in email.BccEmail.Split(',', StringSplitOptions.RemoveEmptyEntries))
            {
                mailMessage.Bcc.Add(bcc.Trim());
            }
        }

        await client.SendMailAsync(mailMessage);
    }

    private static EmailTemplate? GetEmailTemplate(string templateName)
    {
        return templateName.ToLowerInvariant() switch
        {
            "welcome" => new EmailTemplate
            {
                Subject = "Welcome to {{AppName}}!",
                Body = @"
                    <html>
                    <body style='font-family: Arial, sans-serif;'>
                        <h2>Welcome, {{UserName}}!</h2>
                        <p>Thank you for joining {{AppName}}. We're excited to have you on board!</p>
                        <p>You can now browse our pharmaceutical products and place orders.</p>
                        <p>Best regards,<br/>The {{AppName}} Team</p>
                    </body>
                    </html>"
            },
            "password-reset" => new EmailTemplate
            {
                Subject = "Password Reset Request",
                Body = @"
                    <html>
                    <body style='font-family: Arial, sans-serif;'>
                        <h2>Password Reset Request</h2>
                        <p>Hi {{UserName}},</p>
                        <p>We received a request to reset your password. Click the link below to reset it:</p>
                        <p><a href='{{ResetLink}}' style='background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Reset Password</a></p>
                        <p>This link will expire in {{ExpiryHours}} hours.</p>
                        <p>If you didn't request this, please ignore this email.</p>
                    </body>
                    </html>"
            },
            "order-confirmation" => new EmailTemplate
            {
                Subject = "Order Confirmation - {{OrderNumber}}",
                Body = @"
                    <html>
                    <body style='font-family: Arial, sans-serif;'>
                        <h2>Order Confirmed!</h2>
                        <p>Dear {{CustomerName}},</p>
                        <p>Thank you for your order! Your order <strong>{{OrderNumber}}</strong> has been confirmed.</p>
                        <p>Order Total: <strong>{{OrderTotal}}</strong></p>
                        <p>We'll notify you once your order is shipped.</p>
                        <p>Best regards,<br/>The PharmaAssist Team</p>
                    </body>
                    </html>"
            },
            "order-received-internal" => new EmailTemplate
            {
                Subject = "New Order Received - {{OrderNumber}}",
                Body = @"
                    <html>
                    <body style='font-family: Arial, sans-serif;'>
                        <h2>New Order Received</h2>
                        <p>A new order has been placed.</p>
                        <ul>
                            <li><strong>Order:</strong> {{OrderNumber}}</li>
                            <li><strong>Customer:</strong> {{CustomerName}}</li>
                            <li><strong>Total:</strong> {{OrderTotal}}</li>
                        </ul>
                        <p>Please start the order processing workflow.</p>
                    </body>
                    </html>"
            },
            "order-shipped" => new EmailTemplate
            {
                Subject = "Your Order Has Been Shipped - {{OrderNumber}}",
                Body = @"
                    <html>
                    <body style='font-family: Arial, sans-serif;'>
                        <h2>Your Order is On Its Way!</h2>
                        <p>Dear {{CustomerName}},</p>
                        <p>Great news! Your order <strong>{{OrderNumber}}</strong> has been shipped.</p>
                        <p>Tracking Number: <strong>{{TrackingNumber}}</strong></p>
                        <p>Best regards,<br/>The PharmaAssist Team</p>
                    </body>
                    </html>"
            },
            "low-stock-alert" => new EmailTemplate
            {
                Subject = "Low Stock Alert: {{ProductName}}",
                Body = @"
                    <html>
                    <body style='font-family: Arial, sans-serif;'>
                        <h2 style='color: #dc3545;'>Low Stock Alert</h2>
                        <p>The following product is running low on stock:</p>
                        <ul>
                            <li><strong>Product:</strong> {{ProductName}}</li>
                            <li><strong>Current Stock:</strong> {{CurrentStock}}</li>
                            <li><strong>Reorder Level:</strong> {{ReorderLevel}}</li>
                        </ul>
                        <p>Please reorder this product soon to avoid stockouts.</p>
                    </body>
                    </html>"
            },
            "expiry-alert" => new EmailTemplate
            {
                Subject = "Expiry Alert: {{ProductName}}",
                Body = @"
                    <html>
                    <body style='font-family: Arial, sans-serif;'>
                        <h2 style='color: #ffc107;'>Product Expiry Alert</h2>
                        <p>The following product is expiring soon:</p>
                        <ul>
                            <li><strong>Product:</strong> {{ProductName}}</li>
                            <li><strong>Expiry Date:</strong> {{ExpiryDate}}</li>
                            <li><strong>Quantity:</strong> {{Quantity}}</li>
                        </ul>
                        <p>Please take appropriate action.</p>
                    </body>
                    </html>"
            },
            _ => null
        };
    }

    private static string ReplacePlaceholders(string template, Dictionary<string, string> placeholders)
    {
        foreach (var placeholder in placeholders)
        {
            template = template.Replace($"{{{{{placeholder.Key}}}}}", placeholder.Value);
        }
        return template;
    }

    private static int GetEmailTypeFromTemplate(string templateName)
    {
        return templateName.ToLowerInvariant() switch
        {
            "welcome" => (int)EmailType.Welcome,
            "password-reset" => (int)EmailType.PasswordReset,
            "order-confirmation" => (int)EmailType.OrderConfirmation,
            "order-received-internal" => (int)EmailType.OrderReceivedInternal,
            "order-shipped" => (int)EmailType.OrderShipped,
            "low-stock-alert" => (int)EmailType.LowStockAlert,
            "expiry-alert" => (int)EmailType.ExpiryAlert,
            _ => (int)EmailType.Newsletter
        };
    }

    private class EmailTemplate
    {
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
    }
}

public class SmtpSettings
{
    public bool Enabled { get; set; } = false;
    public string Host { get; set; } = "smtp.gmail.com";
    public int Port { get; set; } = 587;
    public bool EnableSsl { get; set; } = true;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromEmail { get; set; } = "noreply@pharmaassist.ba";
    public string FromName { get; set; } = "PharmaAssist";
}
