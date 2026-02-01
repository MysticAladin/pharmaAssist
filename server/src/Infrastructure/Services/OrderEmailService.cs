using Application.Common;
using Application.DTOs.Email;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

/// <summary>
/// Service for sending order-related emails
/// </summary>
public class OrderEmailService : IOrderEmailService
{
    private readonly IEmailService _emailService;
    private readonly IFeatureFlagRepository _featureFlagRepository;
    private readonly ApplicationDbContext _context;
    private readonly EmailSettings _emailSettings;
    private readonly ILogger<OrderEmailService> _logger;

    public OrderEmailService(
        IEmailService emailService,
        IFeatureFlagRepository featureFlagRepository,
        ApplicationDbContext context,
        IConfiguration configuration,
        ILogger<OrderEmailService> logger)
    {
        _emailService = emailService;
        _featureFlagRepository = featureFlagRepository;
        _context = context;
        _emailSettings = configuration.GetSection(EmailSettings.SectionName).Get<EmailSettings>() ?? new EmailSettings();
        _logger = logger;
    }

    public async Task<bool> SendOrderConfirmationToCustomerAsync(Order order, byte[]? pdfDocument = null)
    {
        // Check feature flag
        if (!await IsFeatureEnabledAsync("email.orderConfirmation"))
        {
            _logger.LogInformation("Order confirmation email is disabled by feature flag");
            return false;
        }

        var customer = await _context.Customers.FindAsync(order.CustomerId);
        if (customer == null || string.IsNullOrEmpty(customer.Email))
        {
            _logger.LogWarning("Cannot send order confirmation - customer {CustomerId} has no email", order.CustomerId);
            return false;
        }

        var orderItems = await _context.OrderItems
            .Where(oi => oi.OrderId == order.Id)
            .Include(oi => oi.Product)
            .ToListAsync();

        var itemsHtml = string.Join("", orderItems.Select(oi =>
            $"<tr><td style='padding: 8px; border: 1px solid #ddd;'>{oi.Product?.Name ?? "Unknown"}</td>" +
            $"<td style='padding: 8px; border: 1px solid #ddd; text-align: center;'>{oi.Quantity}</td>" +
            $"<td style='padding: 8px; border: 1px solid #ddd; text-align: right;'>{oi.UnitPrice:N2} BAM</td>" +
            $"<td style='padding: 8px; border: 1px solid #ddd; text-align: right;'>{oi.LineTotal:N2} BAM</td></tr>"));

        var body = $@"
            <html>
            <body style='font-family: Arial, sans-serif;'>
                <h2 style='color: #28a745;'>Order Confirmed!</h2>
                <p>Dear {customer.FullName},</p>
                <p>Thank you for your order! Your order <strong>{order.OrderNumber}</strong> has been confirmed.</p>
                
                <h3>Order Details</h3>
                <table style='border-collapse: collapse; width: 100%; margin: 20px 0;'>
                    <thead>
                        <tr style='background: #f8f9fa;'>
                            <th style='padding: 10px; border: 1px solid #ddd; text-align: left;'>Product</th>
                            <th style='padding: 10px; border: 1px solid #ddd; text-align: center;'>Qty</th>
                            <th style='padding: 10px; border: 1px solid #ddd; text-align: right;'>Unit Price</th>
                            <th style='padding: 10px; border: 1px solid #ddd; text-align: right;'>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr style='background: #f8f9fa; font-weight: bold;'>
                            <td colspan='3' style='padding: 10px; border: 1px solid #ddd; text-align: right;'>Order Total:</td>
                            <td style='padding: 10px; border: 1px solid #ddd; text-align: right;'>{order.TotalAmount:N2} BAM</td>
                        </tr>
                    </tfoot>
                </table>

                <p>We'll notify you once your order is shipped.</p>
                <p>Best regards,<br/>The PharmaAssist Team</p>
            </body>
            </html>";

        var message = new EmailMessageDto
        {
            ToEmail = customer.Email,
            ToName = customer.FullName,
            Subject = $"Order Confirmation - {order.OrderNumber}",
            Body = body,
            IsHtml = true,
            EmailType = (int)EmailType.OrderConfirmation,
            RelatedEntityType = "Order",
            RelatedEntityId = order.Id
        };

        // Add PDF attachment if provided
        if (pdfDocument != null && pdfDocument.Length > 0)
        {
            message.Attachments.Add(new EmailAttachmentDto
            {
                FileName = $"Order_{order.OrderNumber}.pdf",
                Content = pdfDocument,
                ContentType = "application/pdf"
            });
        }

        var result = await _emailService.SendEmailAsync(message);
        return result.Success;
    }

    public async Task<bool> SendOrderNotificationToCompanyAsync(Order order)
    {
        // Check feature flag
        if (!await IsFeatureEnabledAsync("email.internalOrderNotification"))
        {
            _logger.LogInformation("Internal order notification is disabled by feature flag");
            return false;
        }

        var customer = await _context.Customers
            .Include(c => c.Addresses)
            .FirstOrDefaultAsync(c => c.Id == order.CustomerId);

        if (customer == null)
        {
            _logger.LogWarning("Cannot send internal notification - customer {CustomerId} not found", order.CustomerId);
            return false;
        }

        var orderItems = await _context.OrderItems
            .Where(oi => oi.OrderId == order.Id)
            .Include(oi => oi.Product)
            .ToListAsync();

        // Get sales rep name if available
        string? repName = null;
        if (order.RepId.HasValue)
        {
            var rep = await _context.SalesRepresentatives
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == order.RepId.Value);
            repName = rep != null ? $"{rep.User?.FirstName} {rep.User?.LastName}" : null;
        }

        // Get location from default address
        var defaultAddress = customer.Addresses.FirstOrDefault(a => a.IsDefault);
        var locationName = defaultAddress?.City ?? "Unknown";

        var itemsHtml = string.Join("", orderItems.Select(oi =>
            $"<tr><td style='padding: 8px; border: 1px solid #ddd;'>{oi.Product?.Name ?? "Unknown"}</td>" +
            $"<td style='padding: 8px; border: 1px solid #ddd; text-align: center;'>{oi.Quantity}</td>" +
            $"<td style='padding: 8px; border: 1px solid #ddd; text-align: right;'>{oi.LineTotal:N2} BAM</td></tr>"));

        var body = $@"
            <html>
            <body style='font-family: Arial, sans-serif;'>
                <h2 style='color: #007bff;'>New Order Received</h2>
                
                <table style='border-collapse: collapse; margin: 20px 0;'>
                    <tr><td style='padding: 8px; border: 1px solid #ddd;'><strong>Order Number:</strong></td><td style='padding: 8px; border: 1px solid #ddd;'>{order.OrderNumber}</td></tr>
                    <tr><td style='padding: 8px; border: 1px solid #ddd;'><strong>Customer:</strong></td><td style='padding: 8px; border: 1px solid #ddd;'>{customer.FullName}</td></tr>
                    <tr><td style='padding: 8px; border: 1px solid #ddd;'><strong>Location:</strong></td><td style='padding: 8px; border: 1px solid #ddd;'>{locationName}</td></tr>
                    {(repName != null ? $"<tr><td style='padding: 8px; border: 1px solid #ddd;'><strong>Sales Rep:</strong></td><td style='padding: 8px; border: 1px solid #ddd;'>{repName}</td></tr>" : "")}
                    <tr><td style='padding: 8px; border: 1px solid #ddd;'><strong>Total:</strong></td><td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>{order.TotalAmount:N2} BAM</td></tr>
                    <tr><td style='padding: 8px; border: 1px solid #ddd;'><strong>Items:</strong></td><td style='padding: 8px; border: 1px solid #ddd;'>{orderItems.Count}</td></tr>
                </table>

                <h3>Order Items</h3>
                <table style='border-collapse: collapse; width: 100%; margin: 20px 0;'>
                    <thead>
                        <tr style='background: #f8f9fa;'>
                            <th style='padding: 10px; border: 1px solid #ddd; text-align: left;'>Product</th>
                            <th style='padding: 10px; border: 1px solid #ddd; text-align: center;'>Qty</th>
                            <th style='padding: 10px; border: 1px solid #ddd; text-align: right;'>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemsHtml}
                    </tbody>
                </table>

                {(!string.IsNullOrEmpty(order.Notes) ? $"<p><strong>Notes:</strong> {order.Notes}</p>" : "")}
                
                <p>Please start the order processing workflow.</p>
            </body>
            </html>";

        var message = new EmailMessageDto
        {
            ToEmail = _emailSettings.CompanyOrdersEmail,
            ToName = "PharmaAssist Orders",
            Subject = $"[NEW ORDER] {order.OrderNumber} - {customer.FullName} ({locationName})",
            Body = body,
            IsHtml = true,
            EmailType = (int)EmailType.OrderReceivedInternal,
            RelatedEntityType = "Order",
            RelatedEntityId = order.Id
        };

        var result = await _emailService.SendEmailAsync(message);
        return result.Success;
    }

    public async Task<bool> SendOrderStatusUpdateAsync(Order order, OrderStatus previousStatus)
    {
        // Check feature flag
        if (!await IsFeatureEnabledAsync("email.orderStatusUpdates"))
        {
            _logger.LogInformation("Order status update email is disabled by feature flag");
            return false;
        }

        var customer = await _context.Customers.FindAsync(order.CustomerId);
        if (customer == null || string.IsNullOrEmpty(customer.Email))
        {
            _logger.LogWarning("Cannot send status update - customer {CustomerId} has no email", order.CustomerId);
            return false;
        }

        var placeholders = new Dictionary<string, string>
        {
            { "CustomerName", customer.FullName },
            { "OrderNumber", order.OrderNumber },
            { "PreviousStatus", GetStatusDisplayName(previousStatus) },
            { "StatusName", GetStatusDisplayName(order.Status) },
            { "UpdatedAt", DateTime.UtcNow.ToString("dd.MM.yyyy HH:mm") }
        };

        var result = await _emailService.SendTemplateEmailAsync(
            "order-status-update",
            customer.Email,
            customer.FullName,
            placeholders);

        return result.Success;
    }

    public async Task<bool> SendOrderShippedAsync(Order order, string? trackingNumber = null, string? carrier = null)
    {
        // Check feature flag
        if (!await IsFeatureEnabledAsync("email.orderShipped"))
        {
            _logger.LogInformation("Order shipped email is disabled by feature flag");
            return false;
        }

        var customer = await _context.Customers.FindAsync(order.CustomerId);
        if (customer == null || string.IsNullOrEmpty(customer.Email))
        {
            _logger.LogWarning("Cannot send shipped notification - customer {CustomerId} has no email", order.CustomerId);
            return false;
        }

        var result = await _emailService.SendOrderShippedAsync(
            customer.Email,
            customer.FullName,
            order.OrderNumber,
            trackingNumber);

        return result.Success;
    }

    public async Task<bool> SendOrderDeliveredAsync(Order order)
    {
        // Check feature flag
        if (!await IsFeatureEnabledAsync("email.orderDelivered"))
        {
            _logger.LogInformation("Order delivered email is disabled by feature flag");
            return false;
        }

        var customer = await _context.Customers.FindAsync(order.CustomerId);
        if (customer == null || string.IsNullOrEmpty(customer.Email))
        {
            _logger.LogWarning("Cannot send delivery confirmation - customer {CustomerId} has no email", order.CustomerId);
            return false;
        }

        var placeholders = new Dictionary<string, string>
        {
            { "CustomerName", customer.FullName },
            { "OrderNumber", order.OrderNumber },
            { "OrderTotal", $"{order.TotalAmount:N2} BAM" }
        };

        var result = await _emailService.SendTemplateEmailAsync(
            "order-delivered",
            customer.Email,
            customer.FullName,
            placeholders);

        return result.Success;
    }

    public async Task<(bool customerSent, bool companySent)> SendOrderCreatedNotificationsAsync(Order order, byte[]? pdfDocument = null)
    {
        // Check global email switch
        if (!await IsFeatureEnabledAsync("email.globalEnabled"))
        {
            _logger.LogInformation("All emails are disabled by global feature flag");
            return (false, false);
        }

        var customerSent = await SendOrderConfirmationToCustomerAsync(order, pdfDocument);
        var companySent = await SendOrderNotificationToCompanyAsync(order);

        return (customerSent, companySent);
    }

    private async Task<bool> IsFeatureEnabledAsync(string flagKey)
    {
        try
        {
            var flag = await _featureFlagRepository.GetSystemFlagByKeyAsync(flagKey);
            return flag?.IsEnabled == true && flag.Value?.ToLowerInvariant() == "true";
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error checking feature flag {FlagKey}, defaulting to enabled", flagKey);
            return true; // Default to enabled if flag check fails
        }
    }

    private static string GetStatusDisplayName(OrderStatus status)
    {
        return status switch
        {
            OrderStatus.Pending => "Pending",
            OrderStatus.Confirmed => "Confirmed",
            OrderStatus.Processing => "Processing",
            OrderStatus.ReadyForShipment => "Ready for Shipment",
            OrderStatus.Shipped => "Shipped",
            OrderStatus.Delivered => "Delivered",
            OrderStatus.Cancelled => "Cancelled",
            OrderStatus.Returned => "Returned",
            _ => status.ToString()
        };
    }
}
