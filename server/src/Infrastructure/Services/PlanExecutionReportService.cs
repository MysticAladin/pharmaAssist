using Application.DTOs.Planning;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

/// <summary>
/// Implementation of plan execution and activity reporting service
/// </summary>
public class PlanExecutionReportService : IPlanExecutionReportService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PlanExecutionReportService> _logger;

    public PlanExecutionReportService(
        ApplicationDbContext context,
        ILogger<PlanExecutionReportService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<DailyActivityReportDto> GetDailyActivityReportAsync(
        int repId,
        DateTime date,
        CancellationToken cancellationToken = default)
    {
        var dateOnly = date.Date;
        var nextDay = dateOnly.AddDays(1);

        // Get rep with user info
        var rep = await _context.SalesRepresentatives
            .Include(r => r.User)
            .Where(r => r.Id == repId)
            .FirstOrDefaultAsync(cancellationToken);

        if (rep == null)
            throw new InvalidOperationException($"Sales representative {repId} not found");

        var repName = rep.User != null ? $"{rep.User.FirstName} {rep.User.LastName}" : $"Rep #{repId}";

        // Get executed visits for the day
        var executedVisits = await _context.ExecutedVisits
            .Include(v => v.Customer)
            .Include(v => v.Notes)
            .Where(v => v.RepId == repId && v.CheckInTime >= dateOnly && v.CheckInTime < nextDay)
            .ToListAsync(cancellationToken);

        // Get planned visits for the day
        var plannedVisits = await _context.PlannedVisits
            .Include(pv => pv.Plan)
            .Where(pv => pv.Plan != null && pv.Plan.RepId == repId && 
                         pv.PlannedDate >= dateOnly && pv.PlannedDate < nextDay)
            .CountAsync(cancellationToken);

        // Get orders placed by this rep on this day
        var orders = await _context.Orders
            .Include(o => o.OrderItems)
            .Where(o => o.RepId == repId && o.OrderDate >= dateOnly && o.OrderDate < nextDay)
            .ToListAsync(cancellationToken);

        // Build the report
        var report = new DailyActivityReportDto
        {
            Date = dateOnly,
            RepId = repId,
            RepName = repName,
            PlannedVisits = plannedVisits,
            CompletedVisits = executedVisits.Count(v => v.CheckOutTime.HasValue),
            CancelledVisits = 0,
            OrdersCollected = orders.Count,
            OrderValue = orders.Sum(o => o.TotalAmount),
            OrderItems = orders.Sum(o => o.OrderItems.Count),
            CustomersVisited = executedVisits.Select(v => new VisitedCustomerDto
            {
                CustomerId = v.CustomerId,
                CustomerName = v.Customer?.CompanyName ?? v.Customer?.FullName ?? "Unknown",
                CustomerType = v.Customer?.CustomerType.ToString(),
                City = null, // Would need to load addresses
                Outcome = v.Outcome,
                CheckInTime = v.CheckInTime,
                CheckOutTime = v.CheckOutTime,
                HasOrder = orders.Any(o => o.CustomerId == v.CustomerId),
                OrderAmount = orders.Where(o => o.CustomerId == v.CustomerId).Sum(o => o.TotalAmount),
                Notes = v.Notes.FirstOrDefault()?.NoteText
            }).ToList(),
            IssuesEncountered = executedVisits
                .Where(v => v.Notes.Any(n => n.NoteText != null && 
                           (n.NoteText.Contains("issue", StringComparison.OrdinalIgnoreCase) ||
                            n.NoteText.Contains("problem", StringComparison.OrdinalIgnoreCase))))
                .Select(v => new VisitIssueDto
                {
                    CustomerId = v.CustomerId,
                    CustomerName = v.Customer?.CompanyName ?? "Unknown",
                    Issue = v.Notes.FirstOrDefault()?.NoteText ?? ""
                }).ToList(),
            ProductsPresented = new List<string>(),
            SamplesDistributed = 0,
            TimeUtilization = CalculateTimeUtilization(executedVisits)
        };

        report.TotalVisitTime = TimeSpan.FromMinutes(
            executedVisits
                .Where(v => v.CheckOutTime.HasValue)
                .Sum(v => (v.CheckOutTime!.Value - v.CheckInTime).TotalMinutes));

        return report;
    }

    public async Task<WeeklyActivityReportDto> GetWeeklyActivityReportAsync(
        int repId,
        DateTime weekStart,
        CancellationToken cancellationToken = default)
    {
        var weekStartDate = weekStart.Date;
        var weekEndDate = weekStartDate.AddDays(7);
        var previousWeekStart = weekStartDate.AddDays(-7);

        var rep = await _context.SalesRepresentatives
            .Include(r => r.User)
            .Where(r => r.Id == repId)
            .FirstOrDefaultAsync(cancellationToken);

        if (rep == null)
            throw new InvalidOperationException($"Sales representative {repId} not found");

        var repName = rep.User != null ? $"{rep.User.FirstName} {rep.User.LastName}" : $"Rep #{repId}";

        // Get executed visits for the week
        var executedVisits = await _context.ExecutedVisits
            .Include(v => v.Customer)
            .Where(v => v.RepId == repId && v.CheckInTime >= weekStartDate && v.CheckInTime < weekEndDate)
            .ToListAsync(cancellationToken);

        // Get planned visits
        var plannedVisits = await _context.PlannedVisits
            .Include(pv => pv.Plan)
            .Where(pv => pv.Plan != null && pv.Plan.RepId == repId &&
                         pv.PlannedDate >= weekStartDate && pv.PlannedDate < weekEndDate)
            .CountAsync(cancellationToken);

        // Get orders for current and previous week
        var currentWeekOrders = await _context.Orders
            .Where(o => o.RepId == repId && o.OrderDate >= weekStartDate && o.OrderDate < weekEndDate)
            .SumAsync(o => o.TotalAmount, cancellationToken);

        var previousWeekOrders = await _context.Orders
            .Where(o => o.RepId == repId && o.OrderDate >= previousWeekStart && o.OrderDate < weekStartDate)
            .SumAsync(o => o.TotalAmount, cancellationToken);

        // Get customer coverage by tier - from assignments
        var repCustomerIds = await _context.RepCustomerAssignments
            .Include(a => a.Customer)
            .Where(a => a.RepId == repId && a.IsActive)
            .Select(a => new { a.CustomerId, a.Customer!.Tier })
            .ToListAsync(cancellationToken);

        var visitedCustomerIds = executedVisits.Select(v => v.CustomerId).Distinct().ToHashSet();

        // Daily breakdown
        var dailyBreakdown = new List<DailySummaryDto>();
        for (int i = 0; i < 7; i++)
        {
            var day = weekStartDate.AddDays(i);
            var nextDay = day.AddDays(1);

            var dayVisits = executedVisits.Count(v => v.CheckInTime >= day && v.CheckInTime < nextDay);
            var dayPlanned = await _context.PlannedVisits
                .Include(pv => pv.Plan)
                .Where(pv => pv.Plan != null && pv.Plan.RepId == repId && pv.PlannedDate >= day && pv.PlannedDate < nextDay)
                .CountAsync(cancellationToken);

            var dayOrders = await _context.Orders
                .Where(o => o.RepId == repId && o.OrderDate >= day && o.OrderDate < nextDay)
                .ToListAsync(cancellationToken);

            dailyBreakdown.Add(new DailySummaryDto
            {
                Date = day,
                PlannedVisits = dayPlanned,
                CompletedVisits = dayVisits,
                OrderValue = dayOrders.Sum(o => o.TotalAmount),
                Orders = dayOrders.Count
            });
        }

        return new WeeklyActivityReportDto
        {
            WeekStart = weekStartDate,
            WeekEnd = weekEndDate.AddDays(-1),
            RepId = repId,
            RepName = repName,
            PlannedVisits = plannedVisits,
            CompletedVisits = executedVisits.Count(v => v.CheckOutTime.HasValue),
            OrderValue = currentWeekOrders,
            OrderValuePreviousWeek = previousWeekOrders,
            TotalOrders = await _context.Orders
                .Where(o => o.RepId == repId && o.OrderDate >= weekStartDate && o.OrderDate < weekEndDate)
                .CountAsync(cancellationToken),
            TierACoverage = new CustomerCoverageDto
            {
                TotalCustomers = repCustomerIds.Count(c => c.Tier == CustomerTier.A),
                VisitedCustomers = repCustomerIds.Count(c => c.Tier == CustomerTier.A && visitedCustomerIds.Contains(c.CustomerId))
            },
            TierBCoverage = new CustomerCoverageDto
            {
                TotalCustomers = repCustomerIds.Count(c => c.Tier == CustomerTier.B),
                VisitedCustomers = repCustomerIds.Count(c => c.Tier == CustomerTier.B && visitedCustomerIds.Contains(c.CustomerId))
            },
            TierCCoverage = new CustomerCoverageDto
            {
                TotalCustomers = repCustomerIds.Count(c => c.Tier == CustomerTier.C),
                VisitedCustomers = repCustomerIds.Count(c => c.Tier == CustomerTier.C && visitedCustomerIds.Contains(c.CustomerId))
            },
            DailyBreakdown = dailyBreakdown,
            KeyWins = new List<string>(),
            Challenges = new List<string>(),
            NextWeekFocus = new List<string>()
        };
    }

    public async Task<MonthlyActivityReportDto> GetMonthlyActivityReportAsync(
        int repId,
        int year,
        int month,
        ActivityReportFilterDto? filter = null,
        CancellationToken cancellationToken = default)
    {
        var monthStart = new DateTime(year, month, 1);
        var monthEnd = monthStart.AddMonths(1);
        var previousMonthStart = monthStart.AddMonths(-1);

        var rep = await _context.SalesRepresentatives
            .Include(r => r.User)
            .Where(r => r.Id == repId)
            .FirstOrDefaultAsync(cancellationToken);

        if (rep == null)
            throw new InvalidOperationException($"Sales representative {repId} not found");

        var repName = rep.User != null ? $"{rep.User.FirstName} {rep.User.LastName}" : $"Rep #{repId}";

        // Get monthly plan if exists
        var monthlyPlan = await _context.MonthlyPlans
            .Where(mp => mp.RepId == repId && mp.Year == year && mp.Month == month)
            .FirstOrDefaultAsync(cancellationToken);

        // Get executed visits for the month
        var executedVisits = await _context.ExecutedVisits
            .Include(v => v.Customer)
            .Where(v => v.RepId == repId && v.CheckInTime >= monthStart && v.CheckInTime < monthEnd)
            .ToListAsync(cancellationToken);

        // Get orders for the month
        var orders = await _context.Orders
            .Include(o => o.OrderItems)
            .ThenInclude(oi => oi.Product)
            .ThenInclude(p => p.Category)
            .Include(o => o.Customer)
            .Where(o => o.RepId == repId && o.OrderDate >= monthStart && o.OrderDate < monthEnd)
            .ToListAsync(cancellationToken);

        var totalRevenue = orders.Sum(o => o.TotalAmount);

        // Get customer tiers from assignments
        var repCustomerIds = await _context.RepCustomerAssignments
            .Include(a => a.Customer)
            .Where(a => a.RepId == repId && a.IsActive)
            .Select(a => new { a.CustomerId, a.Customer!.Tier })
            .ToListAsync(cancellationToken);

        var visitedCustomerIds = executedVisits.Select(v => v.CustomerId).Distinct().ToHashSet();

        // Product performance
        var productPerformance = new List<ProductPerformanceDto>();
        if (filter?.IncludeProductBreakdown ?? true)
        {
            productPerformance = orders
                .SelectMany(o => o.OrderItems)
                .GroupBy(oi => new { oi.ProductId, ProductName = oi.Product?.Name ?? "Unknown", CategoryName = oi.Product?.Category?.Name ?? "Unknown" })
                .Select(g => new ProductPerformanceDto
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.ProductName,
                    Category = g.Key.CategoryName,
                    Actual = g.Sum(oi => oi.Quantity * oi.UnitPrice),
                    UnitsSold = g.Sum(oi => oi.Quantity)
                })
                .OrderByDescending(p => p.Actual)
                .Take(10)
                .ToList();
        }

        // Customer performance
        var customerPerformance = new List<CustomerPerformanceDto>();
        if (filter?.IncludeCustomerBreakdown ?? true)
        {
            var previousMonthOrders = await _context.Orders
                .Where(o => o.RepId == repId && o.OrderDate >= previousMonthStart && o.OrderDate < monthStart)
                .GroupBy(o => o.CustomerId)
                .Select(g => new { CustomerId = g.Key, Revenue = g.Sum(o => o.TotalAmount) })
                .ToDictionaryAsync(x => x.CustomerId, x => x.Revenue, cancellationToken);

            customerPerformance = orders
                .GroupBy(o => o.CustomerId)
                .Select(g => new CustomerPerformanceDto
                {
                    CustomerId = g.Key,
                    CustomerName = g.First().Customer?.CompanyName ?? g.First().Customer?.FullName ?? "Unknown",
                    Tier = g.First().Customer?.Tier.ToString(),
                    City = null,
                    Revenue = g.Sum(o => o.TotalAmount),
                    RevenuePreviousMonth = previousMonthOrders.GetValueOrDefault(g.Key, 0),
                    OrderCount = g.Count(),
                    VisitCount = executedVisits.Count(v => v.CustomerId == g.Key)
                })
                .OrderByDescending(c => c.Revenue)
                .Take(10)
                .ToList();
        }

        // Territory performance - simplified
        var territoryPerformance = new List<TerritoryPerformanceDto>();

        // Weekly trends
        var weeklyTrends = new List<WeeklySummaryDto>();
        var currentDate = monthStart;
        int weekNum = 1;
        while (currentDate < monthEnd)
        {
            var weekEnd = currentDate.AddDays(7) > monthEnd ? monthEnd : currentDate.AddDays(7);
            var weekVisits = executedVisits.Count(v => v.CheckInTime >= currentDate && v.CheckInTime < weekEnd);
            var weekOrders = orders.Where(o => o.OrderDate >= currentDate && o.OrderDate < weekEnd).ToList();

            weeklyTrends.Add(new WeeklySummaryDto
            {
                WeekNumber = weekNum++,
                WeekStart = currentDate,
                Visits = weekVisits,
                Revenue = weekOrders.Sum(o => o.TotalAmount),
                Orders = weekOrders.Count
            });

            currentDate = weekEnd;
        }

        return new MonthlyActivityReportDto
        {
            Year = year,
            Month = month,
            RepId = repId,
            RepName = repName,
            MonthlyPlanId = monthlyPlan?.Id,
            PlanStatus = monthlyPlan?.Status,
            RevenueTarget = monthlyPlan?.RevenueTarget ?? 0,
            RevenueActual = totalRevenue,
            VisitsTarget = monthlyPlan?.VisitsTarget ?? 0,
            VisitsActual = executedVisits.Count(v => v.CheckOutTime.HasValue),
            TierATarget = new CustomerTargetDto
            {
                Tier = "A",
                Target = monthlyPlan?.TierACoverageTarget ?? 0,
                Actual = repCustomerIds.Count(c => c.Tier == CustomerTier.A && visitedCustomerIds.Contains(c.CustomerId))
            },
            TierBTarget = new CustomerTargetDto
            {
                Tier = "B",
                Target = monthlyPlan?.TierBCoverageTarget ?? 0,
                Actual = repCustomerIds.Count(c => c.Tier == CustomerTier.B && visitedCustomerIds.Contains(c.CustomerId))
            },
            TierCTarget = new CustomerTargetDto
            {
                Tier = "C",
                Target = monthlyPlan?.TierCCoverageTarget ?? 0,
                Actual = repCustomerIds.Count(c => c.Tier == CustomerTier.C && visitedCustomerIds.Contains(c.CustomerId))
            },
            ProductPerformance = productPerformance,
            TopCustomers = customerPerformance,
            TerritoryPerformance = territoryPerformance,
            WeeklyTrends = weeklyTrends,
            TrainingActivities = new List<string>(),
            CompetitiveInsights = new List<CompetitiveInsightDto>()
        };
    }

    public async Task<PlanExecutionReportDto> GetPlanExecutionReportAsync(
        int repId,
        DateTime? periodStart = null,
        DateTime? periodEnd = null,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var startDate = periodStart ?? new DateTime(now.Year, 1, 1);
        var endDate = periodEnd ?? now;

        var rep = await _context.SalesRepresentatives
            .Include(r => r.User)
            .Where(r => r.Id == repId)
            .FirstOrDefaultAsync(cancellationToken);

        if (rep == null)
            throw new InvalidOperationException($"Sales representative {repId} not found");

        var repName = rep.User != null ? $"{rep.User.FirstName} {rep.User.LastName}" : $"Rep #{repId}";

        // Get annual plan
        var annualPlan = await _context.AnnualPlans
            .Where(ap => ap.RepId == repId && ap.Year == now.Year)
            .FirstOrDefaultAsync(cancellationToken);

        // Get quarterly plan
        var currentQuarter = (now.Month - 1) / 3 + 1;
        var quarterlyPlan = await _context.QuarterlyPlans
            .Where(qp => qp.RepId == repId && qp.Year == now.Year && qp.Quarter == currentQuarter)
            .FirstOrDefaultAsync(cancellationToken);

        // Get monthly plan
        var monthlyPlan = await _context.MonthlyPlans
            .Where(mp => mp.RepId == repId && mp.Year == now.Year && mp.Month == now.Month)
            .FirstOrDefaultAsync(cancellationToken);

        // Get actual metrics
        var yearStart = new DateTime(now.Year, 1, 1);
        var yearEnd = yearStart.AddYears(1);
        var quarterStart = new DateTime(now.Year, (currentQuarter - 1) * 3 + 1, 1);
        var quarterEnd = quarterStart.AddMonths(3);
        var monthStart = new DateTime(now.Year, now.Month, 1);
        var monthEnd = monthStart.AddMonths(1);

        var annualRevenue = await _context.Orders
            .Where(o => o.RepId == repId && o.OrderDate >= yearStart && o.OrderDate < yearEnd)
            .SumAsync(o => o.TotalAmount, cancellationToken);

        var annualVisits = await _context.ExecutedVisits
            .Where(v => v.RepId == repId && v.CheckInTime >= yearStart && v.CheckInTime < yearEnd && v.CheckOutTime.HasValue)
            .CountAsync(cancellationToken);

        var quarterlyRevenue = await _context.Orders
            .Where(o => o.RepId == repId && o.OrderDate >= quarterStart && o.OrderDate < quarterEnd)
            .SumAsync(o => o.TotalAmount, cancellationToken);

        var quarterlyVisits = await _context.ExecutedVisits
            .Where(v => v.RepId == repId && v.CheckInTime >= quarterStart && v.CheckInTime < quarterEnd && v.CheckOutTime.HasValue)
            .CountAsync(cancellationToken);

        var monthlyRevenue = await _context.Orders
            .Where(o => o.RepId == repId && o.OrderDate >= monthStart && o.OrderDate < monthEnd)
            .SumAsync(o => o.TotalAmount, cancellationToken);

        var monthlyVisits = await _context.ExecutedVisits
            .Where(v => v.RepId == repId && v.CheckInTime >= monthStart && v.CheckInTime < monthEnd && v.CheckOutTime.HasValue)
            .CountAsync(cancellationToken);

        // Get weekly plans
        var weeklyPlans = await _context.VisitPlans
            .Include(vp => vp.PlannedVisits)
            .ThenInclude(pv => pv.ExecutedVisit)
            .Where(vp => vp.RepId == repId && vp.PlanWeek >= startDate && vp.PlanWeek <= endDate)
            .OrderByDescending(vp => vp.PlanWeek)
            .Take(8)
            .Select(vp => new WeeklyExecutionDto
            {
                PlanId = vp.Id,
                WeekStart = vp.PlanWeek,
                Status = vp.Status.ToString(),
                PlannedVisits = vp.PlannedVisits.Count,
                ExecutedVisits = vp.PlannedVisits.Count(pv => pv.ExecutedVisit != null),
                OrdersCollected = null
            })
            .ToListAsync(cancellationToken);

        // Calculate overall metrics
        var revenueProgress = annualPlan?.RevenueTarget > 0 
            ? (annualRevenue / annualPlan.RevenueTarget.Value) * 100 
            : 0;
        var visitsProgress = annualPlan?.VisitsTarget > 0 
            ? ((decimal)annualVisits / annualPlan.VisitsTarget.Value) * 100 
            : 0;

        var onTrack = 0;
        var behind = 0;
        var ahead = 0;

        if (revenueProgress >= 100) ahead++; else if (revenueProgress >= 80) onTrack++; else behind++;
        if (visitsProgress >= 100) ahead++; else if (visitsProgress >= 80) onTrack++; else behind++;

        var performanceRating = revenueProgress >= 110 ? "Excellent" :
                                revenueProgress >= 90 ? "Good" :
                                revenueProgress >= 70 ? "Average" : "Below Average";

        return new PlanExecutionReportDto
        {
            RepId = repId,
            RepName = repName,
            PeriodStart = startDate,
            PeriodEnd = endDate,
            AnnualExecution = annualPlan != null ? new AnnualExecutionDto
            {
                PlanId = annualPlan.Id,
                Year = annualPlan.Year,
                Status = annualPlan.Status,
                RevenueTarget = annualPlan.RevenueTarget ?? 0,
                RevenueActual = annualRevenue,
                VisitsTarget = annualPlan.VisitsTarget ?? 0,
                VisitsActual = annualVisits,
                QuartersCompleted = currentQuarter - 1,
                QuartersTotal = 4
            } : null,
            QuarterlyExecution = quarterlyPlan != null ? new QuarterlyExecutionDto
            {
                PlanId = quarterlyPlan.Id,
                Year = quarterlyPlan.Year,
                Quarter = quarterlyPlan.Quarter,
                Status = quarterlyPlan.Status,
                RevenueTarget = quarterlyPlan.RevenueTarget ?? 0,
                RevenueActual = quarterlyRevenue,
                VisitsTarget = quarterlyPlan.VisitsTarget ?? 0,
                VisitsActual = quarterlyVisits,
                MonthsCompleted = (now.Month - 1) % 3,
                MonthsTotal = 3
            } : null,
            MonthlyExecution = monthlyPlan != null ? new MonthlyExecutionDto
            {
                PlanId = monthlyPlan.Id,
                Year = monthlyPlan.Year,
                Month = monthlyPlan.Month,
                Status = monthlyPlan.Status,
                RevenueTarget = monthlyPlan.RevenueTarget ?? 0,
                RevenueActual = monthlyRevenue,
                VisitsTarget = monthlyPlan.VisitsTarget ?? 0,
                VisitsActual = monthlyVisits,
                WeeksCompleted = (now.Day - 1) / 7,
                WeeksTotal = DateTime.DaysInMonth(now.Year, now.Month) / 7
            } : null,
            WeeklyExecutions = weeklyPlans,
            OverallMetrics = new OverallExecutionMetricsDto
            {
                OverallRevenueProgress = Math.Round(revenueProgress, 1),
                OverallVisitsProgress = Math.Round(visitsProgress, 1),
                PlanAdherence = Math.Round((revenueProgress + visitsProgress) / 2, 1),
                OnTrackMetrics = onTrack,
                BehindMetrics = behind,
                AheadMetrics = ahead,
                PerformanceRating = performanceRating
            }
        };
    }

    public async Task<TeamExecutionSummaryDto> GetTeamExecutionSummaryAsync(
        string managerUserId,
        DateTime periodStart,
        DateTime periodEnd,
        CancellationToken cancellationToken = default)
    {
        // Get team rep IDs via manager assignments
        var teamRepIds = await _context.RepManagerAssignments
            .Where(a => a.ManagerUserId == managerUserId && a.IsActive)
            .Select(a => a.RepId)
            .ToListAsync(cancellationToken);

        if (!teamRepIds.Any())
            throw new InvalidOperationException("No team members found for this manager");

        var repSummaries = new List<RepExecutionSummaryDto>();

        foreach (var repId in teamRepIds)
        {
            var rep = await _context.SalesRepresentatives
                .Include(r => r.User)
                .Where(r => r.Id == repId)
                .FirstAsync(cancellationToken);

            var repName = rep.User != null ? $"{rep.User.FirstName} {rep.User.LastName}" : $"Rep #{repId}";

            // Get monthly plan for current month
            var monthlyPlan = await _context.MonthlyPlans
                .Where(mp => mp.RepId == repId && 
                             mp.Year == periodStart.Year && 
                             mp.Month == periodStart.Month)
                .FirstOrDefaultAsync(cancellationToken);

            var revenue = await _context.Orders
                .Where(o => o.RepId == repId && o.OrderDate >= periodStart && o.OrderDate < periodEnd)
                .SumAsync(o => o.TotalAmount, cancellationToken);

            var visits = await _context.ExecutedVisits
                .Where(v => v.RepId == repId && 
                           v.CheckInTime >= periodStart && 
                           v.CheckInTime < periodEnd && 
                           v.CheckOutTime.HasValue)
                .CountAsync(cancellationToken);

            var orders = await _context.Orders
                .Where(o => o.RepId == repId && o.OrderDate >= periodStart && o.OrderDate < periodEnd)
                .CountAsync(cancellationToken);

            var revenueTarget = monthlyPlan?.RevenueTarget ?? 0;
            var visitsTarget = monthlyPlan?.VisitsTarget ?? 0;
            var revenueProgress = revenueTarget > 0 ? (revenue / revenueTarget) * 100 : 0;

            var status = revenueProgress >= 100 ? "Above" : revenueProgress >= 80 ? "On Target" : "Below";

            repSummaries.Add(new RepExecutionSummaryDto
            {
                RepId = repId,
                RepName = repName,
                Territory = rep.TerritoryDescription,
                RevenueTarget = revenueTarget,
                RevenueActual = revenue,
                VisitsTarget = visitsTarget,
                VisitsActual = visits,
                OrderCount = orders,
                PerformanceStatus = status
            });
        }

        // Sort and rank
        repSummaries = repSummaries
            .OrderByDescending(r => r.RevenueProgress)
            .Select((r, i) => { r.Rank = i + 1; return r; })
            .ToList();

        var totalRevenueTarget = repSummaries.Sum(r => r.RevenueTarget);
        var totalRevenueActual = repSummaries.Sum(r => r.RevenueActual);
        var totalVisitsTarget = repSummaries.Sum(r => r.VisitsTarget);
        var totalVisitsActual = repSummaries.Sum(r => r.VisitsActual);

        return new TeamExecutionSummaryDto
        {
            PeriodStart = periodStart,
            PeriodEnd = periodEnd,
            PeriodName = periodStart.ToString("MMMM yyyy"),
            TotalReps = repSummaries.Count,
            TotalRevenueTarget = totalRevenueTarget,
            TotalRevenueActual = totalRevenueActual,
            TotalVisitsTarget = totalVisitsTarget,
            TotalVisitsActual = totalVisitsActual,
            RepsOnTarget = repSummaries.Count(r => r.PerformanceStatus == "On Target"),
            RepsAboveTarget = repSummaries.Count(r => r.PerformanceStatus == "Above"),
            RepsBelowTarget = repSummaries.Count(r => r.PerformanceStatus == "Below"),
            RepSummaries = repSummaries,
            TopPerformers = repSummaries.Take(3).ToList(),
            NeedingAttention = repSummaries.Where(r => r.PerformanceStatus == "Below").Take(3).ToList()
        };
    }

    public async Task<IReadOnlyList<DailyActivityReportDto>> GetDailyActivityReportsAsync(
        int repId,
        DateTime startDate,
        DateTime endDate,
        CancellationToken cancellationToken = default)
    {
        var reports = new List<DailyActivityReportDto>();
        var currentDate = startDate.Date;

        while (currentDate <= endDate.Date)
        {
            var report = await GetDailyActivityReportAsync(repId, currentDate, cancellationToken);
            reports.Add(report);
            currentDate = currentDate.AddDays(1);
        }

        return reports;
    }

    public async Task<IReadOnlyList<DailyActivityReportDto>> GetTeamDailyActivityAsync(
        string managerUserId,
        DateTime date,
        CancellationToken cancellationToken = default)
    {
        var teamRepIds = await _context.RepManagerAssignments
            .Where(a => a.ManagerUserId == managerUserId && a.IsActive)
            .Select(a => a.RepId)
            .ToListAsync(cancellationToken);

        var reports = new List<DailyActivityReportDto>();

        foreach (var repId in teamRepIds)
        {
            var report = await GetDailyActivityReportAsync(repId, date, cancellationToken);
            reports.Add(report);
        }

        return reports.OrderByDescending(r => r.CompletedVisits).ToList();
    }

    private TimeUtilizationDto CalculateTimeUtilization(List<ExecutedVisit> visits)
    {
        var customerFacing = TimeSpan.Zero;
        var travel = TimeSpan.Zero;

        foreach (var visit in visits.Where(v => v.CheckOutTime.HasValue))
        {
            customerFacing += visit.CheckOutTime!.Value - visit.CheckInTime;
        }

        // Estimate travel time between visits
        var orderedVisits = visits.OrderBy(v => v.CheckInTime).ToList();
        for (int i = 1; i < orderedVisits.Count; i++)
        {
            var gap = orderedVisits[i].CheckInTime - (orderedVisits[i - 1].CheckOutTime ?? orderedVisits[i - 1].CheckInTime);
            if (gap.TotalMinutes > 0 && gap.TotalMinutes < 120)
            {
                travel += gap;
            }
        }

        var total = customerFacing + travel;

        return new TimeUtilizationDto
        {
            CustomerFacingTime = customerFacing,
            TravelTime = travel,
            AdminTime = TimeSpan.Zero,
            TotalWorkTime = total
        };
    }
}
