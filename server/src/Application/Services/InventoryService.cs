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

        if (dto.IsManufacturing && dto.CanFulfillOrders)
            return ApiResponse<WarehouseDto>.Fail("Manufacturing warehouse cannot be marked as order-fulfillment warehouse.");

        var warehouse = new Warehouse
        {
            Name = dto.Name,
            NameLocal = dto.Name, // Use same name for local
            Code = dto.Code.ToUpperInvariant(),
            IsManufacturing = dto.IsManufacturing,
            CanFulfillOrders = dto.CanFulfillOrders,
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

        // If this warehouse can fulfill orders, ensure it's the only one
        if (dto.CanFulfillOrders)
        {
            await ClearFulfillmentWarehouseAsync(cancellationToken);
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

        if (dto.IsManufacturing && dto.CanFulfillOrders)
            return ApiResponse<WarehouseDto>.Fail("Manufacturing warehouse cannot be marked as order-fulfillment warehouse.");

        if (!dto.IsActive && dto.CanFulfillOrders)
            return ApiResponse<WarehouseDto>.Fail("Inactive warehouse cannot be marked as order-fulfillment warehouse.");

        warehouse.Name = dto.Name;
        warehouse.NameLocal = dto.Name;
        warehouse.IsManufacturing = dto.IsManufacturing;
        warehouse.CityId = dto.CityId;
        warehouse.Address = dto.Address;
        warehouse.ContactPhone = dto.ContactPhone;
        warehouse.IsActive = dto.IsActive;

        // Ensure only one order-fulfillment warehouse at a time
        if (dto.CanFulfillOrders && !warehouse.CanFulfillOrders)
        {
            await ClearFulfillmentWarehouseAsync(cancellationToken);
            warehouse.CanFulfillOrders = true;
        }
        else if (!dto.CanFulfillOrders && warehouse.CanFulfillOrders)
        {
            warehouse.CanFulfillOrders = false;
        }
        
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

    public async Task<ApiResponse<IEnumerable<ExpiringProductDto>>> GetExpiringProductsAsync(int days = 30, CancellationToken cancellationToken = default)
    {
        var expiryDate = DateTime.UtcNow.AddDays(days);
        var expiringBatches = await _unitOfWork.Inventory.GetExpiringBatchesAsync(expiryDate, cancellationToken);
        var expiringProducts = new List<ExpiringProductDto>();
        var today = DateTime.UtcNow.Date;

        foreach (var batch in expiringBatches)
        {
            var product = batch.Product ?? await _unitOfWork.Products.GetByIdAsync(batch.ProductId, cancellationToken);
            if (product != null)
            {
                var daysUntilExpiry = (batch.ExpiryDate - today).Days;
                var severity = daysUntilExpiry <= 0 ? "Expired" 
                             : daysUntilExpiry <= 7 ? "Critical" 
                             : "Warning";

                expiringProducts.Add(new ExpiringProductDto
                {
                    ProductId = batch.ProductId,
                    ProductName = product.Name,
                    ProductSku = product.SKU,
                    BatchId = batch.Id,
                    BatchNumber = batch.BatchNumber,
                    WarehouseId = 1, // Default warehouse - batches don't have warehouse context
                    WarehouseName = "Main Warehouse",
                    Quantity = batch.RemainingQuantity,
                    ExpiryDate = batch.ExpiryDate,
                    DaysUntilExpiry = daysUntilExpiry,
                    Severity = severity
                });
            }
        }

        return ApiResponse<IEnumerable<ExpiringProductDto>>.Ok(expiringProducts.OrderBy(e => e.DaysUntilExpiry));
    }

    #endregion

    #region Stock Movements

    public async Task<ApiResponse<StockMovementDto>> GetMovementByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        // Repository method not yet available; fall back to a date-window search.
        // This keeps the API functional without expanding repository surface area.
        var recent = await _unitOfWork.Inventory.GetMovementsByDateRangeAsync(
            DateTime.UtcNow.AddYears(-1),
            DateTime.UtcNow.AddMinutes(1),
            cancellationToken);

        var movement = recent.FirstOrDefault(m => m.Id == id);
        if (movement == null)
            return ApiResponse<StockMovementDto>.Fail($"Stock movement with ID {id} not found.");

        var dto = await MapMovementToDtoAsync(movement, cancellationToken);
        return ApiResponse<StockMovementDto>.Ok(dto);
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

    public async Task<PagedResponse<StockAdjustmentListItemDto>> GetAdjustmentsPagedAsync(
        int page,
        int pageSize,
        int? productId = null,
        string? adjustmentType = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        CancellationToken cancellationToken = default)
    {
        var from = startDate.HasValue
            ? DateTime.SpecifyKind(startDate.Value.Date, DateTimeKind.Utc)
            : DateTime.UtcNow.AddMonths(-1);

        var to = endDate.HasValue
            ? DateTime.SpecifyKind(endDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc)
            : DateTime.UtcNow;

        var movementTypes = ResolveMovementTypesForAdjustmentFilter(adjustmentType);
        var desiredType = adjustmentType?.Trim().ToLowerInvariant();

        var movements = new List<StockMovement>();
        foreach (var type in movementTypes)
        {
            var byType = await _unitOfWork.Inventory.GetMovementsByTypeAsync(type, cancellationToken);
            movements.AddRange(byType);
        }

        static bool IsManualAdjustmentMovement(StockMovement movement)
        {
            if (movement.MovementType is StockMovementType.Adjustment or StockMovementType.Expired or StockMovementType.Return)
                return true;

            return TryParseAdjustmentTypeFromReference(movement.ReferenceNumber) != null;
        }

        var filtered = movements
            .Where(IsManualAdjustmentMovement)
            .Where(m => m.MovementDate >= from && m.MovementDate <= to)
            .Where(m => !productId.HasValue || m.ProductId == productId.Value)
            .Select(m => new
            {
                Movement = m,
                AdjustmentType = ResolveAdjustmentTypeFromMovement(m)
            })
            .Where(x => x.AdjustmentType != null)
            .Where(x => desiredType == null || string.Equals(x.AdjustmentType, desiredType, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(x => x.Movement.MovementDate)
            .ToList();

        var totalCount = filtered.Count;
        var pageItems = filtered.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        var dtos = new List<StockAdjustmentListItemDto>();
        foreach (var movement in pageItems)
        {
            var mappedType = movement.AdjustmentType;
            var product = movement.Movement.Product ?? await _unitOfWork.Products.GetByIdAsync(movement.Movement.ProductId, cancellationToken);

            dtos.Add(new StockAdjustmentListItemDto
            {
                Id = movement.Movement.Id,
                ProductId = movement.Movement.ProductId,
                ProductName = product?.Name ?? string.Empty,
                ProductSku = product?.SKU ?? string.Empty,
                BatchId = movement.Movement.ProductBatchId,
                BatchNumber = movement.Movement.ProductBatch?.BatchNumber,
                AdjustmentType = mappedType,
                Quantity = Math.Abs(movement.Movement.Quantity),
                Reason = movement.Movement.Reason ?? string.Empty,
                Notes = movement.Movement.Notes,
                AdjustedBy = movement.Movement.PerformedByUserId ?? "system",
                AdjustedAt = movement.Movement.MovementDate
            });
        }

        return PagedResponse<StockAdjustmentListItemDto>.Create(dtos, totalCount, page, pageSize);
    }

    public async Task<ApiResponse<StockAdjustmentListItemDto>> CreateAdjustmentAsync(
        CreateStockAdjustmentRequestDto dto,
        string userId,
        CancellationToken cancellationToken = default)
    {
        if (dto.ProductId <= 0)
            return ApiResponse<StockAdjustmentListItemDto>.Fail("Valid product is required.");

        if (dto.Quantity <= 0)
            return ApiResponse<StockAdjustmentListItemDto>.Fail("Quantity must be greater than 0.");

        if (string.IsNullOrWhiteSpace(dto.AdjustmentType))
            return ApiResponse<StockAdjustmentListItemDto>.Fail("Adjustment type is required.");

        if (string.IsNullOrWhiteSpace(dto.Reason))
            return ApiResponse<StockAdjustmentListItemDto>.Fail("Adjustment reason is required.");

        var warehouse = await _unitOfWork.Inventory.GetDefaultWarehouseAsync(cancellationToken)
                       ?? (await _unitOfWork.Inventory.GetActiveWarehousesAsync(cancellationToken)).FirstOrDefault();

        if (warehouse == null)
            return ApiResponse<StockAdjustmentListItemDto>.Fail("No active warehouse found.");

        var product = await _unitOfWork.Products.GetByIdAsync(dto.ProductId, cancellationToken);
        if (product == null)
            return ApiResponse<StockAdjustmentListItemDto>.Fail($"Product with ID {dto.ProductId} not found.");

        var movementType = ResolveMovementTypeForCreate(dto.AdjustmentType);
        if (movementType == null)
            return ApiResponse<StockAdjustmentListItemDto>.Fail("Invalid adjustment type.");

        var isAddition = IsAdditionAdjustmentType(dto.AdjustmentType);
        var delta = isAddition ? dto.Quantity : -dto.Quantity;

        InventoryStock? currentStock = dto.BatchId.HasValue
            ? await _unitOfWork.Inventory.GetStockByBatchAsync(dto.ProductId, dto.BatchId.Value, warehouse.Id, cancellationToken)
            : await _unitOfWork.Inventory.GetStockByProductAsync(dto.ProductId, warehouse.Id, cancellationToken);

        var currentQuantity = currentStock?.QuantityOnHand ?? 0;
        var newQuantity = currentQuantity + delta;

        if (newQuantity < 0)
            return ApiResponse<StockAdjustmentListItemDto>.Fail("This adjustment would result in negative stock.");

        if (currentStock == null)
        {
            var stock = new InventoryStock
            {
                WarehouseId = warehouse.Id,
                ProductId = dto.ProductId,
                ProductBatchId = dto.BatchId,
                QuantityOnHand = newQuantity,
                QuantityReserved = 0,
                LastMovementDate = DateTime.UtcNow
            };
            await _unitOfWork.Inventory.AddStockAsync(stock, cancellationToken);
        }
        else
        {
            currentStock.QuantityOnHand = newQuantity;
            currentStock.LastMovementDate = DateTime.UtcNow;
            await _unitOfWork.Inventory.UpdateStockAsync(currentStock, cancellationToken);
        }

        var movement = new StockMovement
        {
            WarehouseId = warehouse.Id,
            ProductId = dto.ProductId,
            ProductBatchId = dto.BatchId,
            MovementType = movementType.Value,
            Quantity = dto.Quantity,
            ReferenceNumber = CreateAdjustmentReference(dto.AdjustmentType),
            Reason = dto.Reason,
            Notes = dto.Notes,
            PerformedByUserId = userId,
            MovementDate = DateTime.UtcNow
        };

        await _unitOfWork.Inventory.RecordMovementAsync(movement, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var response = new StockAdjustmentListItemDto
        {
            Id = movement.Id,
            ProductId = dto.ProductId,
            ProductName = product.Name,
            ProductSku = product.SKU,
            BatchId = dto.BatchId,
            BatchNumber = currentStock?.ProductBatch?.BatchNumber,
            AdjustmentType = dto.AdjustmentType,
            Quantity = dto.Quantity,
            Reason = dto.Reason,
            Notes = dto.Notes,
            AdjustedBy = userId,
            AdjustedAt = movement.MovementDate
        };

        return ApiResponse<StockAdjustmentListItemDto>.Ok(response);
    }

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

    private static IReadOnlyList<StockMovementType> ResolveMovementTypesForAdjustmentFilter(string? adjustmentType)
    {
        if (string.IsNullOrWhiteSpace(adjustmentType))
        {
            return new[]
            {
                StockMovementType.In,
                StockMovementType.Out,
                StockMovementType.Adjustment,
                StockMovementType.Expired,
                StockMovementType.Return
            };
        }

        var type = adjustmentType.Trim().ToLowerInvariant();
        return type switch
        {
            "addition" => new[] { StockMovementType.In },
            "removal" => new[] { StockMovementType.Out },
            "correction" => new[] { StockMovementType.Adjustment },
            "damaged" => new[] { StockMovementType.Out },
            "expired" => new[] { StockMovementType.Expired },
            "returned" => new[] { StockMovementType.Return },
            _ => new[] { StockMovementType.In, StockMovementType.Out, StockMovementType.Adjustment, StockMovementType.Expired, StockMovementType.Return }
        };
    }

    private static StockMovementType? ResolveMovementTypeForCreate(string adjustmentType)
    {
        var type = adjustmentType.Trim().ToLowerInvariant();
        return type switch
        {
            "addition" => StockMovementType.In,
            "removal" => StockMovementType.Out,
            "correction" => StockMovementType.Adjustment,
            "damaged" => StockMovementType.Out,
            "expired" => StockMovementType.Expired,
            "returned" => StockMovementType.Return,
            _ => null
        };
    }

    private static bool IsAdditionAdjustmentType(string adjustmentType)
    {
        var type = adjustmentType.Trim().ToLowerInvariant();
        return type is "addition" or "returned" or "correction";
    }

    private static string? MapMovementTypeToAdjustmentType(StockMovementType movementType)
    {
        return movementType switch
        {
            StockMovementType.In => "addition",
            StockMovementType.Out => "removal",
            StockMovementType.Adjustment => "correction",
            StockMovementType.Expired => "expired",
            StockMovementType.Return => "returned",
            _ => null
        };
    }

    private const string AdjustmentReferencePrefix = "adj:";

    private static string CreateAdjustmentReference(string? adjustmentType)
    {
        var normalized = (adjustmentType ?? string.Empty).Trim().ToLowerInvariant();
        return $"{AdjustmentReferencePrefix}{normalized}";
    }

    private static string? TryParseAdjustmentTypeFromReference(string? referenceNumber)
    {
        if (string.IsNullOrWhiteSpace(referenceNumber))
            return null;

        if (!referenceNumber.StartsWith(AdjustmentReferencePrefix, StringComparison.OrdinalIgnoreCase))
            return null;

        var type = referenceNumber[AdjustmentReferencePrefix.Length..].Trim().ToLowerInvariant();
        return type switch
        {
            "addition" => "addition",
            "removal" => "removal",
            "correction" => "correction",
            "damaged" => "damaged",
            "expired" => "expired",
            "returned" => "returned",
            _ => null
        };
    }

    private static string? ResolveAdjustmentTypeFromMovement(StockMovement movement)
    {
        return TryParseAdjustmentTypeFromReference(movement.ReferenceNumber) ?? MapMovementTypeToAdjustmentType(movement.MovementType);
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

    #region Stock Transfers (UI-friendly)

    private const string TransferReferencePrefix = "trf:";

    public async Task<PagedResponse<StockTransferListItemDto>> GetTransfersPagedAsync(
        int page,
        int pageSize,
        string? status = null,
        int? sourceLocationId = null,
        int? destinationLocationId = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        CancellationToken cancellationToken = default)
    {
        var from = startDate.HasValue
            ? DateTime.SpecifyKind(startDate.Value.Date, DateTimeKind.Utc)
            : DateTime.UtcNow.AddMonths(-1);

        var to = endDate.HasValue
            ? DateTime.SpecifyKind(endDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc)
            : DateTime.UtcNow;

        var desiredStatus = status?.Trim().ToLowerInvariant();

        var movements = await _unitOfWork.Inventory.GetMovementsByTypeAsync(StockMovementType.Transfer, cancellationToken);

        var filtered = movements
            .Where(m => m.MovementDate >= from && m.MovementDate <= to)
            .ToList();

        // Group by reference number when available, otherwise treat as legacy single-movement transfers.
        // (Older data may have a reference number without the prefix.)
        var groups = filtered
            .GroupBy(m => !string.IsNullOrWhiteSpace(m.ReferenceNumber)
                ? m.ReferenceNumber!
                : $"legacy:{m.Id}")
            .Select(g => MapTransferGroupToDto(g.Key, g.ToList()))
            .Where(t => t != null)
            .Select(t => t!)
            .Where(t => !sourceLocationId.HasValue || t.SourceLocationId == sourceLocationId.Value)
            .Where(t => !destinationLocationId.HasValue || t.DestinationLocationId == destinationLocationId.Value)
            .Where(t => desiredStatus == null || string.Equals(t.Status, desiredStatus, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(t => t.CreatedAt)
            .ToList();

        var totalCount = groups.Count;
        var pageItems = groups.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        return PagedResponse<StockTransferListItemDto>.Create(pageItems, totalCount, page, pageSize);
    }

    public async Task<ApiResponse<StockTransferListItemDto>> CreateTransferAsync(
        CreateStockTransferRequestDto dto,
        string userId,
        CancellationToken cancellationToken = default)
    {
        if (dto.SourceLocationId <= 0 || dto.DestinationLocationId <= 0)
            return ApiResponse<StockTransferListItemDto>.Fail("Source and destination locations are required.");

        if (dto.SourceLocationId == dto.DestinationLocationId)
            return ApiResponse<StockTransferListItemDto>.Fail("Source and destination locations must be different.");

        if (dto.Items == null || dto.Items.Count == 0)
            return ApiResponse<StockTransferListItemDto>.Fail("At least one item is required.");

        if (dto.Items.Any(i => i.ProductId <= 0 || i.Quantity <= 0))
            return ApiResponse<StockTransferListItemDto>.Fail("All items must have a valid product and quantity.");

        var sourceWarehouse = await _unitOfWork.Inventory.GetWarehouseByIdAsync(dto.SourceLocationId, cancellationToken);
        if (sourceWarehouse == null)
            return ApiResponse<StockTransferListItemDto>.Fail($"Source location with ID {dto.SourceLocationId} not found.");

        var destWarehouse = await _unitOfWork.Inventory.GetWarehouseByIdAsync(dto.DestinationLocationId, cancellationToken);
        if (destWarehouse == null)
            return ApiResponse<StockTransferListItemDto>.Fail($"Destination location with ID {dto.DestinationLocationId} not found.");

        var referenceNumber = $"{TransferReferencePrefix}{Guid.NewGuid():N}";
        var now = DateTime.UtcNow;

        // Validate stock availability up-front
        foreach (var item in dto.Items)
        {
            var available = await _unitOfWork.Inventory.GetAvailableStockQuantityAsync(item.ProductId, dto.SourceLocationId, cancellationToken);
            if (available < item.Quantity)
                return ApiResponse<StockTransferListItemDto>.Fail($"Insufficient stock for product {item.ProductId}. Available: {available}, Requested: {item.Quantity}");
        }

        var transferItemDtos = new List<StockTransferItemDto>();
        var movementIds = new List<int>();

        foreach (var item in dto.Items)
        {
            var product = await _unitOfWork.Products.GetByIdAsync(item.ProductId, cancellationToken);
            if (product == null)
                return ApiResponse<StockTransferListItemDto>.Fail($"Product with ID {item.ProductId} not found.");

            var sourceStock = await _unitOfWork.Inventory.GetStockByProductAsync(item.ProductId, dto.SourceLocationId, cancellationToken);
            if (sourceStock == null || sourceStock.QuantityOnHand < item.Quantity)
                return ApiResponse<StockTransferListItemDto>.Fail($"Insufficient stock for product {item.ProductId} in source location.");

            sourceStock.QuantityOnHand -= item.Quantity;
            sourceStock.LastMovementDate = now;
            await _unitOfWork.Inventory.UpdateStockAsync(sourceStock, cancellationToken);

            var destStock = await _unitOfWork.Inventory.GetStockByProductAsync(item.ProductId, dto.DestinationLocationId, cancellationToken);
            if (destStock == null)
            {
                destStock = new InventoryStock
                {
                    ProductId = item.ProductId,
                    WarehouseId = dto.DestinationLocationId,
                    QuantityOnHand = item.Quantity,
                    QuantityReserved = 0,
                    LastMovementDate = now
                };
                await _unitOfWork.Inventory.AddStockAsync(destStock, cancellationToken);
            }
            else
            {
                destStock.QuantityOnHand += item.Quantity;
                destStock.LastMovementDate = now;
                await _unitOfWork.Inventory.UpdateStockAsync(destStock, cancellationToken);
            }

            var outMovement = await _unitOfWork.Inventory.RecordMovementAsync(new StockMovement
            {
                ProductId = item.ProductId,
                WarehouseId = dto.SourceLocationId,
                MovementType = StockMovementType.Transfer,
                Quantity = -item.Quantity,
                ReferenceNumber = referenceNumber,
                Reason = $"Transfer to warehouse {dto.DestinationLocationId}",
                Notes = dto.Notes,
                PerformedByUserId = userId,
                MovementDate = now
            }, cancellationToken);
            movementIds.Add(outMovement.Id);

            var inMovement = await _unitOfWork.Inventory.RecordMovementAsync(new StockMovement
            {
                ProductId = item.ProductId,
                WarehouseId = dto.DestinationLocationId,
                MovementType = StockMovementType.Transfer,
                Quantity = item.Quantity,
                ReferenceNumber = referenceNumber,
                Reason = $"Transfer from warehouse {dto.SourceLocationId}",
                Notes = dto.Notes,
                PerformedByUserId = userId,
                MovementDate = now
            }, cancellationToken);
            movementIds.Add(inMovement.Id);

            transferItemDtos.Add(new StockTransferItemDto
            {
                Id = 0,
                TransferId = 0,
                ProductId = item.ProductId,
                ProductName = product.Name,
                ProductSku = product.SKU,
                BatchId = item.BatchId,
                Quantity = item.Quantity
            });
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var transferId = movementIds.Count > 0 ? movementIds.Min() : 0;
        foreach (var ti in transferItemDtos)
            ti.TransferId = transferId;

        var created = new StockTransferListItemDto
        {
            Id = transferId,
            ReferenceNumber = referenceNumber,
            SourceLocationId = dto.SourceLocationId,
            SourceLocationName = sourceWarehouse.Name,
            DestinationLocationId = dto.DestinationLocationId,
            DestinationLocationName = destWarehouse.Name,
            Status = "completed",
            Items = transferItemDtos,
            Notes = dto.Notes,
            CreatedBy = userId,
            CreatedById = userId,
            CreatedAt = now,
            CompletedAt = now,
            CompletedBy = userId
        };

        return ApiResponse<StockTransferListItemDto>.Ok(created);
    }

    public async Task<ApiResponse<StockTransferListItemDto>> GetTransferByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var recent = await _unitOfWork.Inventory.GetMovementsByDateRangeAsync(
            DateTime.UtcNow.AddYears(-1),
            DateTime.UtcNow.AddMinutes(1),
            cancellationToken);

        var seed = recent.FirstOrDefault(m => m.Id == id && m.MovementType == StockMovementType.Transfer);
        if (seed == null)
            return ApiResponse<StockTransferListItemDto>.Fail($"Transfer with ID {id} not found.");

        if (string.IsNullOrWhiteSpace(seed.ReferenceNumber))
        {
            var single = MapTransferGroupToDto($"legacy:{seed.Id}", new List<StockMovement> { seed });
            return single == null
                ? ApiResponse<StockTransferListItemDto>.Fail($"Transfer with ID {id} not found.")
                : ApiResponse<StockTransferListItemDto>.Ok(single);
        }

        var group = recent
            .Where(m => m.MovementType == StockMovementType.Transfer && string.Equals(m.ReferenceNumber, seed.ReferenceNumber, StringComparison.OrdinalIgnoreCase))
            .ToList();

        var mapped = MapTransferGroupToDto(seed.ReferenceNumber, group);
        return mapped == null
            ? ApiResponse<StockTransferListItemDto>.Fail($"Transfer with ID {id} not found.")
            : ApiResponse<StockTransferListItemDto>.Ok(mapped);
    }

    public async Task<ApiResponse<StockTransferListItemDto>> UpdateTransferStatusAsync(int id, string status, string userId, CancellationToken cancellationToken = default)
    {
        // Not persisted yet (transfers are executed immediately). Provide a consistent API response.
        var current = await GetTransferByIdAsync(id, cancellationToken);
        if (!current.Success || current.Data == null)
            return ApiResponse<StockTransferListItemDto>.Fail(current.Message ?? "Transfer not found.");

        var normalized = status?.Trim().ToLowerInvariant();
        if (normalized is not ("pending" or "in_transit" or "completed" or "cancelled"))
            return ApiResponse<StockTransferListItemDto>.Fail("Invalid status.");

        current.Data.Status = normalized;
        return ApiResponse<StockTransferListItemDto>.Ok(current.Data);
    }

    public async Task<ApiResponse<bool>> CancelTransferAsync(int id, string reason, string userId, CancellationToken cancellationToken = default)
    {
        // Not persisted yet; treat as supported no-op so UI doesn't 404.
        var current = await GetTransferByIdAsync(id, cancellationToken);
        if (!current.Success)
            return ApiResponse<bool>.Fail(current.Message ?? "Transfer not found.");

        return ApiResponse<bool>.Ok(true);
    }

    private StockTransferListItemDto? MapTransferGroupToDto(string groupKey, List<StockMovement> movements)
    {
        if (movements.Count == 0)
            return null;

        var source = movements.FirstOrDefault(m => m.Quantity < 0);
        var dest = movements.FirstOrDefault(m => m.Quantity > 0);

        if (source == null || dest == null)
            return null;

        var createdAt = movements.Min(m => m.MovementDate);
        var createdById = movements.Select(m => m.PerformedByUserId).FirstOrDefault(x => !string.IsNullOrWhiteSpace(x)) ?? "system";

        var reference = !string.IsNullOrWhiteSpace(source.ReferenceNumber) ? source.ReferenceNumber! : groupKey;
        var id = movements.Min(m => m.Id);

        var itemGroups = movements
            .Where(m => m.Quantity < 0)
            .GroupBy(m => m.ProductId)
            .ToList();

        var items = new List<StockTransferItemDto>();
        foreach (var g in itemGroups)
        {
            var movement = g.First();
            var product = movement.Product;
            var qty = g.Sum(m => Math.Abs(m.Quantity));

            items.Add(new StockTransferItemDto
            {
                Id = 0,
                TransferId = id,
                ProductId = g.Key,
                ProductName = product?.Name ?? string.Empty,
                ProductSku = product?.SKU ?? string.Empty,
                Quantity = qty
            });
        }

        return new StockTransferListItemDto
        {
            Id = id,
            ReferenceNumber = reference,
            SourceLocationId = source.WarehouseId,
            SourceLocationName = source.Warehouse?.Name ?? string.Empty,
            DestinationLocationId = dest.WarehouseId,
            DestinationLocationName = dest.Warehouse?.Name ?? string.Empty,
            Status = "completed",
            Items = items,
            Notes = movements.Select(m => m.Notes).FirstOrDefault(n => !string.IsNullOrWhiteSpace(n)),
            CreatedBy = createdById,
            CreatedById = createdById,
            CreatedAt = createdAt,
            CompletedAt = createdAt,
            CompletedBy = createdById
        };
    }

    #endregion

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

    private async Task ClearFulfillmentWarehouseAsync(CancellationToken cancellationToken)
    {
        var warehouses = await _unitOfWork.Inventory.GetAllWarehousesAsync(cancellationToken);

        foreach (var w in warehouses)
        {
            if (w.CanFulfillOrders)
            {
                w.CanFulfillOrders = false;
                await _unitOfWork.Inventory.UpdateWarehouseAsync(w, cancellationToken);
            }
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
            IsManufacturing = warehouse.IsManufacturing,
            CanFulfillOrders = warehouse.CanFulfillOrders,
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
