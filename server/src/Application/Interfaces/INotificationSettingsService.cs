using Application.DTOs.Common;
using Application.DTOs.Notifications;

namespace Application.Interfaces;

public interface INotificationSettingsService
{
    Task<ApiResponse<List<NotificationEmailRecipientDto>>> GetOrderPlacedInternalRecipientsAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<List<NotificationEmailRecipientDto>>> UpdateOrderPlacedInternalRecipientsAsync(UpdateNotificationRecipientsDto dto, CancellationToken cancellationToken = default);
}
