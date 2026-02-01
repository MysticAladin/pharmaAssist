using Domain.Enums;

namespace Application.DTOs.Orders;

/// <summary>
/// Create order request DTO for sales representative app
/// </summary>
public class CreateRepOrderDto
{
    public int CustomerId { get; set; }
    public int? VisitId { get; set; }
    public int? ShippingAddressId { get; set; }
    public int? BillingAddressId { get; set; }
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Invoice;
    public DateTime? RequiredDate { get; set; }
    public string? Notes { get; set; }
    public List<CreateOrderItemDto> Items { get; set; } = new();
    
    // Offline support
    public string? DeviceId { get; set; }
    public DateTime? OfflineCreatedAt { get; set; }
}

/// <summary>
/// Rep's order summary with attribution data
/// </summary>
public class RepOrderSummaryDto
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerCity { get; set; }
    public int ItemCount { get; set; }
    public decimal TotalAmount { get; set; }
    public OrderStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public PaymentStatus PaymentStatus { get; set; }
    public string PaymentStatusName { get; set; } = string.Empty;
    public int? VisitId { get; set; }
    public bool CreatedViaApp { get; set; }
    public DateTime? SyncedAt { get; set; }
}

/// <summary>
/// Rep's order history filter
/// </summary>
public class RepOrderFilterDto
{
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int? CustomerId { get; set; }
    public OrderStatus? Status { get; set; }
    public string? SearchTerm { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

/// <summary>
/// Rep's order history result with pagination
/// </summary>
public class RepOrderResultDto
{
    public IReadOnlyList<RepOrderSummaryDto> Items { get; set; } = new List<RepOrderSummaryDto>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public decimal TotalRevenue { get; set; }
    public int TotalOrders { get; set; }
}

/// <summary>
/// Rep order statistics summary
/// </summary>
public class RepOrderStatsDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public int TotalOrders { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal AverageOrderValue { get; set; }
    public int UniqueCustomers { get; set; }
    public int OrdersFromVisits { get; set; }
    public int OrdersDirectCreated { get; set; }
    public Dictionary<string, int> OrdersByStatus { get; set; } = new();
}
