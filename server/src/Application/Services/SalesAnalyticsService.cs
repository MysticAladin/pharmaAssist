using Application.DTOs.Common;
using Application.DTOs.Wholesaler;
using Application.Interfaces;
using Domain.Entities;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Services;

public class SalesAnalyticsService : ISalesAnalyticsService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<SalesAnalyticsService> _logger;

    public SalesAnalyticsService(IUnitOfWork unitOfWork, ILogger<SalesAnalyticsService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<ApiResponse<SalesDashboardDto>> GetDashboardAsync(
        SalesAnalyticsFilter filter, CancellationToken ct = default)
    {
        try
        {
            var query = BuildBaseQuery(filter);

            var totalAmount = await query.SumAsync(r => r.TotalAmount, ct);
            var totalQuantity = await query.SumAsync(r => r.Quantity, ct);
            var totalInvoices = await query.Select(r => r.InvoiceNumber).Distinct().CountAsync(ct);
            var totalCustomers = await query.Where(r => r.CustomerId != null).Select(r => r.CustomerId).Distinct().CountAsync(ct);
            var totalProducts = await query.Where(r => r.ProductId != null).Select(r => r.ProductId).Distinct().CountAsync(ct);

            // Monthly trend
            var monthlyTrend = await query
                .Where(r => r.InvoiceDate != null)
                .GroupBy(r => new { r.InvoiceDate!.Value.Year, r.InvoiceDate!.Value.Month })
                .Select(g => new SalesTrendDto
                {
                    Period = $"{g.Key.Year}-{g.Key.Month:D2}",
                    TotalAmount = g.Sum(r => r.TotalAmount),
                    TotalQuantity = g.Sum(r => r.Quantity),
                    RecordCount = g.Count()
                })
                .OrderBy(t => t.Period)
                .ToListAsync(ct);

            // By institution type
            var byType = await GetSalesByInstitutionTypeInternal(query, ct);

            // Top regions
            var topRegions = await GetSalesByRegionInternal(query, ct);

            // Top products
            var topProducts = await query
                .Where(r => r.ProductId != null)
                .GroupBy(r => new { r.ProductId, r.Product!.Name, BrandName = r.Product!.Brand != null ? r.Product.Brand.Name : null })
                .Select(g => new SalesByProductDto
                {
                    ProductId = g.Key.ProductId!.Value,
                    ProductName = g.Key.Name,
                    BrandName = g.Key.BrandName,
                    TotalAmount = g.Sum(r => r.TotalAmount),
                    TotalQuantity = g.Sum(r => r.Quantity),
                    CustomerCount = g.Select(r => r.CustomerId).Distinct().Count()
                })
                .OrderByDescending(p => p.TotalAmount)
                .Take(10)
                .ToListAsync(ct);

            var dashboard = new SalesDashboardDto
            {
                TotalSalesAmount = totalAmount,
                TotalQuantity = totalQuantity,
                TotalInvoices = totalInvoices,
                TotalCustomers = totalCustomers,
                TotalProducts = totalProducts,
                MonthlyTrend = monthlyTrend,
                ByInstitutionType = byType.Take(5).ToList(),
                TopRegions = topRegions.Take(5).ToList(),
                TopProducts = topProducts
            };

            return ApiResponse<SalesDashboardDto>.Ok(dashboard);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating sales dashboard");
            return ApiResponse<SalesDashboardDto>.Fail("An error occurred while generating the dashboard");
        }
    }

    public async Task<ApiResponse<List<SalesByInstitutionDto>>> GetSalesByInstitutionAsync(
        SalesAnalyticsFilter filter, CancellationToken ct = default)
    {
        try
        {
            var query = BuildBaseQuery(filter)
                .Where(r => r.CustomerId != null);

            var results = await query
                .GroupBy(r => new
                {
                    r.CustomerId,
                    CustomerName = r.Customer!.FullName,
                    CustomerType = r.Customer!.CustomerType.ToString(),
                    Canton = r.Customer!.Addresses
                        .Where(a => a.IsDefault && a.Canton != null)
                        .Select(a => a.Canton!.Name)
                        .FirstOrDefault()
                })
                .Select(g => new SalesByInstitutionDto
                {
                    CustomerId = g.Key.CustomerId!.Value,
                    CustomerName = g.Key.CustomerName,
                    CustomerType = g.Key.CustomerType,
                    Canton = g.Key.Canton,
                    TotalAmount = g.Sum(r => r.TotalAmount),
                    TotalQuantity = g.Sum(r => r.Quantity),
                    InvoiceCount = g.Select(r => r.InvoiceNumber).Distinct().Count(),
                    ProductCount = g.Select(r => r.ProductId).Distinct().Count()
                })
                .OrderByDescending(s => s.TotalAmount)
                .ToListAsync(ct);

            return ApiResponse<List<SalesByInstitutionDto>>.Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting sales by institution");
            return ApiResponse<List<SalesByInstitutionDto>>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<List<SalesByInstitutionTypeDto>>> GetSalesByInstitutionTypeAsync(
        SalesAnalyticsFilter filter, CancellationToken ct = default)
    {
        try
        {
            var query = BuildBaseQuery(filter);
            var results = await GetSalesByInstitutionTypeInternal(query, ct);
            return ApiResponse<List<SalesByInstitutionTypeDto>>.Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting sales by institution type");
            return ApiResponse<List<SalesByInstitutionTypeDto>>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<List<SalesByRegionDto>>> GetSalesByRegionAsync(
        SalesAnalyticsFilter filter, CancellationToken ct = default)
    {
        try
        {
            var query = BuildBaseQuery(filter);
            var results = await GetSalesByRegionInternal(query, ct);
            return ApiResponse<List<SalesByRegionDto>>.Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting sales by region");
            return ApiResponse<List<SalesByRegionDto>>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<List<SalesByProductDto>>> GetSalesByProductAsync(
        SalesAnalyticsFilter filter, CancellationToken ct = default)
    {
        try
        {
            var query = BuildBaseQuery(filter)
                .Where(r => r.ProductId != null);

            var results = await query
                .GroupBy(r => new
                {
                    r.ProductId,
                    ProductName = r.Product!.Name,
                    BrandName = r.Product!.Brand != null ? r.Product.Brand.Name : null
                })
                .Select(g => new SalesByProductDto
                {
                    ProductId = g.Key.ProductId!.Value,
                    ProductName = g.Key.ProductName,
                    BrandName = g.Key.BrandName,
                    TotalAmount = g.Sum(r => r.TotalAmount),
                    TotalQuantity = g.Sum(r => r.Quantity),
                    CustomerCount = g.Select(r => r.CustomerId).Distinct().Count()
                })
                .OrderByDescending(p => p.TotalAmount)
                .ToListAsync(ct);

            return ApiResponse<List<SalesByProductDto>>.Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting sales by product");
            return ApiResponse<List<SalesByProductDto>>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<List<SalesByBrandDto>>> GetSalesByBrandAsync(
        SalesAnalyticsFilter filter, CancellationToken ct = default)
    {
        try
        {
            var query = BuildBaseQuery(filter)
                .Where(r => r.ProductId != null && r.Product!.BrandId != null);

            var results = await query
                .GroupBy(r => new { r.Product!.BrandId, BrandName = r.Product!.Brand!.Name })
                .Select(g => new SalesByBrandDto
                {
                    BrandId = g.Key.BrandId!.Value,
                    BrandName = g.Key.BrandName,
                    TotalAmount = g.Sum(r => r.TotalAmount),
                    TotalQuantity = g.Sum(r => r.Quantity),
                    ProductCount = g.Select(r => r.ProductId).Distinct().Count(),
                    CustomerCount = g.Select(r => r.CustomerId).Distinct().Count()
                })
                .OrderByDescending(b => b.TotalAmount)
                .ToListAsync(ct);

            return ApiResponse<List<SalesByBrandDto>>.Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting sales by brand");
            return ApiResponse<List<SalesByBrandDto>>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<List<SalesByRepDto>>> GetSalesByRepAsync(
        SalesAnalyticsFilter filter, CancellationToken ct = default)
    {
        try
        {
            var query = BuildBaseQuery(filter)
                .Where(r => r.CustomerId != null);

            // Join with rep-customer assignments to get rep data
            var repCustomerAssignments = _unitOfWork.SalesReps.AsQueryable()
                .SelectMany(sr => sr.CustomerAssignments, (sr, rca) => new { sr, rca });

            var results = await (
                from record in query
                join rca in repCustomerAssignments on record.CustomerId equals rca.rca.CustomerId
                group record by new
                {
                    RepId = rca.sr.Id,
                    RepName = rca.sr.User != null ? rca.sr.User.FirstName + " " + rca.sr.User.LastName : "Unknown",
                    rca.sr.EmployeeCode
                } into g
                select new SalesByRepDto
                {
                    RepId = g.Key.RepId,
                    RepName = g.Key.RepName,
                    EmployeeCode = g.Key.EmployeeCode,
                    TotalSalesAmount = g.Sum(r => r.TotalAmount),
                    CustomerCount = g.Select(r => r.CustomerId).Distinct().Count(),
                    ProductCount = g.Select(r => r.ProductId).Distinct().Count()
                })
                .OrderByDescending(r => r.TotalSalesAmount)
                .ToListAsync(ct);

            return ApiResponse<List<SalesByRepDto>>.Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting sales by rep");
            return ApiResponse<List<SalesByRepDto>>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<List<SalesTrendDto>>> GetSalesTrendAsync(
        SalesAnalyticsFilter filter, string granularity, CancellationToken ct = default)
    {
        try
        {
            var query = BuildBaseQuery(filter)
                .Where(r => r.InvoiceDate != null);

            List<SalesTrendDto> results;

            switch (granularity.ToLower())
            {
                case "daily":
                    results = await query
                        .GroupBy(r => r.InvoiceDate!.Value.Date)
                        .Select(g => new SalesTrendDto
                        {
                            Period = g.Key.ToString("yyyy-MM-dd"),
                            TotalAmount = g.Sum(r => r.TotalAmount),
                            TotalQuantity = g.Sum(r => r.Quantity),
                            RecordCount = g.Count()
                        })
                        .OrderBy(t => t.Period)
                        .ToListAsync(ct);
                    break;

                case "weekly":
                    results = await query
                        .GroupBy(r => new { r.InvoiceDate!.Value.Year, Week = (r.InvoiceDate!.Value.DayOfYear - 1) / 7 + 1 })
                        .Select(g => new SalesTrendDto
                        {
                            Period = $"{g.Key.Year}-W{g.Key.Week:D2}",
                            TotalAmount = g.Sum(r => r.TotalAmount),
                            TotalQuantity = g.Sum(r => r.Quantity),
                            RecordCount = g.Count()
                        })
                        .OrderBy(t => t.Period)
                        .ToListAsync(ct);
                    break;

                case "quarterly":
                    results = await query
                        .GroupBy(r => new { r.InvoiceDate!.Value.Year, Quarter = (r.InvoiceDate!.Value.Month - 1) / 3 + 1 })
                        .Select(g => new SalesTrendDto
                        {
                            Period = $"{g.Key.Year}-Q{g.Key.Quarter}",
                            TotalAmount = g.Sum(r => r.TotalAmount),
                            TotalQuantity = g.Sum(r => r.Quantity),
                            RecordCount = g.Count()
                        })
                        .OrderBy(t => t.Period)
                        .ToListAsync(ct);
                    break;

                case "yearly":
                    results = await query
                        .GroupBy(r => r.InvoiceDate!.Value.Year)
                        .Select(g => new SalesTrendDto
                        {
                            Period = g.Key.ToString(),
                            TotalAmount = g.Sum(r => r.TotalAmount),
                            TotalQuantity = g.Sum(r => r.Quantity),
                            RecordCount = g.Count()
                        })
                        .OrderBy(t => t.Period)
                        .ToListAsync(ct);
                    break;

                default: // monthly
                    results = await query
                        .GroupBy(r => new { r.InvoiceDate!.Value.Year, r.InvoiceDate!.Value.Month })
                        .Select(g => new SalesTrendDto
                        {
                            Period = $"{g.Key.Year}-{g.Key.Month:D2}",
                            TotalAmount = g.Sum(r => r.TotalAmount),
                            TotalQuantity = g.Sum(r => r.Quantity),
                            RecordCount = g.Count()
                        })
                        .OrderBy(t => t.Period)
                        .ToListAsync(ct);
                    break;
            }

            return ApiResponse<List<SalesTrendDto>>.Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting sales trend");
            return ApiResponse<List<SalesTrendDto>>.Fail("An error occurred");
        }
    }

    #region Private Helpers

    private IQueryable<WholesalerSalesRecord> BuildBaseQuery(SalesAnalyticsFilter filter)
    {
        var query = _unitOfWork.WholesalerSalesRecords.AsQueryable()
            .Include(r => r.Product).ThenInclude(p => p!.Brand)
            .Include(r => r.Customer).ThenInclude(c => c!.Addresses).ThenInclude(a => a.Canton)
            .AsQueryable();

        if (filter.DateFrom.HasValue)
            query = query.Where(r => r.InvoiceDate >= filter.DateFrom.Value);
        if (filter.DateTo.HasValue)
            query = query.Where(r => r.InvoiceDate <= filter.DateTo.Value);
        if (!string.IsNullOrEmpty(filter.Period))
            query = query.Where(r => r.Import != null && r.Import.Period == filter.Period);
        if (filter.WholesalerId.HasValue)
            query = query.Where(r => r.Import != null && r.Import.WholesalerId == filter.WholesalerId.Value);
        if (filter.ProductId.HasValue)
            query = query.Where(r => r.ProductId == filter.ProductId.Value);
        if (filter.BrandId.HasValue)
            query = query.Where(r => r.Product != null && r.Product.BrandId == filter.BrandId.Value);
        if (filter.CustomerId.HasValue)
            query = query.Where(r => r.CustomerId == filter.CustomerId.Value);
        if (filter.CustomerType.HasValue)
            query = query.Where(r => r.Customer != null && (int)r.Customer.CustomerType == filter.CustomerType.Value);
        if (filter.CantonId.HasValue)
            query = query.Where(r => r.Customer != null &&
                r.Customer.Addresses.Any(a => a.CantonId == filter.CantonId.Value));

        return query;
    }

    private async Task<List<SalesByInstitutionTypeDto>> GetSalesByInstitutionTypeInternal(
        IQueryable<WholesalerSalesRecord> query, CancellationToken ct)
    {
        var allTotal = await query.SumAsync(r => r.TotalAmount, ct);

        var results = await query
            .Where(r => r.CustomerId != null)
            .GroupBy(r => r.Customer!.CustomerType)
            .Select(g => new SalesByInstitutionTypeDto
            {
                CustomerType = g.Key.ToString(),
                InstitutionCount = g.Select(r => r.CustomerId).Distinct().Count(),
                TotalAmount = g.Sum(r => r.TotalAmount),
                TotalQuantity = g.Sum(r => r.Quantity),
                PercentOfTotal = allTotal > 0 ? Math.Round(g.Sum(r => r.TotalAmount) / allTotal * 100, 2) : 0
            })
            .OrderByDescending(s => s.TotalAmount)
            .ToListAsync(ct);

        return results;
    }

    private async Task<List<SalesByRegionDto>> GetSalesByRegionInternal(
        IQueryable<WholesalerSalesRecord> query, CancellationToken ct)
    {
        var allTotal = await query.SumAsync(r => r.TotalAmount, ct);

        var results = await query
            .Where(r => r.CustomerId != null &&
                r.Customer!.Addresses.Any(a => a.CantonId != null && a.IsDefault))
            .GroupBy(r => new
            {
                CantonId = r.Customer!.Addresses.Where(a => a.IsDefault && a.CantonId != null).Select(a => a.CantonId).FirstOrDefault(),
                CantonName = r.Customer!.Addresses.Where(a => a.IsDefault && a.Canton != null).Select(a => a.Canton!.Name).FirstOrDefault()!
            })
            .Select(g => new SalesByRegionDto
            {
                CantonId = g.Key.CantonId,
                CantonName = g.Key.CantonName ?? "Unknown",
                InstitutionCount = g.Select(r => r.CustomerId).Distinct().Count(),
                TotalAmount = g.Sum(r => r.TotalAmount),
                TotalQuantity = g.Sum(r => r.Quantity),
                PercentOfTotal = allTotal > 0 ? Math.Round(g.Sum(r => r.TotalAmount) / allTotal * 100, 2) : 0
            })
            .OrderByDescending(s => s.TotalAmount)
            .ToListAsync(ct);

        return results;
    }

    #endregion
}
