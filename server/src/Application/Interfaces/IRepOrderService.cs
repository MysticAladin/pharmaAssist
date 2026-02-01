using Application.DTOs.Common;
using Application.DTOs.Orders;

namespace Application.Interfaces;

/// <summary>
/// Sales rep order service interface - handles rep-specific order operations
/// </summary>
public interface IRepOrderService
{
    /// <summary>
    /// Create an order as a sales rep (sets rep attribution)
    /// </summary>
    Task<ApiResponse<OrderDto>> CreateOrderAsync(string userId, CreateRepOrderDto dto, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get orders created by the authenticated rep
    /// </summary>
    Task<RepOrderResultDto> GetMyOrdersAsync(string userId, RepOrderFilterDto filter, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get order statistics for the authenticated rep
    /// </summary>
    Task<RepOrderStatsDto> GetMyStatsAsync(string userId, DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get recent orders for a specific customer (for rep to see customer history)
    /// </summary>
    Task<IReadOnlyList<RepOrderSummaryDto>> GetCustomerRecentOrdersAsync(string userId, int customerId, int count = 10, CancellationToken cancellationToken = default);
}
