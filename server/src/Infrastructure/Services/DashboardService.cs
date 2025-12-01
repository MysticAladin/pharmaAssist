using Application.DTOs.Common;
using Application.DTOs.Dashboard;
using Application.Interfaces;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

/// <summary>
/// Dashboard and reporting service implementation
/// </summary>
public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DashboardService> _logger;

    public DashboardService(ApplicationDbContext context, ILogger<DashboardService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ApiResponse<DashboardStatsDto>> GetDashboardStatsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var today = DateTime.UtcNow.Date;
            var weekStart = today.AddDays(-(int)today.DayOfWeek);
            var monthStart = new DateTime(today.Year, today.Month, 1);

            var stats = new DashboardStatsDto
            {
                // Product statistics
                TotalProducts = await _context.Products.CountAsync(p => p.IsActive, cancellationToken),
                TotalCategories = await _context.Categories.CountAsync(c => c.IsActive, cancellationToken),
                TotalManufacturers = await _context.Manufacturers.CountAsync(m => m.IsActive, cancellationToken),
                PrescriptionProducts = await _context.Products.CountAsync(p => p.IsActive && p.RequiresPrescription, cancellationToken),
                OtcProducts = await _context.Products.CountAsync(p => p.IsActive && !p.RequiresPrescription, cancellationToken),

                // Inventory statistics
                LowStockProducts = await _context.InventoryStocks
                    .Where(i => i.QuantityOnHand <= i.ReorderLevel && i.QuantityOnHand > 0)
                    .Select(i => i.ProductId)
                    .Distinct()
                    .CountAsync(cancellationToken),
                
                ExpiringProducts = await _context.ProductBatches
                    .Where(b => b.ExpiryDate <= today.AddDays(30) && b.ExpiryDate > today)
                    .CountAsync(cancellationToken),
                
                ExpiredProducts = await _context.ProductBatches
                    .Where(b => b.ExpiryDate < today)
                    .CountAsync(cancellationToken),

                TotalInventoryValue = await _context.InventoryStocks
                    .Where(i => i.QuantityOnHand > 0)
                    .Join(_context.Products, i => i.ProductId, p => p.Id, (i, p) => new { i.QuantityOnHand, p.CostPrice })
                    .SumAsync(x => x.QuantityOnHand * (x.CostPrice ?? 0), cancellationToken),

                // Order statistics
                TotalOrders = await _context.Orders.CountAsync(cancellationToken),
                PendingOrders = await _context.Orders.CountAsync(o => o.Status == OrderStatus.Pending, cancellationToken),
                ProcessingOrders = await _context.Orders.CountAsync(o => o.Status == OrderStatus.Processing, cancellationToken),
                CompletedOrdersToday = await _context.Orders
                    .CountAsync(o => o.Status == OrderStatus.Delivered && o.OrderDate.Date == today, cancellationToken),

                TodaySalesAmount = await _context.Orders
                    .Where(o => o.OrderDate.Date == today && o.Status != OrderStatus.Cancelled)
                    .SumAsync(o => o.TotalAmount, cancellationToken),

                WeekSalesAmount = await _context.Orders
                    .Where(o => o.OrderDate >= weekStart && o.Status != OrderStatus.Cancelled)
                    .SumAsync(o => o.TotalAmount, cancellationToken),

                MonthSalesAmount = await _context.Orders
                    .Where(o => o.OrderDate >= monthStart && o.Status != OrderStatus.Cancelled)
                    .SumAsync(o => o.TotalAmount, cancellationToken),

                // Customer statistics
                TotalCustomers = await _context.Customers.CountAsync(cancellationToken),
                ActiveCustomers = await _context.Customers.CountAsync(c => c.IsActive, cancellationToken),
                NewCustomersThisMonth = await _context.Customers
                    .CountAsync(c => c.CreatedAt >= monthStart, cancellationToken)
            };

            return ApiResponse<DashboardStatsDto>.Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting dashboard stats");
            return ApiResponse<DashboardStatsDto>.Fail("Failed to retrieve dashboard statistics.");
        }
    }

    public async Task<ApiResponse<IEnumerable<SalesSummaryDto>>> GetSalesSummaryAsync(
        DateTime startDate,
        DateTime endDate,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var summary = await _context.Orders
                .Where(o => o.OrderDate >= startDate && o.OrderDate <= endDate && o.Status != OrderStatus.Cancelled)
                .GroupBy(o => o.OrderDate.Date)
                .Select(g => new SalesSummaryDto
                {
                    Date = g.Key,
                    TotalSales = g.Sum(o => o.TotalAmount),
                    OrderCount = g.Count(),
                    AverageOrderValue = g.Average(o => o.TotalAmount)
                })
                .OrderBy(s => s.Date)
                .ToListAsync(cancellationToken);

            return ApiResponse<IEnumerable<SalesSummaryDto>>.Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting sales summary");
            return ApiResponse<IEnumerable<SalesSummaryDto>>.Fail("Failed to retrieve sales summary.");
        }
    }

    public async Task<ApiResponse<IEnumerable<TopProductDto>>> GetTopProductsAsync(
        int count = 10,
        DateTime? startDate = null,
        DateTime? endDate = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _context.OrderItems
                .Include(oi => oi.Product)
                .Where(oi => oi.Order.Status != OrderStatus.Cancelled);

            if (startDate.HasValue)
                query = query.Where(oi => oi.Order.OrderDate >= startDate.Value);
            
            if (endDate.HasValue)
                query = query.Where(oi => oi.Order.OrderDate <= endDate.Value);

            var topProducts = await query
                .GroupBy(oi => new { oi.ProductId, oi.Product.Name, oi.Product.SKU })
                .Select(g => new TopProductDto
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.Name,
                    Sku = g.Key.SKU,
                    QuantitySold = g.Sum(oi => oi.Quantity),
                    TotalRevenue = g.Sum(oi => oi.LineTotal)
                })
                .OrderByDescending(p => p.TotalRevenue)
                .Take(count)
                .ToListAsync(cancellationToken);

            return ApiResponse<IEnumerable<TopProductDto>>.Ok(topProducts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting top products");
            return ApiResponse<IEnumerable<TopProductDto>>.Fail("Failed to retrieve top products.");
        }
    }

    public async Task<ApiResponse<IEnumerable<LowStockAlertDto>>> GetLowStockAlertsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var alerts = await _context.Products
                .Where(p => p.IsActive && p.StockQuantity <= p.ReorderLevel)
                .Select(p => new LowStockAlertDto
                {
                    ProductId = p.Id,
                    ProductName = p.Name,
                    Sku = p.SKU,
                    CurrentStock = p.StockQuantity,
                    MinimumStock = p.ReorderLevel,
                    ReorderLevel = p.ReorderLevel
                })
                .OrderBy(a => a.CurrentStock)
                .ToListAsync(cancellationToken);

            return ApiResponse<IEnumerable<LowStockAlertDto>>.Ok(alerts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting low stock alerts");
            return ApiResponse<IEnumerable<LowStockAlertDto>>.Fail("Failed to retrieve low stock alerts.");
        }
    }

    public async Task<ApiResponse<IEnumerable<ExpiringProductDto>>> GetExpiringProductsAsync(
        int daysThreshold = 30,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var today = DateTime.UtcNow.Date;
            var thresholdDate = today.AddDays(daysThreshold);

            var expiringProducts = await _context.ProductBatches
                .Include(b => b.Product)
                .Where(b => b.ExpiryDate <= thresholdDate && b.ExpiryDate >= today && b.RemainingQuantity > 0)
                .Select(b => new ExpiringProductDto
                {
                    InventoryId = b.Id,
                    ProductId = b.ProductId,
                    ProductName = b.Product.Name,
                    BatchNumber = b.BatchNumber,
                    Quantity = b.RemainingQuantity,
                    ExpiryDate = b.ExpiryDate,
                    DaysUntilExpiry = (int)(b.ExpiryDate - today).TotalDays,
                    LocationName = "Main Warehouse"
                })
                .OrderBy(e => e.ExpiryDate)
                .ToListAsync(cancellationToken);

            return ApiResponse<IEnumerable<ExpiringProductDto>>.Ok(expiringProducts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting expiring products");
            return ApiResponse<IEnumerable<ExpiringProductDto>>.Fail("Failed to retrieve expiring products.");
        }
    }

    public async Task<ApiResponse<IEnumerable<RecentOrderDto>>> GetRecentOrdersAsync(
        int count = 10,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var recentOrders = await _context.Orders
                .Include(o => o.Customer)
                .OrderByDescending(o => o.OrderDate)
                .Take(count)
                .Select(o => new RecentOrderDto
                {
                    OrderId = o.Id,
                    OrderNumber = o.OrderNumber,
                    CustomerName = o.Customer.FullName,
                    OrderDate = o.OrderDate,
                    TotalAmount = o.TotalAmount,
                    Status = o.Status.ToString()
                })
                .ToListAsync(cancellationToken);

            return ApiResponse<IEnumerable<RecentOrderDto>>.Ok(recentOrders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recent orders");
            return ApiResponse<IEnumerable<RecentOrderDto>>.Fail("Failed to retrieve recent orders.");
        }
    }

    public async Task<ApiResponse<IEnumerable<CategorySalesDto>>> GetSalesByCategoryAsync(
        DateTime? startDate = null,
        DateTime? endDate = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _context.OrderItems
                .Include(oi => oi.Product)
                .ThenInclude(p => p.Category)
                .Where(oi => oi.Order.Status != OrderStatus.Cancelled);

            if (startDate.HasValue)
                query = query.Where(oi => oi.Order.OrderDate >= startDate.Value);
            
            if (endDate.HasValue)
                query = query.Where(oi => oi.Order.OrderDate <= endDate.Value);

            var totalRevenue = await query.SumAsync(oi => oi.LineTotal, cancellationToken);

            var categorySales = await query
                .GroupBy(oi => new { oi.Product.CategoryId, oi.Product.Category.Name })
                .Select(g => new CategorySalesDto
                {
                    CategoryId = g.Key.CategoryId,
                    CategoryName = g.Key.Name,
                    ProductCount = g.Select(oi => oi.ProductId).Distinct().Count(),
                    QuantitySold = g.Sum(oi => oi.Quantity),
                    TotalRevenue = g.Sum(oi => oi.LineTotal),
                    PercentageOfTotal = totalRevenue > 0 ? (g.Sum(oi => oi.LineTotal) / totalRevenue) * 100 : 0
                })
                .OrderByDescending(c => c.TotalRevenue)
                .ToListAsync(cancellationToken);

            return ApiResponse<IEnumerable<CategorySalesDto>>.Ok(categorySales);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting sales by category");
            return ApiResponse<IEnumerable<CategorySalesDto>>.Fail("Failed to retrieve category sales.");
        }
    }

    public async Task<ApiResponse<IEnumerable<RegionalSalesDto>>> GetSalesByRegionAsync(
        DateTime? startDate = null,
        DateTime? endDate = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _context.Orders
                .Include(o => o.Customer)
                .ThenInclude(c => c.Addresses)
                .Where(o => o.Status != OrderStatus.Cancelled);

            if (startDate.HasValue)
                query = query.Where(o => o.OrderDate >= startDate.Value);
            
            if (endDate.HasValue)
                query = query.Where(o => o.OrderDate <= endDate.Value);

            // Get orders with canton info through customer addresses
            var ordersWithCanton = await query
                .Select(o => new
                {
                    o.TotalAmount,
                    Address = o.Customer.Addresses.FirstOrDefault(a => a.IsDefault)
                })
                .Where(x => x.Address != null && x.Address.CantonId != null)
                .ToListAsync(cancellationToken);

            if (!ordersWithCanton.Any())
            {
                return ApiResponse<IEnumerable<RegionalSalesDto>>.Ok(new List<RegionalSalesDto>());
            }

            var totalRevenue = ordersWithCanton.Sum(x => x.TotalAmount);

            var cantonIds = ordersWithCanton.Select(x => x.Address!.CantonId!.Value).Distinct().ToList();
            var cantons = await _context.Cantons
                .Include(c => c.BiHEntity)
                .Where(c => cantonIds.Contains(c.Id))
                .ToDictionaryAsync(c => c.Id, cancellationToken);

            var regionalSales = ordersWithCanton
                .GroupBy(x => x.Address!.CantonId!.Value)
                .Select(g => new RegionalSalesDto
                {
                    CantonId = g.Key,
                    CantonName = cantons.TryGetValue(g.Key, out var canton) ? canton.Name : "Unknown",
                    Entity = cantons.TryGetValue(g.Key, out var c) ? c.BiHEntity.Name : "Unknown",
                    OrderCount = g.Count(),
                    TotalRevenue = g.Sum(x => x.TotalAmount),
                    PercentageOfTotal = totalRevenue > 0 ? (g.Sum(x => x.TotalAmount) / totalRevenue) * 100 : 0
                })
                .OrderByDescending(r => r.TotalRevenue)
                .ToList();

            return ApiResponse<IEnumerable<RegionalSalesDto>>.Ok(regionalSales);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting sales by region");
            return ApiResponse<IEnumerable<RegionalSalesDto>>.Fail("Failed to retrieve regional sales.");
        }
    }
}
