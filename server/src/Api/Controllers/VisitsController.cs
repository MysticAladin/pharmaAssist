using Application.DTOs.Visits;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers;

/// <summary>
/// Sales Rep visit execution endpoints (mobile workflow)
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SalesRep")]
[Produces("application/json")]
public class VisitsController : ControllerBase
{
    private readonly IVisitService _visitService;
    private readonly ILogger<VisitsController> _logger;

    public VisitsController(IVisitService visitService, ILogger<VisitsController> logger)
    {
        _visitService = visitService;
        _logger = logger;
    }

    [HttpGet("today/planned")]
    [ProducesResponseType(typeof(IReadOnlyList<PlannedVisitSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTodayPlanned(CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var items = await _visitService.GetTodayPlannedAsync(userId, cancellationToken);
        return Ok(items);
    }

    [HttpGet("today/executed")]
    [ProducesResponseType(typeof(IReadOnlyList<ExecutedVisitSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTodayExecuted(CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var items = await _visitService.GetTodayExecutedAsync(userId, cancellationToken);
        return Ok(items);
    }

    [HttpGet("executed/{id:int}")]
    [ProducesResponseType(typeof(ExecutedVisitDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetExecuted(int id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var visit = await _visitService.GetExecutedVisitAsync(userId, id, cancellationToken);
        if (visit == null) return NotFound();
        return Ok(visit);
    }

    [HttpPost("check-in")]
    [ProducesResponseType(typeof(ExecutedVisitDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CheckIn([FromBody] CheckInVisitDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetUserId();
            var visit = await _visitService.CheckInAsync(userId, dto, cancellationToken);
            return CreatedAtAction(nameof(GetExecuted), new { id = visit.Id }, visit);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Check-in failed");
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("executed/{id:int}")]
    [ProducesResponseType(typeof(ExecutedVisitDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateExecuted(int id, [FromBody] UpdateExecutedVisitDto dto, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var updated = await _visitService.UpdateExecutedVisitAsync(userId, id, dto, cancellationToken);
        if (updated == null) return NotFound();
        return Ok(updated);
    }

    [HttpPost("executed/{id:int}/check-out")]
    [ProducesResponseType(typeof(ExecutedVisitDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CheckOut(int id, [FromBody] CheckOutVisitDto dto, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var updated = await _visitService.CheckOutAsync(userId, id, dto, cancellationToken);
        if (updated == null) return NotFound();
        return Ok(updated);
    }

    private string GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new UnauthorizedAccessException("User ID claim missing");
        }
        return userId;
    }
}
