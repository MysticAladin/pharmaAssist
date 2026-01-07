using Application.Common;
using Application.DTOs.SalesReps;
using Application.Interfaces;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Sales Representatives API Controller
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class SalesRepsController : ControllerBase
{
    private readonly ISalesRepService _salesRepService;
    private readonly ILogger<SalesRepsController> _logger;

    public SalesRepsController(ISalesRepService salesRepService, ILogger<SalesRepsController> logger)
    {
        _salesRepService = salesRepService;
        _logger = logger;
    }

    /// <summary>
    /// Get all sales representatives with pagination and filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<SalesRepresentativeSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] SalesRepQueryDto query, CancellationToken cancellationToken)
    {
        var result = await _salesRepService.GetAllAsync(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get a sales representative by ID
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(SalesRepresentativeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _salesRepService.GetByIdAsync(id, cancellationToken);
        if (result == null)
        {
            return NotFound(new { message = "Sales representative not found" });
        }
        return Ok(result);
    }

    /// <summary>
    /// Get a sales representative by user ID
    /// </summary>
    [HttpGet("by-user/{userId}")]
    [ProducesResponseType(typeof(SalesRepresentativeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByUserId(string userId, CancellationToken cancellationToken)
    {
        var result = await _salesRepService.GetByUserIdAsync(userId, cancellationToken);
        if (result == null)
        {
            return NotFound(new { message = "Sales representative not found for this user" });
        }
        return Ok(result);
    }

    /// <summary>
    /// Create a new sales representative
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(SalesRepresentativeDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateSalesRepresentativeDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _salesRepService.CreateAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update an existing sales representative
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(SalesRepresentativeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateSalesRepresentativeDto dto, CancellationToken cancellationToken)
    {
        var result = await _salesRepService.UpdateAsync(id, dto, cancellationToken);
        if (result == null)
        {
            return NotFound(new { message = "Sales representative not found" });
        }
        return Ok(result);
    }

    /// <summary>
    /// Delete a sales representative (soft delete)
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var success = await _salesRepService.DeleteAsync(id, cancellationToken);
        if (!success)
        {
            return NotFound(new { message = "Sales representative not found" });
        }
        return NoContent();
    }

    /// <summary>
    /// Get all managers
    /// </summary>
    [HttpGet("managers")]
    [ProducesResponseType(typeof(IReadOnlyList<SalesRepresentativeSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetManagers([FromQuery] RepresentativeType? repType, CancellationToken cancellationToken)
    {
        var result = await _salesRepService.GetManagersAsync(repType, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Update manager assignments for a sales representative
    /// </summary>
    [HttpPut("{id:int}/managers")]
    [ProducesResponseType(typeof(SalesRepresentativeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateManagerAssignments(int id, [FromBody] UpdateManagerAssignmentsDto dto, CancellationToken cancellationToken)
    {
        var result = await _salesRepService.UpdateManagerAssignmentsAsync(id, dto, cancellationToken);
        if (result == null)
        {
            return NotFound(new { message = "Sales representative not found" });
        }
        return Ok(result);
    }

    /// <summary>
    /// Get customer assignments for a sales representative
    /// </summary>
    [HttpGet("{id:int}/customers")]
    [ProducesResponseType(typeof(IReadOnlyList<CustomerAssignmentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCustomerAssignments(int id, CancellationToken cancellationToken)
    {
        var result = await _salesRepService.GetCustomerAssignmentsAsync(id, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Assign customers to a sales representative
    /// </summary>
    [HttpPost("{id:int}/customers")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignCustomers(int id, [FromBody] AssignCustomersDto dto, CancellationToken cancellationToken)
    {
        var success = await _salesRepService.AssignCustomersAsync(id, dto, cancellationToken);
        if (!success)
        {
            return NotFound(new { message = "Sales representative not found" });
        }
        return NoContent();
    }

    /// <summary>
    /// Remove customer assignments from a sales representative
    /// </summary>
    [HttpDelete("{id:int}/customers")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveCustomerAssignments(int id, [FromBody] List<int> customerIds, CancellationToken cancellationToken)
    {
        var success = await _salesRepService.RemoveCustomerAssignmentsAsync(id, customerIds, cancellationToken);
        if (!success)
        {
            return NotFound(new { message = "Sales representative not found" });
        }
        return NoContent();
    }

    /// <summary>
    /// Get hierarchy view (managers and their teams)
    /// </summary>
    [HttpGet("hierarchy")]
    [ProducesResponseType(typeof(IReadOnlyList<RepHierarchyDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHierarchy([FromQuery] RepresentativeType? repType, CancellationToken cancellationToken)
    {
        var result = await _salesRepService.GetHierarchyAsync(repType, cancellationToken);
        return Ok(result);
    }
}
