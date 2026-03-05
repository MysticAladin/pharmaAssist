using Application.Common;
using Application.DTOs.Common;
using Application.DTOs.Materials;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/material-distributions")]
[Authorize]
public class MaterialDistributionsController : ControllerBase
{
    private readonly IMaterialDistributionService _service;

    public MaterialDistributionsController(IMaterialDistributionService service)
    {
        _service = service;
    }

    // ───── Distributions ─────

    [HttpGet]
    public async Task<ActionResult<PagedResult<MaterialDistributionDto>>> GetDistributions([FromQuery] DistributionFilterDto filter)
    {
        var result = await _service.GetDistributionsAsync(filter);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<MaterialDistributionDto>> GetDistribution(int id)
    {
        var distribution = await _service.GetDistributionByIdAsync(id);
        if (distribution == null) return NotFound();
        return Ok(distribution);
    }

    [HttpPost]
    public async Task<ActionResult<MaterialDistributionDto>> CreateDistribution([FromBody] CreateDistributionRequest request)
    {
        var distribution = await _service.CreateDistributionAsync(request);
        return CreatedAtAction(nameof(GetDistribution), new { id = distribution.Id }, distribution);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteDistribution(int id)
    {
        await _service.DeleteDistributionAsync(id);
        return NoContent();
    }

    // ───── Rep Inventory ─────

    [HttpGet("inventory/{repId:int}")]
    public async Task<ActionResult<List<RepInventoryDto>>> GetRepInventory(int repId)
    {
        var inventory = await _service.GetRepInventoryAsync(repId);
        return Ok(inventory);
    }

    [HttpPut("inventory")]
    public async Task<ActionResult<RepInventoryDto>> UpdateRepInventory([FromBody] UpdateRepInventoryRequest request)
    {
        var inventory = await _service.UpdateRepInventoryAsync(request);
        return Ok(inventory);
    }

    [HttpPost("inventory/{inventoryId:int}/restock")]
    public async Task<IActionResult> RestockInventory(int inventoryId, [FromBody] RestockInventoryRequest request)
    {
        await _service.RestockInventoryAsync(inventoryId, request);
        return NoContent();
    }

    [HttpDelete("inventory/{inventoryId:int}")]
    public async Task<IActionResult> DeleteRepInventory(int inventoryId)
    {
        await _service.DeleteRepInventoryAsync(inventoryId);
        return NoContent();
    }

    // ───── Reports ─────

    [HttpGet("summary")]
    public async Task<ActionResult<DistributionSummaryDto>> GetSummary([FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] int? repId)
    {
        var summary = await _service.GetDistributionSummaryAsync(from, to, repId);
        return Ok(summary);
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportDistributions([FromQuery] DistributionFilterDto filter)
    {
        var bytes = await _service.ExportDistributionsAsync(filter);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "material_distributions.xlsx");
    }
}
