using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Price rule for customer tier-based pricing
/// Defines discount percentages or fixed prices per product/category/manufacturer for specific tiers
/// </summary>
public class PriceRule : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    
    // Scope: What does this rule apply to?
    public PriceRuleScope Scope { get; set; } = PriceRuleScope.Product;
    
    // Target IDs based on scope (can be comma-separated for multiple)
    public int? ProductId { get; set; }
    public int? CategoryId { get; set; }
    public int? ManufacturerId { get; set; }
    
    // Customer targeting
    public CustomerTier? CustomerTier { get; set; } // null = applies to all tiers
    public int? CustomerId { get; set; } // Specific customer override (highest priority)
    public CustomerType? CustomerType { get; set; } // e.g., only for Pharmacies
    
    // Discount type and value
    public DiscountType DiscountType { get; set; } = DiscountType.Percentage;
    public decimal DiscountValue { get; set; } // Percentage (0-100) or fixed amount
    public decimal? MinimumQuantity { get; set; } // Minimum quantity to trigger this rule
    public decimal? MaximumQuantity { get; set; } // Maximum quantity for this rule
    
    // Validity period
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    
    // Priority (higher = applied first when multiple rules match)
    public int Priority { get; set; } = 0;
    
    // Status
    public bool IsActive { get; set; } = true;
    
    // Calculated properties
    public bool IsValid => IsActive && 
        (!StartDate.HasValue || StartDate <= DateTime.UtcNow) &&
        (!EndDate.HasValue || EndDate >= DateTime.UtcNow);
    
    // Navigation properties
    public virtual Product? Product { get; set; }
    public virtual Category? Category { get; set; }
    public virtual Manufacturer? Manufacturer { get; set; }
    public virtual Customer? Customer { get; set; }
}

/// <summary>
/// Defines the scope of a price rule
/// </summary>
public enum PriceRuleScope
{
    Global = 1,         // Applies to all products
    Product = 2,        // Specific product
    Category = 3,       // All products in category
    Manufacturer = 4    // All products from manufacturer
}

/// <summary>
/// Type of discount applied
/// </summary>
public enum DiscountType
{
    Percentage = 1,     // e.g., 10% off
    FixedAmount = 2,    // e.g., 5 KM off
    FixedPrice = 3      // Override price to specific value
}
