using Domain.Entities;
using Domain.Enums;

namespace Application.DTOs.Pricing;

/// <summary>
/// DTO for price rule
/// </summary>
public class PriceRuleDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public PriceRuleScope Scope { get; set; }
    public int? ProductId { get; set; }
    public string? ProductName { get; set; }
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public int? ManufacturerId { get; set; }
    public string? ManufacturerName { get; set; }
    public CustomerTier? CustomerTier { get; set; }
    public int? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public CustomerType? CustomerType { get; set; }
    public DiscountType DiscountType { get; set; }
    public decimal DiscountValue { get; set; }
    public decimal? MinimumQuantity { get; set; }
    public decimal? MaximumQuantity { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int Priority { get; set; }
    public bool IsActive { get; set; }
    public bool IsValid { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO for creating/updating a price rule
/// </summary>
public class CreatePriceRuleDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public PriceRuleScope Scope { get; set; } = PriceRuleScope.Product;
    public int? ProductId { get; set; }
    public int? CategoryId { get; set; }
    public int? ManufacturerId { get; set; }
    public CustomerTier? CustomerTier { get; set; }
    public int? CustomerId { get; set; }
    public CustomerType? CustomerType { get; set; }
    public DiscountType DiscountType { get; set; } = DiscountType.Percentage;
    public decimal DiscountValue { get; set; }
    public decimal? MinimumQuantity { get; set; }
    public decimal? MaximumQuantity { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int Priority { get; set; } = 0;
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// DTO for promotion
/// </summary>
public class PromotionDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? TermsAndConditions { get; set; }
    public PromotionType Type { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public decimal? MinimumOrderAmount { get; set; }
    public decimal? MaximumDiscountAmount { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int? MaxUsageCount { get; set; }
    public int? MaxUsagePerCustomer { get; set; }
    public int CurrentUsageCount { get; set; }
    public bool AppliesToAllProducts { get; set; }
    public bool AppliesToAllCustomers { get; set; }
    public CustomerTier? RequiredCustomerTier { get; set; }
    public CustomerType? RequiredCustomerType { get; set; }
    public bool IsActive { get; set; }
    public bool RequiresCode { get; set; }
    public bool CanStackWithOtherPromotions { get; set; }
    public bool CanStackWithTierPricing { get; set; }
    public bool IsValid { get; set; }
    public bool HasReachedLimit { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO for creating/updating a promotion
/// </summary>
public class CreatePromotionDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? TermsAndConditions { get; set; }
    public PromotionType Type { get; set; } = PromotionType.PercentageDiscount;
    public decimal Value { get; set; }
    public decimal? MinimumOrderAmount { get; set; }
    public decimal? MaximumDiscountAmount { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int? MaxUsageCount { get; set; }
    public int? MaxUsagePerCustomer { get; set; }
    public bool AppliesToAllProducts { get; set; } = true;
    public bool AppliesToAllCustomers { get; set; } = true;
    public CustomerTier? RequiredCustomerTier { get; set; }
    public CustomerType? RequiredCustomerType { get; set; }
    public bool IsActive { get; set; } = true;
    public bool RequiresCode { get; set; } = true;
    public bool CanStackWithOtherPromotions { get; set; } = false;
    public bool CanStackWithTierPricing { get; set; } = true;
    public List<int>? ProductIds { get; set; }
    public List<int>? CategoryIds { get; set; }
}

/// <summary>
/// DTO for price calculation request
/// </summary>
public class PriceCalculationRequestDto
{
    public int ProductId { get; set; }
    public decimal Quantity { get; set; } = 1;
    public string? PromotionCode { get; set; }
}

/// <summary>
/// DTO for batch price calculation request
/// </summary>
public class BatchPriceCalculationRequestDto
{
    public List<PriceCalculationRequestDto> Items { get; set; } = new();
    public string? PromotionCode { get; set; }
}

/// <summary>
/// DTO for price calculation result
/// </summary>
public class PriceCalculationResultDto
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
    public decimal TotalDiscount { get; set; }
    public decimal TotalDiscountPercent { get; set; }
    public string? AppliedRuleName { get; set; }
    public string? AppliedPromotionCode { get; set; }
}

/// <summary>
/// DTO for promotion validation request
/// </summary>
public class ValidatePromotionRequestDto
{
    public string Code { get; set; } = string.Empty;
    public decimal OrderTotal { get; set; }
}

/// <summary>
/// DTO for promotion validation result
/// </summary>
public class PromotionValidationResultDto
{
    public bool IsValid { get; set; }
    public string? ErrorMessage { get; set; }
    public PromotionDto? Promotion { get; set; }
    public decimal EstimatedDiscount { get; set; }
}

/// <summary>
/// DTO for tier pricing info
/// </summary>
public class TierPricingInfoDto
{
    public CustomerTier Tier { get; set; }
    public string TierName { get; set; } = string.Empty;
    public decimal DiscountPercentage { get; set; }
    public string Description { get; set; } = string.Empty;
}
