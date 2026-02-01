using Domain.Entities;
using Domain.Enums;

namespace Domain.Interfaces;

/// <summary>
/// Order repository with order-specific operations
/// </summary>
public interface IOrderRepository : IRepository<Order>
{
    Task<Order?> GetByOrderNumberAsync(string orderNumber, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Order>> GetByCustomerIdAsync(int customerId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Order>> GetByStatusAsync(OrderStatus status, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Order>> GetByPaymentStatusAsync(PaymentStatus paymentStatus, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Order>> GetByDateRangeAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);
    Task<Order?> GetWithItemsAsync(int id, CancellationToken cancellationToken = default);
    Task<Order?> GetFullOrderAsync(int id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Order>> GetPendingOrdersAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Order>> GetUnpaidOrdersAsync(CancellationToken cancellationToken = default);
    Task<string> GenerateOrderNumberAsync(CancellationToken cancellationToken = default);
    Task<decimal> GetTotalSalesAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);
    Task<int> GetOrderCountAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);
    
    // Rep-specific methods
    IQueryable<Order> Query();
    Task<int> CountAsync(IQueryable<Order> query, CancellationToken cancellationToken = default);
    Task<decimal> SumAsync(IQueryable<Order> query, System.Linq.Expressions.Expression<Func<Order, decimal>> selector, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Order>> GetPagedAsync(IQueryable<Order> query, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Order>> ToListAsync(IQueryable<Order> query, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Order>> GetRecentByCustomerAsync(int customerId, int count, CancellationToken cancellationToken = default);
}
