using Application.DTOs.Common;
using Application.DTOs.Orders;
using Application.Interfaces;
using Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Orders API Controller
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(IOrderService orderService, ILogger<OrdersController> logger)
    {
        _orderService = orderService;
        _logger = logger;
    }

    /// <summary>
    /// Get all orders
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<OrderDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await _orderService.GetAllAsync(cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get orders with pagination
    /// </summary>
    [HttpGet("paged")]
    [ProducesResponseType(typeof(PagedResponse<OrderSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] int? customerId = null,
        [FromQuery] OrderStatus? status = null,
        [FromQuery] PaymentStatus? paymentStatus = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortDirection = null,
        CancellationToken cancellationToken = default)
    {
        var sortDescending = !string.Equals(sortDirection, "asc", StringComparison.OrdinalIgnoreCase);
        var result = await _orderService.GetPagedAsync(
            page: page,
            pageSize: pageSize,
            searchTerm: searchTerm,
            customerId: customerId,
            status: status,
            paymentStatus: paymentStatus,
            fromDate: fromDate,
            toDate: toDate,
            sortBy: sortBy,
            sortDescending: sortDescending,
            cancellationToken: cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get order by ID
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _orderService.GetByIdAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get order by order number
    /// </summary>
    [HttpGet("number/{orderNumber}")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByOrderNumber(string orderNumber, CancellationToken cancellationToken)
    {
        var result = await _orderService.GetByOrderNumberAsync(orderNumber, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get orders by customer
    /// </summary>
    [HttpGet("customer/{customerId:int}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<OrderSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByCustomer(int customerId, CancellationToken cancellationToken)
    {
        var result = await _orderService.GetByCustomerAsync(customerId, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get orders by status
    /// </summary>
    [HttpGet("status/{status}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<OrderSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByStatus(OrderStatus status, CancellationToken cancellationToken)
    {
        var result = await _orderService.GetByStatusAsync(status, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get recent orders
    /// </summary>
    [HttpGet("recent")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<OrderSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRecentOrders([FromQuery] int count = 10, CancellationToken cancellationToken = default)
    {
        var result = await _orderService.GetRecentOrdersAsync(count, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get order statistics
    /// </summary>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(ApiResponse<OrderStatsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStats([FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null, CancellationToken cancellationToken = default)
    {
        var result = await _orderService.GetStatsAsync(fromDate, toDate, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Create a new order
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateOrderDto dto, CancellationToken cancellationToken)
    {
        var result = await _orderService.CreateAsync(dto, cancellationToken);
        return result.Success 
            ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result) 
            : BadRequest(result);
    }

    /// <summary>
    /// Update an order
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateOrderDto dto, CancellationToken cancellationToken)
    {
        var result = await _orderService.UpdateAsync(id, dto, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Delete an order
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var result = await _orderService.DeleteAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #region Order Status Management

    /// <summary>
    /// Update order status
    /// </summary>
    [HttpPatch("{id:int}/status")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusDto dto, CancellationToken cancellationToken)
    {
        var result = await _orderService.UpdateStatusAsync(id, dto, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Update payment status
    /// </summary>
    [HttpPatch("{id:int}/payment-status")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePaymentStatus(int id, [FromBody] UpdatePaymentStatusDto dto, CancellationToken cancellationToken)
    {
        var result = await _orderService.UpdatePaymentStatusAsync(id, dto, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Cancel an order
    /// </summary>
    [HttpPatch("{id:int}/cancel")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Cancel(int id, [FromBody] string reason, CancellationToken cancellationToken)
    {
        var result = await _orderService.CancelOrderAsync(id, reason, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Ship an order
    /// </summary>
    [HttpPatch("{id:int}/ship")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Ship(int id, CancellationToken cancellationToken)
    {
        var result = await _orderService.ShipOrderAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Mark order as delivered
    /// </summary>
    [HttpPatch("{id:int}/deliver")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Deliver(int id, CancellationToken cancellationToken)
    {
        var result = await _orderService.DeliverOrderAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Recalculate order totals
    /// </summary>
    [HttpPatch("{id:int}/recalculate")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RecalculateTotals(int id, CancellationToken cancellationToken)
    {
        var result = await _orderService.RecalculateTotalsAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #endregion

    #region Order Items

    /// <summary>
    /// Add item to order
    /// </summary>
    [HttpPost("{orderId:int}/items")]
    [ProducesResponseType(typeof(ApiResponse<OrderItemDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<OrderItemDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddItem(int orderId, [FromBody] CreateOrderItemDto dto, CancellationToken cancellationToken)
    {
        var result = await _orderService.AddItemAsync(orderId, dto, cancellationToken);
        return result.Success ? CreatedAtAction(nameof(GetById), new { id = orderId }, result) : BadRequest(result);
    }

    /// <summary>
    /// Update order item
    /// </summary>
    [HttpPut("items/{itemId:int}")]
    [ProducesResponseType(typeof(ApiResponse<OrderItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<OrderItemDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateItem(int itemId, [FromBody] UpdateOrderItemDto dto, CancellationToken cancellationToken)
    {
        var result = await _orderService.UpdateItemAsync(itemId, dto, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Remove item from order
    /// </summary>
    [HttpDelete("items/{itemId:int}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveItem(int itemId, CancellationToken cancellationToken)
    {
        var result = await _orderService.RemoveItemAsync(itemId, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #endregion

    #region Prescriptions

    /// <summary>
    /// Add prescription to order
    /// </summary>
    [HttpPost("{orderId:int}/prescriptions")]
    [ProducesResponseType(typeof(ApiResponse<PrescriptionDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<PrescriptionDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddPrescription(int orderId, [FromBody] CreatePrescriptionDto dto, CancellationToken cancellationToken)
    {
        var result = await _orderService.AddPrescriptionAsync(orderId, dto, cancellationToken);
        return result.Success ? CreatedAtAction(nameof(GetById), new { id = orderId }, result) : BadRequest(result);
    }

    /// <summary>
    /// Verify prescription
    /// </summary>
    [HttpPatch("prescriptions/{prescriptionId:int}/verify")]
    [ProducesResponseType(typeof(ApiResponse<PrescriptionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<PrescriptionDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> VerifyPrescription(int prescriptionId, [FromBody] VerifyPrescriptionDto dto, CancellationToken cancellationToken)
    {
        var result = await _orderService.VerifyPrescriptionAsync(prescriptionId, dto, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #endregion
}
