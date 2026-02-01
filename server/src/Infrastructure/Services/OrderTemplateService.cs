using System.Text.Json;
using Application.DTOs.Orders;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

/// <summary>
/// Service for managing order templates (quick re-order)
/// </summary>
public class OrderTemplateService : IOrderTemplateService
{
    private readonly ApplicationDbContext _context;
    private static readonly JsonSerializerOptions JsonOptions = new() 
    { 
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
    };

    public OrderTemplateService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<OrderTemplateDto>> GetTemplatesForCustomerAsync(int customerId, int? repId = null)
    {
        var query = _context.Set<OrderTemplate>()
            .Include(t => t.Customer)
            .Where(t => t.CustomerId == customerId && t.IsActive && !t.IsDeleted);

        // If repId is specified, only show templates created by that rep or customer-created ones
        if (repId.HasValue)
        {
            query = query.Where(t => t.RepId == repId || t.RepId == null);
        }

        var templates = await query
            .OrderByDescending(t => t.LastUsedAt ?? t.CreatedAt)
            .ToListAsync();

        return await MapToTemplatesDto(templates);
    }

    public async Task<List<OrderTemplateDto>> GetRepTemplatesAsync(int repId)
    {
        var templates = await _context.Set<OrderTemplate>()
            .Include(t => t.Customer)
            .Where(t => t.RepId == repId && t.IsActive && !t.IsDeleted)
            .OrderByDescending(t => t.LastUsedAt ?? t.CreatedAt)
            .ToListAsync();

        return await MapToTemplatesDto(templates);
    }

    public async Task<OrderTemplateDto?> GetTemplateByIdAsync(int templateId)
    {
        var template = await _context.Set<OrderTemplate>()
            .Include(t => t.Customer)
            .FirstOrDefaultAsync(t => t.Id == templateId && t.IsActive && !t.IsDeleted);

        if (template == null) return null;

        var result = await MapToTemplatesDto(new List<OrderTemplate> { template });
        return result.FirstOrDefault();
    }

    public async Task<OrderTemplateDto> CreateTemplateAsync(CreateOrderTemplateDto dto, int? repId = null)
    {
        // Validate customer exists
        var customer = await _context.Customers.FindAsync(dto.CustomerId);
        if (customer == null)
            throw new ArgumentException("Customer not found");

        // Validate products exist and get prices
        var productIds = dto.Items.Select(i => i.ProductId).ToList();
        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        var items = dto.Items.Select(i => new TemplateItemJson
        {
            ProductId = i.ProductId,
            Quantity = i.Quantity,
            UnitPrice = i.UnitPrice ?? products.GetValueOrDefault(i.ProductId)?.UnitPrice ?? 0
        }).ToList();

        var template = new OrderTemplate
        {
            RepId = repId,
            CustomerId = dto.CustomerId,
            TemplateName = dto.TemplateName,
            Description = dto.Description,
            ItemsJson = JsonSerializer.Serialize(items, JsonOptions),
            IsActive = true
        };

        _context.Set<OrderTemplate>().Add(template);
        await _context.SaveChangesAsync();

        return (await GetTemplateByIdAsync(template.Id))!;
    }

    public async Task<OrderTemplateDto> CreateTemplateFromOrderAsync(CreateTemplateFromOrderDto dto, int? repId = null)
    {
        var order = await _context.Orders
            .Include(o => o.OrderItems)
            .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(o => o.Id == dto.OrderId);

        if (order == null)
            throw new ArgumentException("Order not found");

        var items = order.OrderItems.Select(i => new TemplateItemJson
        {
            ProductId = i.ProductId,
            Quantity = i.Quantity,
            UnitPrice = i.UnitPrice
        }).ToList();

        var template = new OrderTemplate
        {
            RepId = repId,
            CustomerId = order.CustomerId,
            TemplateName = dto.TemplateName,
            Description = dto.Description ?? $"Created from order #{order.OrderNumber}",
            ItemsJson = JsonSerializer.Serialize(items, JsonOptions),
            IsActive = true
        };

        _context.Set<OrderTemplate>().Add(template);
        await _context.SaveChangesAsync();

        return (await GetTemplateByIdAsync(template.Id))!;
    }

    public async Task<OrderTemplateDto> UpdateTemplateAsync(int templateId, UpdateOrderTemplateDto dto)
    {
        var template = await _context.Set<OrderTemplate>()
            .FirstOrDefaultAsync(t => t.Id == templateId && t.IsActive && !t.IsDeleted);

        if (template == null)
            throw new ArgumentException("Template not found");

        // Get product prices
        var productIds = dto.Items.Select(i => i.ProductId).ToList();
        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        var items = dto.Items.Select(i => new TemplateItemJson
        {
            ProductId = i.ProductId,
            Quantity = i.Quantity,
            UnitPrice = i.UnitPrice ?? products.GetValueOrDefault(i.ProductId)?.UnitPrice ?? 0
        }).ToList();

        template.TemplateName = dto.TemplateName;
        template.Description = dto.Description;
        template.ItemsJson = JsonSerializer.Serialize(items, JsonOptions);
        template.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return (await GetTemplateByIdAsync(template.Id))!;
    }

    public async Task<bool> DeleteTemplateAsync(int templateId)
    {
        var template = await _context.Set<OrderTemplate>()
            .FirstOrDefaultAsync(t => t.Id == templateId && !t.IsDeleted);

        if (template == null) return false;

        template.IsActive = false;
        template.IsDeleted = true;
        template.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<RepOrderSummaryDto> CreateOrderFromTemplateAsync(CreateOrderFromTemplateDto dto, int? repId = null)
    {
        var template = await _context.Set<OrderTemplate>()
            .Include(t => t.Customer)
            .FirstOrDefaultAsync(t => t.Id == dto.TemplateId && t.IsActive && !t.IsDeleted);

        if (template == null)
            throw new ArgumentException("Template not found");

        var items = JsonSerializer.Deserialize<List<TemplateItemJson>>(template.ItemsJson, JsonOptions) ?? new();

        // Get current product info (prices, stock)
        var productIds = items.Select(i => i.ProductId).ToList();
        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id) && p.IsActive && !p.IsDeleted)
            .ToDictionaryAsync(p => p.Id);

        // Get stock info
        var stockInfo = await _context.InventoryStocks
            .Where(ws => productIds.Contains(ws.ProductId))
            .GroupBy(ws => ws.ProductId)
            .Select(g => new { ProductId = g.Key, TotalStock = g.Sum(ws => ws.QuantityOnHand) })
            .ToDictionaryAsync(x => x.ProductId, x => x.TotalStock);

        // Generate order number
        var today = DateTime.UtcNow;
        var orderCount = await _context.Orders
            .CountAsync(o => o.OrderDate.Date == today.Date) + 1;
        var orderNumber = $"ORD-{today:yyyyMMdd}-{orderCount:D4}";

        // Create order items
        var orderItems = new List<OrderItem>();
        decimal subTotal = 0;

        foreach (var item in items)
        {
            if (!products.TryGetValue(item.ProductId, out var product))
                continue; // Skip unavailable products

            var quantity = dto.QuantityOverrides?.GetValueOrDefault(item.ProductId, item.Quantity) ?? item.Quantity;
            var stock = stockInfo.GetValueOrDefault(item.ProductId, 0);
            
            // Limit to available stock
            quantity = Math.Min(quantity, stock);
            if (quantity <= 0) continue;

            var unitPrice = product.UnitPrice;
            var lineTotal = quantity * unitPrice;

            orderItems.Add(new OrderItem
            {
                ProductId = item.ProductId,
                Quantity = quantity,
                UnitPrice = unitPrice,
                DiscountPercent = 0,
                LineTotal = lineTotal
            });

            subTotal += lineTotal;
        }

        if (!orderItems.Any())
            throw new InvalidOperationException("No items available for order");

        var order = new Order
        {
            OrderNumber = orderNumber,
            CustomerId = template.CustomerId,
            RepId = repId,
            VisitId = dto.VisitId,
            CreatedViaApp = repId.HasValue,
            OrderDate = DateTime.UtcNow,
            Status = OrderStatus.Pending,
            PaymentStatus = PaymentStatus.Pending,
            SubTotal = subTotal,
            TaxAmount = subTotal * 0.17m, // 17% VAT
            ShippingAmount = 0,
            DiscountAmount = 0,
            TotalAmount = subTotal * 1.17m,
            Notes = dto.Notes,
            OrderItems = orderItems
        };

        _context.Orders.Add(order);

        // Update template usage
        template.LastUsedAt = DateTime.UtcNow;
        template.UsageCount++;

        await _context.SaveChangesAsync();

        return new RepOrderSummaryDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            CustomerId = order.CustomerId,
            CustomerName = template.Customer.FullName,
            OrderDate = order.OrderDate,
            Status = order.Status,
            StatusName = order.Status.ToString(),
            PaymentStatus = order.PaymentStatus,
            PaymentStatusName = order.PaymentStatus.ToString(),
            TotalAmount = order.TotalAmount,
            ItemCount = order.OrderItems.Count,
            VisitId = order.VisitId,
            CreatedViaApp = order.CreatedViaApp
        };
    }

    public async Task<List<OrderTemplateDto>> GetSuggestedTemplatesAsync(int customerId)
    {
        // Get customer's most frequently ordered product combinations
        var recentOrders = await _context.Orders
            .Include(o => o.OrderItems)
            .ThenInclude(i => i.Product)
            .Where(o => o.CustomerId == customerId && !o.IsDeleted)
            .OrderByDescending(o => o.OrderDate)
            .Take(10)
            .ToListAsync();

        if (!recentOrders.Any())
            return new List<OrderTemplateDto>();

        // Find most common products
        var productFrequency = recentOrders
            .SelectMany(o => o.OrderItems)
            .GroupBy(i => i.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                Product = g.First().Product,
                AverageQuantity = (int)Math.Ceiling(g.Average(i => i.Quantity)),
                Frequency = g.Count()
            })
            .OrderByDescending(x => x.Frequency)
            .Take(10)
            .ToList();

        if (!productFrequency.Any())
            return new List<OrderTemplateDto>();

        // Create a suggested template
        var customer = await _context.Customers.FindAsync(customerId);
        
        return new List<OrderTemplateDto>
        {
            new OrderTemplateDto
            {
                Id = 0, // Virtual template
                CustomerId = customerId,
                CustomerName = customer?.FullName ?? "Customer",
                TemplateName = "Frequently Ordered Items",
                Description = "Based on your recent order history",
                IsAutoGenerated = true,
                Items = productFrequency.Select(p => new OrderTemplateItemDto
                {
                    ProductId = p.ProductId,
                    ProductName = p.Product?.Name ?? "Unknown",
                    ProductSku = p.Product?.SKU,
                    Quantity = p.AverageQuantity,
                    UnitPrice = p.Product?.UnitPrice ?? 0,
                    IsAvailable = p.Product?.IsActive ?? false
                }).ToList(),
                ItemCount = productFrequency.Count,
                EstimatedTotal = productFrequency.Sum(p => p.AverageQuantity * (p.Product?.UnitPrice ?? 0))
            }
        };
    }

    private async Task<List<OrderTemplateDto>> MapToTemplatesDto(List<OrderTemplate> templates)
    {
        if (!templates.Any())
            return new List<OrderTemplateDto>();

        // Get all product IDs from all templates
        var allProductIds = templates
            .SelectMany(t => 
            {
                var items = JsonSerializer.Deserialize<List<TemplateItemJson>>(t.ItemsJson, JsonOptions);
                return items?.Select(i => i.ProductId) ?? Enumerable.Empty<int>();
            })
            .Distinct()
            .ToList();

        // Get product info
        var products = await _context.Products
            .Where(p => allProductIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        // Get stock info
        var stockInfo = await _context.InventoryStocks
            .Where(ws => allProductIds.Contains(ws.ProductId))
            .GroupBy(ws => ws.ProductId)
            .Select(g => new { ProductId = g.Key, TotalStock = g.Sum(ws => ws.QuantityOnHand) })
            .ToDictionaryAsync(x => x.ProductId, x => x.TotalStock);

        return templates.Select(t =>
        {
            var items = JsonSerializer.Deserialize<List<TemplateItemJson>>(t.ItemsJson, JsonOptions) ?? new();
            
            var itemDtos = items.Select(i =>
            {
                var product = products.GetValueOrDefault(i.ProductId);
                var stock = stockInfo.GetValueOrDefault(i.ProductId, 0);
                
                return new OrderTemplateItemDto
                {
                    ProductId = i.ProductId,
                    ProductName = product?.Name ?? "Unknown Product",
                    ProductSku = product?.SKU,
                    Quantity = i.Quantity,
                    UnitPrice = product?.UnitPrice ?? i.UnitPrice,
                    IsAvailable = product?.IsActive ?? false,
                    CurrentStock = stock
                };
            }).ToList();

            return new OrderTemplateDto
            {
                Id = t.Id,
                RepId = t.RepId,
                CustomerId = t.CustomerId,
                CustomerName = t.Customer?.FullName ?? "Unknown",
                TemplateName = t.TemplateName,
                Description = t.Description,
                Items = itemDtos,
                ItemCount = itemDtos.Count,
                EstimatedTotal = itemDtos.Sum(i => i.LineTotal),
                LastUsedAt = t.LastUsedAt,
                UsageCount = t.UsageCount,
                IsAutoGenerated = t.IsAutoGenerated,
                CreatedAt = t.CreatedAt
            };
        }).ToList();
    }

    // Helper class for JSON serialization
    private class TemplateItemJson
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }
}
