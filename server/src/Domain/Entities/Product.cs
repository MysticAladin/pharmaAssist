namespace Domain.Entities;

/// <summary>
/// Pharmaceutical product
/// </summary>
public class Product : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string NameLocal { get; set; } = string.Empty;
    public string? GenericName { get; set; }
    public string? Description { get; set; }
    public string? DescriptionLocal { get; set; }
    
    // Identification
    public string SKU { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string? ATCCode { get; set; } // Anatomical Therapeutic Chemical code
    
    // Classification
    public int CategoryId { get; set; }
    public int ManufacturerId { get; set; }
    
    // Pricing (in BAM - Convertible Mark)
    public decimal UnitPrice { get; set; }
    public decimal? CostPrice { get; set; }
    public decimal TaxRate { get; set; } = 17m; // BiH standard VAT rate
    
    // Pharmaceutical properties
    public bool RequiresPrescription { get; set; } = false;
    public bool IsControlled { get; set; } = false;
    public string? DosageForm { get; set; } // Tablet, Capsule, Syrup, etc.
    public string? Strength { get; set; } // e.g., "500mg", "10mg/ml"
    public string? PackageSize { get; set; } // e.g., "30 tablets", "100ml"
    
    // Inventory
    public int StockQuantity { get; set; } = 0;
    public int ReorderLevel { get; set; } = 10;
    public int ReorderQuantity { get; set; } = 100;
    
    // Media
    public string? ImageUrl { get; set; }
    
    // Status
    public bool IsActive { get; set; } = true;
    public bool IsFeatured { get; set; } = false;

    // Navigation properties
    public virtual Category Category { get; set; } = null!;
    public virtual Manufacturer Manufacturer { get; set; } = null!;
    public virtual ICollection<ProductBatch> Batches { get; set; } = new List<ProductBatch>();
    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
