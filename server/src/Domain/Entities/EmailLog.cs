namespace Domain.Entities;

/// <summary>
/// Email log entity for tracking sent emails
/// </summary>
public class EmailLog : BaseEntity
{
    public string ToEmail { get; set; } = string.Empty;
    public string? ToName { get; set; }
    public string? CcEmail { get; set; }
    public string? BccEmail { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public bool IsHtml { get; set; } = true;
    
    public EmailStatus Status { get; set; } = EmailStatus.Pending;
    public string? ErrorMessage { get; set; }
    public int RetryCount { get; set; } = 0;
    
    public DateTime? SentAt { get; set; }
    
    public EmailType EmailType { get; set; }
    public string? RelatedEntityType { get; set; }
    public int? RelatedEntityId { get; set; }
}

public enum EmailStatus
{
    Pending = 0,
    Sent = 1,
    Failed = 2,
    Retrying = 3
}

public enum EmailType
{
    Welcome = 1,
    PasswordReset = 2,
    EmailConfirmation = 3,
    OrderConfirmation = 4,
    OrderShipped = 5,
    OrderDelivered = 6,
    PrescriptionApproved = 7,
    PrescriptionRejected = 8,
    LowStockAlert = 9,
    ExpiryAlert = 10,
    InvoiceGenerated = 11,
    PaymentReceived = 12,
    AccountDeactivated = 13,
    OrderReceivedInternal = 14,
    Newsletter = 99
}
