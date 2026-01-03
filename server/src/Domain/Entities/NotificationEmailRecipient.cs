using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Stores email recipients for system notifications.
/// </summary>
public class NotificationEmailRecipient : BaseEntity
{
    public NotificationEmailType Type { get; set; } = NotificationEmailType.OrderPlacedInternal;
    public string Email { get; set; } = string.Empty;
    public string? Name { get; set; }
    public bool IsEnabled { get; set; } = true;
}
