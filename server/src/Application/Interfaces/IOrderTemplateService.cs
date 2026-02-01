using Application.DTOs.Orders;

namespace Application.Interfaces;

/// <summary>
/// Service for managing order templates (quick re-order)
/// </summary>
public interface IOrderTemplateService
{
    /// <summary>
    /// Get all templates for a customer (accessible by rep or customer)
    /// </summary>
    Task<List<OrderTemplateDto>> GetTemplatesForCustomerAsync(int customerId, int? repId = null);
    
    /// <summary>
    /// Get all templates created by a rep across all their customers
    /// </summary>
    Task<List<OrderTemplateDto>> GetRepTemplatesAsync(int repId);
    
    /// <summary>
    /// Get a specific template by ID
    /// </summary>
    Task<OrderTemplateDto?> GetTemplateByIdAsync(int templateId);
    
    /// <summary>
    /// Create a new order template
    /// </summary>
    Task<OrderTemplateDto> CreateTemplateAsync(CreateOrderTemplateDto dto, int? repId = null);
    
    /// <summary>
    /// Create template from an existing order
    /// </summary>
    Task<OrderTemplateDto> CreateTemplateFromOrderAsync(CreateTemplateFromOrderDto dto, int? repId = null);
    
    /// <summary>
    /// Update an existing template
    /// </summary>
    Task<OrderTemplateDto> UpdateTemplateAsync(int templateId, UpdateOrderTemplateDto dto);
    
    /// <summary>
    /// Delete (deactivate) a template
    /// </summary>
    Task<bool> DeleteTemplateAsync(int templateId);
    
    /// <summary>
    /// Create an order from a template
    /// </summary>
    Task<RepOrderSummaryDto> CreateOrderFromTemplateAsync(CreateOrderFromTemplateDto dto, int? repId = null);
    
    /// <summary>
    /// Get suggested templates based on customer's order history
    /// </summary>
    Task<List<OrderTemplateDto>> GetSuggestedTemplatesAsync(int customerId);
}
