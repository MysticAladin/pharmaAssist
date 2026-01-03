using Application.DTOs.Common;
using Application.DTOs.Notifications;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;

namespace Application.Services;

public class NotificationSettingsService : INotificationSettingsService
{
    private readonly IUnitOfWork _unitOfWork;

    public NotificationSettingsService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<List<NotificationEmailRecipientDto>>> GetOrderPlacedInternalRecipientsAsync(CancellationToken cancellationToken = default)
    {
        var recipients = await _unitOfWork.NotificationEmailRecipients.FindAsync(
            r => r.Type == NotificationEmailType.OrderPlacedInternal,
            cancellationToken);

        var result = recipients
            .OrderBy(r => r.Email)
            .Select(r => new NotificationEmailRecipientDto
            {
                Id = r.Id,
                Email = r.Email,
                Name = r.Name,
                IsEnabled = r.IsEnabled
            })
            .ToList();

        return ApiResponse<List<NotificationEmailRecipientDto>>.Ok(result);
    }

    public async Task<ApiResponse<List<NotificationEmailRecipientDto>>> UpdateOrderPlacedInternalRecipientsAsync(UpdateNotificationRecipientsDto dto, CancellationToken cancellationToken = default)
    {
        var existing = await _unitOfWork.NotificationEmailRecipients.FindAsync(
            r => r.Type == NotificationEmailType.OrderPlacedInternal,
            cancellationToken);

        if (existing.Count > 0)
        {
            await _unitOfWork.NotificationEmailRecipients.DeleteRangeAsync(existing, cancellationToken);
        }

        var normalized = (dto.Emails ?? new List<string>())
            .Select(e => (e ?? string.Empty).Trim())
            .Where(e => !string.IsNullOrWhiteSpace(e))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var newEntities = normalized.Select(email => new NotificationEmailRecipient
        {
            Type = NotificationEmailType.OrderPlacedInternal,
            Email = email,
            IsEnabled = true
        });

        await _unitOfWork.NotificationEmailRecipients.AddRangeAsync(newEntities, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _unitOfWork.NotificationEmailRecipients.FindAsync(
            r => r.Type == NotificationEmailType.OrderPlacedInternal,
            cancellationToken);

        var result = updated
            .OrderBy(r => r.Email)
            .Select(r => new NotificationEmailRecipientDto
            {
                Id = r.Id,
                Email = r.Email,
                Name = r.Name,
                IsEnabled = r.IsEnabled
            })
            .ToList();

        return ApiResponse<List<NotificationEmailRecipientDto>>.Ok(result, "Notification recipients updated.");
    }
}
