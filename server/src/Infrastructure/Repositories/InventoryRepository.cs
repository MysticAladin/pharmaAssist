using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

/// <summary>
/// Inventory repository implementation
/// </summary>
public class InventoryRepository : IInventoryRepository
{
    private readonly ApplicationDbContext _context;

    public InventoryRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    #region Warehouse Operations

    public async Task<IReadOnlyList<Warehouse>> GetAllWarehousesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Warehouses
            .Include(w => w.City)
            .OrderBy(w => w.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Warehouse>> GetActiveWarehousesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Warehouses
            .Where(w => w.IsActive)
            .Include(w => w.City)
            .OrderBy(w => w.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Warehouse?> GetWarehouseByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Warehouses
            .Include(w => w.City)
            .FirstOrDefaultAsync(w => w.Id == id, cancellationToken);
    }

    public async Task<Warehouse?> GetWarehouseByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        return await _context.Warehouses
            .Include(w => w.City)
            .FirstOrDefaultAsync(w => w.Code == code, cancellationToken);
    }

    public async Task<Warehouse?> GetDefaultWarehouseAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Warehouses
            .Include(w => w.City)
            .FirstOrDefaultAsync(w => w.IsDefault && w.IsActive, cancellationToken);
    }

    public async Task<Warehouse> AddWarehouseAsync(Warehouse warehouse, CancellationToken cancellationToken = default)
    {
        await _context.Warehouses.AddAsync(warehouse, cancellationToken);
        return warehouse;
    }

    public Task UpdateWarehouseAsync(Warehouse warehouse, CancellationToken cancellationToken = default)
    {
        _context.Entry(warehouse).State = EntityState.Modified;
        return Task.CompletedTask;
    }

    #endregion

    #region Inventory Stock Operations

    public async Task<InventoryStock?> GetStockByProductAsync(int productId, int warehouseId, CancellationToken cancellationToken = default)
    {
        return await _context.InventoryStocks
            .Include(s => s.Product)
            .Include(s => s.Warehouse)
            .FirstOrDefaultAsync(s => s.ProductId == productId && 
                                      s.WarehouseId == warehouseId && 
                                      s.ProductBatchId == null, cancellationToken);
    }

    public async Task<InventoryStock?> GetStockByBatchAsync(int productId, int batchId, int warehouseId, CancellationToken cancellationToken = default)
    {
        return await _context.InventoryStocks
            .Include(s => s.Product)
            .Include(s => s.ProductBatch)
            .Include(s => s.Warehouse)
            .FirstOrDefaultAsync(s => s.ProductId == productId && 
                                      s.ProductBatchId == batchId && 
                                      s.WarehouseId == warehouseId, cancellationToken);
    }

    public async Task<IReadOnlyList<InventoryStock>> GetStocksByWarehouseAsync(int warehouseId, CancellationToken cancellationToken = default)
    {
        return await _context.InventoryStocks
            .Where(s => s.WarehouseId == warehouseId)
            .Include(s => s.Product)
            .Include(s => s.ProductBatch)
            .OrderBy(s => s.Product.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<InventoryStock>> GetLowStockItemsAsync(int warehouseId, CancellationToken cancellationToken = default)
    {
        return await _context.InventoryStocks
            .Where(s => s.WarehouseId == warehouseId && 
                        s.QuantityOnHand <= s.ReorderLevel)
            .Include(s => s.Product)
            .OrderBy(s => s.QuantityOnHand)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetTotalStockQuantityAsync(int productId, CancellationToken cancellationToken = default)
    {
        return await _context.InventoryStocks
            .Where(s => s.ProductId == productId)
            .SumAsync(s => s.QuantityOnHand, cancellationToken);
    }

    public async Task<int> GetAvailableStockQuantityAsync(int productId, int warehouseId, CancellationToken cancellationToken = default)
    {
        var stock = await _context.InventoryStocks
            .Where(s => s.ProductId == productId && s.WarehouseId == warehouseId)
            .SumAsync(s => s.QuantityOnHand - s.QuantityReserved, cancellationToken);
        return stock;
    }

    public async Task<InventoryStock> AddStockAsync(InventoryStock stock, CancellationToken cancellationToken = default)
    {
        await _context.InventoryStocks.AddAsync(stock, cancellationToken);
        return stock;
    }

    public Task UpdateStockAsync(InventoryStock stock, CancellationToken cancellationToken = default)
    {
        _context.Entry(stock).State = EntityState.Modified;
        return Task.CompletedTask;
    }

    #endregion

    #region Product Batch Operations

    public async Task<IReadOnlyList<ProductBatch>> GetBatchesByProductAsync(int productId, CancellationToken cancellationToken = default)
    {
        return await _context.ProductBatches
            .Where(b => b.ProductId == productId)
            .OrderBy(b => b.ExpiryDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ProductBatch>> GetActiveBatchesByProductAsync(int productId, CancellationToken cancellationToken = default)
    {
        return await _context.ProductBatches
            .Where(b => b.ProductId == productId && 
                        b.IsActive && 
                        b.ExpiryDate > DateTime.UtcNow)
            .OrderBy(b => b.ExpiryDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ProductBatch>> GetExpiringBatchesAsync(DateTime beforeDate, CancellationToken cancellationToken = default)
    {
        return await _context.ProductBatches
            .Where(b => b.IsActive && 
                        b.ExpiryDate <= beforeDate && 
                        b.ExpiryDate > DateTime.UtcNow)
            .Include(b => b.Product)
            .OrderBy(b => b.ExpiryDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ProductBatch>> GetExpiredBatchesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.ProductBatches
            .Where(b => b.ExpiryDate <= DateTime.UtcNow)
            .Include(b => b.Product)
            .OrderBy(b => b.ExpiryDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<ProductBatch?> GetBatchByNumberAsync(int productId, string batchNumber, CancellationToken cancellationToken = default)
    {
        return await _context.ProductBatches
            .Include(b => b.Product)
            .FirstOrDefaultAsync(b => b.ProductId == productId && 
                                      b.BatchNumber == batchNumber, cancellationToken);
    }

    public async Task<ProductBatch> AddBatchAsync(ProductBatch batch, CancellationToken cancellationToken = default)
    {
        await _context.ProductBatches.AddAsync(batch, cancellationToken);
        return batch;
    }

    public Task UpdateBatchAsync(ProductBatch batch, CancellationToken cancellationToken = default)
    {
        _context.Entry(batch).State = EntityState.Modified;
        return Task.CompletedTask;
    }

    #endregion

    #region Stock Movement Operations

    public async Task<IReadOnlyList<StockMovement>> GetMovementsByProductAsync(int productId, CancellationToken cancellationToken = default)
    {
        return await _context.StockMovements
            .Where(m => m.ProductId == productId)
            .Include(m => m.Warehouse)
            .OrderByDescending(m => m.MovementDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<StockMovement>> GetMovementsByWarehouseAsync(int warehouseId, CancellationToken cancellationToken = default)
    {
        return await _context.StockMovements
            .Where(m => m.WarehouseId == warehouseId)
            .Include(m => m.Product)
            .OrderByDescending(m => m.MovementDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<StockMovement>> GetMovementsByDateRangeAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default)
    {
        return await _context.StockMovements
            .Where(m => m.MovementDate >= startDate && m.MovementDate <= endDate)
            .Include(m => m.Product)
            .Include(m => m.Warehouse)
            .OrderByDescending(m => m.MovementDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<StockMovement>> GetMovementsByTypeAsync(StockMovementType type, CancellationToken cancellationToken = default)
    {
        return await _context.StockMovements
            .Where(m => m.MovementType == type)
            .Include(m => m.Product)
            .Include(m => m.Warehouse)
            .OrderByDescending(m => m.MovementDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<StockMovement> RecordMovementAsync(StockMovement movement, CancellationToken cancellationToken = default)
    {
        await _context.StockMovements.AddAsync(movement, cancellationToken);
        return movement;
    }

    #endregion

    #region Complex Operations

    public async Task<bool> ReserveStockAsync(int productId, int warehouseId, int quantity, CancellationToken cancellationToken = default)
    {
        var stock = await GetStockByProductAsync(productId, warehouseId, cancellationToken);
        if (stock == null || stock.QuantityOnHand - stock.QuantityReserved < quantity)
        {
            return false;
        }

        stock.QuantityReserved += quantity;
        await UpdateStockAsync(stock, cancellationToken);
        return true;
    }

    public async Task<bool> ReleaseReservationAsync(int productId, int warehouseId, int quantity, CancellationToken cancellationToken = default)
    {
        var stock = await GetStockByProductAsync(productId, warehouseId, cancellationToken);
        if (stock == null || stock.QuantityReserved < quantity)
        {
            return false;
        }

        stock.QuantityReserved -= quantity;
        await UpdateStockAsync(stock, cancellationToken);
        return true;
    }

    public async Task TransferStockAsync(int productId, int sourceWarehouseId, int destinationWarehouseId, int quantity, string userId, CancellationToken cancellationToken = default)
    {
        // Get source stock
        var sourceStock = await GetStockByProductAsync(productId, sourceWarehouseId, cancellationToken);
        if (sourceStock == null || sourceStock.QuantityOnHand < quantity)
        {
            throw new InvalidOperationException("Insufficient stock in source warehouse");
        }

        // Reduce source stock
        sourceStock.QuantityOnHand -= quantity;
        sourceStock.LastMovementDate = DateTime.UtcNow;
        await UpdateStockAsync(sourceStock, cancellationToken);

        // Get or create destination stock
        var destStock = await GetStockByProductAsync(productId, destinationWarehouseId, cancellationToken);
        if (destStock == null)
        {
            destStock = new InventoryStock
            {
                ProductId = productId,
                WarehouseId = destinationWarehouseId,
                QuantityOnHand = quantity,
                LastMovementDate = DateTime.UtcNow
            };
            await AddStockAsync(destStock, cancellationToken);
        }
        else
        {
            destStock.QuantityOnHand += quantity;
            destStock.LastMovementDate = DateTime.UtcNow;
            await UpdateStockAsync(destStock, cancellationToken);
        }

        // Record movements
        await RecordMovementAsync(new StockMovement
        {
            ProductId = productId,
            WarehouseId = sourceWarehouseId,
            MovementType = StockMovementType.Transfer,
            Quantity = -quantity,
            Reason = $"Transfer to warehouse {destinationWarehouseId}",
            PerformedByUserId = userId,
            MovementDate = DateTime.UtcNow
        }, cancellationToken);

        await RecordMovementAsync(new StockMovement
        {
            ProductId = productId,
            WarehouseId = destinationWarehouseId,
            MovementType = StockMovementType.Transfer,
            Quantity = quantity,
            Reason = $"Transfer from warehouse {sourceWarehouseId}",
            PerformedByUserId = userId,
            MovementDate = DateTime.UtcNow
        }, cancellationToken);
    }

    #endregion
}
