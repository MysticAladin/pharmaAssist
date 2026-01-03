using Application.DTOs.Common;
using Application.DTOs.Notifications;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class NotificationSettingsController : ControllerBase
{
    private readonly INotificationSettingsService _notificationSettingsService;

    public NotificationSettingsController(INotificationSettingsService notificationSettingsService)
    {
        _notificationSettingsService = notificationSettingsService;
    }

    [HttpGet("order-placed-internal-recipients")]
    [ProducesResponseType(typeof(ApiResponse<List<NotificationEmailRecipientDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOrderPlacedInternalRecipients(CancellationToken cancellationToken)
    {
        var result = await _notificationSettingsService.GetOrderPlacedInternalRecipientsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPut("order-placed-internal-recipients")]
    [ProducesResponseType(typeof(ApiResponse<List<NotificationEmailRecipientDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<List<NotificationEmailRecipientDto>>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateOrderPlacedInternalRecipients([FromBody] UpdateNotificationRecipientsDto dto, CancellationToken cancellationToken)
    {
        var result = await _notificationSettingsService.UpdateOrderPlacedInternalRecipientsAsync(dto, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
