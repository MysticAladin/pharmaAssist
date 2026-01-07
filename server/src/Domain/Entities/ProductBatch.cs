namespace Domain.Entities;

/// <summary>
/// Product batch/lot for tracking expiry dates and inventory
/// This is the source of truth for stock quantities
/// </summary>
public class ProductBatch : BaseEntity
{
    public int ProductId { get; set; }
    public int WarehouseId { get; set; }
    public string BatchNumber { get; set; } = string.Empty;
    public DateTime? ManufactureDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int InitialQuantity { get; set; }
    public int RemainingQuantity { get; set; }
    public decimal? CostPrice { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual Product Product { get; set; } = null!;
    public virtual Warehouse Warehouse { get; set; } = null!;
}
