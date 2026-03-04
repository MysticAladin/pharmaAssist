using Application.DTOs.Common;
using Application.DTOs.SalesReps;
using Application.Interfaces;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

/// <summary>
/// Service for sales representative customer management
/// </summary>
public class RepCustomerService : IRepCustomerService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<RepCustomerService> _logger;

    public RepCustomerService(
        ApplicationDbContext context,
        ILogger<RepCustomerService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ApiResponse<RepCustomerResultDto>> GetMyCustomersAsync(
        int repId,
        RepCustomerFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Get rep's assignments with customer data
            var assignmentsQuery = _context.RepCustomerAssignments
                .Where(a => a.RepId == repId && a.IsActive)
                .Include(a => a.Customer)
                    .ThenInclude(c => c!.Addresses);

            var assignments = await assignmentsQuery.ToListAsync(cancellationToken);
            var customerIds = assignments.Select(a => a.CustomerId).ToList();

            // Build query for customers
            var customers = assignments
                .Select(a => a.Customer)
                .Where(c => c != null)
                .ToList();

            // Apply filters
            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var searchLower = filter.Search.ToLower();
                customers = customers.Where(c =>
                    (c!.CompanyName != null && c.CompanyName.ToLower().Contains(searchLower)) ||
                    c.FirstName.ToLower().Contains(searchLower) ||
                    c.LastName.ToLower().Contains(searchLower) ||
                    c.CustomerCode.ToLower().Contains(searchLower) ||
                    c.Email.ToLower().Contains(searchLower)).ToList();
            }

            if (filter.CustomerType.HasValue)
            {
                customers = customers.Where(c => c!.CustomerType == filter.CustomerType.Value).ToList();
            }

            if (filter.Tier.HasValue)
            {
                customers = customers.Where(c => c!.Tier == filter.Tier.Value).ToList();
            }

            // Get recent orders for these customers
            var recentOrders = await _context.Orders
                .Where(o => customerIds.Contains(o.CustomerId))
                .GroupBy(o => o.CustomerId)
                .Select(g => new
                {
                    CustomerId = g.Key,
                    LastOrderDate = g.Max(o => o.OrderDate),
                    LastOrderAmount = g.OrderByDescending(o => o.OrderDate).First().TotalAmount
                })
                .ToListAsync(cancellationToken);

            // Get recent visits for these customers
            var recentVisits = await _context.ExecutedVisits
                .Where(v => customerIds.Contains(v.CustomerId) && v.RepId == repId)
                .GroupBy(v => v.CustomerId)
                .Select(g => new
                {
                    CustomerId = g.Key,
                    LastVisitDate = g.Max(v => v.CheckInTime)
                })
                .ToListAsync(cancellationToken);

            // Get visit counts this month for compliance calculation
            var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            var visitsThisMonth = await _context.ExecutedVisits
                .Where(v => customerIds.Contains(v.CustomerId) && v.RepId == repId && v.CheckInTime >= startOfMonth)
                .GroupBy(v => v.CustomerId)
                .Select(g => new
                {
                    CustomerId = g.Key,
                    Count = g.Count()
                })
                .ToListAsync(cancellationToken);

            var totalCount = customers.Count;
            
            // Sorting
            var orderedCustomers = filter.SortBy?.ToLower() switch
            {
                "name" => filter.SortDescending ? customers.OrderByDescending(c => c!.FullName) : customers.OrderBy(c => c!.FullName),
                "tier" => filter.SortDescending ? customers.OrderByDescending(c => c!.Tier) : customers.OrderBy(c => c!.Tier),
                "type" => filter.SortDescending ? customers.OrderByDescending(c => c!.CustomerType) : customers.OrderBy(c => c!.CustomerType),
                "code" => filter.SortDescending ? customers.OrderByDescending(c => c!.CustomerCode) : customers.OrderBy(c => c!.CustomerCode),
                _ => customers.OrderBy(c => c!.FullName)
            };

            // Pagination
            var pagedCustomers = orderedCustomers
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToList();

            var assignmentLookup = assignments.ToDictionary(a => a.CustomerId);

            var result = new RepCustomerResultDto
            {
                TotalCount = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize),
                Customers = pagedCustomers.Select(c =>
                {
                    var primaryAddress = c!.Addresses.FirstOrDefault(a => a.IsDefault) ?? c.Addresses.FirstOrDefault();
                    var orderInfo = recentOrders.FirstOrDefault(o => o.CustomerId == c.Id);
                    var visitInfo = recentVisits.FirstOrDefault(v => v.CustomerId == c.Id);
                    var assignment = assignmentLookup.GetValueOrDefault(c.Id);
                    var monthlyVisitCount = visitsThisMonth.FirstOrDefault(v => v.CustomerId == c.Id)?.Count ?? 0;
                    var requiredVisits = assignment?.GetEffectiveRequiredVisits(c.Tier) ?? 1;
                    
                    var daysSinceLastVisit = visitInfo?.LastVisitDate != null
                        ? (int?)(DateTime.UtcNow - visitInfo.LastVisitDate).TotalDays
                        : null;
                    
                    // Calculate max days between visits based on monthly requirement
                    var maxDaysBetweenVisits = requiredVisits > 0 ? 30.0 / requiredVisits : 30.0;
                    var isOverdue = daysSinceLastVisit == null || daysSinceLastVisit > maxDaysBetweenVisits;
                    
                    var compliance = requiredVisits > 0
                        ? Math.Min(100, (decimal)monthlyVisitCount / requiredVisits * 100)
                        : 100;

                    return new RepCustomerDto
                    {
                        Id = c.Id,
                        CustomerCode = c.CustomerCode,
                        Name = c.FullName,
                        CustomerType = c.CustomerType,
                        CustomerTypeName = c.CustomerType.ToString(),
                        Tier = c.Tier,
                        TierName = c.Tier.ToString(),
                        ContactPerson = $"{c.FirstName} {c.LastName}".Trim(),
                        Phone = c.Phone ?? c.MobilePhone,
                        Email = c.Email,
                        City = primaryAddress?.City,
                        FullAddress = primaryAddress != null
                            ? $"{primaryAddress.Street}, {primaryAddress.City}"
                            : null,
                        CreditLimit = c.CreditLimit,
                        CreditUsed = c.CurrentBalance,
                        CreditAvailable = Math.Max(0, c.CreditLimit - c.CurrentBalance),
                        CreditWarning = c.CurrentBalance >= c.CreditLimit * 0.8m,
                        LastVisitDate = visitInfo?.LastVisitDate,
                        LastOrderDate = orderInfo?.LastOrderDate,
                        LastOrderAmount = orderInfo?.LastOrderAmount,
                        AssignedAt = assignment?.AssignmentDate ?? DateTime.UtcNow,
                        IsActive = c.IsActive,
                        RequiredVisitsPerMonth = requiredVisits,
                        CompletedVisitsThisMonth = monthlyVisitCount,
                        DaysSinceLastVisit = daysSinceLastVisit.HasValue ? (int)daysSinceLastVisit.Value : null,
                        IsOverdue = isOverdue,
                        VisitCompliancePercent = compliance,
                        Latitude = primaryAddress?.Latitude,
                        Longitude = primaryAddress?.Longitude
                    };
                }).ToList()
            };

            // Apply post-filter for credit warning
            if (filter.HasCreditWarning == true)
            {
                result.Customers = result.Customers.Where(c => c.CreditWarning).ToList();
                result.TotalCount = result.Customers.Count;
            }
            
            // Apply post-filter for needs visit (overdue based on tier frequency)
            if (filter.NeedsVisit == true)
            {
                result.Customers = result.Customers.Where(c => c.IsOverdue).ToList();
                result.TotalCount = result.Customers.Count;
            }

            return ApiResponse<RepCustomerResultDto>.Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting customers for rep {RepId}", repId);
            return ApiResponse<RepCustomerResultDto>.Fail("Failed to retrieve customers");
        }
    }

    public async Task<ApiResponse<RepCustomerDto>> GetCustomerDetailsAsync(
        int repId,
        int customerId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Verify assignment
            var assignment = await _context.RepCustomerAssignments
                .FirstOrDefaultAsync(a => a.RepId == repId && a.CustomerId == customerId && a.IsActive, cancellationToken);

            if (assignment == null)
            {
                return ApiResponse<RepCustomerDto>.Fail("Customer not assigned to you");
            }

            var customer = await _context.Customers
                .Include(c => c.Addresses)
                .FirstOrDefaultAsync(c => c.Id == customerId, cancellationToken);

            if (customer == null)
            {
                return ApiResponse<RepCustomerDto>.Fail("Customer not found");
            }

            var primaryAddress = customer.Addresses.FirstOrDefault(a => a.IsDefault) ?? customer.Addresses.FirstOrDefault();

            // Get last order
            var lastOrder = await _context.Orders
                .Where(o => o.CustomerId == customerId)
                .OrderByDescending(o => o.OrderDate)
                .FirstOrDefaultAsync(cancellationToken);

            // Get last visit by this rep
            var lastVisit = await _context.ExecutedVisits
                .Where(v => v.CustomerId == customerId && v.RepId == repId)
                .OrderByDescending(v => v.CheckInTime)
                .FirstOrDefaultAsync(cancellationToken);

            // Calculate visit frequency metrics
            var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            var monthlyVisitCount = await _context.ExecutedVisits
                .CountAsync(v => v.CustomerId == customerId && v.RepId == repId && v.CheckInTime >= startOfMonth, cancellationToken);
            
            var requiredVisits = assignment.GetEffectiveRequiredVisits(customer.Tier);
            var daysSinceLastVisit = lastVisit != null
                ? (int?)(DateTime.UtcNow - lastVisit.CheckInTime).TotalDays
                : null;
            var maxDaysBetweenVisits = requiredVisits > 0 ? 30.0 / requiredVisits : 30.0;
            var isOverdue = daysSinceLastVisit == null || daysSinceLastVisit > maxDaysBetweenVisits;
            var compliance = requiredVisits > 0
                ? Math.Min(100, (decimal)monthlyVisitCount / requiredVisits * 100)
                : 100;

            var dto = new RepCustomerDto
            {
                Id = customer.Id,
                CustomerCode = customer.CustomerCode,
                Name = customer.FullName,
                CustomerType = customer.CustomerType,
                CustomerTypeName = customer.CustomerType.ToString(),
                Tier = customer.Tier,
                TierName = customer.Tier.ToString(),
                ContactPerson = $"{customer.FirstName} {customer.LastName}".Trim(),
                Phone = customer.Phone ?? customer.MobilePhone,
                Email = customer.Email,
                City = primaryAddress?.City,
                FullAddress = primaryAddress != null
                    ? $"{primaryAddress.Street}, {primaryAddress.City}"
                    : null,
                CreditLimit = customer.CreditLimit,
                CreditUsed = customer.CurrentBalance,
                CreditAvailable = Math.Max(0, customer.CreditLimit - customer.CurrentBalance),
                CreditWarning = customer.CurrentBalance >= customer.CreditLimit * 0.8m,
                LastVisitDate = lastVisit?.CheckInTime,
                LastOrderDate = lastOrder?.OrderDate,
                LastOrderAmount = lastOrder?.TotalAmount,
                AssignedAt = assignment.AssignmentDate,
                IsActive = customer.IsActive,
                RequiredVisitsPerMonth = requiredVisits,
                CompletedVisitsThisMonth = monthlyVisitCount,
                DaysSinceLastVisit = daysSinceLastVisit.HasValue ? (int)daysSinceLastVisit.Value : null,
                IsOverdue = isOverdue,
                VisitCompliancePercent = compliance,
                Latitude = primaryAddress?.Latitude,
                Longitude = primaryAddress?.Longitude
            };

            return ApiResponse<RepCustomerDto>.Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting customer {CustomerId} details for rep {RepId}", customerId, repId);
            return ApiResponse<RepCustomerDto>.Fail("Failed to retrieve customer details");
        }
    }

    public async Task<ApiResponse<RepCustomerCreditDto>> GetCustomerCreditAsync(
        int repId,
        int customerId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Verify assignment
            if (!await IsCustomerAssignedAsync(repId, customerId, cancellationToken))
            {
                return ApiResponse<RepCustomerCreditDto>.Fail("Customer not assigned to you");
            }

            var customer = await _context.Customers.FindAsync(new object[] { customerId }, cancellationToken);
            if (customer == null)
            {
                return ApiResponse<RepCustomerCreditDto>.Fail("Customer not found");
            }

            // Calculate overdue amounts
            var overdueOrders = await _context.Orders
                .Where(o => o.CustomerId == customerId && 
                            o.Status == OrderStatus.Delivered && 
                            o.PaymentStatus != PaymentStatus.Paid)
                .ToListAsync(cancellationToken);

            var overdueAmount = overdueOrders.Sum(o => o.TotalAmount);
            var oldestOverdueDate = overdueOrders.Any() 
                ? overdueOrders.Min(o => o.OrderDate) 
                : (DateTime?)null;

            var creditUtilization = customer.CreditLimit > 0
                ? (customer.CurrentBalance / customer.CreditLimit) * 100
                : 0;

            var creditAvailable = Math.Max(0, customer.CreditLimit - customer.CurrentBalance);
            var canPlaceOrders = creditAvailable > 0 && customer.IsActive;

            string? warningMessage = null;
            if (!customer.IsActive)
            {
                warningMessage = "Customer account is inactive";
            }
            else if (creditAvailable <= 0)
            {
                warningMessage = "Credit limit exceeded - no orders allowed";
            }
            else if (creditUtilization >= 80)
            {
                warningMessage = $"Credit utilization at {creditUtilization:F0}% - approaching limit";
            }
            else if (overdueAmount > 0)
            {
                warningMessage = $"Outstanding balance of {overdueAmount:C} is overdue";
            }

            var dto = new RepCustomerCreditDto
            {
                CustomerId = customer.Id,
                CustomerName = customer.FullName,
                CreditLimit = customer.CreditLimit,
                CreditUsed = customer.CurrentBalance,
                CreditAvailable = creditAvailable,
                CreditUtilization = creditUtilization,
                PaymentTermDays = customer.PaymentTermsDays,
                OverdueAmount = overdueAmount,
                OverdueInvoiceCount = overdueOrders.Count,
                OldestOverdueDate = oldestOverdueDate,
                CanPlaceOrders = canPlaceOrders,
                CreditWarningMessage = warningMessage
            };

            return ApiResponse<RepCustomerCreditDto>.Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting credit for customer {CustomerId}", customerId);
            return ApiResponse<RepCustomerCreditDto>.Fail("Failed to retrieve credit information");
        }
    }

    public async Task<ApiResponse<List<RepCustomerOrderDto>>> GetCustomerOrdersAsync(
        int repId,
        int customerId,
        int count = 10,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (!await IsCustomerAssignedAsync(repId, customerId, cancellationToken))
            {
                return ApiResponse<List<RepCustomerOrderDto>>.Fail("Customer not assigned to you");
            }

            var orders = await _context.Orders
                .Where(o => o.CustomerId == customerId)
                .OrderByDescending(o => o.OrderDate)
                .Take(count)
                .Include(o => o.OrderItems)
                .ToListAsync(cancellationToken);

            var dtos = orders.Select(o => new RepCustomerOrderDto
            {
                OrderId = o.Id,
                OrderNumber = o.OrderNumber,
                OrderDate = o.OrderDate,
                Status = o.Status,
                StatusName = o.Status.ToString(),
                TotalAmount = o.TotalAmount,
                ItemCount = o.OrderItems.Count,
                CreatedByRep = o.RepId.HasValue,
                CreatedDuringVisit = o.VisitId.HasValue,
                VisitId = o.VisitId
            }).ToList();

            return ApiResponse<List<RepCustomerOrderDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting orders for customer {CustomerId}", customerId);
            return ApiResponse<List<RepCustomerOrderDto>>.Fail("Failed to retrieve orders");
        }
    }

    public async Task<ApiResponse<List<RepCustomerVisitDto>>> GetCustomerVisitsAsync(
        int repId,
        int customerId,
        int count = 10,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (!await IsCustomerAssignedAsync(repId, customerId, cancellationToken))
            {
                return ApiResponse<List<RepCustomerVisitDto>>.Fail("Customer not assigned to you");
            }

            var visits = await _context.ExecutedVisits
                .Where(v => v.CustomerId == customerId && v.RepId == repId)
                .OrderByDescending(v => v.CheckInTime)
                .Take(count)
                .ToListAsync(cancellationToken);

            var visitIds = visits.Select(v => v.Id).ToList();

            // Get orders created during these visits
            var visitOrders = await _context.Orders
                .Where(o => o.VisitId.HasValue && visitIds.Contains(o.VisitId.Value))
                .GroupBy(o => o.VisitId!.Value)
                .Select(g => new
                {
                    VisitId = g.Key,
                    OrderCount = g.Count(),
                    TotalValue = g.Sum(o => o.TotalAmount)
                })
                .ToListAsync(cancellationToken);

            var dtos = visits.Select(v =>
            {
                var orderInfo = visitOrders.FirstOrDefault(o => o.VisitId == v.Id);
                return new RepCustomerVisitDto
                {
                    VisitId = v.Id,
                    VisitDate = v.CheckInTime.Date,
                    StartTime = v.CheckInTime.TimeOfDay,
                    EndTime = v.CheckOutTime?.TimeOfDay,
                    VisitType = v.VisitType,
                    VisitTypeName = v.VisitType.ToString(),
                    Outcome = v.Outcome,
                    OutcomeName = v.Outcome?.ToString() ?? "Pending",
                    Notes = v.Summary,
                    HasOrders = orderInfo != null && orderInfo.OrderCount > 0,
                    OrderCount = orderInfo?.OrderCount ?? 0,
                    TotalOrderValue = orderInfo?.TotalValue
                };
            }).ToList();

            return ApiResponse<List<RepCustomerVisitDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting visits for customer {CustomerId}", customerId);
            return ApiResponse<List<RepCustomerVisitDto>>.Fail("Failed to retrieve visits");
        }
    }

    public async Task<ApiResponse<RepCustomerStatsDto>> GetMyCustomerStatsAsync(
        int repId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var assignments = await _context.RepCustomerAssignments
                .Where(a => a.RepId == repId && a.IsActive)
                .Include(a => a.Customer)
                .ToListAsync(cancellationToken);

            var customerIds = assignments.Select(a => a.CustomerId).ToList();
            var customers = assignments.Select(a => a.Customer!).ToList();

            // Calculate date ranges
            var startOfWeek = DateTime.UtcNow.AddDays(-(int)DateTime.UtcNow.DayOfWeek);
            var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);

            // Get visits this week
            var visitsThisWeek = await _context.ExecutedVisits
                .Where(v => v.RepId == repId && 
                            customerIds.Contains(v.CustomerId) &&
                            v.CheckInTime >= startOfWeek)
                .Select(v => v.CustomerId)
                .Distinct()
                .CountAsync(cancellationToken);

            // Get visits this month per customer for compliance
            var visitsThisMonthPerCustomer = await _context.ExecutedVisits
                .Where(v => v.RepId == repId &&
                            customerIds.Contains(v.CustomerId) &&
                            v.CheckInTime >= startOfMonth)
                .GroupBy(v => v.CustomerId)
                .Select(g => new { CustomerId = g.Key, Count = g.Count() })
                .ToListAsync(cancellationToken);

            // Get last visit date per customer for overdue calculation
            var lastVisitsPerCustomer = await _context.ExecutedVisits
                .Where(v => v.RepId == repId && customerIds.Contains(v.CustomerId))
                .GroupBy(v => v.CustomerId)
                .Select(g => new { CustomerId = g.Key, LastVisit = g.Max(v => v.CheckInTime) })
                .ToListAsync(cancellationToken);

            // Calculate overdue count using tier-based frequency
            var overdueCount = 0;
            var totalRequired = 0;
            var totalCompleted = 0;
            foreach (var assignment in assignments)
            {
                var customer = assignment.Customer!;
                var required = assignment.GetEffectiveRequiredVisits(customer.Tier);
                var completed = visitsThisMonthPerCustomer.FirstOrDefault(v => v.CustomerId == customer.Id)?.Count ?? 0;
                var lastVisitDate = lastVisitsPerCustomer.FirstOrDefault(v => v.CustomerId == customer.Id)?.LastVisit;
                var maxDays = required > 0 ? 30.0 / required : 30.0;
                var daysSince = lastVisitDate != null ? (DateTime.UtcNow - lastVisitDate.Value).TotalDays : double.MaxValue;
                
                if (daysSince > maxDays) overdueCount++;
                totalRequired += required;
                totalCompleted += completed;
            }

            var overallCompliance = totalRequired > 0
                ? Math.Min(100, (decimal)totalCompleted / totalRequired * 100)
                : 100;

            // Get orders this month
            var ordersThisMonth = await _context.Orders
                .Where(o => customerIds.Contains(o.CustomerId) && 
                            o.OrderDate >= startOfMonth)
                .ToListAsync(cancellationToken);

            var customersWithOrdersThisMonth = ordersThisMonth
                .Select(o => o.CustomerId)
                .Distinct()
                .Count();

            var totalOrderValueThisMonth = ordersThisMonth.Sum(o => o.TotalAmount);

            var stats = new RepCustomerStatsDto
            {
                TotalCustomers = assignments.Count,
                ActiveCustomers = customers.Count(c => c.IsActive),
                CustomersByType = customers
                    .GroupBy(c => c.CustomerType.ToString())
                    .ToDictionary(g => g.Key, g => g.Count()),
                CustomersByTier = customers
                    .GroupBy(c => c.Tier.ToString())
                    .ToDictionary(g => g.Key, g => g.Count()),
                CustomersWithCreditWarning = customers
                    .Count(c => c.CurrentBalance >= c.CreditLimit * 0.8m),
                CustomersNeedingVisit = overdueCount,
                CustomersOverdue = overdueCount,
                CustomersVisitedThisWeek = visitsThisWeek,
                CustomersWithOrdersThisMonth = customersWithOrdersThisMonth,
                TotalOrderValueThisMonth = totalOrderValueThisMonth,
                OverallVisitCompliance = overallCompliance
            };

            return ApiResponse<RepCustomerStatsDto>.Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting customer stats for rep {RepId}", repId);
            return ApiResponse<RepCustomerStatsDto>.Fail("Failed to retrieve statistics");
        }
    }

    public async Task<ApiResponse<CustomerPhotoArchiveDto>> GetCustomerPhotosAsync(
        int repId,
        int customerId,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (!await IsCustomerAssignedAsync(repId, customerId, cancellationToken))
            {
                return ApiResponse<CustomerPhotoArchiveDto>.Fail("Customer not assigned to you");
            }

            var customer = await _context.Customers.FindAsync(new object[] { customerId }, cancellationToken);
            if (customer == null)
            {
                return ApiResponse<CustomerPhotoArchiveDto>.Fail("Customer not found");
            }

            // Get all visit IDs for this customer by this rep
            var visitIds = await _context.ExecutedVisits
                .Where(v => v.CustomerId == customerId && v.RepId == repId)
                .Select(v => v.Id)
                .ToListAsync(cancellationToken);

            // Get attachments that are images from those visits
            var imageTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp" };
            var totalPhotos = await _context.VisitAttachments
                .CountAsync(a => visitIds.Contains(a.VisitId) && imageTypes.Contains(a.FileType), cancellationToken);

            var attachments = await _context.VisitAttachments
                .Where(a => visitIds.Contains(a.VisitId) && imageTypes.Contains(a.FileType))
                .OrderByDescending(a => a.UploadedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Include(a => a.Visit)
                .ToListAsync(cancellationToken);

            var photos = attachments.Select(a => new CustomerPhotoDto
            {
                Id = a.Id,
                VisitId = a.VisitId,
                VisitDate = a.Visit?.CheckInTime.Date ?? a.UploadedAt.Date,
                FileName = a.FileName,
                FileType = a.FileType,
                FilePath = a.FilePath,
                FileSize = a.FileSize,
                UploadedAt = a.UploadedAt,
                ThumbnailUrl = null // TODO: Generate thumbnails
            }).ToList();

            var result = new CustomerPhotoArchiveDto
            {
                CustomerId = customerId,
                CustomerName = customer.FullName,
                TotalPhotos = totalPhotos,
                Photos = photos
            };

            return ApiResponse<CustomerPhotoArchiveDto>.Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting photos for customer {CustomerId}", customerId);
            return ApiResponse<CustomerPhotoArchiveDto>.Fail("Failed to retrieve photos");
        }
    }

    public async Task<bool> IsCustomerAssignedAsync(
        int repId,
        int customerId,
        CancellationToken cancellationToken = default)
    {
        return await _context.RepCustomerAssignments
            .AnyAsync(a => a.RepId == repId && a.CustomerId == customerId && a.IsActive, cancellationToken);
    }
}
