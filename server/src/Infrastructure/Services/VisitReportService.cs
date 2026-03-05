using Application.DTOs.Visits;
using Application.DTOs.Visits.Reports;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class VisitReportService : IVisitReportService
{
    private readonly ApplicationDbContext _context;

    public VisitReportService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<TeamVisitPlanSummaryDto>> GetTeamPlansForWeekAsync(
        string managerUserId,
        DateTime weekStartUtc,
        CancellationToken cancellationToken = default)
    {
        var teamRepIds = await GetTeamRepIdsByManagerUserIdAsync(managerUserId, cancellationToken);

        if (teamRepIds.Count == 0)
            return Array.Empty<TeamVisitPlanSummaryDto>();

        var weekStart = weekStartUtc.Date;
        var weekEnd = weekStart.AddDays(7);

        var plans = await _context.VisitPlans
            .AsNoTracking()
            .Include(p => p.Rep)
                .ThenInclude(r => r!.User)
            .Include(p => p.PlannedVisits)
                .ThenInclude(pv => pv.ExecutedVisit)
            .Where(p => teamRepIds.Contains(p.RepId))
            .Where(p => p.PlanWeek >= weekStart && p.PlanWeek < weekEnd)
            .OrderBy(p => p.RepId)
            .ToListAsync(cancellationToken);

        return plans.Select(p => new TeamVisitPlanSummaryDto
        {
            PlanId = p.Id,
            RepId = p.RepId,
            RepName = p.Rep?.User?.FullName ?? "",
            PlanWeek = p.PlanWeek,
            Status = p.Status,
            PlannedCount = p.PlannedVisits.Count,
            ExecutedCount = p.PlannedVisits.Count(v => v.ExecutedVisit != null)
        }).ToList();
    }

    public async Task<VisitPlanReportDto?> GetTeamPlanAsync(
        string managerUserId,
        int planId,
        CancellationToken cancellationToken = default)
    {
        var teamRepIds = await GetTeamRepIdsByManagerUserIdAsync(managerUserId, cancellationToken);

        var plan = await _context.VisitPlans
            .AsNoTracking()
            .Include(p => p.Rep)
                .ThenInclude(r => r!.User)
            .Include(p => p.PlannedVisits)
                .ThenInclude(pv => pv.Customer)
            .Include(p => p.PlannedVisits)
                .ThenInclude(pv => pv.ExecutedVisit)
            .FirstOrDefaultAsync(p => p.Id == planId && teamRepIds.Contains(p.RepId), cancellationToken);

        if (plan == null)
            return null;

        var planned = plan.PlannedVisits
            .OrderBy(pv => pv.PlannedDate)
            .ThenBy(pv => pv.SequenceNumber)
            .Select(MapPlannedVisitSummary)
            .ToList();

        return new VisitPlanReportDto
        {
            PlanId = plan.Id,
            RepId = plan.RepId,
            RepName = plan.Rep?.User?.FullName ?? "",
            PlanWeek = plan.PlanWeek,
            Status = plan.Status,
            PlannedVisits = planned
        };
    }

    public async Task<ExecutedVisitDto?> GetTeamExecutedVisitAsync(
        string managerUserId,
        int executedVisitId,
        CancellationToken cancellationToken = default)
    {
        var teamRepIds = await GetTeamRepIdsByManagerUserIdAsync(managerUserId, cancellationToken);

        var visit = await _context.ExecutedVisits
            .AsNoTracking()
            .Include(v => v.Customer)
            .FirstOrDefaultAsync(v => v.Id == executedVisitId && teamRepIds.Contains(v.RepId), cancellationToken);

        return visit == null ? null : MapExecutedVisit(visit);
    }

    private async Task<List<int>> GetTeamRepIdsByManagerUserIdAsync(string managerUserId, CancellationToken cancellationToken)
    {
        return await _context.RepManagerAssignments
            .AsNoTracking()
            .Where(a => a.ManagerUserId == managerUserId && a.IsActive && !a.IsDeleted)
            .Select(a => a.RepId)
            .Distinct()
            .ToListAsync(cancellationToken);
    }

    private static PlannedVisitSummaryDto MapPlannedVisitSummary(PlannedVisit pv)
    {
        return new PlannedVisitSummaryDto
        {
            PlannedVisitId = pv.Id,
            PlanId = pv.PlanId,
            PlannedDate = pv.PlannedDate,
            PlannedTime = pv.PlannedTime,
            CustomerId = pv.CustomerId,
            CustomerName = pv.Customer?.CompanyName ?? ((pv.Customer?.FirstName ?? "") + " " + (pv.Customer?.LastName ?? "")).Trim(),
            Objective = pv.VisitObjective,
            SequenceNumber = pv.SequenceNumber,
            HasExecutedVisit = pv.ExecutedVisit != null,
            ExecutedVisitId = pv.ExecutedVisit?.Id
        };
    }

    private static ExecutedVisitDto MapExecutedVisit(ExecutedVisit visit)
    {
        return new ExecutedVisitDto
        {
            Id = visit.Id,
            RepId = visit.RepId,
            CustomerId = visit.CustomerId,
            CustomerName = visit.Customer?.CompanyName ?? ((visit.Customer?.FirstName ?? "") + " " + (visit.Customer?.LastName ?? "")).Trim(),
            PlannedVisitId = visit.PlannedVisitId,
            VisitType = visit.VisitType,
            CheckInTime = visit.CheckInTime,
            CheckInLatitude = visit.CheckInLatitude,
            CheckInLongitude = visit.CheckInLongitude,
            CheckInAddress = visit.CheckInAddress,
            CheckOutTime = visit.CheckOutTime,
            CheckOutLatitude = visit.CheckOutLatitude,
            CheckOutLongitude = visit.CheckOutLongitude,
            LocationVerified = visit.LocationVerified,
            DistanceFromCustomerMeters = visit.DistanceFromCustomerMeters,
            Outcome = visit.Outcome,
            Summary = visit.Summary,
            ProductsDiscussed = visit.ProductsDiscussed,
            GeneralComment = visit.GeneralComment,
            AgreedDeals = visit.AgreedDeals,
            CompetitionNotes = visit.CompetitionNotes
        };
    }

    public async Task<TeamActivityDashboardDto> GetTeamActivityAsync(
        string managerUserId,
        DateTime? date,
        CancellationToken cancellationToken = default)
    {
        var targetDate = date?.Date ?? DateTime.UtcNow.Date;
        var nextDate = targetDate.AddDays(1);

        var teamRepIds = await GetTeamRepIdsByManagerUserIdAsync(managerUserId, cancellationToken);

        if (teamRepIds.Count == 0)
        {
            return new TeamActivityDashboardDto { Date = targetDate };
        }

        // Get team reps with today's visits
        var reps = await _context.SalesRepresentatives
            .AsNoTracking()
            .Include(r => r.User)
            .Where(r => teamRepIds.Contains(r.Id) && !r.IsDeleted)
            .ToListAsync(cancellationToken);

        // Get today's planned visits for team
        var todayPlanned = await _context.PlannedVisits
            .AsNoTracking()
            .Where(pv => teamRepIds.Contains(pv.Plan!.RepId))
            .Where(pv => pv.PlannedDate >= targetDate && pv.PlannedDate < nextDate)
            .GroupBy(pv => pv.Plan!.RepId)
            .Select(g => new { RepId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        // Get today's executed visits for team
        var todayVisits = await _context.ExecutedVisits
            .AsNoTracking()
            .Include(v => v.Customer)
                .ThenInclude(c => c!.Addresses)
            .Where(v => teamRepIds.Contains(v.RepId))
            .Where(v => v.CheckInTime >= targetDate && v.CheckInTime < nextDate)
            .ToListAsync(cancellationToken);

        var visitsByRep = todayVisits.GroupBy(v => v.RepId).ToDictionary(g => g.Key, g => g.ToList());
        var plannedByRep = todayPlanned.ToDictionary(x => x.RepId, x => x.Count);

        var repActivities = reps.Select(rep =>
        {
            var repVisits = visitsByRep.GetValueOrDefault(rep.Id, new List<ExecutedVisit>());
            var plannedCount = plannedByRep.GetValueOrDefault(rep.Id, 0);
            var executedCount = repVisits.Count;
            var completedCount = repVisits.Count(v => v.CheckOutTime.HasValue);
            var verifiedCount = repVisits.Count(v => v.LocationVerified);
            var alertCount = repVisits.Count(v => !v.LocationVerified && v.DistanceFromCustomerMeters > 500);
            var currentVisit = repVisits.FirstOrDefault(v => !v.CheckOutTime.HasValue);

            return new RepActivitySummaryDto
            {
                RepId = rep.Id,
                RepName = rep.User?.FullName ?? "",
                RepType = rep.RepType,
                PlannedVisitsCount = plannedCount,
                ExecutedVisitsCount = executedCount,
                CompletedVisitsCount = completedCount,
                LocationVerifiedCount = verifiedCount,
                LocationAlertCount = alertCount,
                CurrentVisit = currentVisit != null ? MapVisitActivity(currentVisit) : null,
                TodayVisits = repVisits.OrderByDescending(v => v.CheckInTime).Select(MapVisitActivity).ToList()
            };
        }).ToList();

        var totals = new TeamActivityTotalsDto
        {
            TotalReps = reps.Count,
            ActiveReps = repActivities.Count(r => r.CurrentVisit != null),
            TotalPlannedVisits = repActivities.Sum(r => r.PlannedVisitsCount),
            TotalExecutedVisits = repActivities.Sum(r => r.ExecutedVisitsCount),
            TotalCompletedVisits = repActivities.Sum(r => r.CompletedVisitsCount),
            LocationVerifiedCount = repActivities.Sum(r => r.LocationVerifiedCount),
            LocationAlertCount = repActivities.Sum(r => r.LocationAlertCount)
        };

        return new TeamActivityDashboardDto
        {
            Date = targetDate,
            RepActivities = repActivities,
            Totals = totals
        };
    }

    private static VisitActivityDto MapVisitActivity(ExecutedVisit visit)
    {
        var city = visit.Customer?.Addresses?.OrderByDescending(a => a.IsDefault).FirstOrDefault()?.City;

        return new VisitActivityDto
        {
            VisitId = visit.Id,
            CustomerId = visit.CustomerId,
            CustomerName = visit.Customer?.CompanyName ?? ((visit.Customer?.FirstName ?? "") + " " + (visit.Customer?.LastName ?? "")).Trim(),
            CustomerCity = city,
            CheckInTime = visit.CheckInTime,
            CheckOutTime = visit.CheckOutTime,
            Latitude = visit.CheckInLatitude,
            Longitude = visit.CheckInLongitude,
            LocationVerified = visit.LocationVerified,
            DistanceFromCustomerMeters = visit.DistanceFromCustomerMeters,
            Outcome = visit.Outcome
        };
    }

    public async Task<VisitAuditResultDto> GetVisitAuditAsync(
        string managerUserId,
        VisitAuditFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        var teamRepIds = await GetTeamRepIdsByManagerUserIdAsync(managerUserId, cancellationToken);

        if (teamRepIds.Count == 0)
        {
            return new VisitAuditResultDto { Page = filter.Page, PageSize = filter.PageSize };
        }

        var query = _context.ExecutedVisits
            .AsNoTracking()
            .Include(v => v.Rep)
                .ThenInclude(r => r!.User)
            .Include(v => v.Customer)
                .ThenInclude(c => c!.Addresses)
            .Where(v => teamRepIds.Contains(v.RepId))
            .AsQueryable();

        // Apply filters
        if (filter.FromDate.HasValue)
        {
            var fromDate = filter.FromDate.Value.Date;
            query = query.Where(v => v.CheckInTime >= fromDate);
        }

        if (filter.ToDate.HasValue)
        {
            var toDate = filter.ToDate.Value.Date.AddDays(1);
            query = query.Where(v => v.CheckInTime < toDate);
        }

        if (filter.RepId.HasValue)
        {
            query = query.Where(v => v.RepId == filter.RepId.Value);
        }

        if (filter.LocationVerified.HasValue)
        {
            query = query.Where(v => v.LocationVerified == filter.LocationVerified.Value);
        }

        if (filter.HasLocationAlert == true)
        {
            query = query.Where(v => !v.LocationVerified && v.DistanceFromCustomerMeters > 500);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var visits = await query
            .OrderByDescending(v => v.CheckInTime)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(cancellationToken);

        var items = visits.Select(v =>
        {
            var address = v.Customer?.Addresses?.OrderByDescending(a => a.IsDefault).FirstOrDefault();

            return new VisitAuditItemDto
            {
                VisitId = v.Id,
                RepId = v.RepId,
                RepName = v.Rep?.User?.FullName ?? "",
                CustomerId = v.CustomerId,
                CustomerName = v.Customer?.CompanyName ?? ((v.Customer?.FirstName ?? "") + " " + (v.Customer?.LastName ?? "")).Trim(),
                CustomerCity = address?.City,
                CheckInTime = v.CheckInTime,
                CheckOutTime = v.CheckOutTime,
                CheckInLatitude = v.CheckInLatitude,
                CheckInLongitude = v.CheckInLongitude,
                CustomerLatitude = address?.Latitude,
                CustomerLongitude = address?.Longitude,
                LocationVerified = v.LocationVerified,
                DistanceFromCustomerMeters = v.DistanceFromCustomerMeters,
                Outcome = v.Outcome
            };
        }).ToList();

        return new VisitAuditResultDto
        {
            Items = items,
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize
        };
    }

    public async Task<CustomerVisitHistoryDto> GetCustomerVisitsAcrossRepsAsync(
        int customerId, int page = 1, int pageSize = 10,
        DateTime? from = null, DateTime? to = null,
        CancellationToken ct = default)
    {
        var customer = await _context.Customers.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == customerId, ct);

        if (customer == null)
            throw new InvalidOperationException("Customer not found");

        var query = _context.ExecutedVisits.AsNoTracking()
            .Where(v => v.CustomerId == customerId);

        if (from.HasValue)
            query = query.Where(v => v.CheckInTime >= from.Value);
        if (to.HasValue)
            query = query.Where(v => v.CheckInTime <= to.Value);

        var totalCount = await query.CountAsync(ct);

        var visits = await query
            .Include(v => v.Rep!).ThenInclude(r => r.User)
            .OrderByDescending(v => v.CheckInTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new CustomerVisitHistoryDto
        {
            CustomerId = customerId,
            CustomerName = customer.CompanyName ?? (customer.FirstName + " " + customer.LastName),
            CustomerType = customer.CustomerType.ToString(),
            TotalVisits = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
            CurrentPage = page,
            PageSize = pageSize,
            Visits = visits.Select(v => new CrossRepVisitDto
            {
                Id = v.Id,
                RepId = v.RepId,
                RepName = v.Rep?.User?.FirstName + " " + v.Rep?.User?.LastName,
                CheckInTime = v.CheckInTime,
                CheckOutTime = v.CheckOutTime,
                ActualDurationMinutes = v.ActualDurationMinutes,
                LocationVerified = v.LocationVerified,
                VisitType = v.VisitType.ToString(),
                Outcome = v.Outcome?.ToString(),
                Summary = v.Summary,
                ProductsDiscussed = v.ProductsDiscussed,
                CompetitionNotes = v.CompetitionNotes,
                AgreedDeals = v.AgreedDeals,
                FollowUpRequired = v.FollowUpRequired,
                NextVisitDate = v.NextVisitDate
            }).ToList()
        };
    }
}
