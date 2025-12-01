using Application.DTOs.Common;
using Application.DTOs.Inventory;
using Application.Interfaces;
using AutoMapper;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;

namespace Application.Services;

/// <summary>
/// Inventory service implementation
/// </summary>
public class InventoryService : IInventoryService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public InventoryService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    #region Warehouse Operations

    public async Task<ApiResponse<WarehouseDto>> GetWarehouseByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var warehouse = await _unitOfWork.Inventory.GetWarehouseByIdAsync(id, cancellationToken);
        
        if (warehouse == null)
            return ApiResponse<WarehouseDto>.Fail($"Warehouse with ID {id} not found.");

        var dto = MapWarehouseToDto(warehouse);
        return ApiResponse<WarehouseDto>.Ok(dto);
    }

    public async Task<ApiResponse<IEnumerable<WarehouseDto>>> GetAllWarehousesAsync(bool activeOnly = true, CancellationToken cancellationToken = default)
    {
        var warehouses = activeOnly 
            ? await _unitOfWork.Inventory.GetActiveWarehousesAsync(cancellationToken)
            : await _unitOfWork.Inventory.GetAllWarehousesAsync(cancellationToken);

        var dtos = warehouses.Select(MapWarehouseToDto);
        return ApiResponse<IEnumerable<WarehouseDto>>.Ok(dtos);
    }

    public async Task<ApiResponse<WarehouseDto>> CreateWarehouseAsync(CreateWarehouseDto dto, CancellationToken cancellationToken = default)
    {
        // Check if code already exists
        var existing = await _unitOfWork.Inventory.GetWarehouseByCodeAsync(dto.Code, cancellationToken);
        if (existing != null)
            return ApiResponse<WarehouseDto>.Fail($"Warehouse with code '{dto.Code}' already exists.");

        var warehouse = new Warehouse
        {
            Name = dto.Name,
            NameLocal = dto.Name, // Use same name for local
            Code = dto.Code.ToUpperInvariant(),
            CityId = dto.CityId,
            Address = dto.Address,
            ContactPhone = dto.ContactPhone,
            IsActive = true,
            IsDefault = dto.IsDefault
        };

        // If this is set as default, remove default from others
        if (dto.IsDefault)
        {
            await ClearDefaultWarehouseAsync(cancellationToken);
        }

        var created = await _unitOfWork.Inventory.AddWarehouseAsync(warehouse, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var resultDto = MapWarehouseToDto(created);
        return ApiResponse<WarehouseDto>.Ok(resultDto, "Warehouse created successfully.");
    }

    public async Task<ApiResponse<WarehouseDto>> UpdateWarehouseAsync(int id, UpdateWarehouseDto dto, CancellationToken cancellationToken = default)
    {
        var warehouse = await _unitOfWork.Inventory.GetWarehouseByIdAsync(id, cancellationToken);
        
        if (warehouse == null)
            return ApiResponse<WarehouseDto>.Fail($"Warehouse with ID {id} not found.");

        warehouse.Name = dto.Name;
        warehouse.NameLocal = dto.Name;
        warehouse.CityId = dto.CityId;
        warehouse.Address = dto.Address;
        warehouse.ContactPhone = dto.ContactPhone;
        warehouse.IsActive = dto.IsActive;
        
        // Handle default change
        if (dto.IsDefault && !warehouse.IsDefault)
        {
            await ClearDefaultWarehouseAsync(cancellationToken);
            warehouse.IsDefault = true;
        }
        else if (!dto.IsDefault && warehouse.IsDefault)
        {
            warehouse.IsDefault = false;
        }

        await _unitOfWork.Inventory.UpdateWarehouseAsync(warehouse, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var resultDto = MapWarehouseToDto(warehouse);
        return ApiResponse<WarehouseDto>.Ok(resultDto);
    }

    public async Task<ApiResponse<bool>> DeleteWarehouseAsync(int id, CancellationToken cancellationToken = default)
    {
        var warehouse = await _unitOfWork.Inventory.GetWarehouseByIdAsync(id, cancellationToken);
        
        if (warehouse == null)
            return ApiResponse<bool>.Fail($"Warehouse with ID {id} not found.");

        // Check for existing stock
        var stocks = await _unitOfWork.Inventory.GetStocksByWarehouseAsync(id, cancellationToken);
        if (stocks.Any(s => s.QuantityOnHand > 0))
            return ApiResponse<bool>.Fail("Cannot delete warehouse with existing stock. Transfer or adjust stock first.");

        // Soft delete by deactivating
        warehouse.IsActive = false;
        warehouse.IsDefault = false;
        
        await _unitOfWork.Inventory.UpdateWarehouseAsync(warehouse, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.Ok(true, "Warehouse deactivated successfully.");
    }

    public async Task<ApiResponse<bool>> SetDefaultWarehouseAsync(int id, CancellationToken cancellationToken = default)
    {
        var warehouse = await _unitOfWork.Inventory.GetWarehouseByIdAsync(id, cancellationToken);
        
        if (warehouse == null)
            return ApiResponse<bool>.Fail($"Warehouse with ID {id} not found.");

        if (!warehouse.IsActive)
            return ApiResponse<bool>.Fail("Cannot set an inactive warehouse as default.");

        await ClearDefaultWarehouseAsync(cancellationToken);
        warehouse.IsDefault = true;
        
        await _unitOfWork.Inventory.UpdateWarehouseAsync(warehouse, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.Ok(true, "Default warehouse updated successfully.");
    }

    #endregion

    #region Stock Operations

    public async Task<ApiResponse<InventoryStockDto>> GetStockByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        // Note: Would need a GetStockByIdAsync method in repository
        return ApiResponse<InventoryStockDto>.Fail("GetStockByIdAsync not implemented. Requires repository method.");
    }

    public async Task<ApiResponse<IEnumerable<InventoryStockDto>>> GetStockByWarehouseAsync(int warehouseId, CancellationToken cancellationToken = default)
    {
        var stocks = await _unitOfWork.Inventory.GetStocksByWarehouseAsync(warehouseId, cancellationToken);
        var dtos = stocks.Select(MapStockToDto);
        return ApiResponse<IEnumerable<InventoryStockDto>>.Ok(dtos);
    }

    public async Task<ApiResponse<IEnumerable<InventoryStockDto>>> GetStockByProductAsync(int productId, CancellationToken cancellationToken = default)
    {
        var warehouses = await _unitOfWork.Inventory.GetActiveWarehousesAsync(cancellationToken);
        var stocks = new List<InventoryStockDto>();

        foreach (var warehouse in warehouses)
        {
            var stock = await _unitOfWork.Inventory.GetStockByProductAsync(productId, warehouse.Id, cancellationToken);
            if (stock != null)
            {
                stocks.Add(MapStockToDto(stock));
            }
        }

        return ApiResponse<IEnumerable<InventoryStockDto>>.Ok(stocks);
    }

    public async Task<ApiResponse<ProductStockSummaryDto>> GetProductStockSummaryAsync(int productId, CancellationToken cancellationToken = default)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(productId, cancellationToken);
        if (product == null)
            return ApiResponse<ProductStockSummaryDto>.Fail($"Product with ID {productId} not found.");

        var totalQuantity = await _unitOfWork.Inventory.GetTotalStockQuantityAsync(productId, cancellationToken);
        
        var warehouses = await _unitOfWork.Inventory.GetActiveWarehousesAsync(cancellationToken);
        var warehouseStocks = new List<WarehouseStockDto>();

        foreach (var warehouse in warehouses)
        {
            var stock = await _unitOfWork.Inventory.GetStockByProductAsync(productId, warehouse.Id, cancellationToken);
            if (stock != null)
            {
                warehouseStocks.Add(new WarehouseStockDto
                {
                    WarehouseId = warehouse.Id,
                    WarehouseName = warehouse.Name,
                    QuantityOnHand = stock.QuantityOnHand,
                    QuantityReserved = stock.QuantityReserved
                });
            }
        }

        var summary = new ProductStockSummaryDto
        {
            ProductId = productId,
            ProductName = product.Name,
            ProductSku = product.SKU,
            TotalOnHand = warehouseStocks.Sum(s => s.QuantityOnHand),
            TotalReserved = warehouseStocks.Sum(s => s.QuantityReserved),
            WarehouseStocks = warehouseStocks
        };

        return ApiResponse<ProductStockSummaryDto>.Ok(summary);
    }

    public async Task<ApiResponse<IEnumerable<LowStockAlertDto>>> GetLowStockAlertsAsync(CancellationToken cancellationToken = default)
    {
        var warehouses = await _unitOfWork.Inventory.GetActiveWarehousesAsync(cancellationToken);
        var alerts = new List<LowStockAlertDto>();

        foreach (var warehouse in warehouses)
        {
            var lowStockItems = await _unitOfWork.Inventory.GetLowStockItemsAsync(warehouse.Id, cancellationToken);
            
            foreach (var stock in lowStockItems)
            {
                var product = await _unitOfWork.Products.GetByIdAsync(stock.ProductId, cancellationToken);
                if (product != null)
                {
                    var available = stock.QuantityOnHand - stock.QuantityReserved;
                    alerts.Add(new LowStockAlertDto
                    {
                        ProductId = stock.ProductId,
                        ProductName = product.Name,
                        ProductSku = product.SKU,
                        WarehouseId = warehouse.Id,
                        WarehouseName = warehouse.Name,
                        QuantityAvailable = available,
                        ReorderPoint = stock.ReorderLevel,
                        MinimumStockLevel = stock.ReorderLevel,
                        Severity = available < stock.ReorderLevel / 2 ? "Critical" : "Warning"
                    });
                }
            }
        }

        return ApiResponse<IEnumerable<LowStockAlertDto>>.Ok(alerts);
    }

    #endregion

    #region Stock Movements

    public async Task<ApiResponse<StockMovementDto>> GetMovementByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        // Note: Would need GetByIdAsync in repository
        return ApiResponse<StockMovementDto>.Fail("GetMovementByIdAsync not implemented. Requires repository method.");
    }

    public async Task<PagedResponse<StockMovementDto>> GetMovementsPagedAsync(
        int page,
        int pageSize,
        int? warehouseId = null,
        int? productId = null,
        StockMovementType? movementType = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<StockMovement> movements;

        if (warehouseId.HasValue)
        {
            movements = await _unitOfWork.Inventory.GetMovementsByWarehouseAsync(warehouseId.Value, cancellationToken);
        }
        else if (productId.HasValue)
        {
            movements = await _unitOfWork.Inventory.GetMovementsByProductAsync(productId.Value, cancellationToken);
        }
        else if (fromDate.HasValue && toDate.HasValue)
        {
            movements = await _unitOfWork.Inventory.GetMovementsByDateRangeAsync(fromDate.Value, toDate.Value, cancellationToken);
        }
        else if (movementType.HasValue)
        {
            movements = await _unitOfWork.Inventory.GetMovementsByTypeAsync(movementType.Value, cancellationToken);
        }
        else
        {
            movements = await _unitOfWork.Inventory.GetMovementsByDateRangeAsync(
                DateTime.UtcNow.AddMonths(-1), 
                DateTime.UtcNow, 
                cancellationToken);
        }

        // Apply additional filters
        var filtered = movements.AsEnumerable();

        if (warehouseId.HasValue)
            filtered = filtered.Where(m => m.WarehouseId == warehouseId.Value);
        
        if (productId.HasValue)
            filtered = filtered.Where(m => m.ProductId == productId.Value);
        
        if (movementType.HasValue)
            filtered = filtered.Where(m => m.MovementType == movementType.Value);
        
        if (fromDate.HasValue)
            filtered = filtered.Where(m => m.CreatedAt >= fromDate.Value);
        
        if (toDate.HasValue)
            filtered = filtered.Where(m => m.CreatedAt <= toDate.Value);

        var filteredList = filtered.OrderByDescending(m => m.CreatedAt).ToList();
        var totalCount = filteredList.Count;

        var pagedItems = new List<StockMovementDto>();
        foreach (var movement in filteredList.Skip((page - 1) * pageSize).Take(pageSize))
        {
            pagedItems.Add(await MapMovementToDtoAsync(movement, cancellationToken));
        }

        return PagedResponse<StockMovementDto>.Create(pagedItems, totalCount, page, pageSize);
    }

    public async Task<ApiResponse<StockMovementDto>> CreateMovementAsync(CreateStockMovementDto dto, string userId, CancellationToken cancellationToken = default)
    {
        var warehouse = await _unitOfWork.Inventory.GetWarehouseByIdAsync(dto.WarehouseId, cancellationToken);
        if (warehouse == null)
            return ApiResponse<StockMovementDto>.Fail($"Warehouse with ID {dto.WarehouseId} not found.");

        var product = await _unitOfWork.Products.GetByIdAsync(dto.ProductId, cancellationToken);
        if (product == null)
            return ApiResponse<StockMovementDto>.Fail($"Product with ID {dto.ProductId} not found.");

        var movement = new StockMovement
        {
            WarehouseId = dto.WarehouseId,
            ProductId = dto.ProductId,
            ProductBatchId = dto.ProductBatchId,
            MovementType = dto.MovementType,
            Quantity = dto.Quantity,
            ReferenceNumber = dto.ReferenceNumber,
            Notes = dto.Notes,
            PerformedByUserId = userId,
            MovementDate = DateTime.UtcNow
        };

        // Update stock based on movement type
        await UpdateStockForMovementAsync(movement, cancellationToken);

        var created = await _unitOfWork.Inventory.RecordMovementAsync(movement, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var resultDto = await MapMovementToDtoAsync(created, cancellationToken);
        return ApiResponse<StockMovementDto>.Ok(resultDto, "Stock movement recorded successfully.");
    }

    #endregion

    #region Stock Adjustments

    public async Task<ApiResponse<StockMovementDto>> AdjustStockAsync(StockAdjustmentDto dto, string userId, CancellationToken cancellationToken = default)
    {
        var warehouse = await _unitOfWork.Inventory.GetWarehouseByIdAsync(dto.WarehouseId, cancellationToken);
        if (warehouse == null)
            return ApiResponse<StockMovementDto>.Fail($"Warehouse with ID {dto.WarehouseId} not found.");

        var product = await _unitOfWork.Products.GetByIdAsync(dto.ProductId, cancellationToken);
        if (product == null)
            return ApiResponse<StockMovementDto>.Fail($"Product with ID {dto.ProductId} not found.");

        var currentStock = await _unitOfWork.Inventory.GetStockByProductAsync(dto.ProductId, dto.WarehouseId, cancellationToken);
        var currentQuantity = currentStock?.QuantityOnHand ?? 0;
        var adjustmentQuantity = dto.NewQuantity - currentQuantity;

        if (adjustmentQuantity == 0)
            return ApiResponse<StockMovementDto>.Fail("No adjustment needed. New quantity equals current quantity.");

        var movementType = StockMovementType.Adjustment;

        var movement = new StockMovement
        {
            WarehouseId = dto.WarehouseId,
            ProductId = dto.ProductId,
            ProductBatchId = dto.ProductBatchId,
            MovementType = movementType,
            Quantity = Math.Abs(adjustmentQuantity),
            Reason = dto.Reason,
            Notes = dto.Notes,
            PerformedByUserId = userId,
            MovementDate = DateTime.UtcNow
        };

        // Update the stock
        if (currentStock == null)
        {
            var newStock = new InventoryStock
            {
                WarehouseId = dto.WarehouseId,
                ProductId = dto.ProductId,
                ProductBatchId = dto.ProductBatchId,
                QuantityOnHand = dto.NewQuantity,
                QuantityReserved = 0
            };
            await _unitOfWork.Inventory.AddStockAsync(newStock, cancellationToken);
        }
        else
        {
            currentStock.QuantityOnHand = dto.NewQuantity;
            await _unitOfWork.Inventory.UpdateStockAsync(currentStock, cancellationToken);
        }

        var created = await _unitOfWork.Inventory.RecordMovementAsync(movement, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var resultDto = await MapMovementToDtoAsync(created, cancellationToken);
        return ApiResponse<StockMovementDto>.Ok(resultDto);
    }

    public async Task<ApiResponse<IEnumerable<StockMovementDto>>> TransferStockAsync(StockTransferDto dto, string userId, CancellationToken cancellationToken = default)
    {
        if (dto.SourceWarehouseId == dto.DestinationWarehouseId)
            return ApiResponse<IEnumerable<StockMovementDto>>.Fail("Source and destination warehouses must be different.");

        var sourceWarehouse = await _unitOfWork.Inventory.GetWarehouseByIdAsync(dto.SourceWarehouseId, cancellationToken);
        if (sourceWarehouse == null)
            return ApiResponse<IEnumerable<StockMovementDto>>.Fail($"Source warehouse with ID {dto.SourceWarehouseId} not found.");

        var destWarehouse = await _unitOfWork.Inventory.GetWarehouseByIdAsync(dto.DestinationWarehouseId, cancellationToken);
        if (destWarehouse == null)
            return ApiResponse<IEnumerable<StockMovementDto>>.Fail($"Destination warehouse with ID {dto.DestinationWarehouseId} not found.");

        var product = await _unitOfWork.Products.GetByIdAsync(dto.ProductId, cancellationToken);
        if (product == null)
            return ApiResponse<IEnumerable<StockMovementDto>>.Fail($"Product with ID {dto.ProductId} not found.");

        // Check source stock
        var availableStock = await _unitOfWork.Inventory.GetAvailableStockQuantityAsync(dto.ProductId, dto.SourceWarehouseId, cancellationToken);
        if (availableStock < dto.Quantity)
            return ApiResponse<IEnumerable<StockMovementDto>>.Fail($"Insufficient stock. Available: {availableStock}, Requested: {dto.Quantity}");

        await _unitOfWork.Inventory.TransferStockAsync(
            dto.ProductId, 
            dto.SourceWarehouseId, 
            dto.DestinationWarehouseId, 
            dto.Quantity, 
            userId, 
            cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Get recent transfer movements
        var recentMovements = await _unitOfWork.Inventory.GetMovementsByDateRangeAsync(
            DateTime.UtcNow.AddMinutes(-1), 
            DateTime.UtcNow.AddMinutes(1), 
            cancellationToken);

        var transferMovements = new List<StockMovementDto>();
        foreach (var movement in recentMovements.Where(m => 
            m.ProductId == dto.ProductId && 
            m.MovementType == StockMovementType.Transfer))
        {
            transferMovements.Add(await MapMovementToDtoAsync(movement, cancellationToken));
        }

        return ApiResponse<IEnumerable<StockMovementDto>>.Ok(transferMovements);
    }

    #endregion

    #region Stock Receiving

    public async Task<ApiResponse<IEnumerable<StockMovementDto>>> ReceiveStockAsync(
        int warehouseId,
        IEnumerable<(int productId, int? batchId, int quantity)> items,
        string referenceNumber,
        string userId,
        CancellationToken cancellationToken = default)
    {
        var warehouse = await _unitOfWork.Inventory.GetWarehouseByIdAsync(warehouseId, cancellationToken);
        if (warehouse == null)
            return ApiResponse<IEnumerable<StockMovementDto>>.Fail($"Warehouse with ID {warehouseId} not found.");

        var movements = new List<StockMovementDto>();

        foreach (var (productId, batchId, quantity) in items)
        {
            var product = await _unitOfWork.Products.GetByIdAsync(productId, cancellationToken);
            if (product == null)
                continue;

            var movement = new StockMovement
            {
                WarehouseId = warehouseId,
                ProductId = productId,
                ProductBatchId = batchId,
                MovementType = StockMovementType.In,
                Quantity = quantity,
                ReferenceNumber = referenceNumber,
                Notes = $"Stock receipt: {referenceNumber}",
                PerformedByUserId = userId,
                MovementDate = DateTime.UtcNow
            };

            // Update stock
            var stock = await _unitOfWork.Inventory.GetStockByProductAsync(productId, warehouseId, cancellationToken);
            if (stock == null)
            {
                var newStock = new InventoryStock
                {
                    WarehouseId = warehouseId,
                    ProductId = productId,
                    ProductBatchId = batchId,
                    QuantityOnHand = quantity,
                    QuantityReserved = 0
                };
                await _unitOfWork.Inventory.AddStockAsync(newStock, cancellationToken);
            }
            else
            {
                stock.QuantityOnHand += quantity;
                await _unitOfWork.Inventory.UpdateStockAsync(stock, cancellationToken);
            }

            var created = await _unitOfWork.Inventory.RecordMovementAsync(movement, cancellationToken);
            movements.Add(await MapMovementToDtoAsync(created, cancellationToken));
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<IEnumerable<StockMovementDto>>.Ok(movements);
    }

    #endregion

    #region Stock Reservations

    public async Task<ApiResponse<bool>> ReserveStockAsync(int warehouseId, int productId, int? batchId, int quantity, CancellationToken cancellationToken = default)
    {
        var available = await _unitOfWork.Inventory.GetAvailableStockQuantityAsync(productId, warehouseId, cancellationToken);
        if (available < quantity)
            return ApiResponse<bool>.Fail($"Insufficient stock available. Available: {available}, Requested: {quantity}");

        var result = await _unitOfWork.Inventory.ReserveStockAsync(productId, warehouseId, quantity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return result 
            ? ApiResponse<bool>.Ok(true, "Stock reserved successfully.") 
            : ApiResponse<bool>.Fail("Failed to reserve stock.");
    }

    public async Task<ApiResponse<bool>> ReleaseReservedStockAsync(int warehouseId, int productId, int? batchId, int quantity, CancellationToken cancellationToken = default)
    {
        var result = await _unitOfWork.Inventory.ReleaseReservationAsync(productId, warehouseId, quantity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return result 
            ? ApiResponse<bool>.Ok(true, "Stock reservation released successfully.") 
            : ApiResponse<bool>.Fail("Failed to release stock reservation.");
    }

    #endregion

    #region Private Helpers

    private async Task ClearDefaultWarehouseAsync(CancellationToken cancellationToken)
    {
        var currentDefault = await _unitOfWork.Inventory.GetDefaultWarehouseAsync(cancellationToken);
        if (currentDefault != null)
        {
            currentDefault.IsDefault = false;
            await _unitOfWork.Inventory.UpdateWarehouseAsync(currentDefault, cancellationToken);
        }
    }

    private async Task UpdateStockForMovementAsync(StockMovement movement, CancellationToken cancellationToken)
    {
        var stock = await _unitOfWork.Inventory.GetStockByProductAsync(movement.ProductId, movement.WarehouseId, cancellationToken);

        if (stock == null)
        {
            if (movement.MovementType == StockMovementType.In || 
                movement.MovementType == StockMovementType.Return)
            {
                var newStock = new InventoryStock
                {
                    WarehouseId = movement.WarehouseId,
                    ProductId = movement.ProductId,
                    ProductBatchId = movement.ProductBatchId,
                    QuantityOnHand = movement.Quantity,
                    QuantityReserved = 0
                };
                await _unitOfWork.Inventory.AddStockAsync(newStock, cancellationToken);
            }
            return;
        }

        switch (movement.MovementType)
        {
            case StockMovementType.In:
            case StockMovementType.Return:
                stock.QuantityOnHand += movement.Quantity;
                break;

            case StockMovementType.Out:
            case StockMovementType.Expired:
                stock.QuantityOnHand -= movement.Quantity;
                break;

            case StockMovementType.Adjustment:
                // For adjustment, quantity can be positive or negative
                stock.QuantityOnHand += movement.Quantity;
                break;
        }

        stock.LastMovementDate = DateTime.UtcNow;
        await _unitOfWork.Inventory.UpdateStockAsync(stock, cancellationToken);
    }

    private WarehouseDto MapWarehouseToDto(Warehouse warehouse)
    {
        return new WarehouseDto
        {
            Id = warehouse.Id,
            Name = warehouse.Name,
            Code = warehouse.Code,
            Description = null, // Not in entity
            CityId = warehouse.CityId ?? 0,
            CityName = warehouse.City?.Name ?? string.Empty,
            Address = warehouse.Address ?? string.Empty,
            ContactPerson = null, // Not in entity
            ContactPhone = warehouse.ContactPhone,
            IsActive = warehouse.IsActive,
            IsDefault = warehouse.IsDefault,
            StockItemCount = warehouse.InventoryStocks?.Count ?? 0
        };
    }

    private InventoryStockDto MapStockToDto(InventoryStock stock)
    {
        return new InventoryStockDto
        {
            Id = stock.Id,
            WarehouseId = stock.WarehouseId,
            WarehouseName = stock.Warehouse?.Name ?? string.Empty,
            ProductId = stock.ProductId,
            ProductName = stock.Product?.Name ?? string.Empty,
            ProductSku = stock.Product?.SKU ?? string.Empty,
            ProductBatchId = stock.ProductBatchId,
            BatchNumber = stock.ProductBatch?.BatchNumber,
            QuantityOnHand = stock.QuantityOnHand,
            QuantityReserved = stock.QuantityReserved,
            MinimumStockLevel = stock.ReorderLevel,
            ReorderPoint = stock.ReorderLevel,
            MaximumStockLevel = stock.MaxStockLevel,
            LastUpdated = stock.LastMovementDate ?? stock.CreatedAt
        };
    }

    private async Task<StockMovementDto> MapMovementToDtoAsync(StockMovement movement, CancellationToken cancellationToken)
    {
        var warehouse = await _unitOfWork.Inventory.GetWarehouseByIdAsync(movement.WarehouseId, cancellationToken);
        var product = await _unitOfWork.Products.GetByIdAsync(movement.ProductId, cancellationToken);

        return new StockMovementDto
        {
            Id = movement.Id,
            WarehouseId = movement.WarehouseId,
            WarehouseName = warehouse?.Name ?? string.Empty,
            ProductId = movement.ProductId,
            ProductName = product?.Name ?? string.Empty,
            ProductBatchId = movement.ProductBatchId,
            BatchNumber = movement.ProductBatch?.BatchNumber,
            MovementType = movement.MovementType,
            MovementTypeName = movement.MovementType.ToString(),
            Quantity = movement.Quantity,
            ReferenceNumber = movement.ReferenceNumber,
            ReferenceType = movement.OrderId.HasValue ? "Order" : (movement.PurchaseOrderId.HasValue ? "PurchaseOrder" : null),
            ReferenceId = movement.OrderId ?? movement.PurchaseOrderId,
            Notes = movement.Notes,
            CreatedBy = movement.PerformedByUserId,
            CreatedAt = movement.MovementDate
        };
    }

    #endregion
}
