using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Order entity
/// </summary>
public class Order : BaseEntity
{
    public string OrderNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    
    // Dates
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public DateTime? RequiredDate { get; set; }
    public DateTime? ShippedDate { get; set; }
    public DateTime? DeliveredDate { get; set; }
    
    // Status
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    
    // Addresses
    public int? ShippingAddressId { get; set; }
    public int? BillingAddressId { get; set; }
    
    // Amounts (in BAM)
    public decimal SubTotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal ShippingAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    
    // Payment
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Invoice;
    public DateTime? PaidDate { get; set; }
    
    // Notes
    public string? Notes { get; set; }
    public string? InternalNotes { get; set; }
    public string? CancellationReason { get; set; }

    // Navigation properties
    public virtual Customer Customer { get; set; } = null!;
    public virtual CustomerAddress? ShippingAddress { get; set; }
    public virtual CustomerAddress? BillingAddress { get; set; }
    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
