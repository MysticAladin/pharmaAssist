using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Order line item
/// </summary>
public class OrderItem : BaseEntity
{
    public int OrderId { get; set; }
    public int ProductId { get; set; }
    public int? ProductBatchId { get; set; }
    
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountPercent { get; set; } = 0;
    public decimal TaxRate { get; set; } = 17m; // BiH VAT
    public decimal LineTotal { get; set; }
    
    /// <summary>
    /// Price type used for this item (Commercial=1, Essential=2)
    /// Used for split invoice generation
    /// </summary>
    public PriceType PriceType { get; set; } = PriceType.Commercial;
    
    // Prescription
    public bool PrescriptionRequired { get; set; } = false;
    public int? PrescriptionId { get; set; }

    // Navigation properties
    public virtual Order Order { get; set; } = null!;
    public virtual Product Product { get; set; } = null!;
    public virtual ProductBatch? ProductBatch { get; set; }
    public virtual Prescription? Prescription { get; set; }
}
