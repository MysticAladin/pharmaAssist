using Application.DTOs.Dashboard;
using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Api.Controllers;

/// <summary>
/// Dashboard endpoints for Sales Representatives
/// Provides performance metrics, targets, and activity summaries
/// </summary>
[ApiController]
[Route("api/sales-rep/dashboard")]
[Authorize(Roles = "SalesRep,Manager,Admin")]
public class RepDashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<RepDashboardController> _logger;

    public RepDashboardController(ApplicationDbContext context, ILogger<RepDashboardController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get the main dashboard summary for the current sales rep
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<RepDashboardSummaryDto>> GetDashboard(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var rep = await _context.SalesRepresentatives
            .AsNoTracking()
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.UserId == userId, cancellationToken);

        if (rep == null)
            return NotFound("User is not registered as a sales representative.");

        fromDate ??= new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        toDate ??= DateTime.UtcNow;
        var endDate = toDate.Value.AddDays(1);

        // Get orders for this period
        var orders = await _context.Orders
            .AsNoTracking()
            .Where(o => o.RepId == rep.Id &&
                       o.OrderDate >= fromDate.Value &&
                       o.OrderDate < endDate)
            .ToListAsync(cancellationToken);

        // Get visits for this period
        var visits = await _context.ExecutedVisits
            .AsNoTracking()
            .Where(v => v.RepId == rep.Id &&
                       v.CheckInTime >= fromDate.Value &&
                       v.CheckInTime < endDate)
            .ToListAsync(cancellationToken);

        // Get assigned customers
        var customerCount = await _context.RepCustomerAssignments
            .AsNoTracking()
            .CountAsync(a => a.RepId == rep.Id && a.IsActive, cancellationToken);

        // Calculate metrics
        var userName = rep.User != null ? $"{rep.User.FirstName} {rep.User.LastName}" : "Unknown";
        var summary = new RepDashboardSummaryDto
        {
            RepId = rep.Id,
            RepName = userName,
            PeriodStart = fromDate.Value,
            PeriodEnd = toDate.Value,

            // Order metrics
            TotalOrders = orders.Count,
            TotalRevenue = orders.Sum(o => o.TotalAmount),
            AverageOrderValue = orders.Any() ? orders.Average(o => o.TotalAmount) : 0,
            PendingOrders = orders.Count(o => o.Status == Domain.Enums.OrderStatus.Pending),
            DeliveredOrders = orders.Count(o => o.Status == Domain.Enums.OrderStatus.Delivered),

            // Visit metrics
            TotalVisits = visits.Count,
            PlannedVisits = await _context.PlannedVisits
                .CountAsync(v => v.Plan.RepId == rep.Id &&
                                v.PlannedDate >= fromDate.Value &&
                                v.PlannedDate < endDate, cancellationToken),
            CompletedVisits = visits.Count(v => v.CheckOutTime.HasValue),
            VisitCompletionRate = visits.Any() 
                ? Math.Round((decimal)visits.Count(v => v.CheckOutTime.HasValue) / visits.Count * 100, 1)
                : 0,

            // Customer metrics
            AssignedCustomers = customerCount,
            CustomersVisited = visits.Select(v => v.CustomerId).Distinct().Count(),

            // Offline sync status
            PendingOfflineOrders = orders.Count(o => !o.SyncedAt.HasValue && o.OfflineCreatedAt.HasValue)
        };

        // Calculate YoY comparison
        var lastYearStart = fromDate.Value.AddYears(-1);
        var lastYearEnd = toDate.Value.AddYears(-1);
        var lastYearOrders = await _context.Orders
            .AsNoTracking()
            .Where(o => o.RepId == rep.Id &&
                       o.OrderDate >= lastYearStart &&
                       o.OrderDate <= lastYearEnd)
            .ToListAsync(cancellationToken);

        if (lastYearOrders.Any())
        {
            var lastYearRevenue = lastYearOrders.Sum(o => o.TotalAmount);
            if (lastYearRevenue > 0)
            {
                summary.RevenueGrowthPercent = Math.Round(
                    (summary.TotalRevenue - lastYearRevenue) / lastYearRevenue * 100, 1);
            }
        }

        return Ok(summary);
    }

    /// <summary>
    /// Get performance widgets data
    /// </summary>
    [HttpGet("widgets")]
    public async Task<ActionResult<RepDashboardWidgetsDto>> GetWidgets(CancellationToken cancellationToken = default)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var rep = await _context.SalesRepresentatives
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.UserId == userId, cancellationToken);

        if (rep == null)
            return NotFound("User is not registered as a sales representative.");

        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1);
        var weekStart = now.AddDays(-(int)now.DayOfWeek);
        var today = now.Date;

        var widgets = new RepDashboardWidgetsDto
        {
            // Today's activity
            TodayOrders = await _context.Orders
                .CountAsync(o => o.RepId == rep.Id && o.OrderDate.Date == today, cancellationToken),
            TodayRevenue = await _context.Orders
                .Where(o => o.RepId == rep.Id && o.OrderDate.Date == today)
                .SumAsync(o => o.TotalAmount, cancellationToken),
            TodayVisits = await _context.ExecutedVisits
                .CountAsync(v => v.RepId == rep.Id && 
                            v.CheckInTime.Date == today, cancellationToken),

            // This week
            WeekOrders = await _context.Orders
                .CountAsync(o => o.RepId == rep.Id && o.OrderDate >= weekStart, cancellationToken),
            WeekRevenue = await _context.Orders
                .Where(o => o.RepId == rep.Id && o.OrderDate >= weekStart)
                .SumAsync(o => o.TotalAmount, cancellationToken),

            // This month
            MonthOrders = await _context.Orders
                .CountAsync(o => o.RepId == rep.Id && o.OrderDate >= monthStart, cancellationToken),
            MonthRevenue = await _context.Orders
                .Where(o => o.RepId == rep.Id && o.OrderDate >= monthStart)
                .SumAsync(o => o.TotalAmount, cancellationToken),

            // Pending tasks
            PlannedVisitsToday = await _context.PlannedVisits
                .CountAsync(v => v.Plan.RepId == rep.Id && 
                            v.PlannedDate.Date == today &&
                            v.ExecutedVisit == null, cancellationToken),
            OverdueVisits = await _context.PlannedVisits
                .CountAsync(v => v.Plan.RepId == rep.Id && 
                            v.PlannedDate.Date < today &&
                            v.ExecutedVisit == null, cancellationToken)
        };

        return Ok(widgets);
    }

    /// <summary>
    /// Get recent orders list
    /// </summary>
    [HttpGet("recent-orders")]
    public async Task<ActionResult<List<RecentOrderDto>>> GetRecentOrders(
        [FromQuery] int count = 10,
        CancellationToken cancellationToken = default)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var rep = await _context.SalesRepresentatives
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.UserId == userId, cancellationToken);

        if (rep == null)
            return NotFound("User is not registered as a sales representative.");

        var orders = await _context.Orders
            .AsNoTracking()
            .Include(o => o.Customer)
            .Where(o => o.RepId == rep.Id)
            .OrderByDescending(o => o.OrderDate)
            .Take(count)
            .Select(o => new RecentOrderDto
            {
                OrderId = o.Id,
                OrderNumber = o.OrderNumber,
                CustomerName = o.Customer.CompanyName ?? $"{o.Customer.FirstName} {o.Customer.LastName}",
                TotalAmount = o.TotalAmount,
                Status = o.Status.ToString(),
                OrderDate = o.OrderDate,
                ItemCount = o.OrderItems.Count
            })
            .ToListAsync(cancellationToken);

        return Ok(orders);
    }

    /// <summary>
    /// Get today's schedule
    /// </summary>
    [HttpGet("today-schedule")]
    public async Task<ActionResult<TodayScheduleDto>> GetTodaySchedule(CancellationToken cancellationToken = default)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var rep = await _context.SalesRepresentatives
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.UserId == userId, cancellationToken);

        if (rep == null)
            return NotFound("User is not registered as a sales representative.");

        var today = DateTime.UtcNow.Date;

        // Get planned visits for today
        var plannedVisits = await _context.PlannedVisits
            .AsNoTracking()
            .Include(v => v.Customer)
            .ThenInclude(c => c.Addresses)
            .Where(v => v.Plan.RepId == rep.Id &&
                       v.PlannedDate.Date == today)
            .OrderBy(v => v.PlannedTime)
            .Select(v => new ScheduledVisitDto
            {
                VisitId = v.Id,
                CustomerId = v.CustomerId,
                CustomerName = v.Customer.CompanyName ?? $"{v.Customer.FirstName} {v.Customer.LastName}",
                CustomerAddress = v.Customer.Addresses.FirstOrDefault() != null 
                    ? $"{v.Customer.Addresses.First().Street}, {v.Customer.Addresses.First().City}"
                    : "",
                ScheduledTime = v.PlannedTime,
                VisitType = v.VisitObjective ?? "Regular",
                Status = v.ExecutedVisit != null ? "Completed" : "Scheduled",
                Notes = v.Notes
            })
            .ToListAsync(cancellationToken);

        // Get executed visits for today
        var executedVisits = await _context.ExecutedVisits
            .AsNoTracking()
            .Include(v => v.Customer)
            .Where(v => v.RepId == rep.Id &&
                       v.CheckInTime.Date == today)
            .Select(v => new ExecutedVisitSummaryDto
            {
                VisitId = v.Id,
                CustomerId = v.CustomerId,
                CustomerName = v.Customer.CompanyName ?? $"{v.Customer.FirstName} {v.Customer.LastName}",
                CheckInTime = v.CheckInTime,
                CheckOutTime = v.CheckOutTime,
                Duration = v.ActualDurationMinutes,
                OrderTaken = v.Outcome == Domain.Enums.VisitOutcome.Positive
            })
            .ToListAsync(cancellationToken);

        return Ok(new TodayScheduleDto
        {
            Date = today,
            PlannedVisits = plannedVisits,
            ExecutedVisits = executedVisits,
            TotalPlanned = plannedVisits.Count,
            TotalCompleted = executedVisits.Count(v => v.CheckOutTime.HasValue)
        });
    }

    /// <summary>
    /// Get top performing customers
    /// </summary>
    [HttpGet("top-customers")]
    public async Task<ActionResult<List<TopCustomerDto>>> GetTopCustomers(
        [FromQuery] int count = 5,
        [FromQuery] int? daysBack = 30,
        CancellationToken cancellationToken = default)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var rep = await _context.SalesRepresentatives
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.UserId == userId, cancellationToken);

        if (rep == null)
            return NotFound("User is not registered as a sales representative.");

        var fromDate = DateTime.UtcNow.AddDays(-daysBack!.Value);

        var topCustomers = await _context.Orders
            .AsNoTracking()
            .Include(o => o.Customer)
            .Where(o => o.RepId == rep.Id && o.OrderDate >= fromDate)
            .GroupBy(o => new { o.CustomerId, o.Customer.CompanyName, o.Customer.FirstName, o.Customer.LastName })
            .Select(g => new TopCustomerDto
            {
                CustomerId = g.Key.CustomerId,
                CustomerName = g.Key.CompanyName ?? $"{g.Key.FirstName} {g.Key.LastName}",
                TotalOrders = g.Count(),
                TotalRevenue = g.Sum(o => o.TotalAmount),
                AverageOrderValue = g.Average(o => o.TotalAmount),
                LastOrderDate = g.Max(o => o.OrderDate)
            })
            .OrderByDescending(c => c.TotalRevenue)
            .Take(count)
            .ToListAsync(cancellationToken);

        return Ok(topCustomers);
    }

    /// <summary>
    /// Get sales trend data for charts
    /// </summary>
    [HttpGet("trends")]
    public async Task<ActionResult<SalesTrendsDto>> GetSalesTrends(
        [FromQuery] int daysBack = 30,
        CancellationToken cancellationToken = default)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var rep = await _context.SalesRepresentatives
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.UserId == userId, cancellationToken);

        if (rep == null)
            return NotFound("User is not registered as a sales representative.");

        var fromDate = DateTime.UtcNow.AddDays(-daysBack).Date;
        var toDate = DateTime.UtcNow.Date.AddDays(1);

        // Get daily order data
        var dailyOrders = await _context.Orders
            .AsNoTracking()
            .Where(o => o.RepId == rep.Id &&
                       o.OrderDate >= fromDate &&
                       o.OrderDate < toDate)
            .GroupBy(o => o.OrderDate.Date)
            .Select(g => new DailyDataPoint
            {
                Date = g.Key,
                OrderCount = g.Count(),
                Revenue = g.Sum(o => o.TotalAmount)
            })
            .OrderBy(d => d.Date)
            .ToListAsync(cancellationToken);

        // Get daily visit data
        var dailyVisits = await _context.ExecutedVisits
            .AsNoTracking()
            .Where(v => v.RepId == rep.Id &&
                       v.CheckInTime >= fromDate &&
                       v.CheckInTime < toDate)
            .GroupBy(v => v.CheckInTime.Date)
            .Select(g => new
            {
                Date = g.Key,
                VisitCount = g.Count()
            })
            .OrderBy(d => d.Date)
            .ToListAsync(cancellationToken);

        // Fill in missing dates with zeros
        var allDates = Enumerable.Range(0, daysBack + 1)
            .Select(i => fromDate.AddDays(i))
            .ToList();

        var trends = new SalesTrendsDto
        {
            FromDate = fromDate,
            ToDate = DateTime.UtcNow.Date,
            DataPoints = allDates.Select(date => new TrendDataPoint
            {
                Date = date,
                Orders = dailyOrders.FirstOrDefault(d => d.Date == date)?.OrderCount ?? 0,
                Revenue = dailyOrders.FirstOrDefault(d => d.Date == date)?.Revenue ?? 0,
                Visits = dailyVisits.FirstOrDefault(d => d.Date == date)?.VisitCount ?? 0
            }).ToList()
        };

        return Ok(trends);
    }

    /// <summary>
    /// Get current targets and progress
    /// </summary>
    [HttpGet("targets")]
    public async Task<ActionResult<RepTargetProgressDto>> GetTargetProgress(CancellationToken cancellationToken = default)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var now = DateTime.UtcNow;
        var currentMonth = now.Month;
        var currentYear = now.Year;

        // Get targets for this user
        var targets = await _context.SalesTargets
            .AsNoTracking()
            .Where(t => t.UserId == userId &&
                       t.Year == currentYear &&
                       (t.Month == currentMonth || t.Month == null) &&
                       t.IsActive)
            .ToListAsync(cancellationToken);

        var progress = new RepTargetProgressDto
        {
            Year = currentYear,
            Month = currentMonth,
            DaysElapsed = now.Day,
            TotalDays = DateTime.DaysInMonth(currentYear, currentMonth),
            Targets = targets.Select(t => new TargetItemDto
            {
                TargetId = t.Id,
                Name = t.Name,
                Type = t.TargetType.ToString(),
                TargetValue = t.TargetValue,
                CurrentValue = t.CurrentValue,
                AchievementPercent = t.AchievementPercentage,
                IsAchieved = t.IsAchieved,
                Status = GetTargetStatus(t.AchievementPercentage, now.Day, DateTime.DaysInMonth(currentYear, currentMonth))
            }).ToList()
        };

        return Ok(progress);
    }

    private static string GetTargetStatus(decimal achievementPercent, int daysElapsed, int totalDays)
    {
        var expectedPercent = (decimal)daysElapsed / totalDays * 100;
        var proRataAchievement = achievementPercent / expectedPercent * 100;

        return proRataAchievement switch
        {
            >= 100 => "OnTrack",
            >= 80 => "AtRisk",
            _ => "Behind"
        };
    }

    private class DailyDataPoint
    {
        public DateTime Date { get; set; }
        public int OrderCount { get; set; }
        public decimal Revenue { get; set; }
    }
}
