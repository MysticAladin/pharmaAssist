namespace Domain.Entities;

/// <summary>
/// Inventory stock tracking per product/batch
/// </summary>
public class InventoryStock : BaseEntity
{
    public int ProductId { get; set; }
    public int? ProductBatchId { get; set; }
    public int WarehouseId { get; set; }
    
    public int QuantityOnHand { get; set; } = 0;
    public int QuantityReserved { get; set; } = 0;
    public int QuantityAvailable => QuantityOnHand - QuantityReserved;
    
    public int ReorderLevel { get; set; } = 10;
    public int ReorderQuantity { get; set; } = 50;
    public int MaxStockLevel { get; set; } = 1000;
    
    public DateTime? LastStockTakeDate { get; set; }
    public DateTime? LastMovementDate { get; set; }

    // Navigation properties
    public virtual Product Product { get; set; } = null!;
    public virtual ProductBatch? ProductBatch { get; set; }
    public virtual Warehouse Warehouse { get; set; } = null!;
}
