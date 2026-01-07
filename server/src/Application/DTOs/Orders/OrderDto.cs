using Domain.Enums;

namespace Application.DTOs.Orders;

/// <summary>
/// Order response DTO
/// </summary>
public class OrderDto
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerCode { get; set; } = string.Empty;
    public int? ShippingAddressId { get; set; }
    public string? ShippingAddress { get; set; }
    public int? BillingAddressId { get; set; }
    public string? BillingAddress { get; set; }
    public OrderStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public PaymentStatus PaymentStatus { get; set; }
    public string PaymentStatusName { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public DateTime? RequiredDate { get; set; }
    public DateTime? ShippedDate { get; set; }
    public DateTime? DeliveredDate { get; set; }
    public decimal SubTotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal ShippingAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string? Notes { get; set; }
    public string? InternalNotes { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
    public List<PrescriptionDto> Prescriptions { get; set; } = new();
}

/// <summary>
/// Order summary for lists
/// </summary>
public class OrderSummaryDto
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerCode { get; set; } = string.Empty;
    public OrderStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public PaymentStatus PaymentStatus { get; set; }
    public string PaymentStatusName { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public decimal TotalAmount { get; set; }
    public int ItemCount { get; set; }
}

/// <summary>
/// Create order request DTO
/// </summary>
public class CreateOrderDto
{
    public int CustomerId { get; set; }
    public int? ShippingAddressId { get; set; }
    public int? BillingAddressId { get; set; }
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Invoice;
    public DateTime? RequiredDate { get; set; }
    public string? Notes { get; set; }
    public List<CreateOrderItemDto> Items { get; set; } = new();
}

/// <summary>
/// Create order request DTO for customer portal.
/// CustomerId is derived from the authenticated user.
/// </summary>
public class CreatePortalOrderDto
{
    public int? ShippingAddressId { get; set; }
    public int? BillingAddressId { get; set; }
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Invoice;
    public DateTime? RequiredDate { get; set; }
    public string? Notes { get; set; }
    public List<CreateOrderItemDto> Items { get; set; } = new();
}

/// <summary>
/// Update order request DTO
/// </summary>
public class UpdateOrderDto
{
    public int? ShippingAddressId { get; set; }
    public int? BillingAddressId { get; set; }
    public DateTime? RequiredDate { get; set; }
    public string? Notes { get; set; }
    public string? InternalNotes { get; set; }
}

/// <summary>
/// Update order status request DTO
/// </summary>
public class UpdateOrderStatusDto
{
    public OrderStatus Status { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Update payment status request DTO
/// </summary>
public class UpdatePaymentStatusDto
{
    public PaymentStatus PaymentStatus { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Order item response DTO
/// </summary>
public class OrderItemDto
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public int? ProductBatchId { get; set; }
    public string? BatchNumber { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountPercentage { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxRate { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal LineTotal { get; set; }
    public int? PrescriptionId { get; set; }
    
    /// <summary>
    /// Price type used for this item (1=Commercial, 2=Essential)
    /// </summary>
    public int PriceType { get; set; } = 1;
}

/// <summary>
/// Create order item request DTO
/// </summary>
public class CreateOrderItemDto
{
    public int ProductId { get; set; }
    public int? ProductBatchId { get; set; }
    public int Quantity { get; set; }
    public decimal? DiscountPercentage { get; set; }
    public int? PrescriptionId { get; set; }
    
    /// <summary>
    /// The unit price to use for this order item.
    /// If provided, this price is used directly (e.g., from customer portal with pre-calculated pricing).
    /// If not provided, the product's base unit price is used.
    /// </summary>
    public decimal? UnitPrice { get; set; }
    
    /// <summary>
    /// The price type (Commercial=1, Essential=2).
    /// Used to track which pricing tier was applied.
    /// </summary>
    public int? PriceType { get; set; }
}

/// <summary>
/// Update order item request DTO
/// </summary>
public class UpdateOrderItemDto
{
    public int Quantity { get; set; }
    public decimal? DiscountPercentage { get; set; }
}

/// <summary>
/// Prescription response DTO
/// </summary>
public class PrescriptionDto
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public string PrescriptionNumber { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string? DoctorLicense { get; set; }
    public string? PatientName { get; set; }
    public DateTime IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsVerified { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public string? VerifiedBy { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Create prescription request DTO
/// </summary>
public class CreatePrescriptionDto
{
    public string PrescriptionNumber { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string? DoctorLicense { get; set; }
    public string? PatientName { get; set; }
    public DateTime IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? ImageUrl { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Verify prescription request DTO
/// </summary>
public class VerifyPrescriptionDto
{
    public bool IsVerified { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Order statistics DTO
/// </summary>
public class OrderStatsDto
{
    public int TotalOrders { get; set; }
    public int PendingOrders { get; set; }
    public int ProcessingOrders { get; set; }
    public int CompletedOrders { get; set; }
    public int CancelledOrders { get; set; }
    public int ShippedOrders { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal AverageOrderValue { get; set; }
    public int OrdersWithPrescription { get; set; }
}
