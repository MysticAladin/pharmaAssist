using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

/// <summary>
/// Order repository implementation
/// </summary>
public class OrderRepository : Repository<Order>, IOrderRepository
{
    public OrderRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Order?> GetByOrderNumberAsync(string orderNumber, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber, cancellationToken);
    }

    public async Task<IReadOnlyList<Order>> GetByCustomerIdAsync(int customerId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(o => o.CustomerId == customerId)
            .OrderByDescending(o => o.OrderDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Order>> GetByStatusAsync(OrderStatus status, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(o => o.Status == status)
            .Include(o => o.Customer)
            .OrderByDescending(o => o.OrderDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Order>> GetByPaymentStatusAsync(PaymentStatus paymentStatus, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(o => o.PaymentStatus == paymentStatus)
            .Include(o => o.Customer)
            .OrderByDescending(o => o.OrderDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Order>> GetByDateRangeAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(o => o.OrderDate >= startDate && o.OrderDate <= endDate)
            .Include(o => o.Customer)
            .OrderByDescending(o => o.OrderDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<Order?> GetWithItemsAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);
    }

    public async Task<Order?> GetFullOrderAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(o => o.Customer)
            .Include(o => o.ShippingAddress)
            .Include(o => o.BillingAddress)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                    .ThenInclude(p => p.Manufacturer)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.ProductBatch)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<Order>> GetPendingOrdersAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(o => o.Status == OrderStatus.Pending || o.Status == OrderStatus.Confirmed)
            .Include(o => o.Customer)
            .OrderBy(o => o.OrderDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Order>> GetUnpaidOrdersAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(o => o.PaymentStatus == PaymentStatus.Pending && 
                        o.Status != OrderStatus.Cancelled)
            .Include(o => o.Customer)
            .OrderBy(o => o.OrderDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<string> GenerateOrderNumberAsync(CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow;
        // Format: ORD-YYYYMMDD-0001
        // Dashes improve readability and match UI expectations.
        var prefix = $"ORD-{today:yyyyMMdd}-";
        
        var lastOrder = await _dbSet
            .Where(o => o.OrderNumber.StartsWith(prefix))
            .OrderByDescending(o => o.OrderNumber)
            .FirstOrDefaultAsync(cancellationToken);

        int nextNumber = 1;
        if (lastOrder != null && lastOrder.OrderNumber.Length > prefix.Length)
        {
            var numberPart = lastOrder.OrderNumber[prefix.Length..];
            if (int.TryParse(numberPart, out int currentNumber))
            {
                nextNumber = currentNumber + 1;
            }
        }

        return $"{prefix}{nextNumber:D4}";
    }

    public async Task<decimal> GetTotalSalesAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(o => o.OrderDate >= startDate && 
                        o.OrderDate <= endDate && 
                        o.Status != OrderStatus.Cancelled)
            .SumAsync(o => o.TotalAmount, cancellationToken);
    }

    public async Task<int> GetOrderCountAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(o => o.OrderDate >= startDate && 
                        o.OrderDate <= endDate && 
                        o.Status != OrderStatus.Cancelled)
            .CountAsync(cancellationToken);
    }
}
