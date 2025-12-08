using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Promotional campaign that can apply discounts, offers, or special pricing
/// </summary>
public class Promotion : BaseEntity
{
    public string Code { get; set; } = string.Empty; // Promotional code (e.g., "WINTER2025")
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? TermsAndConditions { get; set; }
    
    // Promotion type
    public PromotionType Type { get; set; } = PromotionType.PercentageDiscount;
    
    // Value
    public decimal Value { get; set; } // Percentage, fixed amount, or quantity for BOGO
    public decimal? MinimumOrderAmount { get; set; } // Minimum order to qualify
    public decimal? MaximumDiscountAmount { get; set; } // Cap on discount
    
    // Validity
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    
    // Usage limits
    public int? MaxUsageCount { get; set; } // Total times promotion can be used
    public int? MaxUsagePerCustomer { get; set; } // Per customer limit
    public int CurrentUsageCount { get; set; } = 0;
    
    // Targeting
    public bool AppliesToAllProducts { get; set; } = true;
    public bool AppliesToAllCustomers { get; set; } = true;
    public CustomerTier? RequiredCustomerTier { get; set; }
    public CustomerType? RequiredCustomerType { get; set; }
    
    // Customer-specific targeting (for exclusive promotions)
    public int? CustomerId { get; set; } // Specific customer this promotion is for
    public bool ApplyToChildCustomers { get; set; } = true; // Also apply to all child branches
    
    // Status
    public bool IsActive { get; set; } = true;
    public bool RequiresCode { get; set; } = true; // Must enter code at checkout
    
    // Stacking
    public bool CanStackWithOtherPromotions { get; set; } = false;
    public bool CanStackWithTierPricing { get; set; } = true;
    
    // Calculated properties
    public bool IsValid => IsActive && 
        StartDate <= DateTime.UtcNow && 
        EndDate >= DateTime.UtcNow &&
        (!MaxUsageCount.HasValue || CurrentUsageCount < MaxUsageCount);
    
    public bool HasReachedLimit => MaxUsageCount.HasValue && CurrentUsageCount >= MaxUsageCount;
    
    // Navigation properties
    public virtual Customer? Customer { get; set; }
    public virtual ICollection<PromotionProduct> ApplicableProducts { get; set; } = new List<PromotionProduct>();
    public virtual ICollection<PromotionCategory> ApplicableCategories { get; set; } = new List<PromotionCategory>();
    public virtual ICollection<PromotionUsage> Usages { get; set; } = new List<PromotionUsage>();
}

/// <summary>
/// Links promotion to specific products
/// </summary>
public class PromotionProduct : BaseEntity
{
    public int PromotionId { get; set; }
    public int ProductId { get; set; }
    
    public virtual Promotion Promotion { get; set; } = null!;
    public virtual Product Product { get; set; } = null!;
}

/// <summary>
/// Links promotion to specific categories
/// </summary>
public class PromotionCategory : BaseEntity
{
    public int PromotionId { get; set; }
    public int CategoryId { get; set; }
    
    public virtual Promotion Promotion { get; set; } = null!;
    public virtual Category Category { get; set; } = null!;
}

/// <summary>
/// Tracks promotion usage by customers
/// </summary>
public class PromotionUsage : BaseEntity
{
    public int PromotionId { get; set; }
    public int CustomerId { get; set; }
    public int OrderId { get; set; }
    public decimal DiscountApplied { get; set; }
    public DateTime UsedAt { get; set; } = DateTime.UtcNow;
    
    public virtual Promotion Promotion { get; set; } = null!;
    public virtual Customer Customer { get; set; } = null!;
    public virtual Order Order { get; set; } = null!;
}

/// <summary>
/// Types of promotional offers
/// </summary>
public enum PromotionType
{
    PercentageDiscount = 1,     // X% off
    FixedAmountDiscount = 2,    // X KM off
    FreeShipping = 3,           // Free shipping
    BuyOneGetOne = 4,           // BOGO (value = quantity to get free)
    BuyXGetYFree = 5,           // Buy X get Y free
    GiftWithPurchase = 6,       // Free product with order
    BundleDiscount = 7          // Discount on buying multiple specific products
}
