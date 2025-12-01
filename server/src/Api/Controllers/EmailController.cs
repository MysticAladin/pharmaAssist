using Application.DTOs.Email;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Manager")]
public class EmailController : ControllerBase
{
    private readonly IEmailService _emailService;
    private readonly ILogger<EmailController> _logger;

    public EmailController(IEmailService emailService, ILogger<EmailController> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }

    /// <summary>
    /// Send a custom email
    /// </summary>
    [HttpPost("send")]
    public async Task<ActionResult<SendEmailResultDto>> SendEmail([FromBody] EmailMessageDto message)
    {
        var result = await _emailService.SendEmailAsync(message);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Send a template-based email
    /// </summary>
    [HttpPost("send-template")]
    public async Task<ActionResult<SendEmailResultDto>> SendTemplateEmail([FromBody] EmailTemplateDto request)
    {
        if (request.Placeholders == null || !request.Placeholders.TryGetValue("ToEmail", out var toEmail))
        {
            return BadRequest(new SendEmailResultDto { Success = false, Message = "ToEmail is required in placeholders" });
        }

        request.Placeholders.TryGetValue("ToName", out var toName);

        var result = await _emailService.SendTemplateEmailAsync(
            request.TemplateName,
            toEmail,
            toName,
            request.Placeholders);

        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get email logs with pagination and filtering
    /// </summary>
    [HttpGet("logs")]
    public async Task<ActionResult> GetEmailLogs([FromQuery] EmailQueryParams queryParams)
    {
        var result = await _emailService.GetEmailLogsAsync(queryParams);
        return Ok(result);
    }

    /// <summary>
    /// Get email log by ID
    /// </summary>
    [HttpGet("logs/{id}")]
    public async Task<ActionResult<EmailLogDto>> GetEmailLog(int id)
    {
        var log = await _emailService.GetEmailLogByIdAsync(id);
        if (log == null)
        {
            return NotFound();
        }
        return Ok(log);
    }

    /// <summary>
    /// Get email statistics
    /// </summary>
    [HttpGet("statistics")]
    public async Task<ActionResult<EmailStatisticsDto>> GetStatistics()
    {
        var stats = await _emailService.GetStatisticsAsync();
        return Ok(stats);
    }

    /// <summary>
    /// Retry failed emails
    /// </summary>
    [HttpPost("retry-failed")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> RetryFailedEmails()
    {
        var count = await _emailService.RetryFailedEmailsAsync();
        return Ok(new { RetriedCount = count });
    }

    /// <summary>
    /// Send test email
    /// </summary>
    [HttpPost("test")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<SendEmailResultDto>> SendTestEmail([FromBody] TestEmailRequest request)
    {
        var result = await _emailService.SendEmailAsync(new EmailMessageDto
        {
            ToEmail = request.Email,
            ToName = request.Name,
            Subject = "PharmaAssist - Test Email",
            Body = @"
                <html>
                <body style='font-family: Arial, sans-serif;'>
                    <h2>Test Email</h2>
                    <p>This is a test email from PharmaAssist.</p>
                    <p>If you received this, your email configuration is working correctly!</p>
                    <p>Sent at: " + DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss UTC") + @"</p>
                </body>
                </html>",
            IsHtml = true,
            EmailType = (int)Domain.Entities.EmailType.Newsletter
        });

        return result.Success ? Ok(result) : BadRequest(result);
    }
}

public class TestEmailRequest
{
    public string Email { get; set; } = string.Empty;
    public string? Name { get; set; }
}
