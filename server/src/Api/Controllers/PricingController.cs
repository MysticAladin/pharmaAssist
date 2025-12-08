using Application.DTOs.Pricing;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

/// <summary>
/// API endpoints for pricing, price rules, and promotions management
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PricingController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IPricingService _pricingService;
    private readonly ILogger<PricingController> _logger;

    public PricingController(
        ApplicationDbContext context,
        IPricingService pricingService,
        ILogger<PricingController> logger)
    {
        _context = context;
        _pricingService = pricingService;
        _logger = logger;
    }

    #region Price Rules

    /// <summary>
    /// Get all price rules
    /// </summary>
    [HttpGet("rules")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<IEnumerable<PriceRuleDto>>> GetPriceRules(
        [FromQuery] bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.PriceRules
            .Include(r => r.Product)
            .Include(r => r.Category)
            .Include(r => r.Manufacturer)
            .Include(r => r.Customer)
            .AsNoTracking();

        if (activeOnly == true)
        {
            query = query.Where(r => r.IsActive);
        }

        var rules = await query
            .OrderByDescending(r => r.Priority)
            .ThenByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(rules.Select(MapToDto));
    }

    /// <summary>
    /// Get a specific price rule
    /// </summary>
    [HttpGet("rules/{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<PriceRuleDto>> GetPriceRule(int id, CancellationToken cancellationToken)
    {
        var rule = await _context.PriceRules
            .Include(r => r.Product)
            .Include(r => r.Category)
            .Include(r => r.Manufacturer)
            .Include(r => r.Customer)
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (rule == null)
        {
            return NotFound();
        }

        return Ok(MapToDto(rule));
    }

    /// <summary>
    /// Create a new price rule
    /// </summary>
    [HttpPost("rules")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<PriceRuleDto>> CreatePriceRule(
        [FromBody] CreatePriceRuleDto dto,
        CancellationToken cancellationToken)
    {
        var rule = new PriceRule
        {
            Name = dto.Name,
            Description = dto.Description,
            Scope = dto.Scope,
            ProductId = dto.ProductId,
            CategoryId = dto.CategoryId,
            ManufacturerId = dto.ManufacturerId,
            CustomerTier = dto.CustomerTier,
            CustomerId = dto.CustomerId,
            CustomerType = dto.CustomerType,
            DiscountType = dto.DiscountType,
            DiscountValue = dto.DiscountValue,
            MinimumQuantity = dto.MinimumQuantity,
            MaximumQuantity = dto.MaximumQuantity,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            Priority = dto.Priority,
            IsActive = dto.IsActive
        };

        _context.PriceRules.Add(rule);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created price rule {RuleName} with ID {RuleId}", rule.Name, rule.Id);

        return CreatedAtAction(nameof(GetPriceRule), new { id = rule.Id }, MapToDto(rule));
    }

    /// <summary>
    /// Update a price rule
    /// </summary>
    [HttpPut("rules/{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<PriceRuleDto>> UpdatePriceRule(
        int id,
        [FromBody] CreatePriceRuleDto dto,
        CancellationToken cancellationToken)
    {
        var rule = await _context.PriceRules.FindAsync([id], cancellationToken);

        if (rule == null)
        {
            return NotFound();
        }

        rule.Name = dto.Name;
        rule.Description = dto.Description;
        rule.Scope = dto.Scope;
        rule.ProductId = dto.ProductId;
        rule.CategoryId = dto.CategoryId;
        rule.ManufacturerId = dto.ManufacturerId;
        rule.CustomerTier = dto.CustomerTier;
        rule.CustomerId = dto.CustomerId;
        rule.CustomerType = dto.CustomerType;
        rule.DiscountType = dto.DiscountType;
        rule.DiscountValue = dto.DiscountValue;
        rule.MinimumQuantity = dto.MinimumQuantity;
        rule.MaximumQuantity = dto.MaximumQuantity;
        rule.StartDate = dto.StartDate;
        rule.EndDate = dto.EndDate;
        rule.Priority = dto.Priority;
        rule.IsActive = dto.IsActive;

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(MapToDto(rule));
    }

    /// <summary>
    /// Delete a price rule
    /// </summary>
    [HttpDelete("rules/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeletePriceRule(int id, CancellationToken cancellationToken)
    {
        var rule = await _context.PriceRules.FindAsync([id], cancellationToken);

        if (rule == null)
        {
            return NotFound();
        }

        _context.PriceRules.Remove(rule);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    #endregion

    #region Promotions

    /// <summary>
    /// Get all promotions
    /// </summary>
    [HttpGet("promotions")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<IEnumerable<PromotionDto>>> GetPromotions(
        [FromQuery] bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Promotions
            .Include(p => p.Customer)
            .AsNoTracking();

        if (activeOnly == true)
        {
            var now = DateTime.UtcNow;
            query = query.Where(p => p.IsActive && p.StartDate <= now && p.EndDate >= now);
        }

        var promotions = await query
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(promotions.Select(MapToDto));
    }

    /// <summary>
    /// Get a specific promotion
    /// </summary>
    [HttpGet("promotions/{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<PromotionDto>> GetPromotion(int id, CancellationToken cancellationToken)
    {
        var promotion = await _context.Promotions
            .Include(p => p.Customer)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (promotion == null)
        {
            return NotFound();
        }

        return Ok(MapToDto(promotion));
    }

    /// <summary>
    /// Create a new promotion
    /// </summary>
    [HttpPost("promotions")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<PromotionDto>> CreatePromotion(
        [FromBody] CreatePromotionDto dto,
        CancellationToken cancellationToken)
    {
        // Check if code already exists
        if (await _context.Promotions.AnyAsync(p => p.Code == dto.Code, cancellationToken))
        {
            return BadRequest(new { message = "A promotion with this code already exists" });
        }

        var promotion = new Promotion
        {
            Code = dto.Code.ToUpperInvariant(),
            Name = dto.Name,
            Description = dto.Description,
            TermsAndConditions = dto.TermsAndConditions,
            Type = dto.Type,
            Value = dto.Value,
            MinimumOrderAmount = dto.MinimumOrderAmount,
            MaximumDiscountAmount = dto.MaximumDiscountAmount,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            MaxUsageCount = dto.MaxUsageCount,
            MaxUsagePerCustomer = dto.MaxUsagePerCustomer,
            AppliesToAllProducts = dto.AppliesToAllProducts,
            AppliesToAllCustomers = dto.AppliesToAllCustomers,
            RequiredCustomerTier = dto.RequiredCustomerTier,
            RequiredCustomerType = dto.RequiredCustomerType,
            CustomerId = dto.CustomerId,
            ApplyToChildCustomers = dto.ApplyToChildCustomers,
            IsActive = dto.IsActive,
            RequiresCode = dto.RequiresCode,
            CanStackWithOtherPromotions = dto.CanStackWithOtherPromotions,
            CanStackWithTierPricing = dto.CanStackWithTierPricing
        };

        _context.Promotions.Add(promotion);
        await _context.SaveChangesAsync(cancellationToken);

        // Add product associations if provided
        if (dto.ProductIds?.Any() == true)
        {
            foreach (var productId in dto.ProductIds)
            {
                _context.PromotionProducts.Add(new PromotionProduct
                {
                    PromotionId = promotion.Id,
                    ProductId = productId
                });
            }
        }

        // Add category associations if provided
        if (dto.CategoryIds?.Any() == true)
        {
            foreach (var categoryId in dto.CategoryIds)
            {
                _context.PromotionCategories.Add(new PromotionCategory
                {
                    PromotionId = promotion.Id,
                    CategoryId = categoryId
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created promotion {PromotionCode} with ID {PromotionId}", promotion.Code, promotion.Id);

        return CreatedAtAction(nameof(GetPromotion), new { id = promotion.Id }, MapToDto(promotion));
    }

    /// <summary>
    /// Update a promotion
    /// </summary>
    [HttpPut("promotions/{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<PromotionDto>> UpdatePromotion(
        int id,
        [FromBody] CreatePromotionDto dto,
        CancellationToken cancellationToken)
    {
        var promotion = await _context.Promotions.FindAsync([id], cancellationToken);

        if (promotion == null)
        {
            return NotFound();
        }

        // Check if new code conflicts with another promotion
        if (await _context.Promotions.AnyAsync(p => p.Code == dto.Code && p.Id != id, cancellationToken))
        {
            return BadRequest(new { message = "A promotion with this code already exists" });
        }

        promotion.Code = dto.Code.ToUpperInvariant();
        promotion.Name = dto.Name;
        promotion.Description = dto.Description;
        promotion.TermsAndConditions = dto.TermsAndConditions;
        promotion.Type = dto.Type;
        promotion.Value = dto.Value;
        promotion.MinimumOrderAmount = dto.MinimumOrderAmount;
        promotion.MaximumDiscountAmount = dto.MaximumDiscountAmount;
        promotion.StartDate = dto.StartDate;
        promotion.EndDate = dto.EndDate;
        promotion.MaxUsageCount = dto.MaxUsageCount;
        promotion.MaxUsagePerCustomer = dto.MaxUsagePerCustomer;
        promotion.AppliesToAllProducts = dto.AppliesToAllProducts;
        promotion.AppliesToAllCustomers = dto.AppliesToAllCustomers;
        promotion.RequiredCustomerTier = dto.RequiredCustomerTier;
        promotion.RequiredCustomerType = dto.RequiredCustomerType;
        promotion.CustomerId = dto.CustomerId;
        promotion.ApplyToChildCustomers = dto.ApplyToChildCustomers;
        promotion.IsActive = dto.IsActive;
        promotion.RequiresCode = dto.RequiresCode;
        promotion.CanStackWithOtherPromotions = dto.CanStackWithOtherPromotions;
        promotion.CanStackWithTierPricing = dto.CanStackWithTierPricing;

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(MapToDto(promotion));
    }

    /// <summary>
    /// Delete a promotion
    /// </summary>
    [HttpDelete("promotions/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeletePromotion(int id, CancellationToken cancellationToken)
    {
        var promotion = await _context.Promotions.FindAsync([id], cancellationToken);

        if (promotion == null)
        {
            return NotFound();
        }

        _context.Promotions.Remove(promotion);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    /// <summary>
    /// Get all promotions available to the current customer (including inherited from parent)
    /// </summary>
    [HttpGet("promotions/available")]
    public async Task<ActionResult<IEnumerable<PromotionDto>>> GetAvailablePromotions(
        CancellationToken cancellationToken)
    {
        var customerId = await GetCurrentCustomerIdAsync(cancellationToken);
        if (customerId == null)
        {
            return BadRequest(new { message = "No customer profile found" });
        }

        var promotions = await _pricingService.GetAvailablePromotionsAsync(customerId.Value, cancellationToken);
        return Ok(promotions.Select(MapToDto));
    }

    /// <summary>
    /// Get all promotions available to a specific customer (admin view)
    /// </summary>
    [HttpGet("promotions/available/{customerId}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<IEnumerable<PromotionDto>>> GetAvailablePromotionsForCustomer(
        int customerId,
        CancellationToken cancellationToken)
    {
        var customer = await _context.Customers.FindAsync([customerId], cancellationToken);
        if (customer == null)
        {
            return NotFound(new { message = "Customer not found" });
        }

        var promotions = await _pricingService.GetAvailablePromotionsAsync(customerId, cancellationToken);
        return Ok(promotions.Select(MapToDto));
    }

    #endregion

    #region Price Calculation

    /// <summary>
    /// Calculate price for a product for the current customer
    /// </summary>
    [HttpPost("calculate")]
    public async Task<ActionResult<PriceCalculationResultDto>> CalculatePrice(
        [FromBody] PriceCalculationRequestDto request,
        CancellationToken cancellationToken)
    {
        var customerId = await GetCurrentCustomerIdAsync(cancellationToken);
        if (customerId == null)
        {
            return BadRequest(new { message = "Customer not found for current user" });
        }

        var result = await _pricingService.CalculatePriceAsync(
            request.ProductId,
            customerId.Value,
            request.Quantity,
            request.PromotionCode,
            cancellationToken);

        return Ok(MapToDto(result));
    }

    /// <summary>
    /// Calculate prices for multiple products
    /// </summary>
    [HttpPost("calculate/batch")]
    public async Task<ActionResult<IEnumerable<PriceCalculationResultDto>>> CalculatePrices(
        [FromBody] BatchPriceCalculationRequestDto request,
        CancellationToken cancellationToken)
    {
        var customerId = await GetCurrentCustomerIdAsync(cancellationToken);
        if (customerId == null)
        {
            return BadRequest(new { message = "Customer not found for current user" });
        }

        var items = request.Items.Select(i => (i.ProductId, i.Quantity));
        var results = await _pricingService.CalculatePricesAsync(
            items,
            customerId.Value,
            request.PromotionCode,
            cancellationToken);

        return Ok(results.Select(MapToDto));
    }

    /// <summary>
    /// Validate a promotion code
    /// </summary>
    [HttpPost("promotions/validate")]
    public async Task<ActionResult<PromotionValidationResultDto>> ValidatePromotion(
        [FromBody] ValidatePromotionRequestDto request,
        CancellationToken cancellationToken)
    {
        var customerId = await GetCurrentCustomerIdAsync(cancellationToken);
        if (customerId == null)
        {
            return BadRequest(new { message = "Customer not found for current user" });
        }

        var result = await _pricingService.ValidatePromotionAsync(
            request.Code,
            customerId.Value,
            request.OrderTotal,
            cancellationToken);

        return Ok(new PromotionValidationResultDto
        {
            IsValid = result.IsValid,
            ErrorMessage = result.ErrorMessage,
            Promotion = result.Promotion != null ? MapToDto(result.Promotion) : null,
            EstimatedDiscount = result.EstimatedDiscount
        });
    }

    /// <summary>
    /// Get tier pricing information
    /// </summary>
    [HttpGet("tiers")]
    [AllowAnonymous]
    public ActionResult<IEnumerable<TierPricingInfoDto>> GetTierPricing()
    {
        var tiers = new[]
        {
            new TierPricingInfoDto
            {
                Tier = CustomerTier.A,
                TierName = "Premium (A)",
                DiscountPercentage = _pricingService.GetTierDiscountPercentage(CustomerTier.A),
                Description = "Monthly purchases > 10,000 KM"
            },
            new TierPricingInfoDto
            {
                Tier = CustomerTier.B,
                TierName = "Standard (B)",
                DiscountPercentage = _pricingService.GetTierDiscountPercentage(CustomerTier.B),
                Description = "Monthly purchases 5,000-10,000 KM"
            },
            new TierPricingInfoDto
            {
                Tier = CustomerTier.C,
                TierName = "Basic (C)",
                DiscountPercentage = _pricingService.GetTierDiscountPercentage(CustomerTier.C),
                Description = "Monthly purchases < 5,000 KM"
            }
        };

        return Ok(tiers);
    }

    #endregion

    #region Helpers

    private async Task<int?> GetCurrentCustomerIdAsync(CancellationToken cancellationToken)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return null;
        }

        var customer = await _context.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken);

        return customer?.Id;
    }

    private static PriceRuleDto MapToDto(PriceRule rule) => new()
    {
        Id = rule.Id,
        Name = rule.Name,
        Description = rule.Description,
        Scope = rule.Scope,
        ProductId = rule.ProductId,
        ProductName = rule.Product?.Name,
        CategoryId = rule.CategoryId,
        CategoryName = rule.Category?.Name,
        ManufacturerId = rule.ManufacturerId,
        ManufacturerName = rule.Manufacturer?.Name,
        CustomerTier = rule.CustomerTier,
        CustomerId = rule.CustomerId,
        CustomerName = rule.Customer?.FullName,
        CustomerType = rule.CustomerType,
        DiscountType = rule.DiscountType,
        DiscountValue = rule.DiscountValue,
        MinimumQuantity = rule.MinimumQuantity,
        MaximumQuantity = rule.MaximumQuantity,
        StartDate = rule.StartDate,
        EndDate = rule.EndDate,
        Priority = rule.Priority,
        IsActive = rule.IsActive,
        IsValid = rule.IsValid,
        CreatedAt = rule.CreatedAt
    };

    private static PromotionDto MapToDto(Promotion promotion) => new()
    {
        Id = promotion.Id,
        Code = promotion.Code,
        Name = promotion.Name,
        Description = promotion.Description,
        TermsAndConditions = promotion.TermsAndConditions,
        Type = promotion.Type,
        TypeName = GetPromotionTypeName(promotion.Type),
        Value = promotion.Value,
        MinimumOrderAmount = promotion.MinimumOrderAmount,
        MaximumDiscountAmount = promotion.MaximumDiscountAmount,
        StartDate = promotion.StartDate,
        EndDate = promotion.EndDate,
        MaxUsageCount = promotion.MaxUsageCount,
        MaxUsagePerCustomer = promotion.MaxUsagePerCustomer,
        CurrentUsageCount = promotion.CurrentUsageCount,
        AppliesToAllProducts = promotion.AppliesToAllProducts,
        AppliesToAllCustomers = promotion.AppliesToAllCustomers,
        RequiredCustomerTier = promotion.RequiredCustomerTier,
        RequiredCustomerType = promotion.RequiredCustomerType,
        CustomerId = promotion.CustomerId,
        CustomerName = promotion.Customer?.FullName,
        ApplyToChildCustomers = promotion.ApplyToChildCustomers,
        IsActive = promotion.IsActive,
        RequiresCode = promotion.RequiresCode,
        CanStackWithOtherPromotions = promotion.CanStackWithOtherPromotions,
        CanStackWithTierPricing = promotion.CanStackWithTierPricing,
        IsValid = promotion.IsValid,
        HasReachedLimit = promotion.HasReachedLimit,
        CreatedAt = promotion.CreatedAt
    };

    private static PriceCalculationResultDto MapToDto(PriceCalculationResult result) => new()
    {
        ProductId = result.ProductId,
        ProductName = result.ProductName,
        Quantity = result.Quantity,
        BasePrice = result.BasePrice,
        TierDiscountPercent = result.TierDiscountPercent,
        TierDiscountAmount = result.TierDiscountAmount,
        RuleDiscountPercent = result.RuleDiscountPercent,
        RuleDiscountAmount = result.RuleDiscountAmount,
        PromotionDiscountPercent = result.PromotionDiscountPercent,
        PromotionDiscountAmount = result.PromotionDiscountAmount,
        FinalUnitPrice = result.FinalUnitPrice,
        LineTotal = result.LineTotal,
        TotalDiscount = result.TotalDiscount,
        TotalDiscountPercent = result.TotalDiscountPercent,
        AppliedRuleName = result.AppliedRuleName,
        AppliedPromotionCode = result.AppliedPromotionCode
    };

    private static string GetPromotionTypeName(PromotionType type) => type switch
    {
        PromotionType.PercentageDiscount => "Percentage Discount",
        PromotionType.FixedAmountDiscount => "Fixed Amount Discount",
        PromotionType.FreeShipping => "Free Shipping",
        PromotionType.BuyOneGetOne => "Buy One Get One",
        PromotionType.BuyXGetYFree => "Buy X Get Y Free",
        PromotionType.GiftWithPurchase => "Gift With Purchase",
        PromotionType.BundleDiscount => "Bundle Discount",
        _ => type.ToString()
    };

    #endregion
}
