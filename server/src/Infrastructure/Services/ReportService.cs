using Application.DTOs.Reports;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Globalization;
using System.Text;

namespace Infrastructure.Services;

public class ReportService : IReportService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ReportService> _logger;

    public ReportService(ApplicationDbContext context, ILogger<ReportService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ReportResultDto> GenerateReportAsync(ReportRequestDto request)
    {
        try
        {
            return request.ReportType switch
            {
                ReportType.SalesSummary or ReportType.SalesDetailed => await GenerateSalesReportAsync(request),
                ReportType.InventoryStatus => await GenerateInventoryReportAsync(request),
                ReportType.CustomerOrders or ReportType.CustomerStatement => await GenerateCustomerReportAsync(request),
                ReportType.ExpiringProducts => await GenerateExpiringProductsReportAsync(request),
                ReportType.LowStockProducts => await GenerateLowStockReportAsync(request),
                _ => new ReportResultDto { Success = false, Message = $"Report type {request.ReportType} is not supported" }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating report: {ReportType}", request.ReportType);
            return new ReportResultDto { Success = false, Message = $"Error generating report: {ex.Message}" };
        }
    }

    public async Task<SalesReportDto> GetSalesReportDataAsync(DateTime startDate, DateTime endDate)
    {
        var orders = await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .Where(o => o.OrderDate >= startDate && o.OrderDate <= endDate)
            .Where(o => o.Status != OrderStatus.Cancelled)
            .ToListAsync();

        var report = new SalesReportDto
        {
            ReportDate = DateTime.UtcNow,
            StartDate = startDate,
            EndDate = endDate,
            TotalOrders = orders.Count,
            TotalRevenue = orders.Sum(o => o.TotalAmount),
            TotalDiscount = orders.Sum(o => o.DiscountAmount),
            NetRevenue = orders.Sum(o => o.TotalAmount - o.DiscountAmount),
            AverageOrderValue = orders.Count > 0 ? orders.Average(o => o.TotalAmount) : 0
        };

        // Group by product
        var productSales = orders
            .SelectMany(o => o.OrderItems)
            .GroupBy(oi => new { oi.ProductId, oi.Product.Name, oi.Product.SKU })
            .Select(g => new SalesReportItemDto
            {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.Name,
                SKU = g.Key.SKU,
                QuantitySold = g.Sum(oi => oi.Quantity),
                UnitPrice = g.Average(oi => oi.UnitPrice),
                TotalAmount = g.Sum(oi => oi.LineTotal),
                DiscountAmount = g.Sum(oi => oi.LineTotal * oi.DiscountPercent / 100),
                NetAmount = g.Sum(oi => oi.LineTotal * (1 - oi.DiscountPercent / 100))
            })
            .OrderByDescending(p => p.TotalAmount)
            .ToList();

        report.Items = productSales;

        // Daily sales
        report.DailySales = orders
            .GroupBy(o => o.OrderDate.Date)
            .Select(g => new DailySalesDto
            {
                Date = g.Key,
                OrderCount = g.Count(),
                Revenue = g.Sum(o => o.TotalAmount)
            })
            .OrderBy(d => d.Date)
            .ToList();

        return report;
    }

    public async Task<InventoryReportDto> GetInventoryReportDataAsync()
    {
        var products = await _context.Products
            .Where(p => !p.IsDeleted && p.IsActive)
            .ToListAsync();

        var report = new InventoryReportDto
        {
            ReportDate = DateTime.UtcNow,
            TotalProducts = products.Count
        };

        var items = new List<InventoryReportItemDto>();

        foreach (var product in products)
        {
            var currentStock = product.StockQuantity;
            
            // Get earliest expiry from product batches
            var earliestExpiry = await _context.Set<ProductBatch>()
                .Where(b => b.ProductId == product.Id && b.RemainingQuantity > 0)
                .MinAsync(b => (DateTime?)b.ExpiryDate);
            
            string stockStatus;
            if (currentStock == 0)
            {
                stockStatus = "Out of Stock";
                report.TotalOutOfStock++;
            }
            else if (currentStock <= product.ReorderLevel)
            {
                stockStatus = "Low Stock";
                report.TotalLowStock++;
            }
            else
            {
                stockStatus = "In Stock";
                report.TotalInStock++;
            }

            if (earliestExpiry.HasValue && earliestExpiry.Value <= DateTime.UtcNow.AddDays(90))
            {
                report.TotalExpiringSoon++;
            }

            var unitCost = product.CostPrice ?? 0m;
            items.Add(new InventoryReportItemDto
            {
                ProductId = product.Id,
                ProductName = product.Name,
                SKU = product.SKU,
                CurrentStock = currentStock,
                ReorderLevel = product.ReorderLevel,
                UnitCost = unitCost,
                TotalValue = currentStock * unitCost,
                EarliestExpiry = earliestExpiry,
                StockStatus = stockStatus
            });

            report.TotalInventoryValue += currentStock * unitCost;
        }

        report.Items = items.OrderBy(i => i.StockStatus).ThenBy(i => i.ProductName).ToList();
        return report;
    }

    public async Task<CustomerReportDto> GetCustomerReportDataAsync(int customerId, DateTime startDate, DateTime endDate)
    {
        var customer = await _context.Customers
            .Include(c => c.Orders.Where(o => o.OrderDate >= startDate && o.OrderDate <= endDate))
            .FirstOrDefaultAsync(c => c.Id == customerId);

        if (customer == null)
        {
            return new CustomerReportDto { ReportDate = DateTime.UtcNow };
        }

        var report = new CustomerReportDto
        {
            ReportDate = DateTime.UtcNow,
            CustomerId = customer.Id,
            CustomerName = customer.FullName,
            Email = customer.Email ?? string.Empty,
            StartDate = startDate,
            EndDate = endDate,
            TotalOrders = customer.Orders.Count,
            TotalSpent = customer.Orders.Sum(o => o.TotalAmount),
            TotalDiscount = customer.Orders.Sum(o => o.DiscountAmount)
        };

        report.Orders = customer.Orders
            .Select(o => new CustomerOrderSummaryDto
            {
                OrderId = o.Id,
                OrderNumber = o.OrderNumber,
                OrderDate = o.OrderDate,
                Status = o.Status.ToString(),
                ItemCount = o.OrderItems.Count,
                Total = o.TotalAmount
            })
            .OrderByDescending(o => o.OrderDate)
            .ToList();

        return report;
    }

    public async Task<byte[]> GenerateSalesPdfAsync(SalesReportDto data)
    {
        // Generate HTML content for PDF
        var html = GenerateSalesHtml(data);
        
        // For now, return HTML as bytes - in production use a library like DinkToPdf or iTextSharp
        return Encoding.UTF8.GetBytes(html);
    }

    public async Task<byte[]> GenerateInventoryPdfAsync(InventoryReportDto data)
    {
        var html = GenerateInventoryHtml(data);
        return Encoding.UTF8.GetBytes(html);
    }

    public async Task<byte[]> GenerateCustomerPdfAsync(CustomerReportDto data)
    {
        var html = GenerateCustomerHtml(data);
        return Encoding.UTF8.GetBytes(html);
    }

    public async Task<byte[]> ExportToExcelAsync<T>(IEnumerable<T> data, string sheetName)
    {
        // Simple CSV-like format for Excel - in production use EPPlus or ClosedXML
        var csv = await ExportToCsvAsync(data);
        return csv;
    }

    public async Task<byte[]> ExportToCsvAsync<T>(IEnumerable<T> data)
    {
        var sb = new StringBuilder();
        var properties = typeof(T).GetProperties();

        // Header
        sb.AppendLine(string.Join(",", properties.Select(p => $"\"{p.Name}\"")));

        // Data rows
        foreach (var item in data)
        {
            var values = properties.Select(p =>
            {
                var value = p.GetValue(item)?.ToString() ?? string.Empty;
                return $"\"{value.Replace("\"", "\"\"")}\"";
            });
            sb.AppendLine(string.Join(",", values));
        }

        return await Task.FromResult(Encoding.UTF8.GetBytes(sb.ToString()));
    }

    private async Task<ReportResultDto> GenerateSalesReportAsync(ReportRequestDto request)
    {
        var startDate = request.StartDate ?? DateTime.UtcNow.AddMonths(-1);
        var endDate = request.EndDate ?? DateTime.UtcNow;

        var data = await GetSalesReportDataAsync(startDate, endDate);

        byte[] content;
        string contentType;
        string fileName;

        switch (request.Format)
        {
            case ReportFormat.Excel:
            case ReportFormat.Csv:
                content = await ExportToCsvAsync(data.Items);
                contentType = "text/csv";
                fileName = $"sales-report-{DateTime.UtcNow:yyyyMMdd}.csv";
                break;
            case ReportFormat.Html:
                content = Encoding.UTF8.GetBytes(GenerateSalesHtml(data));
                contentType = "text/html";
                fileName = $"sales-report-{DateTime.UtcNow:yyyyMMdd}.html";
                break;
            default:
                content = await GenerateSalesPdfAsync(data);
                contentType = "text/html"; // For now returning HTML
                fileName = $"sales-report-{DateTime.UtcNow:yyyyMMdd}.html";
                break;
        }

        return new ReportResultDto
        {
            Success = true,
            FileName = fileName,
            ContentType = contentType,
            Content = content
        };
    }

    private async Task<ReportResultDto> GenerateInventoryReportAsync(ReportRequestDto request)
    {
        var data = await GetInventoryReportDataAsync();

        byte[] content;
        string contentType;
        string fileName;

        switch (request.Format)
        {
            case ReportFormat.Excel:
            case ReportFormat.Csv:
                content = await ExportToCsvAsync(data.Items);
                contentType = "text/csv";
                fileName = $"inventory-report-{DateTime.UtcNow:yyyyMMdd}.csv";
                break;
            default:
                content = await GenerateInventoryPdfAsync(data);
                contentType = "text/html";
                fileName = $"inventory-report-{DateTime.UtcNow:yyyyMMdd}.html";
                break;
        }

        return new ReportResultDto
        {
            Success = true,
            FileName = fileName,
            ContentType = contentType,
            Content = content
        };
    }

    private async Task<ReportResultDto> GenerateCustomerReportAsync(ReportRequestDto request)
    {
        if (!request.EntityId.HasValue)
        {
            return new ReportResultDto { Success = false, Message = "Customer ID is required" };
        }

        var startDate = request.StartDate ?? DateTime.UtcNow.AddYears(-1);
        var endDate = request.EndDate ?? DateTime.UtcNow;

        var data = await GetCustomerReportDataAsync(request.EntityId.Value, startDate, endDate);

        byte[] content;
        string contentType;
        string fileName;

        switch (request.Format)
        {
            case ReportFormat.Excel:
            case ReportFormat.Csv:
                content = await ExportToCsvAsync(data.Orders);
                contentType = "text/csv";
                fileName = $"customer-{request.EntityId}-report-{DateTime.UtcNow:yyyyMMdd}.csv";
                break;
            default:
                content = await GenerateCustomerPdfAsync(data);
                contentType = "text/html";
                fileName = $"customer-{request.EntityId}-report-{DateTime.UtcNow:yyyyMMdd}.html";
                break;
        }

        return new ReportResultDto
        {
            Success = true,
            FileName = fileName,
            ContentType = contentType,
            Content = content
        };
    }

    private async Task<ReportResultDto> GenerateExpiringProductsReportAsync(ReportRequestDto request)
    {
        var daysThreshold = 90;
        if (request.Parameters.TryGetValue("days", out var days))
        {
            daysThreshold = Convert.ToInt32(days);
        }

        var expiryDate = DateTime.UtcNow.AddDays(daysThreshold);

        var items = await _context.Set<ProductBatch>()
            .Include(b => b.Product)
            .Where(b => b.ExpiryDate <= expiryDate && b.RemainingQuantity > 0)
            .OrderBy(b => b.ExpiryDate)
            .Select(b => new
            {
                b.Product.Name,
                b.Product.SKU,
                b.BatchNumber,
                b.ExpiryDate,
                QuantityOnHand = b.RemainingQuantity,
                DaysUntilExpiry = (b.ExpiryDate - DateTime.UtcNow).Days
            })
            .ToListAsync();

        var content = await ExportToCsvAsync(items);

        return new ReportResultDto
        {
            Success = true,
            FileName = $"expiring-products-{DateTime.UtcNow:yyyyMMdd}.csv",
            ContentType = "text/csv",
            Content = content
        };
    }

    private async Task<ReportResultDto> GenerateLowStockReportAsync(ReportRequestDto request)
    {
        var items = await _context.Products
            .Where(p => !p.IsDeleted && p.IsActive)
            .Select(p => new
            {
                p.Name,
                p.SKU,
                CurrentStock = p.StockQuantity,
                p.ReorderLevel,
                p.ReorderQuantity
            })
            .Where(p => p.CurrentStock <= p.ReorderLevel)
            .OrderBy(p => p.CurrentStock)
            .ToListAsync();

        var content = await ExportToCsvAsync(items);

        return new ReportResultDto
        {
            Success = true,
            FileName = $"low-stock-products-{DateTime.UtcNow:yyyyMMdd}.csv",
            ContentType = "text/csv",
            Content = content
        };
    }

    private static string GenerateSalesHtml(SalesReportDto data)
    {
        var sb = new StringBuilder();
        sb.AppendLine("<!DOCTYPE html>");
        sb.AppendLine("<html><head><meta charset='utf-8'>");
        sb.AppendLine("<title>Sales Report</title>");
        sb.AppendLine("<style>");
        sb.AppendLine("body { font-family: Arial, sans-serif; margin: 40px; }");
        sb.AppendLine("h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }");
        sb.AppendLine(".summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }");
        sb.AppendLine(".summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }");
        sb.AppendLine(".summary-item { text-align: center; }");
        sb.AppendLine(".summary-item h3 { margin: 0; color: #007bff; font-size: 24px; }");
        sb.AppendLine(".summary-item p { margin: 5px 0 0; color: #666; }");
        sb.AppendLine("table { width: 100%; border-collapse: collapse; margin-top: 20px; }");
        sb.AppendLine("th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }");
        sb.AppendLine("th { background: #007bff; color: white; }");
        sb.AppendLine("tr:hover { background: #f5f5f5; }");
        sb.AppendLine("</style></head><body>");

        sb.AppendLine("<h1>📊 Sales Report</h1>");
        sb.AppendLine($"<p><strong>Period:</strong> {data.StartDate:yyyy-MM-dd} to {data.EndDate:yyyy-MM-dd}</p>");
        sb.AppendLine($"<p><strong>Generated:</strong> {data.ReportDate:yyyy-MM-dd HH:mm}</p>");

        sb.AppendLine("<div class='summary'><div class='summary-grid'>");
        sb.AppendLine($"<div class='summary-item'><h3>{data.TotalOrders}</h3><p>Total Orders</p></div>");
        sb.AppendLine($"<div class='summary-item'><h3>{data.TotalRevenue:C}</h3><p>Total Revenue</p></div>");
        sb.AppendLine($"<div class='summary-item'><h3>{data.NetRevenue:C}</h3><p>Net Revenue</p></div>");
        sb.AppendLine($"<div class='summary-item'><h3>{data.AverageOrderValue:C}</h3><p>Avg Order Value</p></div>");
        sb.AppendLine("</div></div>");

        sb.AppendLine("<h2>Product Sales</h2>");
        sb.AppendLine("<table><thead><tr>");
        sb.AppendLine("<th>SKU</th><th>Product</th><th>Qty Sold</th><th>Unit Price</th><th>Total</th><th>Net</th>");
        sb.AppendLine("</tr></thead><tbody>");

        foreach (var item in data.Items.Take(50))
        {
            sb.AppendLine($"<tr><td>{item.SKU}</td><td>{item.ProductName}</td><td>{item.QuantitySold}</td>");
            sb.AppendLine($"<td>{item.UnitPrice:C}</td><td>{item.TotalAmount:C}</td><td>{item.NetAmount:C}</td></tr>");
        }

        sb.AppendLine("</tbody></table></body></html>");
        return sb.ToString();
    }

    private static string GenerateInventoryHtml(InventoryReportDto data)
    {
        var sb = new StringBuilder();
        sb.AppendLine("<!DOCTYPE html>");
        sb.AppendLine("<html><head><meta charset='utf-8'>");
        sb.AppendLine("<title>Inventory Report</title>");
        sb.AppendLine("<style>");
        sb.AppendLine("body { font-family: Arial, sans-serif; margin: 40px; }");
        sb.AppendLine("h1 { color: #333; border-bottom: 2px solid #28a745; padding-bottom: 10px; }");
        sb.AppendLine(".summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }");
        sb.AppendLine(".summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 20px; }");
        sb.AppendLine(".summary-item { text-align: center; }");
        sb.AppendLine(".summary-item h3 { margin: 0; font-size: 24px; }");
        sb.AppendLine(".summary-item p { margin: 5px 0 0; color: #666; }");
        sb.AppendLine(".in-stock { color: #28a745; }");
        sb.AppendLine(".low-stock { color: #ffc107; }");
        sb.AppendLine(".out-stock { color: #dc3545; }");
        sb.AppendLine("table { width: 100%; border-collapse: collapse; margin-top: 20px; }");
        sb.AppendLine("th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }");
        sb.AppendLine("th { background: #28a745; color: white; }");
        sb.AppendLine("</style></head><body>");

        sb.AppendLine("<h1>📦 Inventory Report</h1>");
        sb.AppendLine($"<p><strong>Generated:</strong> {data.ReportDate:yyyy-MM-dd HH:mm}</p>");

        sb.AppendLine("<div class='summary'><div class='summary-grid'>");
        sb.AppendLine($"<div class='summary-item'><h3>{data.TotalProducts}</h3><p>Total Products</p></div>");
        sb.AppendLine($"<div class='summary-item'><h3 class='in-stock'>{data.TotalInStock}</h3><p>In Stock</p></div>");
        sb.AppendLine($"<div class='summary-item'><h3 class='low-stock'>{data.TotalLowStock}</h3><p>Low Stock</p></div>");
        sb.AppendLine($"<div class='summary-item'><h3 class='out-stock'>{data.TotalOutOfStock}</h3><p>Out of Stock</p></div>");
        sb.AppendLine($"<div class='summary-item'><h3>{data.TotalInventoryValue:C}</h3><p>Total Value</p></div>");
        sb.AppendLine("</div></div>");

        sb.AppendLine("<table><thead><tr>");
        sb.AppendLine("<th>SKU</th><th>Product</th><th>Stock</th><th>Reorder Level</th><th>Value</th><th>Status</th>");
        sb.AppendLine("</tr></thead><tbody>");

        foreach (var item in data.Items)
        {
            var statusClass = item.StockStatus switch
            {
                "In Stock" => "in-stock",
                "Low Stock" => "low-stock",
                _ => "out-stock"
            };
            sb.AppendLine($"<tr><td>{item.SKU}</td><td>{item.ProductName}</td><td>{item.CurrentStock}</td>");
            sb.AppendLine($"<td>{item.ReorderLevel}</td><td>{item.TotalValue:C}</td>");
            sb.AppendLine($"<td class='{statusClass}'>{item.StockStatus}</td></tr>");
        }

        sb.AppendLine("</tbody></table></body></html>");
        return sb.ToString();
    }

    private static string GenerateCustomerHtml(CustomerReportDto data)
    {
        var sb = new StringBuilder();
        sb.AppendLine("<!DOCTYPE html>");
        sb.AppendLine("<html><head><meta charset='utf-8'>");
        sb.AppendLine("<title>Customer Report</title>");
        sb.AppendLine("<style>");
        sb.AppendLine("body { font-family: Arial, sans-serif; margin: 40px; }");
        sb.AppendLine("h1 { color: #333; border-bottom: 2px solid #6f42c1; padding-bottom: 10px; }");
        sb.AppendLine(".customer-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }");
        sb.AppendLine("table { width: 100%; border-collapse: collapse; margin-top: 20px; }");
        sb.AppendLine("th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }");
        sb.AppendLine("th { background: #6f42c1; color: white; }");
        sb.AppendLine("</style></head><body>");

        sb.AppendLine("<h1>👤 Customer Report</h1>");
        sb.AppendLine("<div class='customer-info'>");
        sb.AppendLine($"<p><strong>Customer:</strong> {data.CustomerName}</p>");
        sb.AppendLine($"<p><strong>Email:</strong> {data.Email}</p>");
        sb.AppendLine($"<p><strong>Period:</strong> {data.StartDate:yyyy-MM-dd} to {data.EndDate:yyyy-MM-dd}</p>");
        sb.AppendLine($"<p><strong>Total Orders:</strong> {data.TotalOrders}</p>");
        sb.AppendLine($"<p><strong>Total Spent:</strong> {data.TotalSpent:C}</p>");
        sb.AppendLine("</div>");

        sb.AppendLine("<h2>Order History</h2>");
        sb.AppendLine("<table><thead><tr>");
        sb.AppendLine("<th>Order #</th><th>Date</th><th>Items</th><th>Status</th><th>Total</th>");
        sb.AppendLine("</tr></thead><tbody>");

        foreach (var order in data.Orders)
        {
            sb.AppendLine($"<tr><td>{order.OrderNumber}</td><td>{order.OrderDate:yyyy-MM-dd}</td>");
            sb.AppendLine($"<td>{order.ItemCount}</td><td>{order.Status}</td><td>{order.Total:C}</td></tr>");
        }

        sb.AppendLine("</tbody></table></body></html>");
        return sb.ToString();
    }

    #region Customer/Drugstore Sales Reports

    public async Task<CustomerSalesReportDto> GetCustomerSalesReportAsync(
        CustomerSalesReportRequestDto request, 
        CancellationToken cancellationToken = default)
    {
        var startDate = request.StartDate.Date;
        var endDate = request.EndDate.Date.AddDays(1).AddTicks(-1);

        // Build base query
        var ordersQuery = _context.Orders
            .Include(o => o.Customer)
                .ThenInclude(c => c.ParentCustomer)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                    .ThenInclude(p => p.Category)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                    .ThenInclude(p => p.Manufacturer)
            .Where(o => o.OrderDate >= startDate && o.OrderDate <= endDate)
            .Where(o => o.Status != OrderStatus.Cancelled)
            .AsQueryable();

        // Filter by customer if specified
        if (request.CustomerId.HasValue)
        {
            var customerId = request.CustomerId.Value;
            
            if (request.IncludeChildBranches)
            {
                // Get all child customer IDs
                var childIds = await _context.Customers
                    .Where(c => c.ParentCustomerId == customerId)
                    .Select(c => c.Id)
                    .ToListAsync(cancellationToken);
                
                childIds.Add(customerId);
                ordersQuery = ordersQuery.Where(o => childIds.Contains(o.CustomerId));
            }
            else
            {
                ordersQuery = ordersQuery.Where(o => o.CustomerId == customerId);
            }
        }

        var orders = await ordersQuery.ToListAsync(cancellationToken);
        var orderItems = orders.SelectMany(o => o.OrderItems).ToList();

        var report = new CustomerSalesReportDto
        {
            StartDate = startDate,
            EndDate = endDate,
            CustomerId = request.CustomerId,
            IncludeChildBranches = request.IncludeChildBranches,
            TotalOrders = orders.Count,
            TotalProducts = orderItems.Select(oi => oi.ProductId).Distinct().Count(),
            TotalQuantity = orderItems.Sum(oi => oi.Quantity),
            TotalRevenue = orders.Sum(o => o.TotalAmount),
            TotalDiscount = orders.Sum(o => o.DiscountAmount),
            NetRevenue = orders.Sum(o => o.TotalAmount - o.DiscountAmount),
            AverageOrderValue = orders.Count > 0 ? orders.Average(o => o.TotalAmount) : 0
        };

        if (request.CustomerId.HasValue)
        {
            var customer = await _context.Customers.FindAsync([request.CustomerId.Value], cancellationToken);
            report.CustomerName = customer?.FullName;
        }

        // Sales by customer/drugstore
        report.SalesByCustomer = orders
            .GroupBy(o => o.Customer)
            .Select(g => new CustomerSalesItemDto
            {
                CustomerId = g.Key.Id,
                CustomerCode = g.Key.CustomerCode ?? string.Empty,
                CustomerName = g.Key.FullName,
                IsHeadquarters = !g.Key.ParentCustomerId.HasValue && g.Key.ChildCustomers?.Count > 0,
                ParentCustomerId = g.Key.ParentCustomerId,
                ParentCustomerName = g.Key.ParentCustomer?.FullName,
                OrderCount = g.Count(),
                TotalQuantity = g.SelectMany(o => o.OrderItems).Sum(oi => oi.Quantity),
                TotalRevenue = g.Sum(o => o.TotalAmount),
                TotalDiscount = g.Sum(o => o.DiscountAmount),
                NetRevenue = g.Sum(o => o.TotalAmount - o.DiscountAmount)
            })
            .OrderByDescending(c => c.TotalRevenue)
            .ToList();

        // Sales by product
        if (request.GroupByProduct)
        {
            report.SalesByProduct = orderItems
                .GroupBy(oi => new { oi.ProductId, oi.Product.Name, oi.Product.SKU, 
                    CategoryName = oi.Product.Category?.Name, 
                    ManufacturerName = oi.Product.Manufacturer?.Name })
                .Select(g => new ProductSalesItemDto
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.Name,
                    SKU = g.Key.SKU,
                    CategoryName = g.Key.CategoryName,
                    ManufacturerName = g.Key.ManufacturerName,
                    QuantitySold = g.Sum(oi => oi.Quantity),
                    UnitPrice = g.Average(oi => oi.UnitPrice),
                    TotalRevenue = g.Sum(oi => oi.LineTotal),
                    TotalDiscount = g.Sum(oi => oi.LineTotal * oi.DiscountPercent / 100),
                    NetRevenue = g.Sum(oi => oi.LineTotal * (1 - oi.DiscountPercent / 100)),
                    OrderCount = g.Select(oi => oi.OrderId).Distinct().Count()
                })
                .OrderByDescending(p => p.TotalRevenue)
                .ToList();
        }

        // Sales by category
        if (request.GroupByCategory)
        {
            var totalRevenue = report.TotalRevenue > 0 ? report.TotalRevenue : 1;
            report.SalesByCategory = orderItems
                .Where(oi => oi.Product.Category != null)
                .GroupBy(oi => new { oi.Product.Category!.Id, oi.Product.Category.Name })
                .Select(g => new CategorySalesItemDto
                {
                    CategoryId = g.Key.Id,
                    CategoryName = g.Key.Name,
                    ProductCount = g.Select(oi => oi.ProductId).Distinct().Count(),
                    QuantitySold = g.Sum(oi => oi.Quantity),
                    TotalRevenue = g.Sum(oi => oi.LineTotal),
                    TotalDiscount = g.Sum(oi => oi.LineTotal * oi.DiscountPercent / 100),
                    NetRevenue = g.Sum(oi => oi.LineTotal * (1 - oi.DiscountPercent / 100)),
                    PercentageOfTotal = (g.Sum(oi => oi.LineTotal) / totalRevenue) * 100
                })
                .OrderByDescending(c => c.TotalRevenue)
                .ToList();
        }

        // Sales by manufacturer
        if (request.GroupByManufacturer)
        {
            var totalRevenue = report.TotalRevenue > 0 ? report.TotalRevenue : 1;
            report.SalesByManufacturer = orderItems
                .Where(oi => oi.Product.Manufacturer != null)
                .GroupBy(oi => new { oi.Product.Manufacturer!.Id, oi.Product.Manufacturer.Name })
                .Select(g => new ManufacturerSalesItemDto
                {
                    ManufacturerId = g.Key.Id,
                    ManufacturerName = g.Key.Name,
                    ProductCount = g.Select(oi => oi.ProductId).Distinct().Count(),
                    QuantitySold = g.Sum(oi => oi.Quantity),
                    TotalRevenue = g.Sum(oi => oi.LineTotal),
                    TotalDiscount = g.Sum(oi => oi.LineTotal * oi.DiscountPercent / 100),
                    NetRevenue = g.Sum(oi => oi.LineTotal * (1 - oi.DiscountPercent / 100)),
                    PercentageOfTotal = (g.Sum(oi => oi.LineTotal) / totalRevenue) * 100
                })
                .OrderByDescending(m => m.TotalRevenue)
                .ToList();
        }

        // Daily sales
        report.DailySales = orders
            .GroupBy(o => o.OrderDate.Date)
            .Select(g => new DailySalesDto
            {
                Date = g.Key,
                OrderCount = g.Count(),
                Revenue = g.Sum(o => o.TotalAmount)
            })
            .OrderBy(d => d.Date)
            .ToList();

        return report;
    }

    public async Task<ChainSalesReportDto> GetChainSalesReportAsync(
        int parentCustomerId, 
        DateTime startDate, 
        DateTime endDate,
        CancellationToken cancellationToken = default)
    {
        var start = startDate.Date;
        var end = endDate.Date.AddDays(1).AddTicks(-1);

        // Get parent customer with children
        var parentCustomer = await _context.Customers
            .Include(c => c.ChildCustomers)
            .FirstOrDefaultAsync(c => c.Id == parentCustomerId, cancellationToken);

        if (parentCustomer == null)
        {
            return new ChainSalesReportDto { StartDate = start, EndDate = end };
        }

        var allCustomerIds = new List<int> { parentCustomerId };
        allCustomerIds.AddRange(parentCustomer.ChildCustomers.Select(c => c.Id));

        var orders = await _context.Orders
            .Include(o => o.Customer)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                    .ThenInclude(p => p.Category)
            .Where(o => allCustomerIds.Contains(o.CustomerId))
            .Where(o => o.OrderDate >= start && o.OrderDate <= end)
            .Where(o => o.Status != OrderStatus.Cancelled)
            .ToListAsync(cancellationToken);

        var orderItems = orders.SelectMany(o => o.OrderItems).ToList();
        var totalRevenue = orders.Sum(o => o.TotalAmount);

        var report = new ChainSalesReportDto
        {
            StartDate = start,
            EndDate = end,
            ParentCustomerId = parentCustomer.Id,
            ParentCustomerName = parentCustomer.FullName,
            ParentCustomerCode = parentCustomer.CustomerCode ?? string.Empty,
            BranchCount = parentCustomer.ChildCustomers.Count,
            TotalOrders = orders.Count,
            TotalQuantity = orderItems.Sum(oi => oi.Quantity),
            TotalRevenue = totalRevenue,
            TotalDiscount = orders.Sum(o => o.DiscountAmount),
            NetRevenue = orders.Sum(o => o.TotalAmount - o.DiscountAmount),
            AverageOrderValue = orders.Count > 0 ? orders.Average(o => o.TotalAmount) : 0
        };

        // Per-branch breakdown
        report.BranchSales = orders
            .GroupBy(o => o.Customer)
            .Select(g => new CustomerSalesItemDto
            {
                CustomerId = g.Key.Id,
                CustomerCode = g.Key.CustomerCode ?? string.Empty,
                CustomerName = g.Key.FullName,
                IsHeadquarters = g.Key.Id == parentCustomerId,
                ParentCustomerId = g.Key.ParentCustomerId,
                OrderCount = g.Count(),
                TotalQuantity = g.SelectMany(o => o.OrderItems).Sum(oi => oi.Quantity),
                TotalRevenue = g.Sum(o => o.TotalAmount),
                TotalDiscount = g.Sum(o => o.DiscountAmount),
                NetRevenue = g.Sum(o => o.TotalAmount - o.DiscountAmount)
            })
            .OrderByDescending(b => b.TotalRevenue)
            .ToList();

        // Top products across chain
        report.TopProducts = orderItems
            .GroupBy(oi => new { oi.ProductId, oi.Product.Name, oi.Product.SKU,
                CategoryName = oi.Product.Category?.Name })
            .Select(g => new ProductSalesItemDto
            {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.Name,
                SKU = g.Key.SKU,
                CategoryName = g.Key.CategoryName,
                QuantitySold = g.Sum(oi => oi.Quantity),
                UnitPrice = g.Average(oi => oi.UnitPrice),
                TotalRevenue = g.Sum(oi => oi.LineTotal),
                OrderCount = g.Select(oi => oi.OrderId).Distinct().Count()
            })
            .OrderByDescending(p => p.TotalRevenue)
            .Take(20)
            .ToList();

        // Category breakdown
        var totalRev = totalRevenue > 0 ? totalRevenue : 1;
        report.SalesByCategory = orderItems
            .Where(oi => oi.Product.Category != null)
            .GroupBy(oi => new { oi.Product.Category!.Id, oi.Product.Category.Name })
            .Select(g => new CategorySalesItemDto
            {
                CategoryId = g.Key.Id,
                CategoryName = g.Key.Name,
                ProductCount = g.Select(oi => oi.ProductId).Distinct().Count(),
                QuantitySold = g.Sum(oi => oi.Quantity),
                TotalRevenue = g.Sum(oi => oi.LineTotal),
                PercentageOfTotal = (g.Sum(oi => oi.LineTotal) / totalRev) * 100
            })
            .OrderByDescending(c => c.TotalRevenue)
            .ToList();

        return report;
    }

    public async Task<List<CustomerSalesItemDto>> GetSalesByCustomerAsync(
        DateTime startDate, 
        DateTime endDate,
        CancellationToken cancellationToken = default)
    {
        var start = startDate.Date;
        var end = endDate.Date.AddDays(1).AddTicks(-1);

        var sales = await _context.Orders
            .Include(o => o.Customer)
                .ThenInclude(c => c.ParentCustomer)
            .Include(o => o.OrderItems)
            .Where(o => o.OrderDate >= start && o.OrderDate <= end)
            .Where(o => o.Status != OrderStatus.Cancelled)
            .GroupBy(o => o.Customer)
            .Select(g => new CustomerSalesItemDto
            {
                CustomerId = g.Key.Id,
                CustomerCode = g.Key.CustomerCode ?? string.Empty,
                CustomerName = g.Key.FullName,
                IsHeadquarters = !g.Key.ParentCustomerId.HasValue,
                ParentCustomerId = g.Key.ParentCustomerId,
                ParentCustomerName = g.Key.ParentCustomer != null ? g.Key.ParentCustomer.FullName : null,
                OrderCount = g.Count(),
                TotalQuantity = g.SelectMany(o => o.OrderItems).Sum(oi => oi.Quantity),
                TotalRevenue = g.Sum(o => o.TotalAmount),
                TotalDiscount = g.Sum(o => o.DiscountAmount),
                NetRevenue = g.Sum(o => o.TotalAmount - o.DiscountAmount)
            })
            .OrderByDescending(c => c.TotalRevenue)
            .ToListAsync(cancellationToken);

        return sales;
    }

    #endregion
}
