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

        // Calculate distance from customer location if GPS is available
        if (dto.Latitude.HasValue && dto.Longitude.HasValue)
        {
            var customerAddress = await _context.CustomerAddresses
                .Where(a => a.CustomerId == customerId && a.IsDefault && a.IsActive)
                .FirstOrDefaultAsync(cancellationToken);

            if (customerAddress?.Latitude != null && customerAddress.Longitude != null)
            {
                var distance = CalculateDistanceMeters(
                    (double)dto.Latitude.Value, (double)dto.Longitude.Value,
                    (double)customerAddress.Latitude.Value, (double)customerAddress.Longitude.Value);

                visit.DistanceFromCustomerMeters = (int)distance;
                
                // Thresholds: <100m = verified, 100-500m = warning, >500m = alert
                visit.LocationVerified = distance < 100;
            }
        }

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
        
        // Update visit notes
        if (dto.GeneralComment != null) visit.GeneralComment = dto.GeneralComment;
        if (dto.AgreedDeals != null) visit.AgreedDeals = dto.AgreedDeals;
        if (dto.CompetitionNotes != null) visit.CompetitionNotes = dto.CompetitionNotes;

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
            DistanceFromCustomerMeters = visit.DistanceFromCustomerMeters,
            LocationVerified = visit.LocationVerified,
            Outcome = visit.Outcome,
            Summary = visit.Summary,
            ProductsDiscussed = visit.ProductsDiscussed,
            GeneralComment = visit.GeneralComment,
            AgreedDeals = visit.AgreedDeals,
            CompetitionNotes = visit.CompetitionNotes
        };
    }

    /// <summary>
    /// Calculate distance between two GPS coordinates using Haversine formula
    /// </summary>
    private static double CalculateDistanceMeters(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371000; // Earth's radius in meters

        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return R * c;
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180;

    public async Task<VisitHistoryResultDto> GetVisitHistoryAsync(string userId, VisitHistoryFilterDto filter, CancellationToken cancellationToken = default)
    {
        var repId = await GetRepIdAsync(userId, cancellationToken);

        var query = _context.ExecutedVisits
            .Include(v => v.Customer)
                .ThenInclude(c => c!.Addresses)
            .Where(v => v.RepId == repId)
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

        if (filter.CustomerId.HasValue)
        {
            query = query.Where(v => v.CustomerId == filter.CustomerId.Value);
        }

        if (filter.Outcome.HasValue)
        {
            query = query.Where(v => v.Outcome == filter.Outcome.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim().ToLower();
            query = query.Where(v =>
                (v.Summary != null && v.Summary.ToLower().Contains(term)) ||
                (v.ProductsDiscussed != null && v.ProductsDiscussed.ToLower().Contains(term)) ||
                (v.Customer != null && v.Customer.CompanyName != null && v.Customer.CompanyName.ToLower().Contains(term))
            );
        }

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination and ordering
        var items = await query
            .OrderByDescending(v => v.CheckInTime)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(v => new VisitHistoryItemDto
            {
                Id = v.Id,
                CustomerId = v.CustomerId,
                CustomerName = v.Customer != null
                    ? (v.Customer.CompanyName ?? ((v.Customer.FirstName ?? "") + " " + (v.Customer.LastName ?? "")).Trim())
                    : "",
                CustomerCity = v.Customer != null && v.Customer.Addresses.Any()
                    ? v.Customer.Addresses.OrderByDescending(a => a.IsDefault).First().City
                    : null,
                VisitType = v.VisitType,
                CheckInTime = v.CheckInTime,
                CheckOutTime = v.CheckOutTime,
                DurationMinutes = v.CheckOutTime.HasValue
                    ? (int?)(v.CheckOutTime.Value - v.CheckInTime).TotalMinutes
                    : null,
                LocationVerified = v.LocationVerified,
                DistanceFromCustomerMeters = v.DistanceFromCustomerMeters,
                Outcome = v.Outcome,
                Summary = v.Summary
            })
            .ToListAsync(cancellationToken);

        return new VisitHistoryResultDto
        {
            Items = items,
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize
        };
    }
}
