using Application.DTOs.Orders;
using Application.DTOs.Pricing;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers;

/// <summary>
/// Rep Orders API Controller - Order operations for sales representatives
/// </summary>
[ApiController]
[Route("api/orders/rep")]
[Produces("application/json")]
[Authorize]
public class RepOrdersController : ControllerBase
{
    private readonly IRepOrderService _service;
    private readonly IPromotionEngineService _promotionEngine;
    private readonly ILogger<RepOrdersController> _logger;

    public RepOrdersController(
        IRepOrderService service, 
        IPromotionEngineService promotionEngine,
        ILogger<RepOrdersController> logger)
    {
        _service = service;
        _promotionEngine = promotionEngine;
        _logger = logger;
    }

    /// <summary>
    /// Create an order as a sales representative
    /// </summary>
    [HttpPost("create")]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateOrder([FromBody] CreateRepOrderDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetUserId();
            var result = await _service.CreateOrderAsync(userId, dto, cancellationToken);
            
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }
            
            return CreatedAtAction(nameof(GetMyOrders), new { }, result.Data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating rep order");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get orders created by the authenticated rep
    /// </summary>
    [HttpGet("my-orders")]
    [ProducesResponseType(typeof(RepOrderResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyOrders([FromQuery] RepOrderFilterDto filter, CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetUserId();
            var result = await _service.GetMyOrdersAsync(userId, filter, cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error getting rep orders");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get order statistics for the authenticated rep
    /// </summary>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(RepOrderStatsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyStats([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate, CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetUserId();
            var result = await _service.GetMyStatsAsync(userId, fromDate, toDate, cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error getting rep order stats");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get recent orders for a specific customer
    /// </summary>
    [HttpGet("customer/{customerId:int}/recent")]
    [ProducesResponseType(typeof(IReadOnlyList<RepOrderSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCustomerRecentOrders(int customerId, [FromQuery] int count = 10, CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = GetUserId();
            var result = await _service.GetCustomerRecentOrdersAsync(userId, customerId, count, cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error getting customer recent orders");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get applicable promotions for a customer
    /// </summary>
    [HttpGet("customer/{customerId:int}/promotions")]
    [ProducesResponseType(typeof(IReadOnlyList<PromotionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCustomerPromotions(int customerId, CancellationToken cancellationToken)
    {
        try
        {
            var promotions = await _promotionEngine.GetApplicablePromotionsAsync(customerId, cancellationToken);
            return Ok(promotions);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error getting customer promotions");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Validate a promotion code for a customer
    /// </summary>
    [HttpPost("validate-promo")]
    [ProducesResponseType(typeof(PromoCodeValidationResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ValidatePromoCode([FromBody] ValidatePromoCodeRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _promotionEngine.ValidatePromoCodeAsync(
                request.PromoCode, 
                request.CustomerId, 
                request.OrderTotal, 
                cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error validating promo code");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Calculate promotions for cart items
    /// </summary>
    [HttpPost("calculate-promotions")]
    [ProducesResponseType(typeof(PromotionCalculationResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> CalculatePromotions([FromBody] CalculatePromotionsRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var items = request.Items.Select(i => new OrderItemForPromotion
            {
                ProductId = i.ProductId,
                CategoryId = i.CategoryId,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                LineTotal = i.Quantity * i.UnitPrice
            }).ToList();

            var result = await _promotionEngine.CalculatePromotionsAsync(
                request.CustomerId,
                items,
                request.PromoCode,
                cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error calculating promotions");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get active promotions for rep to present to customers
    /// </summary>
    [HttpGet("promotions")]
    [ProducesResponseType(typeof(IReadOnlyList<PromotionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActivePromotions([FromQuery] int? categoryId, CancellationToken cancellationToken)
    {
        try
        {
            var promotions = await _promotionEngine.GetActivePromotionsForRepAsync(categoryId, cancellationToken);
            return Ok(promotions);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error getting active promotions");
            return BadRequest(new { message = ex.Message });
        }
    }

    private string GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            throw new InvalidOperationException("User ID not found in claims.");
        }
        return userId;
    }
}

/// <summary>
/// Request to validate a promotion code
/// </summary>
public class ValidatePromoCodeRequest
{
    public string PromoCode { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public decimal OrderTotal { get; set; }
}

/// <summary>
/// Request to calculate promotions for cart items
/// </summary>
public class CalculatePromotionsRequest
{
    public int CustomerId { get; set; }
    public string? PromoCode { get; set; }
    public List<CalculatePromotionItem> Items { get; set; } = new();
}

/// <summary>
/// Item for promotion calculation
/// </summary>
public class CalculatePromotionItem
{
    public int ProductId { get; set; }
    public int? CategoryId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}
