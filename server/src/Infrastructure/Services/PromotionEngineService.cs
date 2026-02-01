using Application.DTOs.Pricing;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

/// <summary>
/// Promotion engine service for calculating and applying promotions to orders
/// </summary>
public class PromotionEngineService : IPromotionEngineService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PromotionEngineService> _logger;

    public PromotionEngineService(
        ApplicationDbContext context,
        ILogger<PromotionEngineService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IReadOnlyList<PromotionDto>> GetApplicablePromotionsAsync(
        int customerId,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var customer = await _context.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == customerId, cancellationToken);

        if (customer == null)
        {
            return Array.Empty<PromotionDto>();
        }

        var promotions = await _context.Promotions
            .AsNoTracking()
            .Include(p => p.ApplicableProducts)
            .Include(p => p.ApplicableCategories)
            .Where(p => p.IsActive &&
                        p.StartDate <= now &&
                        p.EndDate >= now &&
                        (!p.MaxUsageCount.HasValue || p.CurrentUsageCount < p.MaxUsageCount))
            .ToListAsync(cancellationToken);

        // Filter by customer eligibility
        var applicablePromotions = promotions
            .Where(p => IsCustomerEligible(p, customer))
            .Select(MapToDto)
            .ToList();

        return applicablePromotions;
    }

    public async Task<PromotionCalculationResult> CalculatePromotionsAsync(
        int customerId,
        IEnumerable<OrderItemForPromotion> items,
        string? promoCode = null,
        CancellationToken cancellationToken = default)
    {
        var result = new PromotionCalculationResult();
        var itemsList = items.ToList();

        result.OriginalTotal = itemsList.Sum(i => i.LineTotal);
        result.FinalTotal = result.OriginalTotal;

        var customer = await _context.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == customerId, cancellationToken);

        if (customer == null)
        {
            result.Success = false;
            result.Message = "Customer not found";
            return result;
        }

        var now = DateTime.UtcNow;
        var promotionsQuery = _context.Promotions
            .AsNoTracking()
            .Include(p => p.ApplicableProducts)
            .Include(p => p.ApplicableCategories)
            .Where(p => p.IsActive &&
                        p.StartDate <= now &&
                        p.EndDate >= now &&
                        (!p.MaxUsageCount.HasValue || p.CurrentUsageCount < p.MaxUsageCount));

        var promotions = await promotionsQuery.ToListAsync(cancellationToken);

        // Filter eligible promotions
        var eligiblePromotions = promotions
            .Where(p => IsCustomerEligible(p, customer))
            .ToList();

        // Separate code-required vs auto-apply promotions
        var autoApplyPromotions = eligiblePromotions.Where(p => !p.RequiresCode).ToList();
        Promotion? codePromotion = null;

        // If promo code provided, validate it
        if (!string.IsNullOrWhiteSpace(promoCode))
        {
            codePromotion = eligiblePromotions
                .FirstOrDefault(p => p.RequiresCode &&
                                    p.Code.Equals(promoCode, StringComparison.OrdinalIgnoreCase));

            if (codePromotion == null)
            {
                // Check if code exists but not applicable
                var existingPromo = await _context.Promotions
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.Code == promoCode, cancellationToken);

                if (existingPromo != null)
                {
                    result.Message = GetIneligibilityReason(existingPromo, customer, now);
                }
                else
                {
                    result.Message = "Invalid promotion code";
                }
            }
        }

        // Collect all promotions to apply
        var promotionsToApply = new List<Promotion>(autoApplyPromotions);
        if (codePromotion != null)
        {
            promotionsToApply.Add(codePromotion);
        }

        // Sort by priority: percentage discounts first, then fixed amounts
        promotionsToApply = promotionsToApply
            .OrderByDescending(p => p.Type == PromotionType.PercentageDiscount)
            .ThenByDescending(p => p.Value)
            .ToList();

        // Check stacking rules
        var nonStackablePromo = promotionsToApply.FirstOrDefault(p => !p.CanStackWithOtherPromotions);
        if (nonStackablePromo != null && promotionsToApply.Count > 1)
        {
            // Keep only the best non-stackable promotion
            promotionsToApply = new List<Promotion> { nonStackablePromo };
        }

        // Calculate discounts
        var totalDiscount = 0m;
        var lineDiscounts = new Dictionary<int, PromotionLineDiscount>();

        // Initialize line discounts
        foreach (var item in itemsList)
        {
            lineDiscounts[item.ProductId] = new PromotionLineDiscount
            {
                ProductId = item.ProductId,
                OriginalLineTotal = item.LineTotal,
                FinalLineTotal = item.LineTotal
            };
        }

        foreach (var promo in promotionsToApply)
        {
            var discountAmount = CalculatePromotionDiscount(promo, itemsList, lineDiscounts, result.OriginalTotal);

            if (discountAmount > 0)
            {
                // Apply maximum discount cap
                if (promo.MaximumDiscountAmount.HasValue)
                {
                    discountAmount = Math.Min(discountAmount, promo.MaximumDiscountAmount.Value);
                }

                totalDiscount += discountAmount;

                result.AppliedPromotions.Add(new AppliedPromotion
                {
                    PromotionId = promo.Id,
                    Code = promo.Code,
                    Name = promo.Name,
                    Type = promo.Type.ToString(),
                    DiscountAmount = discountAmount,
                    Description = GetPromotionDescription(promo)
                });

                _logger.LogInformation("Applied promotion {PromoCode} for customer {CustomerId}: {Discount:C}",
                    promo.Code, customerId, discountAmount);
            }
        }

        result.DiscountTotal = totalDiscount;
        result.FinalTotal = result.OriginalTotal - totalDiscount;
        result.LineDiscounts = lineDiscounts.Values.ToList();
        result.Success = true;

        return result;
    }

    public async Task<PromoCodeValidationResult> ValidatePromoCodeAsync(
        string promoCode,
        int customerId,
        decimal orderTotal,
        CancellationToken cancellationToken = default)
    {
        var result = new PromoCodeValidationResult();

        if (string.IsNullOrWhiteSpace(promoCode))
        {
            result.IsValid = false;
            result.ErrorMessage = "Promotion code is required";
            return result;
        }

        var promotion = await _context.Promotions
            .AsNoTracking()
            .Include(p => p.ApplicableProducts)
            .Include(p => p.ApplicableCategories)
            .FirstOrDefaultAsync(p => p.Code.ToLower() == promoCode.ToLower(), cancellationToken);

        if (promotion == null)
        {
            result.IsValid = false;
            result.ErrorMessage = "Invalid promotion code";
            return result;
        }

        var now = DateTime.UtcNow;
        var customer = await _context.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == customerId, cancellationToken);

        if (customer == null)
        {
            result.IsValid = false;
            result.ErrorMessage = "Customer not found";
            return result;
        }

        // Check validity
        if (!promotion.IsActive)
        {
            result.IsValid = false;
            result.ErrorMessage = "This promotion is no longer active";
            return result;
        }

        if (promotion.StartDate > now)
        {
            result.IsValid = false;
            result.ErrorMessage = $"This promotion starts on {promotion.StartDate:d}";
            return result;
        }

        if (promotion.EndDate < now)
        {
            result.IsValid = false;
            result.ErrorMessage = "This promotion has expired";
            return result;
        }

        if (promotion.HasReachedLimit)
        {
            result.IsValid = false;
            result.ErrorMessage = "This promotion has reached its usage limit";
            return result;
        }

        // Check minimum order amount
        if (promotion.MinimumOrderAmount.HasValue && orderTotal < promotion.MinimumOrderAmount.Value)
        {
            result.IsValid = false;
            result.ErrorMessage = $"Minimum order of {promotion.MinimumOrderAmount:C} required for this promotion";
            return result;
        }

        // Check customer eligibility
        if (!IsCustomerEligible(promotion, customer))
        {
            result.IsValid = false;
            result.ErrorMessage = GetIneligibilityReason(promotion, customer, now);
            return result;
        }

        // Check per-customer usage limit
        if (promotion.MaxUsagePerCustomer.HasValue)
        {
            var customerUsageCount = await _context.Set<PromotionUsage>()
                .CountAsync(pu => pu.PromotionId == promotion.Id && pu.CustomerId == customerId, cancellationToken);

            if (customerUsageCount >= promotion.MaxUsagePerCustomer.Value)
            {
                result.IsValid = false;
                result.ErrorMessage = "You have already used this promotion the maximum number of times";
                return result;
            }
        }

        // Calculate estimated discount
        var estimatedDiscount = CalculateEstimatedDiscount(promotion, orderTotal);
        if (promotion.MaximumDiscountAmount.HasValue)
        {
            estimatedDiscount = Math.Min(estimatedDiscount, promotion.MaximumDiscountAmount.Value);
        }

        result.IsValid = true;
        result.Promotion = MapToDto(promotion);
        result.EstimatedDiscount = estimatedDiscount;

        return result;
    }

    public async Task RecordPromotionUsageAsync(
        int orderId,
        int customerId,
        IEnumerable<AppliedPromotion> appliedPromotions,
        CancellationToken cancellationToken = default)
    {
        foreach (var applied in appliedPromotions)
        {
            var usage = new PromotionUsage
            {
                PromotionId = applied.PromotionId,
                CustomerId = customerId,
                OrderId = orderId,
                DiscountApplied = applied.DiscountAmount,
                UsedAt = DateTime.UtcNow
            };

            _context.Set<PromotionUsage>().Add(usage);

            // Increment usage count
            var promotion = await _context.Promotions
                .FirstOrDefaultAsync(p => p.Id == applied.PromotionId, cancellationToken);

            if (promotion != null)
            {
                promotion.CurrentUsageCount++;
            }

            _logger.LogInformation("Recorded promotion usage: Order {OrderId}, Promo {PromoId}, Discount {Discount:C}",
                orderId, applied.PromotionId, applied.DiscountAmount);
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<PromotionDto>> GetActivePromotionsForRepAsync(
        int? categoryId = null,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        var query = _context.Promotions
            .AsNoTracking()
            .Include(p => p.ApplicableProducts)
            .Include(p => p.ApplicableCategories)
            .Where(p => p.IsActive &&
                        p.StartDate <= now &&
                        p.EndDate >= now &&
                        (!p.MaxUsageCount.HasValue || p.CurrentUsageCount < p.MaxUsageCount));

        if (categoryId.HasValue)
        {
            query = query.Where(p =>
                p.AppliesToAllProducts ||
                p.ApplicableCategories.Any(c => c.CategoryId == categoryId.Value));
        }

        var promotions = await query
            .OrderByDescending(p => p.StartDate)
            .Take(50)
            .ToListAsync(cancellationToken);

        return promotions.Select(MapToDto).ToList();
    }

    #region Private Helper Methods

    private bool IsCustomerEligible(Promotion promotion, Customer customer)
    {
        // Check if promotion applies to all customers
        if (promotion.AppliesToAllCustomers)
        {
            // Still check tier and type requirements
            if (promotion.RequiredCustomerTier.HasValue && customer.Tier != promotion.RequiredCustomerTier.Value)
            {
                return false;
            }

            if (promotion.RequiredCustomerType.HasValue && customer.CustomerType != promotion.RequiredCustomerType.Value)
            {
                return false;
            }

            return true;
        }

        // Check customer-specific targeting
        if (promotion.CustomerId.HasValue)
        {
            if (customer.Id == promotion.CustomerId.Value)
            {
                return true;
            }

            // Check if customer is a child branch and promotion applies to children
            if (promotion.ApplyToChildCustomers && customer.ParentCustomerId == promotion.CustomerId.Value)
            {
                return true;
            }

            return false;
        }

        return false;
    }

    private string GetIneligibilityReason(Promotion promotion, Customer customer, DateTime now)
    {
        if (!promotion.IsActive)
            return "This promotion is no longer active";

        if (promotion.StartDate > now)
            return $"This promotion starts on {promotion.StartDate:d}";

        if (promotion.EndDate < now)
            return "This promotion has expired";

        if (promotion.HasReachedLimit)
            return "This promotion has reached its usage limit";

        if (promotion.RequiredCustomerTier.HasValue && customer.Tier != promotion.RequiredCustomerTier.Value)
            return $"This promotion is only for {promotion.RequiredCustomerTier} tier customers";

        if (promotion.RequiredCustomerType.HasValue && customer.CustomerType != promotion.RequiredCustomerType.Value)
            return $"This promotion is only for {promotion.RequiredCustomerType} customers";

        if (promotion.CustomerId.HasValue && customer.Id != promotion.CustomerId.Value)
            return "This promotion is not available for your account";

        return "You are not eligible for this promotion";
    }

    private decimal CalculatePromotionDiscount(
        Promotion promotion,
        List<OrderItemForPromotion> items,
        Dictionary<int, PromotionLineDiscount> lineDiscounts,
        decimal orderTotal)
    {
        // Check minimum order requirement
        if (promotion.MinimumOrderAmount.HasValue && orderTotal < promotion.MinimumOrderAmount.Value)
        {
            return 0m;
        }

        // Get applicable items
        var applicableItems = GetApplicableItems(promotion, items);
        if (!applicableItems.Any())
        {
            return 0m;
        }

        var applicableTotal = applicableItems.Sum(i => lineDiscounts[i.ProductId].FinalLineTotal);

        switch (promotion.Type)
        {
            case PromotionType.PercentageDiscount:
                var percentDiscount = applicableTotal * (promotion.Value / 100m);
                ApplyLineDiscounts(applicableItems, lineDiscounts, promotion, percentDiscount, applicableTotal);
                return percentDiscount;

            case PromotionType.FixedAmountDiscount:
                var fixedDiscount = Math.Min(promotion.Value, applicableTotal);
                ApplyLineDiscounts(applicableItems, lineDiscounts, promotion, fixedDiscount, applicableTotal);
                return fixedDiscount;

            case PromotionType.FreeShipping:
                // Handled at order level, not line level
                return 0m;

            case PromotionType.BuyOneGetOne:
                // Calculate BOGO discount
                return CalculateBOGODiscount(applicableItems, lineDiscounts, promotion);

            case PromotionType.BuyXGetYFree:
                // Similar to BOGO but with configurable quantities
                return CalculateBuyXGetYDiscount(applicableItems, lineDiscounts, promotion);

            default:
                return 0m;
        }
    }

    private List<OrderItemForPromotion> GetApplicableItems(Promotion promotion, List<OrderItemForPromotion> items)
    {
        if (promotion.AppliesToAllProducts)
        {
            return items;
        }

        var applicableProductIds = promotion.ApplicableProducts.Select(p => p.ProductId).ToHashSet();
        var applicableCategoryIds = promotion.ApplicableCategories.Select(c => c.CategoryId).ToHashSet();

        return items.Where(item =>
            applicableProductIds.Contains(item.ProductId) ||
            (item.CategoryId.HasValue && applicableCategoryIds.Contains(item.CategoryId.Value))
        ).ToList();
    }

    private void ApplyLineDiscounts(
        List<OrderItemForPromotion> items,
        Dictionary<int, PromotionLineDiscount> lineDiscounts,
        Promotion promotion,
        decimal totalDiscount,
        decimal applicableTotal)
    {
        if (applicableTotal == 0) return;

        foreach (var item in items)
        {
            var lineDiscount = lineDiscounts[item.ProductId];
            var proportion = lineDiscount.FinalLineTotal / applicableTotal;
            var itemDiscount = totalDiscount * proportion;

            lineDiscount.PromotionId = promotion.Id;
            lineDiscount.DiscountAmount += itemDiscount;
            lineDiscount.FinalLineTotal -= itemDiscount;
            lineDiscount.DiscountPercent = (lineDiscount.DiscountAmount / lineDiscount.OriginalLineTotal) * 100;
        }
    }

    private decimal CalculateBOGODiscount(
        List<OrderItemForPromotion> items,
        Dictionary<int, PromotionLineDiscount> lineDiscounts,
        Promotion promotion)
    {
        var totalDiscount = 0m;

        foreach (var item in items)
        {
            if (item.Quantity >= 2)
            {
                // For every 2 items, one is free
                var freeItems = item.Quantity / 2;
                var discountPerItem = item.UnitPrice;
                var itemDiscount = freeItems * discountPerItem;

                var lineDiscount = lineDiscounts[item.ProductId];
                lineDiscount.PromotionId = promotion.Id;
                lineDiscount.DiscountAmount += itemDiscount;
                lineDiscount.FinalLineTotal -= itemDiscount;

                totalDiscount += itemDiscount;
            }
        }

        return totalDiscount;
    }

    private decimal CalculateBuyXGetYDiscount(
        List<OrderItemForPromotion> items,
        Dictionary<int, PromotionLineDiscount> lineDiscounts,
        Promotion promotion)
    {
        // Value represents: Buy X (whole part) Get Y free (decimal represents Y)
        // E.g., 3.1 means Buy 3 Get 1 Free
        var buyQuantity = (int)Math.Floor(promotion.Value);
        var freeQuantity = (int)((promotion.Value - buyQuantity) * 10);
        if (freeQuantity == 0) freeQuantity = 1;

        var totalRequired = buyQuantity + freeQuantity;
        var totalDiscount = 0m;

        foreach (var item in items)
        {
            if (item.Quantity >= totalRequired)
            {
                var sets = item.Quantity / totalRequired;
                var freeItems = sets * freeQuantity;
                var itemDiscount = freeItems * item.UnitPrice;

                var lineDiscount = lineDiscounts[item.ProductId];
                lineDiscount.PromotionId = promotion.Id;
                lineDiscount.DiscountAmount += itemDiscount;
                lineDiscount.FinalLineTotal -= itemDiscount;

                totalDiscount += itemDiscount;
            }
        }

        return totalDiscount;
    }

    private decimal CalculateEstimatedDiscount(Promotion promotion, decimal orderTotal)
    {
        switch (promotion.Type)
        {
            case PromotionType.PercentageDiscount:
                return orderTotal * (promotion.Value / 100m);

            case PromotionType.FixedAmountDiscount:
                return Math.Min(promotion.Value, orderTotal);

            default:
                return 0m;
        }
    }

    private string GetPromotionDescription(Promotion promotion)
    {
        return promotion.Type switch
        {
            PromotionType.PercentageDiscount => $"{promotion.Value}% off",
            PromotionType.FixedAmountDiscount => $"{promotion.Value:C} off",
            PromotionType.FreeShipping => "Free shipping",
            PromotionType.BuyOneGetOne => "Buy one, get one free",
            PromotionType.BuyXGetYFree => $"Buy {(int)promotion.Value} get free items",
            PromotionType.GiftWithPurchase => "Free gift included",
            PromotionType.BundleDiscount => "Bundle discount",
            _ => promotion.Name
        };
    }

    private PromotionDto MapToDto(Promotion promotion)
    {
        return new PromotionDto
        {
            Id = promotion.Id,
            Code = promotion.Code,
            Name = promotion.Name,
            Description = promotion.Description,
            TermsAndConditions = promotion.TermsAndConditions,
            Type = promotion.Type,
            TypeName = promotion.Type.ToString(),
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
            ApplyToChildCustomers = promotion.ApplyToChildCustomers,
            IsActive = promotion.IsActive,
            RequiresCode = promotion.RequiresCode,
            CanStackWithOtherPromotions = promotion.CanStackWithOtherPromotions,
            CanStackWithTierPricing = promotion.CanStackWithTierPricing,
            ProductIds = promotion.ApplicableProducts?.Select(p => p.ProductId).ToList(),
            CategoryIds = promotion.ApplicableCategories?.Select(c => c.CategoryId).ToList(),
            IsValid = promotion.IsValid,
            HasReachedLimit = promotion.HasReachedLimit,
            CreatedAt = promotion.CreatedAt
        };
    }

    #endregion
}
