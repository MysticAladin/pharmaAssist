using Application.DTOs.Physicians;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class PhysiciansController : ControllerBase
{
    private readonly IPhysicianService _physicianService;
    private readonly ILogger<PhysiciansController> _logger;

    public PhysiciansController(IPhysicianService physicianService, ILogger<PhysiciansController> logger)
    {
        _physicianService = physicianService;
        _logger = logger;
    }

    [HttpGet("paged")]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int? institutionId,
        [FromQuery] int? departmentId,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var result = await _physicianService.GetPagedAsync(institutionId, departmentId, search, page, pageSize, ct);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var result = await _physicianService.GetByIdAsync(id, ct);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpGet("by-institution/{institutionId:int}")]
    public async Task<IActionResult> GetByInstitution(int institutionId, CancellationToken ct)
    {
        var result = await _physicianService.GetByInstitutionAsync(institutionId, ct);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpGet("by-department/{departmentId:int}")]
    public async Task<IActionResult> GetByDepartment(int departmentId, CancellationToken ct)
    {
        var result = await _physicianService.GetByDepartmentAsync(departmentId, ct);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePhysicianRequest request, CancellationToken ct)
    {
        var result = await _physicianService.CreateAsync(request, ct);
        return result.Success ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result) : BadRequest(result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePhysicianRequest request, CancellationToken ct)
    {
        request.Id = id;
        var result = await _physicianService.UpdateAsync(request, ct);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var result = await _physicianService.DeleteAsync(id, ct);
        return result.Success ? Ok(result) : NotFound(result);
    }
}
