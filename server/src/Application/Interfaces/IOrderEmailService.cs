using Domain.Entities;
using Domain.Enums;

namespace Application.Interfaces;

/// <summary>
/// Service for sending order-related emails
/// </summary>
public interface IOrderEmailService
{
    /// <summary>
    /// Send order confirmation email to customer with PDF attachment
    /// </summary>
    Task<bool> SendOrderConfirmationToCustomerAsync(Order order, byte[]? pdfDocument = null);
    
    /// <summary>
    /// Send new order notification to company email (orders@pharmaassist.com)
    /// </summary>
    Task<bool> SendOrderNotificationToCompanyAsync(Order order);
    
    /// <summary>
    /// Send order status update email to customer
    /// </summary>
    Task<bool> SendOrderStatusUpdateAsync(Order order, OrderStatus previousStatus);
    
    /// <summary>
    /// Send order shipped notification to customer
    /// </summary>
    Task<bool> SendOrderShippedAsync(Order order, string? trackingNumber = null, string? carrier = null);
    
    /// <summary>
    /// Send order delivered confirmation to customer
    /// </summary>
    Task<bool> SendOrderDeliveredAsync(Order order);
    
    /// <summary>
    /// Send all order created notifications (customer + company)
    /// </summary>
    Task<(bool customerSent, bool companySent)> SendOrderCreatedNotificationsAsync(Order order, byte[]? pdfDocument = null);
}
