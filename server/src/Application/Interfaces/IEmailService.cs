using Application.Common;
using Application.DTOs.Email;

namespace Application.Interfaces;

public interface IEmailService
{
    Task<SendEmailResultDto> SendEmailAsync(EmailMessageDto message);
    Task<SendEmailResultDto> SendTemplateEmailAsync(string templateName, string toEmail, string? toName, Dictionary<string, string> placeholders);
    Task<PagedResult<EmailLogDto>> GetEmailLogsAsync(EmailQueryParams queryParams);
    Task<EmailLogDto?> GetEmailLogByIdAsync(int id);
    Task<EmailStatisticsDto> GetStatisticsAsync();
    Task<int> RetryFailedEmailsAsync();
    
    // Template-based email methods
    Task<SendEmailResultDto> SendWelcomeEmailAsync(string toEmail, string userName);
    Task<SendEmailResultDto> SendPasswordResetEmailAsync(string toEmail, string userName, string resetLink);
    Task<SendEmailResultDto> SendOrderConfirmationAsync(string toEmail, string customerName, string orderNumber, decimal orderTotal);
    Task<SendEmailResultDto> SendOrderShippedAsync(string toEmail, string customerName, string orderNumber, string? trackingNumber);
    Task<SendEmailResultDto> SendLowStockAlertAsync(string toEmail, string productName, int currentStock, int reorderLevel);
    Task<SendEmailResultDto> SendExpiryAlertAsync(string toEmail, string productName, DateTime expiryDate, int quantity);
}
