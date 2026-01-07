using Application.DTOs.Visits;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class VisitService : IVisitService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<VisitService> _logger;

    public VisitService(ApplicationDbContext context, ILogger<VisitService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IReadOnlyList<PlannedVisitSummaryDto>> GetTodayPlannedAsync(string userId, CancellationToken cancellationToken = default)
    {
        var repId = await GetRepIdAsync(userId, cancellationToken);

        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var planned = await _context.PlannedVisits
            .AsNoTracking()
            .Include(pv => pv.Plan)
            .Include(pv => pv.Customer)
            .Include(pv => pv.ExecutedVisit)
            .Where(pv => pv.Plan != null && pv.Plan.RepId == repId)
            .Where(pv => pv.PlannedDate >= today && pv.PlannedDate < tomorrow)
            .Where(pv => pv.Plan != null && pv.Plan.Status != VisitPlanStatus.Rejected)
            .OrderBy(pv => pv.SequenceNumber)
            .ThenBy(pv => pv.PlannedTime ?? TimeSpan.Zero)
            .ToListAsync(cancellationToken);

        return planned.Select(pv => new PlannedVisitSummaryDto
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
        }).ToList();
    }

    public async Task<IReadOnlyList<ExecutedVisitSummaryDto>> GetTodayExecutedAsync(string userId, CancellationToken cancellationToken = default)
    {
        var repId = await GetRepIdAsync(userId, cancellationToken);
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var visits = await _context.ExecutedVisits
            .AsNoTracking()
            .Include(v => v.Customer)
            .Where(v => v.RepId == repId)
            .Where(v => v.CheckInTime >= today && v.CheckInTime < tomorrow)
            .OrderByDescending(v => v.CheckInTime)
            .ToListAsync(cancellationToken);

        return visits.Select(v => new ExecutedVisitSummaryDto
        {
            Id = v.Id,
            CustomerId = v.CustomerId,
            CustomerName = v.Customer?.CompanyName ?? ((v.Customer?.FirstName ?? "") + " " + (v.Customer?.LastName ?? "")).Trim(),
            PlannedVisitId = v.PlannedVisitId,
            VisitType = v.VisitType,
            CheckInTime = v.CheckInTime,
            CheckOutTime = v.CheckOutTime
        }).ToList();
    }

    public async Task<ExecutedVisitDto?> GetExecutedVisitAsync(string userId, int id, CancellationToken cancellationToken = default)
    {
        var repId = await GetRepIdAsync(userId, cancellationToken);

        var visit = await _context.ExecutedVisits
            .AsNoTracking()
            .Include(v => v.Customer)
            .FirstOrDefaultAsync(v => v.Id == id && v.RepId == repId, cancellationToken);

        return visit == null ? null : MapExecutedVisit(visit);
    }

    public async Task<ExecutedVisitDto> CheckInAsync(string userId, CheckInVisitDto dto, CancellationToken cancellationToken = default)
    {
        var repId = await GetRepIdAsync(userId, cancellationToken);

        int customerId;
        int? plannedVisitId = null;

        if (dto.PlannedVisitId.HasValue)
        {
            plannedVisitId = dto.PlannedVisitId.Value;

            var planned = await _context.PlannedVisits
                .Include(pv => pv.Plan)
                .Include(pv => pv.ExecutedVisit)
                .FirstOrDefaultAsync(pv => pv.Id == plannedVisitId.Value, cancellationToken);

            if (planned == null || planned.Plan.RepId != repId)
                throw new InvalidOperationException("Planned visit not found");

            if (planned.ExecutedVisit != null)
                throw new InvalidOperationException("This planned visit was already checked in");

            customerId = planned.CustomerId;
        }
        else if (dto.CustomerId.HasValue)
        {
            customerId = dto.CustomerId.Value;

            var assigned = await _context.RepCustomerAssignments
                .AsNoTracking()
                .AnyAsync(a => a.RepId == repId && a.CustomerId == customerId && a.IsActive && !a.IsDeleted, cancellationToken);

            if (!assigned)
                throw new InvalidOperationException("Customer is not assigned to this sales representative");
        }
        else
        {
            throw new InvalidOperationException("Either plannedVisitId or customerId is required");
        }

        var visit = new ExecutedVisit
        {
            RepId = repId,
            CustomerId = customerId,
            PlannedVisitId = plannedVisitId,
            VisitType = plannedVisitId.HasValue ? VisitType.Planned : VisitType.AdHoc,

            CheckInTime = DateTime.UtcNow,
            CheckInLatitude = dto.Latitude,
            CheckInLongitude = dto.Longitude,
            CheckInAddress = dto.Address,

            LocationVerified = false
        };

        _context.ExecutedVisits.Add(visit);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Checked in visit {VisitId} for Rep {RepId} Customer {CustomerId}", visit.Id, repId, customerId);

        await _context.Entry(visit).Reference(v => v.Customer).LoadAsync(cancellationToken);

        return MapExecutedVisit(visit);
    }

    public async Task<ExecutedVisitDto?> UpdateExecutedVisitAsync(string userId, int id, UpdateExecutedVisitDto dto, CancellationToken cancellationToken = default)
    {
        var repId = await GetRepIdAsync(userId, cancellationToken);

        var visit = await _context.ExecutedVisits
            .Include(v => v.Customer)
            .FirstOrDefaultAsync(v => v.Id == id && v.RepId == repId, cancellationToken);

        if (visit == null) return null;

        if (dto.Outcome.HasValue) visit.Outcome = dto.Outcome;
        if (dto.Summary != null) visit.Summary = dto.Summary;
        if (dto.ProductsDiscussed != null) visit.ProductsDiscussed = dto.ProductsDiscussed;

        if (dto.FollowUpRequired.HasValue) visit.FollowUpRequired = dto.FollowUpRequired.Value;
        if (dto.FollowUpDate.HasValue) visit.FollowUpDate = dto.FollowUpDate;

        await _context.SaveChangesAsync(cancellationToken);

        return MapExecutedVisit(visit);
    }

    public async Task<ExecutedVisitDto?> CheckOutAsync(string userId, int id, CheckOutVisitDto dto, CancellationToken cancellationToken = default)
    {
        var repId = await GetRepIdAsync(userId, cancellationToken);

        var visit = await _context.ExecutedVisits
            .Include(v => v.Customer)
            .FirstOrDefaultAsync(v => v.Id == id && v.RepId == repId, cancellationToken);

        if (visit == null) return null;

        if (visit.CheckOutTime.HasValue)
            return MapExecutedVisit(visit);

        visit.CheckOutTime = DateTime.UtcNow;
        visit.CheckOutLatitude = dto.Latitude;
        visit.CheckOutLongitude = dto.Longitude;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Checked out visit {VisitId} for Rep {RepId}", visit.Id, repId);

        return MapExecutedVisit(visit);
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
