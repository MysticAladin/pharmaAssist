using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Stock movement/transaction record
/// </summary>
public class StockMovement : BaseEntity
{
    public int ProductId { get; set; }
    public int? ProductBatchId { get; set; }
    public int WarehouseId { get; set; }
    
    public StockMovementType MovementType { get; set; }
    public int Quantity { get; set; }
    
    // Reference to source document
    public int? OrderId { get; set; }
    public int? PurchaseOrderId { get; set; }
    public string? ReferenceNumber { get; set; }
    
    public string? Reason { get; set; }
    public string? Notes { get; set; }
    
    // User who performed the movement
    public string? PerformedByUserId { get; set; }
    public DateTime MovementDate { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Product Product { get; set; } = null!;
    public virtual ProductBatch? ProductBatch { get; set; }
    public virtual Warehouse Warehouse { get; set; } = null!;
    public virtual Order? Order { get; set; }
    public virtual ApplicationUser? PerformedByUser { get; set; }
}
