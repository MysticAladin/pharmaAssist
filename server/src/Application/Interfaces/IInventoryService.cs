using Application.DTOs.Common;
using Application.DTOs.Inventory;
using Domain.Enums;

namespace Application.Interfaces;

/// <summary>
/// Inventory service interface
/// </summary>
public interface IInventoryService
{
    // Warehouse operations
    Task<ApiResponse<WarehouseDto>> GetWarehouseByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<WarehouseDto>>> GetAllWarehousesAsync(bool activeOnly = true, CancellationToken cancellationToken = default);
    Task<ApiResponse<WarehouseDto>> CreateWarehouseAsync(CreateWarehouseDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<WarehouseDto>> UpdateWarehouseAsync(int id, UpdateWarehouseDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteWarehouseAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> SetDefaultWarehouseAsync(int id, CancellationToken cancellationToken = default);
    
    // Stock operations
    Task<ApiResponse<InventoryStockDto>> GetStockByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<InventoryStockDto>>> GetStockByWarehouseAsync(int warehouseId, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<InventoryStockDto>>> GetStockByProductAsync(int productId, CancellationToken cancellationToken = default);
    Task<ApiResponse<ProductStockSummaryDto>> GetProductStockSummaryAsync(int productId, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<LowStockAlertDto>>> GetLowStockAlertsAsync(CancellationToken cancellationToken = default);
    
    // Stock movements
    Task<ApiResponse<StockMovementDto>> GetMovementByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<PagedResponse<StockMovementDto>> GetMovementsPagedAsync(
        int page,
        int pageSize,
        int? warehouseId = null,
        int? productId = null,
        StockMovementType? movementType = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken cancellationToken = default);
    Task<ApiResponse<StockMovementDto>> CreateMovementAsync(CreateStockMovementDto dto, string userId, CancellationToken cancellationToken = default);
    
    // Stock adjustments
    Task<ApiResponse<StockMovementDto>> AdjustStockAsync(StockAdjustmentDto dto, string userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<StockMovementDto>>> TransferStockAsync(StockTransferDto dto, string userId, CancellationToken cancellationToken = default);
    
    // Stock receiving
    Task<ApiResponse<IEnumerable<StockMovementDto>>> ReceiveStockAsync(
        int warehouseId,
        IEnumerable<(int productId, int? batchId, int quantity)> items,
        string referenceNumber,
        string userId,
        CancellationToken cancellationToken = default);
    
    // Stock reservations
    Task<ApiResponse<bool>> ReserveStockAsync(int warehouseId, int productId, int? batchId, int quantity, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> ReleaseReservedStockAsync(int warehouseId, int productId, int? batchId, int quantity, CancellationToken cancellationToken = default);
}
