namespace Application.DTOs.Notifications;

public class NotificationEmailRecipientDto
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Name { get; set; }
    public bool IsEnabled { get; set; }
}

public class UpdateNotificationRecipientsDto
{
    public List<string> Emails { get; set; } = new();
}
