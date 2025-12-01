using Domain.Entities;
using Domain.Enums;

namespace Domain.Interfaces;

/// <summary>
/// Inventory repository for stock management
/// </summary>
public interface IInventoryRepository
{
    // Warehouse operations
    Task<IReadOnlyList<Warehouse>> GetAllWarehousesAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Warehouse>> GetActiveWarehousesAsync(CancellationToken cancellationToken = default);
    Task<Warehouse?> GetWarehouseByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Warehouse?> GetWarehouseByCodeAsync(string code, CancellationToken cancellationToken = default);
    Task<Warehouse?> GetDefaultWarehouseAsync(CancellationToken cancellationToken = default);
    Task<Warehouse> AddWarehouseAsync(Warehouse warehouse, CancellationToken cancellationToken = default);
    Task UpdateWarehouseAsync(Warehouse warehouse, CancellationToken cancellationToken = default);

    // Inventory Stock operations
    Task<InventoryStock?> GetStockByProductAsync(int productId, int warehouseId, CancellationToken cancellationToken = default);
    Task<InventoryStock?> GetStockByBatchAsync(int productId, int batchId, int warehouseId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<InventoryStock>> GetStocksByWarehouseAsync(int warehouseId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<InventoryStock>> GetLowStockItemsAsync(int warehouseId, CancellationToken cancellationToken = default);
    Task<int> GetTotalStockQuantityAsync(int productId, CancellationToken cancellationToken = default);
    Task<int> GetAvailableStockQuantityAsync(int productId, int warehouseId, CancellationToken cancellationToken = default);
    Task<InventoryStock> AddStockAsync(InventoryStock stock, CancellationToken cancellationToken = default);
    Task UpdateStockAsync(InventoryStock stock, CancellationToken cancellationToken = default);

    // Product Batch operations
    Task<IReadOnlyList<ProductBatch>> GetBatchesByProductAsync(int productId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ProductBatch>> GetActiveBatchesByProductAsync(int productId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ProductBatch>> GetExpiringBatchesAsync(DateTime beforeDate, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ProductBatch>> GetExpiredBatchesAsync(CancellationToken cancellationToken = default);
    Task<ProductBatch?> GetBatchByNumberAsync(int productId, string batchNumber, CancellationToken cancellationToken = default);
    Task<ProductBatch> AddBatchAsync(ProductBatch batch, CancellationToken cancellationToken = default);
    Task UpdateBatchAsync(ProductBatch batch, CancellationToken cancellationToken = default);

    // Stock Movement operations
    Task<IReadOnlyList<StockMovement>> GetMovementsByProductAsync(int productId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<StockMovement>> GetMovementsByWarehouseAsync(int warehouseId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<StockMovement>> GetMovementsByDateRangeAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<StockMovement>> GetMovementsByTypeAsync(StockMovementType type, CancellationToken cancellationToken = default);
    Task<StockMovement> RecordMovementAsync(StockMovement movement, CancellationToken cancellationToken = default);
    
    // Complex operations
    Task<bool> ReserveStockAsync(int productId, int warehouseId, int quantity, CancellationToken cancellationToken = default);
    Task<bool> ReleaseReservationAsync(int productId, int warehouseId, int quantity, CancellationToken cancellationToken = default);
    Task TransferStockAsync(int productId, int sourceWarehouseId, int destinationWarehouseId, int quantity, string userId, CancellationToken cancellationToken = default);
}
