using Domain.Enums;

namespace Application.DTOs.Inventory;

/// <summary>
/// Warehouse response DTO
/// </summary>
public class WarehouseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsManufacturing { get; set; }
    public bool CanFulfillOrders { get; set; }
    public int CityId { get; set; }
    public string CityName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? ContactPhone { get; set; }
    public bool IsActive { get; set; }
    public bool IsDefault { get; set; }
    public int StockItemCount { get; set; }
}

/// <summary>
/// Create warehouse request DTO
/// </summary>
public class CreateWarehouseDto
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsManufacturing { get; set; }
    public bool CanFulfillOrders { get; set; }
    public int CityId { get; set; }
    public string Address { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? ContactPhone { get; set; }
    public bool IsDefault { get; set; }
}

/// <summary>
/// Update warehouse request DTO
/// </summary>
public class UpdateWarehouseDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsManufacturing { get; set; }
    public bool CanFulfillOrders { get; set; }
    public int CityId { get; set; }
    public string Address { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? ContactPhone { get; set; }
    public bool IsActive { get; set; }
    public bool IsDefault { get; set; }
}

/// <summary>
/// Inventory stock response DTO
/// </summary>
public class InventoryStockDto
{
    public int Id { get; set; }
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public string? PackageSize { get; set; }
    public int? ProductBatchId { get; set; }
    public string? BatchNumber { get; set; }
    public int QuantityOnHand { get; set; }
    public int QuantityReserved { get; set; }
    public int QuantityAvailable => QuantityOnHand - QuantityReserved;
    public int MinimumStockLevel { get; set; }
    public int ReorderPoint { get; set; }
    public int MaximumStockLevel { get; set; }
    public DateTime? EarliestExpiryDate { get; set; }
    public bool IsLowStock => QuantityAvailable <= ReorderPoint;
    public bool IsBelowMinimum => QuantityAvailable < MinimumStockLevel;
    public DateTime LastUpdated { get; set; }
}

/// <summary>
/// Stock summary for a product across all warehouses
/// </summary>
public class ProductStockSummaryDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public int TotalOnHand { get; set; }
    public int TotalReserved { get; set; }
    public int TotalAvailable => TotalOnHand - TotalReserved;
    public List<WarehouseStockDto> WarehouseStocks { get; set; } = new();
}

/// <summary>
/// Stock per warehouse
/// </summary>
public class WarehouseStockDto
{
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public int QuantityOnHand { get; set; }
    public int QuantityReserved { get; set; }
    public int QuantityAvailable => QuantityOnHand - QuantityReserved;
}

/// <summary>
/// Stock movement response DTO
/// </summary>
public class StockMovementDto
{
    public int Id { get; set; }
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int? ProductBatchId { get; set; }
    public string? BatchNumber { get; set; }
    public StockMovementType MovementType { get; set; }
    public string MovementTypeName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? ReferenceType { get; set; }
    public int? ReferenceId { get; set; }
    public string? Notes { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Create stock movement request DTO
/// </summary>
public class CreateStockMovementDto
{
    public int WarehouseId { get; set; }
    public int ProductId { get; set; }
    public int? ProductBatchId { get; set; }
    public StockMovementType MovementType { get; set; }
    public int Quantity { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? ReferenceType { get; set; }
    public int? ReferenceId { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Stock adjustment request DTO
/// </summary>
public class StockAdjustmentDto
{
    public int WarehouseId { get; set; }
    public int ProductId { get; set; }
    public int? ProductBatchId { get; set; }
    public int NewQuantity { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

/// <summary>
/// Stock transfer request DTO
/// </summary>
public class StockTransferDto
{
    public int SourceWarehouseId { get; set; }
    public int DestinationWarehouseId { get; set; }
    public int ProductId { get; set; }
    public int? ProductBatchId { get; set; }
    public int Quantity { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Low stock alert DTO
/// </summary>
public class LowStockAlertDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public int QuantityAvailable { get; set; }
    public int ReorderPoint { get; set; }
    public int MinimumStockLevel { get; set; }
    public string Severity { get; set; } = string.Empty; // "Warning" or "Critical"
}

/// <summary>
/// Expiring product DTO
/// </summary>
public class ExpiringProductDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public int? BatchId { get; set; }
    public string? BatchNumber { get; set; }
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int DaysUntilExpiry { get; set; }
    public string Severity { get; set; } = string.Empty; // "Warning", "Critical", or "Expired"
}
