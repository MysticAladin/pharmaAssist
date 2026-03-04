using Application.DTOs.SalesReps;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers;

/// <summary>
/// Rep Customers API Controller - Customer management for sales representatives
/// </summary>
[ApiController]
[Route("api/customers/rep")]
[Produces("application/json")]
[Authorize]
public class RepCustomersController : ControllerBase
{
    private readonly IRepCustomerService _repCustomerService;
    private readonly ISalesRepService _salesRepService;
    private readonly ILogger<RepCustomersController> _logger;

    public RepCustomersController(
        IRepCustomerService repCustomerService,
        ISalesRepService salesRepService,
        ILogger<RepCustomersController> logger)
    {
        _repCustomerService = repCustomerService;
        _salesRepService = salesRepService;
        _logger = logger;
    }

    private string? GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    private async Task<int?> GetRepIdAsync(CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return null;

        var rep = await _salesRepService.GetByUserIdAsync(userId, cancellationToken);
        return rep?.Id;
    }

    /// <summary>
    /// Get customers assigned to the current sales representative
    /// </summary>
    [HttpGet("my-customers")]
    [ProducesResponseType(typeof(RepCustomerResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyCustomers(
        [FromQuery] string? search,
        [FromQuery] int? customerType,
        [FromQuery] int? tier,
        [FromQuery] bool? needsVisit,
        [FromQuery] bool? hasCreditWarning,
        [FromQuery] string? city,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false,
        CancellationToken cancellationToken = default)
    {
        var repId = await GetRepIdAsync(cancellationToken);
        if (!repId.HasValue)
        {
            return Unauthorized(new { message = "Not a sales representative" });
        }

        var filter = new RepCustomerFilterDto
        {
            Search = search,
            CustomerType = customerType.HasValue ? (Domain.Enums.CustomerType)customerType.Value : null,
            Tier = tier.HasValue ? (Domain.Enums.CustomerTier)tier.Value : null,
            NeedsVisit = needsVisit,
            HasCreditWarning = hasCreditWarning,
            City = city,
            Page = page,
            PageSize = pageSize,
            SortBy = sortBy,
            SortDescending = sortDescending
        };

        var result = await _repCustomerService.GetMyCustomersAsync(repId.Value, filter, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(new { message = result.Message });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Get customer details for an assigned customer
    /// </summary>
    [HttpGet("{customerId:int}")]
    [ProducesResponseType(typeof(RepCustomerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCustomerDetails(
        int customerId,
        CancellationToken cancellationToken)
    {
        var repId = await GetRepIdAsync(cancellationToken);
        if (!repId.HasValue)
        {
            return Unauthorized(new { message = "Not a sales representative" });
        }

        var result = await _repCustomerService.GetCustomerDetailsAsync(repId.Value, customerId, cancellationToken);
        if (!result.Success)
        {
            return NotFound(new { message = result.Message });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Get credit status for an assigned customer
    /// </summary>
    [HttpGet("{customerId:int}/credit")]
    [ProducesResponseType(typeof(RepCustomerCreditDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCustomerCredit(
        int customerId,
        CancellationToken cancellationToken)
    {
        var repId = await GetRepIdAsync(cancellationToken);
        if (!repId.HasValue)
        {
            return Unauthorized(new { message = "Not a sales representative" });
        }

        var result = await _repCustomerService.GetCustomerCreditAsync(repId.Value, customerId, cancellationToken);
        if (!result.Success)
        {
            return NotFound(new { message = result.Message });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Get recent orders for an assigned customer
    /// </summary>
    [HttpGet("{customerId:int}/orders")]
    [ProducesResponseType(typeof(List<RepCustomerOrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCustomerOrders(
        int customerId,
        [FromQuery] int count = 10,
        CancellationToken cancellationToken = default)
    {
        var repId = await GetRepIdAsync(cancellationToken);
        if (!repId.HasValue)
        {
            return Unauthorized(new { message = "Not a sales representative" });
        }

        var result = await _repCustomerService.GetCustomerOrdersAsync(repId.Value, customerId, count, cancellationToken);
        if (!result.Success)
        {
            return NotFound(new { message = result.Message });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Get visit history for an assigned customer (by this rep)
    /// </summary>
    [HttpGet("{customerId:int}/visits")]
    [ProducesResponseType(typeof(List<RepCustomerVisitDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCustomerVisits(
        int customerId,
        [FromQuery] int count = 10,
        CancellationToken cancellationToken = default)
    {
        var repId = await GetRepIdAsync(cancellationToken);
        if (!repId.HasValue)
        {
            return Unauthorized(new { message = "Not a sales representative" });
        }

        var result = await _repCustomerService.GetCustomerVisitsAsync(repId.Value, customerId, count, cancellationToken);
        if (!result.Success)
        {
            return NotFound(new { message = result.Message });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Get statistics for rep's assigned customers
    /// </summary>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(RepCustomerStatsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyCustomerStats(CancellationToken cancellationToken)
    {
        var repId = await GetRepIdAsync(cancellationToken);
        if (!repId.HasValue)
        {
            return Unauthorized(new { message = "Not a sales representative" });
        }

        var result = await _repCustomerService.GetMyCustomerStatsAsync(repId.Value, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(new { message = result.Message });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Check if a customer is assigned to the current rep
    /// </summary>
    [HttpGet("{customerId:int}/is-assigned")]
    [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
    public async Task<IActionResult> IsCustomerAssigned(
        int customerId,
        CancellationToken cancellationToken)
    {
        var repId = await GetRepIdAsync(cancellationToken);
        if (!repId.HasValue)
        {
            return Unauthorized(new { message = "Not a sales representative" });
        }

        var isAssigned = await _repCustomerService.IsCustomerAssignedAsync(repId.Value, customerId, cancellationToken);
        return Ok(new { isAssigned });
    }

    /// <summary>
    /// Get photo archive for an assigned customer (images from visit attachments)
    /// </summary>
    [HttpGet("{customerId:int}/photos")]
    [ProducesResponseType(typeof(CustomerPhotoArchiveDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCustomerPhotos(
        int customerId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var repId = await GetRepIdAsync(cancellationToken);
        if (!repId.HasValue)
        {
            return Unauthorized(new { message = "Not a sales representative" });
        }

        var result = await _repCustomerService.GetCustomerPhotosAsync(repId.Value, customerId, page, pageSize, cancellationToken);
        if (!result.Success)
        {
            return NotFound(new { message = result.Message });
        }

        return Ok(result.Data);
    }
}
