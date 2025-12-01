using Application.DTOs.Common;
using Application.DTOs.Orders;
using Domain.Enums;

namespace Application.Interfaces;

/// <summary>
/// Order service interface
/// </summary>
public interface IOrderService
{
    Task<ApiResponse<OrderDto>> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<OrderDto>> GetByOrderNumberAsync(string orderNumber, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<OrderDto>>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<PagedResponse<OrderSummaryDto>> GetPagedAsync(
        int page,
        int pageSize,
        int? customerId = null,
        OrderStatus? status = null,
        PaymentStatus? paymentStatus = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<OrderSummaryDto>>> GetByCustomerAsync(int customerId, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<OrderSummaryDto>>> GetByStatusAsync(OrderStatus status, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<OrderSummaryDto>>> GetRecentOrdersAsync(int count, CancellationToken cancellationToken = default);
    
    // CRUD Operations
    Task<ApiResponse<OrderDto>> CreateAsync(CreateOrderDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<OrderDto>> UpdateAsync(int id, UpdateOrderDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default);
    
    // Status Management
    Task<ApiResponse<OrderDto>> UpdateStatusAsync(int id, UpdateOrderStatusDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<OrderDto>> UpdatePaymentStatusAsync(int id, UpdatePaymentStatusDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<OrderDto>> CancelOrderAsync(int id, string reason, CancellationToken cancellationToken = default);
    Task<ApiResponse<OrderDto>> ShipOrderAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<OrderDto>> DeliverOrderAsync(int id, CancellationToken cancellationToken = default);
    
    // Order Items
    Task<ApiResponse<OrderItemDto>> AddItemAsync(int orderId, CreateOrderItemDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<OrderItemDto>> UpdateItemAsync(int itemId, UpdateOrderItemDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> RemoveItemAsync(int itemId, CancellationToken cancellationToken = default);
    
    // Prescriptions
    Task<ApiResponse<PrescriptionDto>> AddPrescriptionAsync(int orderId, CreatePrescriptionDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<PrescriptionDto>> VerifyPrescriptionAsync(int prescriptionId, VerifyPrescriptionDto dto, CancellationToken cancellationToken = default);
    
    // Order Calculations
    Task<ApiResponse<OrderDto>> RecalculateTotalsAsync(int orderId, CancellationToken cancellationToken = default);
}
