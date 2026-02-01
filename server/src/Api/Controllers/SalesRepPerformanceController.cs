using Application.DTOs.Reports;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

/// <summary>
/// Sales Representative Performance Reporting API
/// </summary>
[ApiController]
[Route("api/reports/sales-rep-performance")]
[Authorize(Roles = "Admin,Manager,SuperAdmin")]
[Produces("application/json")]
public class SalesRepPerformanceController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<SalesRepPerformanceController> _logger;

    public SalesRepPerformanceController(ApplicationDbContext context, ILogger<SalesRepPerformanceController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get sales rep performance report with filters
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(SalesRepPerformanceReportDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SalesRepPerformanceReportDto>> GetPerformanceReport(
        [FromQuery] SalesRepPerformanceFilterDto filter,
        CancellationToken cancellationToken)
    {
        try
        {
            // Default date range: current month
            var fromDate = filter.FromDate?.Date ?? new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            var toDate = filter.ToDate?.Date.AddDays(1) ?? DateTime.UtcNow.Date.AddDays(1);

            // Get all reps (optionally filtered)
            var repsQuery = _context.SalesRepresentatives
                .AsNoTracking()
                .Include(r => r.User)
                .Where(r => !r.IsDeleted);

            if (!filter.IncludeInactive)
                repsQuery = repsQuery.Where(r => r.Status == RepresentativeStatus.Active);

            if (filter.RepId.HasValue)
                repsQuery = repsQuery.Where(r => r.Id == filter.RepId.Value);

            if (filter.RepType.HasValue)
                repsQuery = repsQuery.Where(r => (int)r.RepType == filter.RepType.Value);

            var reps = await repsQuery.ToListAsync(cancellationToken);

            var repIds = reps.Select(r => r.Id).ToList();

            // Get orders for the period
            var orders = await _context.Orders
                .AsNoTracking()
                .Where(o => o.RepId.HasValue && repIds.Contains(o.RepId.Value))
                .Where(o => o.OrderDate >= fromDate && o.OrderDate < toDate)
                .GroupBy(o => o.RepId!.Value)
                .Select(g => new
                {
                    RepId = g.Key,
                    OrderCount = g.Count(),
                    Revenue = g.Sum(o => o.TotalAmount)
                })
                .ToListAsync(cancellationToken);

            // Get executed visits for the period
            var executedVisits = await _context.ExecutedVisits
                .AsNoTracking()
                .Where(v => repIds.Contains(v.RepId))
                .Where(v => v.CheckInTime >= fromDate && v.CheckInTime < toDate)
                .GroupBy(v => v.RepId)
                .Select(g => new
                {
                    RepId = g.Key,
                    ExecutedCount = g.Count(),
                    LocationVerifiedCount = g.Count(v => v.LocationVerified),
                    CustomersVisited = g.Select(v => v.CustomerId).Distinct().Count()
                })
                .ToListAsync(cancellationToken);

            // Get planned visits for the period
            var plannedVisits = await _context.PlannedVisits
                .AsNoTracking()
                .Include(pv => pv.Plan)
                .Where(pv => repIds.Contains(pv.Plan!.RepId))
                .Where(pv => pv.PlannedDate >= fromDate && pv.PlannedDate < toDate)
                .GroupBy(pv => pv.Plan!.RepId)
                .Select(g => new
                {
                    RepId = g.Key,
                    PlannedCount = g.Count()
                })
                .ToListAsync(cancellationToken);

            // Get customer assignments
            var customerAssignments = await _context.RepCustomerAssignments
                .AsNoTracking()
                .Where(ca => repIds.Contains(ca.RepId) && ca.IsActive)
                .GroupBy(ca => ca.RepId)
                .Select(g => new
                {
                    RepId = g.Key,
                    AssignedCount = g.Count()
                })
                .ToListAsync(cancellationToken);

            // Get targets for the period
            var year = fromDate.Year;
            var month = fromDate.Month;
            var targets = await _context.SalesTargets
                .AsNoTracking()
                .Where(t => t.UserId != null && t.IsActive)
                .Where(t => t.Year == year && (t.Month == null || t.Month == month))
                .ToListAsync(cancellationToken);

            // Build the report
            var repPerformances = reps.Select(rep =>
            {
                var orderData = orders.FirstOrDefault(o => o.RepId == rep.Id);
                var visitData = executedVisits.FirstOrDefault(v => v.RepId == rep.Id);
                var plannedData = plannedVisits.FirstOrDefault(p => p.RepId == rep.Id);
                var assignmentData = customerAssignments.FirstOrDefault(a => a.RepId == rep.Id);
                var repTargets = targets.Where(t => t.UserId == rep.UserId).ToList();

                return new SalesRepPerformanceItemDto
                {
                    RepId = rep.Id,
                    RepName = $"{rep.User?.FirstName} {rep.User?.LastName}".Trim(),
                    RepCode = rep.EmployeeCode,
                    RepType = (int)rep.RepType,
                    IsActive = rep.Status == RepresentativeStatus.Active,
                    
                    OrderCount = orderData?.OrderCount ?? 0,
                    OrderRevenue = orderData?.Revenue ?? 0,
                    
                    VisitsPlanned = plannedData?.PlannedCount ?? 0,
                    VisitsExecuted = visitData?.ExecutedCount ?? 0,
                    VisitsWithLocationVerified = visitData?.LocationVerifiedCount ?? 0,
                    
                    AssignedCustomers = assignmentData?.AssignedCount ?? 0,
                    CustomersVisited = visitData?.CustomersVisited ?? 0,
                    
                    TargetsAssigned = repTargets.Count,
                    TargetsAchieved = repTargets.Count(t => t.IsAchieved)
                };
            })
            .OrderByDescending(r => r.PerformanceScore)
            .ToList();

            var report = new SalesRepPerformanceReportDto
            {
                FromDate = fromDate,
                ToDate = toDate.AddDays(-1),
                TotalReps = repPerformances.Count,
                TotalOrders = repPerformances.Sum(r => r.OrderCount),
                TotalRevenue = repPerformances.Sum(r => r.OrderRevenue),
                TotalVisits = repPerformances.Sum(r => r.VisitsExecuted),
                TotalCustomersVisited = repPerformances.Sum(r => r.CustomersVisited),
                Reps = repPerformances
            };

            return Ok(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating sales rep performance report");
            return StatusCode(500, new { message = "Error generating report" });
        }
    }

    /// <summary>
    /// Get list of sales reps for filter dropdown
    /// </summary>
    [HttpGet("reps")]
    [ProducesResponseType(typeof(IEnumerable<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRepsForFilter(CancellationToken cancellationToken)
    {
        var reps = await _context.SalesRepresentatives
            .AsNoTracking()
            .Include(r => r.User)
            .Where(r => !r.IsDeleted)
            .OrderBy(r => r.User!.FirstName)
            .Select(r => new
            {
                r.Id,
                Name = (r.User!.FirstName + " " + r.User.LastName).Trim(),
                RepCode = r.EmployeeCode,
                RepType = (int)r.RepType,
                IsActive = r.Status == RepresentativeStatus.Active
            })
            .ToListAsync(cancellationToken);

        return Ok(reps);
    }
}
