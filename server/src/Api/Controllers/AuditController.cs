using Application.DTOs.Audit;
using Application.DTOs.Common;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Audit Log API Controller
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize(Roles = "Admin,Manager")]
public class AuditController : ControllerBase
{
    private readonly IAuditService _auditService;
    private readonly ILogger<AuditController> _logger;

    public AuditController(IAuditService auditService, ILogger<AuditController> logger)
    {
        _auditService = auditService;
        _logger = logger;
    }

    /// <summary>
    /// Get paginated audit logs with filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<AuditLogDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAuditLogs([FromQuery] AuditLogQueryDto query, CancellationToken cancellationToken)
    {
        var result = await _auditService.GetAuditLogsAsync(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get change history for a specific entity
    /// </summary>
    [HttpGet("entity/{entityName}/{entityId}")]
    [ProducesResponseType(typeof(ApiResponse<EntityHistoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEntityHistory(
        string entityName, 
        string entityId, 
        CancellationToken cancellationToken)
    {
        var result = await _auditService.GetEntityHistoryAsync(entityName, entityId, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get activity for a specific user
    /// </summary>
    [HttpGet("user/{userId}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<AuditLogDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserActivity(
        string userId, 
        [FromQuery] int count = 50, 
        CancellationToken cancellationToken = default)
    {
        var result = await _auditService.GetUserActivityAsync(userId, count, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get list of entity names that have been audited
    /// </summary>
    [HttpGet("entities")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<string>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAuditedEntityNames(CancellationToken cancellationToken)
    {
        var result = await _auditService.GetAuditedEntityNamesAsync(cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
