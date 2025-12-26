using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

/// <summary>
/// Service for calculating prices based on customer tiers, price rules, and promotions
/// </summary>
public class PricingService : IPricingService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PricingService> _logger;

    // Default tier discount percentages
    private static readonly Dictionary<CustomerTier, decimal> TierDiscounts = new()
    {
        { CustomerTier.A, 15m },  // Premium: 15% discount
        { CustomerTier.B, 10m },  // Standard: 10% discount
        { CustomerTier.C, 5m }    // Basic: 5% discount
    };

    public PricingService(ApplicationDbContext context, ILogger<PricingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public decimal GetTierDiscountPercentage(CustomerTier tier)
    {
        return TierDiscounts.GetValueOrDefault(tier, 0m);
    }

    public async Task<PriceCalculationResult> CalculatePriceAsync(
        int productId,
        int customerId,
        decimal quantity = 1,
        string? promotionCode = null,
        PriceType priceType = PriceType.Commercial,
        int? cantonId = null,
        CancellationToken cancellationToken = default)
    {
        var product = await _context.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == productId, cancellationToken);

        if (product == null)
        {
            throw new ArgumentException($"Product with ID {productId} not found");
        }

        var customer = await _context.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == customerId, cancellationToken);

        if (customer == null)
        {
            throw new ArgumentException($"Customer with ID {customerId} not found");
        }

        var resolvedCantonId = await ResolveCustomerCantonIdAsync(customerId, cantonId, cancellationToken);
        var baseUnitPrice = await ResolveBaseUnitPriceAsync(productId, customerId, priceType, resolvedCantonId, cancellationToken)
            ?? product.UnitPrice;

        var result = new PriceCalculationResult
        {
            ProductId = productId,
            ProductName = product.Name,
            Quantity = quantity,
            BasePrice = baseUnitPrice
        };

        decimal currentPrice = baseUnitPrice;

        // 1. Apply tier-based discount
        var tierDiscount = GetTierDiscountPercentage(customer.Tier);
        result.TierDiscountPercent = tierDiscount;
        result.TierDiscountAmount = currentPrice * (tierDiscount / 100m);
        currentPrice -= result.TierDiscountAmount;

        // 2. Find and apply best price rule
        var applicableRule = await GetBestPriceRuleAsync(product, customer, quantity, cancellationToken);
        if (applicableRule != null)
        {
            var ruleDiscount = CalculateRuleDiscount(applicableRule, currentPrice, quantity);
            result.RuleDiscountPercent = applicableRule.DiscountType == DiscountType.Percentage 
                ? applicableRule.DiscountValue 
                : (currentPrice > 0 ? (ruleDiscount / currentPrice) * 100m : 0m);
            result.RuleDiscountAmount = ruleDiscount;
            result.AppliedRuleName = applicableRule.Name;
            currentPrice -= ruleDiscount;
        }

        // 3. Apply promotion if provided
        if (!string.IsNullOrEmpty(promotionCode))
        {
            var validation = await ValidatePromotionAsync(promotionCode, customerId, currentPrice * quantity, cancellationToken);
            if (validation.IsValid && validation.Promotion != null)
            {
                // Check if promotion can stack with tier pricing
                if (validation.Promotion.CanStackWithTierPricing || result.TierDiscountAmount == 0)
                {
                    var promoDiscount = CalculatePromotionDiscount(validation.Promotion, currentPrice, quantity);
                    result.PromotionDiscountPercent = validation.Promotion.Type == PromotionType.PercentageDiscount
                        ? validation.Promotion.Value
                        : (currentPrice > 0 ? (promoDiscount / currentPrice) * 100m : 0m);
                    result.PromotionDiscountAmount = promoDiscount;
                    result.AppliedPromotionCode = promotionCode;
                    currentPrice -= promoDiscount;
                }
            }
        }

        result.FinalUnitPrice = Math.Max(0, currentPrice);
        result.LineTotal = result.FinalUnitPrice * quantity;
        result.TotalDiscountPercent = result.BasePrice > 0 
            ? ((result.BasePrice - result.FinalUnitPrice) / result.BasePrice) * 100m 
            : 0m;

        return result;
    }

    public async Task<IEnumerable<PriceCalculationResult>> CalculatePricesAsync(
        IEnumerable<IPricingService.PriceCalculationItem> items,
        int customerId,
        string? promotionCode = null,
        CancellationToken cancellationToken = default)
    {
        var results = new List<PriceCalculationResult>();
        
        foreach (var item in items)
        {
            var result = await CalculatePriceAsync(
                item.ProductId,
                customerId,
                item.Quantity,
                promotionCode,
                item.PriceType,
                item.CantonId,
                cancellationToken);
            results.Add(result);
        }

        return results;
    }

    private async Task<int?> ResolveCustomerCantonIdAsync(
        int customerId,
        int? requestCantonId,
        CancellationToken cancellationToken)
    {
        if (requestCantonId.HasValue)
        {
            return requestCantonId;
        }

        return await _context.CustomerAddresses
            .AsNoTracking()
            .Where(a => a.CustomerId == customerId && a.IsActive)
            .Where(a => a.CantonId.HasValue)
            .OrderByDescending(a => a.IsDefault)
            .ThenByDescending(a => a.AddressType == AddressType.Shipping)
            .ThenByDescending(a => a.Id)
            .Select(a => a.CantonId)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private async Task<decimal?> ResolveBaseUnitPriceAsync(
        int productId,
        int customerId,
        PriceType priceType,
        int? cantonId,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        var query = _context.ProductPrices
            .AsNoTracking()
            .Where(p => p.ProductId == productId)
            .Where(p => p.IsActive)
            .Where(p => p.PriceType == priceType)
            .Where(p => p.ValidFrom <= now)
            .Where(p => !p.ValidTo.HasValue || p.ValidTo >= now)
            .Where(p => !p.CustomerId.HasValue || p.CustomerId == customerId)
            .Where(p => !p.CantonId.HasValue || (cantonId.HasValue && p.CantonId == cantonId));

        var best = await query
            .OrderByDescending(p => p.CustomerId.HasValue)
            .ThenByDescending(p => p.CantonId.HasValue)
            .ThenByDescending(p => p.Priority)
            .ThenByDescending(p => p.ValidFrom)
            .ThenByDescending(p => p.Id)
            .FirstOrDefaultAsync(cancellationToken);

        return best?.UnitPrice;
    }

    public async Task<IEnumerable<PriceRule>> GetApplicableRulesAsync(
        int customerId,
        CancellationToken cancellationToken = default)
    {
        var customer = await _context.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == customerId, cancellationToken);

        if (customer == null)
        {
            return Enumerable.Empty<PriceRule>();
        }

        var now = DateTime.UtcNow;

        return await _context.PriceRules
            .AsNoTracking()
            .Where(r => r.IsActive)
            .Where(r => !r.StartDate.HasValue || r.StartDate <= now)
            .Where(r => !r.EndDate.HasValue || r.EndDate >= now)
            .Where(r => !r.CustomerTier.HasValue || r.CustomerTier == customer.Tier)
            .Where(r => !r.CustomerType.HasValue || r.CustomerType == customer.CustomerType)
            .Where(r => !r.CustomerId.HasValue || r.CustomerId == customerId)
            .OrderByDescending(r => r.Priority)
            .ToListAsync(cancellationToken);
    }

    public async Task<PromotionValidationResult> ValidatePromotionAsync(
        string code,
        int customerId,
        decimal orderTotal,
        CancellationToken cancellationToken = default)
    {
        var promotion = await _context.Promotions
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Code == code, cancellationToken);

        if (promotion == null)
        {
            return new PromotionValidationResult
            {
                IsValid = false,
                ErrorMessage = "Promotion code not found"
            };
        }

        // Check if promotion is active
        if (!promotion.IsActive)
        {
            return new PromotionValidationResult
            {
                IsValid = false,
                ErrorMessage = "This promotion is no longer active"
            };
        }

        // Check dates
        var now = DateTime.UtcNow;
        if (promotion.StartDate > now)
        {
            return new PromotionValidationResult
            {
                IsValid = false,
                ErrorMessage = "This promotion has not started yet"
            };
        }

        if (promotion.EndDate < now)
        {
            return new PromotionValidationResult
            {
                IsValid = false,
                ErrorMessage = "This promotion has expired"
            };
        }

        // Check usage limits
        if (promotion.HasReachedLimit)
        {
            return new PromotionValidationResult
            {
                IsValid = false,
                ErrorMessage = "This promotion has reached its usage limit"
            };
        }

        // Check per-customer limit
        if (promotion.MaxUsagePerCustomer.HasValue)
        {
            var customerUsageCount = await _context.PromotionUsages
                .CountAsync(u => u.PromotionId == promotion.Id && u.CustomerId == customerId, cancellationToken);

            if (customerUsageCount >= promotion.MaxUsagePerCustomer.Value)
            {
                return new PromotionValidationResult
                {
                    IsValid = false,
                    ErrorMessage = "You have already used this promotion the maximum number of times"
                };
            }
        }

        // Check minimum order amount
        if (promotion.MinimumOrderAmount.HasValue && orderTotal < promotion.MinimumOrderAmount.Value)
        {
            return new PromotionValidationResult
            {
                IsValid = false,
                ErrorMessage = $"Minimum order amount of {promotion.MinimumOrderAmount:N2} KM required"
            };
        }

        // Check customer requirements
        var customer = await _context.Customers
            .AsNoTracking()
            .Include(c => c.ParentCustomer)
            .FirstOrDefaultAsync(c => c.Id == customerId, cancellationToken);

        if (customer != null)
        {
            // Check customer-specific promotion targeting
            if (promotion.CustomerId.HasValue)
            {
                var isDirectMatch = promotion.CustomerId == customerId;
                var isChildMatch = promotion.ApplyToChildCustomers && 
                                   customer.ParentCustomerId.HasValue && 
                                   customer.ParentCustomerId == promotion.CustomerId;
                
                if (!isDirectMatch && !isChildMatch)
                {
                    return new PromotionValidationResult
                    {
                        IsValid = false,
                        ErrorMessage = "This promotion is not available for your account"
                    };
                }
            }
            
            if (promotion.RequiredCustomerTier.HasValue && customer.Tier != promotion.RequiredCustomerTier.Value)
            {
                return new PromotionValidationResult
                {
                    IsValid = false,
                    ErrorMessage = "This promotion is not available for your customer tier"
                };
            }

            if (promotion.RequiredCustomerType.HasValue && customer.CustomerType != promotion.RequiredCustomerType.Value)
            {
                return new PromotionValidationResult
                {
                    IsValid = false,
                    ErrorMessage = "This promotion is not available for your customer type"
                };
            }
        }

        // Calculate estimated discount
        var estimatedDiscount = CalculatePromotionDiscount(promotion, orderTotal, 1);

        return new PromotionValidationResult
        {
            IsValid = true,
            Promotion = promotion,
            EstimatedDiscount = estimatedDiscount
        };
    }

    public async Task<decimal> ApplyPromotionAsync(
        int promotionId,
        int customerId,
        int orderId,
        decimal orderTotal,
        CancellationToken cancellationToken = default)
    {
        var promotion = await _context.Promotions
            .FirstOrDefaultAsync(p => p.Id == promotionId, cancellationToken);

        if (promotion == null || !promotion.IsValid)
        {
            return 0;
        }

        var discountAmount = CalculatePromotionDiscount(promotion, orderTotal, 1);

        // Record usage
        var usage = new PromotionUsage
        {
            PromotionId = promotionId,
            CustomerId = customerId,
            OrderId = orderId,
            DiscountApplied = discountAmount,
            UsedAt = DateTime.UtcNow
        };

        _context.PromotionUsages.Add(usage);

        // Increment usage count
        promotion.CurrentUsageCount++;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Applied promotion {PromotionCode} to order {OrderId} for customer {CustomerId}. Discount: {Discount:N2} KM",
            promotion.Code, orderId, customerId, discountAmount);

        return discountAmount;
    }

    private async Task<PriceRule?> GetBestPriceRuleAsync(
        Product product,
        Customer customer,
        decimal quantity,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // Get all potentially applicable rules
        var rules = await _context.PriceRules
            .AsNoTracking()
            .Where(r => r.IsActive)
            .Where(r => !r.StartDate.HasValue || r.StartDate <= now)
            .Where(r => !r.EndDate.HasValue || r.EndDate >= now)
            .Where(r => !r.MinimumQuantity.HasValue || r.MinimumQuantity <= quantity)
            .Where(r => !r.MaximumQuantity.HasValue || r.MaximumQuantity >= quantity)
            .OrderByDescending(r => r.Priority)
            .ToListAsync(cancellationToken);

        // Filter and find the best rule
        foreach (var rule in rules)
        {
            // Check customer targeting
            if (rule.CustomerId.HasValue && rule.CustomerId != customer.Id)
                continue;

            if (rule.CustomerTier.HasValue && rule.CustomerTier != customer.Tier)
                continue;

            if (rule.CustomerType.HasValue && rule.CustomerType != customer.CustomerType)
                continue;

            // Check scope
            var matchesScope = rule.Scope switch
            {
                PriceRuleScope.Global => true,
                PriceRuleScope.Product => rule.ProductId == product.Id,
                PriceRuleScope.Category => rule.CategoryId == product.CategoryId,
                PriceRuleScope.Manufacturer => rule.ManufacturerId == product.ManufacturerId,
                _ => false
            };

            if (matchesScope)
            {
                return rule;
            }
        }

        return null;
    }

    private decimal CalculateRuleDiscount(PriceRule rule, decimal currentPrice, decimal quantity)
    {
        return rule.DiscountType switch
        {
            DiscountType.Percentage => currentPrice * (rule.DiscountValue / 100m),
            DiscountType.FixedAmount => Math.Min(rule.DiscountValue, currentPrice),
            DiscountType.FixedPrice => Math.Max(0, currentPrice - rule.DiscountValue),
            _ => 0m
        };
    }

    private decimal CalculatePromotionDiscount(Promotion promotion, decimal price, decimal quantity)
    {
        var discount = promotion.Type switch
        {
            PromotionType.PercentageDiscount => price * (promotion.Value / 100m),
            PromotionType.FixedAmountDiscount => Math.Min(promotion.Value, price),
            PromotionType.FreeShipping => 0m, // Handled separately in shipping calculation
            _ => 0m
        };

        // Apply maximum discount cap
        if (promotion.MaximumDiscountAmount.HasValue)
        {
            discount = Math.Min(discount, promotion.MaximumDiscountAmount.Value);
        }

        return discount;
    }

    public async Task<IEnumerable<Promotion>> GetAvailablePromotionsAsync(
        int customerId,
        CancellationToken cancellationToken = default)
    {
        var customer = await _context.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == customerId, cancellationToken);

        if (customer == null)
        {
            return Enumerable.Empty<Promotion>();
        }

        var now = DateTime.UtcNow;

        // Get all active promotions within date range
        var promotions = await _context.Promotions
            .AsNoTracking()
            .Include(p => p.Customer)
            .Include(p => p.ApplicableProducts)
            .Include(p => p.ApplicableCategories)
            .Where(p => p.IsActive)
            .Where(p => p.StartDate <= now && p.EndDate >= now)
            .Where(p => !p.MaxUsageCount.HasValue || p.CurrentUsageCount < p.MaxUsageCount)
            .ToListAsync(cancellationToken);

        // Filter promotions based on customer eligibility
        var availablePromotions = new List<Promotion>();

        foreach (var promotion in promotions)
        {
            // Check customer-specific targeting
            if (promotion.CustomerId.HasValue)
            {
                var isDirectMatch = promotion.CustomerId == customerId;
                var isChildMatch = promotion.ApplyToChildCustomers && 
                                   customer.ParentCustomerId.HasValue && 
                                   customer.ParentCustomerId == promotion.CustomerId;

                if (!isDirectMatch && !isChildMatch)
                    continue;
            }

            // Check tier requirement
            if (promotion.RequiredCustomerTier.HasValue && customer.Tier != promotion.RequiredCustomerTier.Value)
                continue;

            // Check type requirement
            if (promotion.RequiredCustomerType.HasValue && customer.CustomerType != promotion.RequiredCustomerType.Value)
                continue;

            // Check per-customer usage limit
            if (promotion.MaxUsagePerCustomer.HasValue)
            {
                var customerUsageCount = await _context.PromotionUsages
                    .CountAsync(u => u.PromotionId == promotion.Id && u.CustomerId == customerId, cancellationToken);

                if (customerUsageCount >= promotion.MaxUsagePerCustomer.Value)
                    continue;
            }

            availablePromotions.Add(promotion);
        }

        return availablePromotions;
    }
}

