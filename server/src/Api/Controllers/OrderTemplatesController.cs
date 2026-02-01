using Application.DTOs.Orders;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Controller for managing order templates (quick re-order functionality)
/// Available for both sales reps and pharmacy customers
/// </summary>
[ApiController]
[Route("api/orders/templates")]
[Authorize]
public class OrderTemplatesController : ControllerBase
{
    private readonly IOrderTemplateService _templateService;
    private readonly ISalesRepService _repService;
    private readonly ILogger<OrderTemplatesController> _logger;

    public OrderTemplatesController(
        IOrderTemplateService templateService,
        ISalesRepService repService,
        ILogger<OrderTemplatesController> logger)
    {
        _templateService = templateService;
        _repService = repService;
        _logger = logger;
    }

    /// <summary>
    /// Get templates for a specific customer
    /// </summary>
    [HttpGet("customer/{customerId}")]
    public async Task<ActionResult<List<OrderTemplateDto>>> GetTemplatesForCustomer(int customerId)
    {
        try
        {
            var repId = await GetRepIdAsync();
            var templates = await _templateService.GetTemplatesForCustomerAsync(customerId, repId);
            return Ok(templates);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting templates for customer {CustomerId}", customerId);
            return StatusCode(500, new { message = "Failed to get templates" });
        }
    }

    /// <summary>
    /// Get all templates created by the current rep
    /// </summary>
    [HttpGet("my-templates")]
    public async Task<ActionResult<List<OrderTemplateDto>>> GetMyTemplates()
    {
        try
        {
            var repId = await GetRepIdAsync();
            if (!repId.HasValue)
                return Ok(new List<OrderTemplateDto>());

            var templates = await _templateService.GetRepTemplatesAsync(repId.Value);
            return Ok(templates);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rep templates");
            return StatusCode(500, new { message = "Failed to get templates" });
        }
    }

    /// <summary>
    /// Get a specific template by ID
    /// </summary>
    [HttpGet("{templateId}")]
    public async Task<ActionResult<OrderTemplateDto>> GetTemplate(int templateId)
    {
        try
        {
            var template = await _templateService.GetTemplateByIdAsync(templateId);
            if (template == null)
                return NotFound(new { message = "Template not found" });

            return Ok(template);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting template {TemplateId}", templateId);
            return StatusCode(500, new { message = "Failed to get template" });
        }
    }

    /// <summary>
    /// Create a new order template
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<OrderTemplateDto>> CreateTemplate([FromBody] CreateOrderTemplateDto dto)
    {
        try
        {
            var repId = await GetRepIdAsync();
            var template = await _templateService.CreateTemplateAsync(dto, repId);
            return CreatedAtAction(nameof(GetTemplate), new { templateId = template.Id }, template);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating template");
            return StatusCode(500, new { message = "Failed to create template" });
        }
    }

    /// <summary>
    /// Create a template from an existing order
    /// </summary>
    [HttpPost("from-order")]
    public async Task<ActionResult<OrderTemplateDto>> CreateFromOrder([FromBody] CreateTemplateFromOrderDto dto)
    {
        try
        {
            var repId = await GetRepIdAsync();
            var template = await _templateService.CreateTemplateFromOrderAsync(dto, repId);
            return CreatedAtAction(nameof(GetTemplate), new { templateId = template.Id }, template);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating template from order {OrderId}", dto.OrderId);
            return StatusCode(500, new { message = "Failed to create template" });
        }
    }

    /// <summary>
    /// Update an existing template
    /// </summary>
    [HttpPut("{templateId}")]
    public async Task<ActionResult<OrderTemplateDto>> UpdateTemplate(int templateId, [FromBody] UpdateOrderTemplateDto dto)
    {
        try
        {
            var template = await _templateService.UpdateTemplateAsync(templateId, dto);
            return Ok(template);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating template {TemplateId}", templateId);
            return StatusCode(500, new { message = "Failed to update template" });
        }
    }

    /// <summary>
    /// Delete a template
    /// </summary>
    [HttpDelete("{templateId}")]
    public async Task<IActionResult> DeleteTemplate(int templateId)
    {
        try
        {
            var success = await _templateService.DeleteTemplateAsync(templateId);
            if (!success)
                return NotFound(new { message = "Template not found" });

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting template {TemplateId}", templateId);
            return StatusCode(500, new { message = "Failed to delete template" });
        }
    }

    /// <summary>
    /// Create an order from a template (quick re-order)
    /// </summary>
    [HttpPost("reorder")]
    public async Task<ActionResult<RepOrderSummaryDto>> CreateOrderFromTemplate([FromBody] CreateOrderFromTemplateDto dto)
    {
        try
        {
            var repId = await GetRepIdAsync();
            var order = await _templateService.CreateOrderFromTemplateAsync(dto, repId);
            return CreatedAtAction("GetOrder", "Orders", new { id = order.Id }, order);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating order from template {TemplateId}", dto.TemplateId);
            return StatusCode(500, new { message = "Failed to create order" });
        }
    }

    /// <summary>
    /// Get suggested templates based on customer's order history
    /// </summary>
    [HttpGet("suggested/{customerId}")]
    public async Task<ActionResult<List<OrderTemplateDto>>> GetSuggestedTemplates(int customerId)
    {
        try
        {
            var templates = await _templateService.GetSuggestedTemplatesAsync(customerId);
            return Ok(templates);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting suggested templates for customer {CustomerId}", customerId);
            return StatusCode(500, new { message = "Failed to get suggestions" });
        }
    }

    private async Task<int?> GetRepIdAsync()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return null;

        var rep = await _repService.GetByUserIdAsync(userId);
        return rep?.Id;
    }
}
