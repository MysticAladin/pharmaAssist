using Application.DTOs.Orders;
using Application.DTOs.Pricing;

namespace Application.Interfaces;

/// <summary>
/// Promotion engine service for auto-applying promotions during order creation
/// </summary>
public interface IPromotionEngineService
{
    /// <summary>
    /// Get all active promotions applicable to a customer
    /// </summary>
    Task<IReadOnlyList<PromotionDto>> GetApplicablePromotionsAsync(
        int customerId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Calculate and apply promotions to order items
    /// Returns the applied promotions with calculated discounts
    /// </summary>
    Task<PromotionCalculationResult> CalculatePromotionsAsync(
        int customerId,
        IEnumerable<OrderItemForPromotion> items,
        string? promoCode = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Validate a promotion code for a customer
    /// </summary>
    Task<PromoCodeValidationResult> ValidatePromoCodeAsync(
        string promoCode,
        int customerId,
        decimal orderTotal,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Record promotion usage after order is placed
    /// </summary>
    Task RecordPromotionUsageAsync(
        int orderId,
        int customerId,
        IEnumerable<AppliedPromotion> appliedPromotions,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get active promotions for rep to present to customers
    /// </summary>
    Task<IReadOnlyList<PromotionDto>> GetActivePromotionsForRepAsync(
        int? categoryId = null,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Order item info needed for promotion calculation
/// </summary>
public class OrderItemForPromotion
{
    public int ProductId { get; set; }
    public int? CategoryId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
}

/// <summary>
/// Result of promotion calculation
/// </summary>
public class PromotionCalculationResult
{
    public bool Success { get; set; }
    public decimal OriginalTotal { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal FinalTotal { get; set; }
    public IList<AppliedPromotion> AppliedPromotions { get; set; } = new List<AppliedPromotion>();
    public IList<PromotionLineDiscount> LineDiscounts { get; set; } = new List<PromotionLineDiscount>();
    public string? Message { get; set; }
}

/// <summary>
/// Details of an applied promotion
/// </summary>
public class AppliedPromotion
{
    public int PromotionId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public decimal DiscountAmount { get; set; }
    public string Description { get; set; } = string.Empty;
}

/// <summary>
/// Per-line discount from promotions
/// </summary>
public class PromotionLineDiscount
{
    public int ProductId { get; set; }
    public int PromotionId { get; set; }
    public decimal OriginalLineTotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal FinalLineTotal { get; set; }
}

/// <summary>
/// Result of promo code validation for the promotion engine
/// </summary>
public class PromoCodeValidationResult
{
    public bool IsValid { get; set; }
    public string? ErrorMessage { get; set; }
    public PromotionDto? Promotion { get; set; }
    public decimal? EstimatedDiscount { get; set; }
}
