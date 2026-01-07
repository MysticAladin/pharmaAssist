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
        var managerRepId = await GetRepIdAsync(managerUserId, cancellationToken);
        var teamRepIds = await GetTeamRepIdsAsync(managerRepId, cancellationToken);

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
        var managerRepId = await GetRepIdAsync(managerUserId, cancellationToken);
        var teamRepIds = await GetTeamRepIdsAsync(managerRepId, cancellationToken);

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
        var managerRepId = await GetRepIdAsync(managerUserId, cancellationToken);
        var teamRepIds = await GetTeamRepIdsAsync(managerRepId, cancellationToken);

        var visit = await _context.ExecutedVisits
            .AsNoTracking()
            .Include(v => v.Customer)
            .FirstOrDefaultAsync(v => v.Id == executedVisitId && teamRepIds.Contains(v.RepId), cancellationToken);

        return visit == null ? null : MapExecutedVisit(visit);
    }

    private async Task<int> GetRepIdAsync(string userId, CancellationToken cancellationToken)
    {
        var repId = await _context.SalesRepresentatives
            .AsNoTracking()
            .Where(r => r.UserId == userId && !r.IsDeleted)
            .Select(r => (int?)r.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (!repId.HasValue)
            throw new InvalidOperationException("Sales representative not found for this user");

        return repId.Value;
    }

    private async Task<List<int>> GetTeamRepIdsAsync(int managerRepId, CancellationToken cancellationToken)
    {
        return await _context.RepManagerAssignments
            .AsNoTracking()
            .Where(a => a.ManagerId == managerRepId && a.IsActive && !a.IsDeleted)
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
            Outcome = visit.Outcome,
            Summary = visit.Summary,
            ProductsDiscussed = visit.ProductsDiscussed
        };
    }
}
