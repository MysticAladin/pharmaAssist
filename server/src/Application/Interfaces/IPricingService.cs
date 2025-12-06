using Domain.Entities;
using Domain.Enums;

namespace Application.Interfaces;

/// <summary>
/// Service for calculating prices based on customer tiers, price rules, and promotions
/// </summary>
public interface IPricingService
{
    /// <summary>
    /// Calculate the final price for a product for a specific customer
    /// </summary>
    Task<PriceCalculationResult> CalculatePriceAsync(
        int productId, 
        int customerId, 
        decimal quantity = 1,
        string? promotionCode = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Calculate prices for multiple products (for cart/order)
    /// </summary>
    Task<IEnumerable<PriceCalculationResult>> CalculatePricesAsync(
        IEnumerable<(int ProductId, decimal Quantity)> items,
        int customerId,
        string? promotionCode = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all applicable price rules for a customer
    /// </summary>
    Task<IEnumerable<PriceRule>> GetApplicableRulesAsync(
        int customerId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get the tier discount percentage for a customer tier
    /// </summary>
    decimal GetTierDiscountPercentage(CustomerTier tier);

    /// <summary>
    /// Validate and get a promotion by code
    /// </summary>
    Task<PromotionValidationResult> ValidatePromotionAsync(
        string code,
        int customerId,
        decimal orderTotal,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Apply a promotion to an order and record usage
    /// </summary>
    Task<decimal> ApplyPromotionAsync(
        int promotionId,
        int customerId,
        int orderId,
        decimal orderTotal,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Result of a price calculation including breakdown of discounts
/// </summary>
public class PriceCalculationResult
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal BasePrice { get; set; }
    public decimal TierDiscountPercent { get; set; }
    public decimal TierDiscountAmount { get; set; }
    public decimal RuleDiscountPercent { get; set; }
    public decimal RuleDiscountAmount { get; set; }
    public decimal PromotionDiscountPercent { get; set; }
    public decimal PromotionDiscountAmount { get; set; }
    public decimal FinalUnitPrice { get; set; }
    public decimal LineTotal { get; set; }
    public decimal TotalDiscount => TierDiscountAmount + RuleDiscountAmount + PromotionDiscountAmount;
    public decimal TotalDiscountPercent { get; set; }
    public string? AppliedRuleName { get; set; }
    public string? AppliedPromotionCode { get; set; }
}

/// <summary>
/// Result of validating a promotion code
/// </summary>
public class PromotionValidationResult
{
    public bool IsValid { get; set; }
    public string? ErrorMessage { get; set; }
    public Promotion? Promotion { get; set; }
    public decimal EstimatedDiscount { get; set; }
}
