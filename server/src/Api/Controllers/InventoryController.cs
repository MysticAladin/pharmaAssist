using Application.DTOs.Common;
using Application.DTOs.Inventory;
using Application.Interfaces;
using Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers;

/// <summary>
/// Inventory API Controller
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;
    private readonly ILogger<InventoryController> _logger;

    public InventoryController(IInventoryService inventoryService, ILogger<InventoryController> logger)
    {
        _inventoryService = inventoryService;
        _logger = logger;
    }

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "system";

    #region Warehouses

    /// <summary>
    /// Get all warehouses
    /// </summary>
    [HttpGet("warehouses")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<WarehouseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllWarehouses([FromQuery] bool activeOnly = true, CancellationToken cancellationToken = default)
    {
        var result = await _inventoryService.GetAllWarehousesAsync(activeOnly, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get warehouse by ID
    /// </summary>
    [HttpGet("warehouses/{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<WarehouseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<WarehouseDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetWarehouseById(int id, CancellationToken cancellationToken)
    {
        var result = await _inventoryService.GetWarehouseByIdAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Create a new warehouse
    /// </summary>
    [HttpPost("warehouses")]
    [ProducesResponseType(typeof(ApiResponse<WarehouseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<WarehouseDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateWarehouse([FromBody] CreateWarehouseDto dto, CancellationToken cancellationToken)
    {
        var result = await _inventoryService.CreateWarehouseAsync(dto, cancellationToken);
        return result.Success 
            ? CreatedAtAction(nameof(GetWarehouseById), new { id = result.Data!.Id }, result) 
            : BadRequest(result);
    }

    /// <summary>
    /// Update a warehouse
    /// </summary>
    [HttpPut("warehouses/{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<WarehouseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<WarehouseDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateWarehouse(int id, [FromBody] UpdateWarehouseDto dto, CancellationToken cancellationToken)
    {
        var result = await _inventoryService.UpdateWarehouseAsync(id, dto, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Delete a warehouse
    /// </summary>
    [HttpDelete("warehouses/{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteWarehouse(int id, CancellationToken cancellationToken)
    {
        var result = await _inventoryService.DeleteWarehouseAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Set warehouse as default
    /// </summary>
    [HttpPatch("warehouses/{id:int}/set-default")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetDefaultWarehouse(int id, CancellationToken cancellationToken)
    {
        var result = await _inventoryService.SetDefaultWarehouseAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #endregion

    #region Stock

    /// <summary>
    /// Get stock by ID
    /// </summary>
    [HttpGet("stock/{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<InventoryStockDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<InventoryStockDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStockById(int id, CancellationToken cancellationToken)
    {
        var result = await _inventoryService.GetStockByIdAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get stock by warehouse
    /// </summary>
    [HttpGet("warehouses/{warehouseId:int}/stock")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<InventoryStockDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStockByWarehouse(int warehouseId, CancellationToken cancellationToken)
    {
        var result = await _inventoryService.GetStockByWarehouseAsync(warehouseId, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get stock by product
    /// </summary>
    [HttpGet("products/{productId:int}/stock")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<InventoryStockDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStockByProduct(int productId, CancellationToken cancellationToken)
    {
        var result = await _inventoryService.GetStockByProductAsync(productId, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get product stock summary (across all warehouses)
    /// </summary>
    [HttpGet("products/{productId:int}/stock/summary")]
    [ProducesResponseType(typeof(ApiResponse<ProductStockSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProductStockSummary(int productId, CancellationToken cancellationToken)
    {
        var result = await _inventoryService.GetProductStockSummaryAsync(productId, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get low stock alerts
    /// </summary>
    [HttpGet("stock/alerts/low-stock")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<LowStockAlertDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLowStockAlerts(CancellationToken cancellationToken)
    {
        var result = await _inventoryService.GetLowStockAlertsAsync(cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Stock Movements

    /// <summary>
    /// Get stock movement by ID
    /// </summary>
    [HttpGet("movements/{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<StockMovementDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<StockMovementDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMovementById(int id, CancellationToken cancellationToken)
    {
        var result = await _inventoryService.GetMovementByIdAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get stock movements with pagination
    /// </summary>
    [HttpGet("movements")]
    [ProducesResponseType(typeof(PagedResponse<StockMovementDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMovementsPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] int? warehouseId = null,
        [FromQuery] int? productId = null,
        [FromQuery] StockMovementType? movementType = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _inventoryService.GetMovementsPagedAsync(page, pageSize, warehouseId, productId, movementType, fromDate, toDate, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Create a stock movement
    /// </summary>
    [HttpPost("movements")]
    [ProducesResponseType(typeof(ApiResponse<StockMovementDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<StockMovementDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateMovement([FromBody] CreateStockMovementDto dto, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var result = await _inventoryService.CreateMovementAsync(dto, userId, cancellationToken);
        return result.Success 
            ? CreatedAtAction(nameof(GetMovementById), new { id = result.Data!.Id }, result) 
            : BadRequest(result);
    }

    /// <summary>
    /// Adjust stock quantity
    /// </summary>
    [HttpPost("stock/adjust")]
    [ProducesResponseType(typeof(ApiResponse<StockMovementDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<StockMovementDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AdjustStock([FromBody] StockAdjustmentDto dto, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var result = await _inventoryService.AdjustStockAsync(dto, userId, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Transfer stock between warehouses
    /// </summary>
    [HttpPost("stock/transfer")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<StockMovementDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<StockMovementDto>>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> TransferStock([FromBody] StockTransferDto dto, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var result = await _inventoryService.TransferStockAsync(dto, userId, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Stock Reservations

    /// <summary>
    /// Reserve stock for an order
    /// </summary>
    [HttpPost("stock/reserve")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ReserveStock([FromBody] StockReservationRequest request, CancellationToken cancellationToken)
    {
        var result = await _inventoryService.ReserveStockAsync(request.WarehouseId, request.ProductId, request.BatchId, request.Quantity, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Release reserved stock
    /// </summary>
    [HttpPost("stock/release")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ReleaseStock([FromBody] StockReservationRequest request, CancellationToken cancellationToken)
    {
        var result = await _inventoryService.ReleaseReservedStockAsync(request.WarehouseId, request.ProductId, request.BatchId, request.Quantity, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion
}

/// <summary>
/// Stock reservation request model
/// </summary>
public class StockReservationRequest
{
    public int WarehouseId { get; set; }
    public int ProductId { get; set; }
    public int? BatchId { get; set; }
    public int Quantity { get; set; }
}
