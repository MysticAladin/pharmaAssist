using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Defines a price for a product with optional customer/canton targeting and a validity period.
/// Used to support Commercial vs Essential pricing and regional (canton) pricing.
/// </summary>
public class ProductPrice : BaseEntity
{
    public int ProductId { get; set; }

    /// <summary>
    /// Optional: price applies to a specific canton; null means "all cantons".
    /// </summary>
    public int? CantonId { get; set; }

    /// <summary>
    /// Optional: price applies to a specific customer; null means "all customers".
    /// </summary>
    public int? CustomerId { get; set; }

    public PriceType PriceType { get; set; } = PriceType.Commercial;

    public decimal UnitPrice { get; set; }

    public DateTime ValidFrom { get; set; } = DateTime.UtcNow;

    public DateTime? ValidTo { get; set; }

    public int Priority { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    public bool IsValid => IsActive &&
        (!ValidFrom.Equals(default) ? ValidFrom <= DateTime.UtcNow : true) &&
        (!ValidTo.HasValue || ValidTo >= DateTime.UtcNow);

    public virtual Product Product { get; set; } = null!;
    public virtual Canton? Canton { get; set; }
    public virtual Customer? Customer { get; set; }
}
