using Application.DTOs.Claims;
using Application.DTOs.Common;
using Application.Interfaces;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Claims/Returns API Controller
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ClaimsController : ControllerBase
{
    private readonly IClaimService _claimService;
    private readonly ILogger<ClaimsController> _logger;

    public ClaimsController(IClaimService claimService, ILogger<ClaimsController> logger)
    {
        _claimService = claimService;
        _logger = logger;
    }

    /// <summary>
    /// Get all claims
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ClaimSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await _claimService.GetAllAsync(cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get claims with pagination
    /// </summary>
    [HttpGet("paged")]
    [ProducesResponseType(typeof(PagedResponse<ClaimSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] int? customerId = null,
        [FromQuery] ClaimStatus? status = null,
        [FromQuery] ClaimType? type = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _claimService.GetPagedAsync(page, pageSize, customerId, status, type, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get claim by ID
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<ClaimDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<ClaimDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _claimService.GetByIdAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get claim by claim number
    /// </summary>
    [HttpGet("number/{claimNumber}")]
    [ProducesResponseType(typeof(ApiResponse<ClaimDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<ClaimDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByClaimNumber(string claimNumber, CancellationToken cancellationToken)
    {
        var result = await _claimService.GetByClaimNumberAsync(claimNumber, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get claims by customer
    /// </summary>
    [HttpGet("customer/{customerId:int}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ClaimSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByCustomer(int customerId, CancellationToken cancellationToken)
    {
        var result = await _claimService.GetByCustomerAsync(customerId, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get claims by order
    /// </summary>
    [HttpGet("order/{orderId:int}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ClaimSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByOrder(int orderId, CancellationToken cancellationToken)
    {
        var result = await _claimService.GetByOrderAsync(orderId, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get claims by status
    /// </summary>
    [HttpGet("status/{status}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ClaimSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByStatus(ClaimStatus status, CancellationToken cancellationToken)
    {
        var result = await _claimService.GetByStatusAsync(status, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Create a new claim (admin/staff)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<ClaimDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<ClaimDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateClaimDto dto, CancellationToken cancellationToken)
    {
        var result = await _claimService.CreateAsync(dto, cancellationToken);
        return result.Success 
            ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result) 
            : BadRequest(result);
    }

    /// <summary>
    /// Update claim status
    /// </summary>
    [HttpPatch("{id:int}/status")]
    [ProducesResponseType(typeof(ApiResponse<ClaimDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<ClaimDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateClaimStatusDto dto, CancellationToken cancellationToken)
    {
        var result = await _claimService.UpdateStatusAsync(id, dto, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Resolve a claim
    /// </summary>
    [HttpPatch("{id:int}/resolve")]
    [ProducesResponseType(typeof(ApiResponse<ClaimDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<ClaimDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Resolve(int id, [FromBody] ResolveClaimDto dto, CancellationToken cancellationToken)
    {
        var result = await _claimService.ResolveAsync(id, dto, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Update return tracking number
    /// </summary>
    [HttpPatch("{id:int}/tracking")]
    [ProducesResponseType(typeof(ApiResponse<ClaimDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<ClaimDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateReturnTracking(int id, [FromBody] UpdateReturnTrackingDto dto, CancellationToken cancellationToken)
    {
        var result = await _claimService.UpdateReturnTrackingAsync(id, dto, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Mark return as received
    /// </summary>
    [HttpPatch("{id:int}/return-received")]
    [ProducesResponseType(typeof(ApiResponse<ClaimDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<ClaimDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkReturnReceived(int id, CancellationToken cancellationToken)
    {
        var result = await _claimService.MarkReturnReceivedAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Cancel a claim
    /// </summary>
    [HttpPatch("{id:int}/cancel")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Cancel(int id, [FromBody] string reason, CancellationToken cancellationToken)
    {
        var result = await _claimService.CancelAsync(id, reason, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }
}
