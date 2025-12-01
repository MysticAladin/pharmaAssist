using Application.DTOs.Common;
using Application.DTOs.Manufacturers;
using Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Manufacturers API Controller
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ManufacturersController : ControllerBase
{
    private readonly IManufacturerService _manufacturerService;
    private readonly ILogger<ManufacturersController> _logger;

    public ManufacturersController(IManufacturerService manufacturerService, ILogger<ManufacturersController> logger)
    {
        _manufacturerService = manufacturerService;
        _logger = logger;
    }

    /// <summary>
    /// Get all manufacturers
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ManufacturerDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await _manufacturerService.GetAllAsync(cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get manufacturers with pagination
    /// </summary>
    [HttpGet("paged")]
    [ProducesResponseType(typeof(PagedResponse<ManufacturerDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? country = null,
        [FromQuery] bool? activeOnly = true,
        CancellationToken cancellationToken = default)
    {
        var result = await _manufacturerService.GetPagedAsync(page, pageSize, search, country, activeOnly, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get manufacturer by ID
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<ManufacturerDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<ManufacturerDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _manufacturerService.GetByIdAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get manufacturers summary list (for dropdowns)
    /// </summary>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ManufacturerSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummaryList([FromQuery] bool activeOnly = true, CancellationToken cancellationToken = default)
    {
        var result = await _manufacturerService.GetSummaryListAsync(activeOnly, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Create a new manufacturer
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<ManufacturerDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<ManufacturerDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateManufacturerDto dto, CancellationToken cancellationToken)
    {
        var result = await _manufacturerService.CreateAsync(dto, cancellationToken);
        return result.Success 
            ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result) 
            : BadRequest(result);
    }

    /// <summary>
    /// Update an existing manufacturer
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<ManufacturerDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<ManufacturerDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateManufacturerDto dto, CancellationToken cancellationToken)
    {
        var result = await _manufacturerService.UpdateAsync(id, dto, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Delete a manufacturer
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var result = await _manufacturerService.DeleteAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Activate a manufacturer
    /// </summary>
    [HttpPatch("{id:int}/activate")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Activate(int id, CancellationToken cancellationToken)
    {
        var result = await _manufacturerService.ActivateAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Deactivate a manufacturer
    /// </summary>
    [HttpPatch("{id:int}/deactivate")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Deactivate(int id, CancellationToken cancellationToken)
    {
        var result = await _manufacturerService.DeactivateAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }
}
