using Application.DTOs.Common;
using Application.DTOs.Orders;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Application.Services;

/// <summary>
/// Service implementation for sales rep order operations
/// </summary>
public class RepOrderService : IRepOrderService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IOrderService _orderService;
    private readonly IVisitService _visitService;
    private readonly ILogger<RepOrderService> _logger;

    public RepOrderService(
        IUnitOfWork unitOfWork,
        IOrderService orderService,
        IVisitService visitService,
        ILogger<RepOrderService> logger)
    {
        _unitOfWork = unitOfWork;
        _orderService = orderService;
        _visitService = visitService;
        _logger = logger;
    }

    public async Task<ApiResponse<OrderDto>> CreateOrderAsync(string userId, CreateRepOrderDto dto, CancellationToken cancellationToken = default)
    {
        // Get rep from user ID
        var rep = await _unitOfWork.SalesReps.GetByUserIdAsync(userId, cancellationToken);
        if (rep == null)
        {
            return ApiResponse<OrderDto>.Fail("User is not registered as a sales representative.");
        }

        // Verify customer is assigned to this rep
        var customerAssignment = await _unitOfWork.SalesReps.GetCustomerAssignmentAsync(rep.Id, dto.CustomerId, cancellationToken);
        if (customerAssignment == null)
        {
            return ApiResponse<OrderDto>.Fail("Customer is not assigned to you.");
        }

        // Verify visit exists and belongs to this rep (if provided)
        if (dto.VisitId.HasValue)
        {
            var visit = await _visitService.GetExecutedVisitAsync(userId, dto.VisitId.Value, cancellationToken);
            if (visit == null)
            {
                return ApiResponse<OrderDto>.Fail("Invalid visit reference.");
            }
        }

        // Create the order using the standard service
        var createOrderDto = new CreateOrderDto
        {
            CustomerId = dto.CustomerId,
            ShippingAddressId = dto.ShippingAddressId,
            BillingAddressId = dto.BillingAddressId,
            PaymentMethod = dto.PaymentMethod,
            RequiredDate = dto.RequiredDate,
            Notes = dto.Notes,
            Items = dto.Items
        };

        var result = await _orderService.CreateAsync(createOrderDto, cancellationToken);
        if (!result.Success || result.Data == null)
        {
            return result;
        }

        // Update with rep attribution
        var order = await _unitOfWork.Orders.GetByIdAsync(result.Data.Id, cancellationToken);
        if (order != null)
        {
            order.RepId = rep.Id;
            order.VisitId = dto.VisitId;
            order.CreatedViaApp = true;
            order.RepDeviceId = dto.DeviceId;
            order.OfflineCreatedAt = dto.OfflineCreatedAt;
            order.SyncedAt = dto.OfflineCreatedAt.HasValue ? DateTime.UtcNow : null;
            
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            
            _logger.LogInformation("Rep {RepId} created order {OrderNumber} for customer {CustomerId}",
                rep.Id, order.OrderNumber, dto.CustomerId);
        }

        return result;
    }

    public async Task<RepOrderResultDto> GetMyOrdersAsync(string userId, RepOrderFilterDto filter, CancellationToken cancellationToken = default)
    {
        var rep = await _unitOfWork.SalesReps.GetByUserIdAsync(userId, cancellationToken);
        if (rep == null)
        {
            return new RepOrderResultDto();
        }

        var query = _unitOfWork.Orders.Query()
            .Where(o => o.RepId == rep.Id);

        // Apply filters
        if (filter.FromDate.HasValue)
        {
            query = query.Where(o => o.OrderDate >= filter.FromDate.Value);
        }

        if (filter.ToDate.HasValue)
        {
            var endDate = filter.ToDate.Value.AddDays(1);
            query = query.Where(o => o.OrderDate < endDate);
        }

        if (filter.CustomerId.HasValue)
        {
            query = query.Where(o => o.CustomerId == filter.CustomerId.Value);
        }

        if (filter.Status.HasValue)
        {
            query = query.Where(o => o.Status == filter.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim().ToLower();
            query = query.Where(o =>
                o.OrderNumber.ToLower().Contains(term) ||
                (o.Customer.CompanyName != null && o.Customer.CompanyName.ToLower().Contains(term)) ||
                o.Customer.FirstName.ToLower().Contains(term) ||
                o.Customer.LastName.ToLower().Contains(term));
        }

        // Get total count and revenue
        var totalCount = await _unitOfWork.Orders.CountAsync(query, cancellationToken);
        var totalRevenue = await _unitOfWork.Orders.SumAsync(query, o => o.TotalAmount, cancellationToken);

        // Apply pagination
        var items = await _unitOfWork.Orders.GetPagedAsync(
            query.OrderByDescending(o => o.OrderDate),
            filter.Page,
            filter.PageSize,
            cancellationToken);

        return new RepOrderResultDto
        {
            Items = items.Select(MapToRepOrderSummary).ToList(),
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalRevenue = totalRevenue,
            TotalOrders = totalCount
        };
    }

    public async Task<RepOrderStatsDto> GetMyStatsAsync(string userId, DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default)
    {
        var rep = await _unitOfWork.SalesReps.GetByUserIdAsync(userId, cancellationToken);
        if (rep == null)
        {
            return new RepOrderStatsDto();
        }

        var actualFromDate = fromDate ?? DateTime.UtcNow.AddMonths(-1);
        var actualToDate = toDate ?? DateTime.UtcNow;
        var endDate = actualToDate.AddDays(1);

        var query = _unitOfWork.Orders.Query()
            .Where(o => o.RepId == rep.Id && o.OrderDate >= actualFromDate && o.OrderDate < endDate);

        var orders = await _unitOfWork.Orders.ToListAsync(query, cancellationToken);

        var stats = new RepOrderStatsDto
        {
            FromDate = actualFromDate,
            ToDate = actualToDate,
            TotalOrders = orders.Count,
            TotalRevenue = orders.Sum(o => o.TotalAmount),
            UniqueCustomers = orders.Select(o => o.CustomerId).Distinct().Count(),
            OrdersFromVisits = orders.Count(o => o.VisitId.HasValue),
            OrdersDirectCreated = orders.Count(o => !o.VisitId.HasValue)
        };

        stats.AverageOrderValue = stats.TotalOrders > 0 
            ? stats.TotalRevenue / stats.TotalOrders 
            : 0;

        stats.OrdersByStatus = orders
            .GroupBy(o => o.Status.ToString())
            .ToDictionary(g => g.Key, g => g.Count());

        return stats;
    }

    public async Task<IReadOnlyList<RepOrderSummaryDto>> GetCustomerRecentOrdersAsync(string userId, int customerId, int count = 10, CancellationToken cancellationToken = default)
    {
        var rep = await _unitOfWork.SalesReps.GetByUserIdAsync(userId, cancellationToken);
        if (rep == null)
        {
            return new List<RepOrderSummaryDto>();
        }

        // Verify customer is assigned to rep
        var assignment = await _unitOfWork.SalesReps.GetCustomerAssignmentAsync(rep.Id, customerId, cancellationToken);
        if (assignment == null)
        {
            return new List<RepOrderSummaryDto>();
        }

        var orders = await _unitOfWork.Orders.GetRecentByCustomerAsync(customerId, count, cancellationToken);

        return orders.Select(MapToRepOrderSummary).ToList();
    }

    private static RepOrderSummaryDto MapToRepOrderSummary(Order order)
    {
        return new RepOrderSummaryDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            OrderDate = order.OrderDate,
            CustomerId = order.CustomerId,
            CustomerName = GetCustomerDisplayName(order.Customer),
            CustomerCity = order.Customer?.Addresses?.FirstOrDefault(a => a.IsDefault)?.City,
            ItemCount = order.OrderItems?.Count ?? 0,
            TotalAmount = order.TotalAmount,
            Status = order.Status,
            StatusName = order.Status.ToString(),
            PaymentStatus = order.PaymentStatus,
            PaymentStatusName = order.PaymentStatus.ToString(),
            VisitId = order.VisitId,
            CreatedViaApp = order.CreatedViaApp,
            SyncedAt = order.SyncedAt
        };
    }

    private static string GetCustomerDisplayName(Customer? customer)
    {
        if (customer == null) return string.Empty;
        
        // Prefer company name for B2B customers
        if (!string.IsNullOrWhiteSpace(customer.CompanyName))
        {
            return customer.CompanyName;
        }
        
        // Fall back to full name
        return $"{customer.FirstName} {customer.LastName}".Trim();
    }
}
