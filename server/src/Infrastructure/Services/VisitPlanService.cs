using Application.DTOs.Visits;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

/// <summary>
/// Service for managing sales rep weekly visit plans
/// </summary>
public class VisitPlanService : IVisitPlanService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<VisitPlanService> _logger;

    public VisitPlanService(ApplicationDbContext context, ILogger<VisitPlanService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IReadOnlyList<VisitPlanSummaryDto>> GetPlansAsync(string userId, DateTime? fromWeek = null, CancellationToken cancellationToken = default)
    {
        var rep = await GetSalesRepAsync(userId, cancellationToken);
        if (rep == null) return new List<VisitPlanSummaryDto>();

        var query = _context.VisitPlans
            .Where(p => p.RepId == rep.Id);

        if (fromWeek.HasValue)
        {
            query = query.Where(p => p.PlanWeek >= fromWeek.Value.Date);
        }

        var plans = await query
            .OrderByDescending(p => p.PlanWeek)
            .Select(p => new VisitPlanSummaryDto
            {
                Id = p.Id,
                PlanWeek = p.PlanWeek,
                Status = p.Status,
                PlannedVisitsCount = p.PlannedVisits.Count,
                ExecutedVisitsCount = p.PlannedVisits.Count(pv => pv.ExecutedVisit != null),
                SubmittedAt = p.SubmittedAt,
                ApprovedAt = p.ApprovedAt,
                RejectionReason = p.RejectionReason
            })
            .ToListAsync(cancellationToken);

        return plans;
    }

    public async Task<VisitPlanDetailDto?> GetPlanAsync(string userId, int planId, CancellationToken cancellationToken = default)
    {
        var rep = await GetSalesRepAsync(userId, cancellationToken);
        if (rep == null) return null;

        var plan = await _context.VisitPlans
            .Include(p => p.PlannedVisits)
                .ThenInclude(pv => pv.Customer)
                    .ThenInclude(c => c!.Addresses)
            .Include(p => p.PlannedVisits)
                .ThenInclude(pv => pv.ExecutedVisit)
            .FirstOrDefaultAsync(p => p.Id == planId && p.RepId == rep.Id, cancellationToken);

        if (plan == null) return null;

        return MapToDetailDto(plan);
    }

    public async Task<VisitPlanDetailDto> GetOrCreateWeekPlanAsync(string userId, DateTime weekStart, CancellationToken cancellationToken = default)
    {
        var rep = await GetSalesRepAsync(userId, cancellationToken);
        if (rep == null)
        {
            throw new InvalidOperationException("Sales representative profile not found");
        }

        // Normalize to Monday of the week
        var monday = GetMondayOfWeek(weekStart);

        var plan = await _context.VisitPlans
            .Include(p => p.PlannedVisits)
                .ThenInclude(pv => pv.Customer)
                    .ThenInclude(c => c!.Addresses)
            .Include(p => p.PlannedVisits)
                .ThenInclude(pv => pv.ExecutedVisit)
            .FirstOrDefaultAsync(p => p.RepId == rep.Id && p.PlanWeek == monday, cancellationToken);

        if (plan == null)
        {
            plan = new VisitPlan
            {
                RepId = rep.Id,
                PlanWeek = monday,
                Status = VisitPlanStatus.Draft,
                CreatedAt = DateTime.UtcNow
            };

            _context.VisitPlans.Add(plan);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Created new visit plan for rep {RepId} for week {Week}", rep.Id, monday);
        }

        return MapToDetailDto(plan);
    }

    public async Task<PlannedVisitDto> AddPlannedVisitAsync(string userId, int planId, CreatePlannedVisitDto dto, CancellationToken cancellationToken = default)
    {
        var rep = await GetSalesRepAsync(userId, cancellationToken);
        if (rep == null)
        {
            throw new InvalidOperationException("Sales representative profile not found");
        }

        var plan = await _context.VisitPlans
            .FirstOrDefaultAsync(p => p.Id == planId && p.RepId == rep.Id, cancellationToken);

        if (plan == null)
        {
            throw new InvalidOperationException("Visit plan not found");
        }

        if (plan.Status != VisitPlanStatus.Draft && plan.Status != VisitPlanStatus.Rejected)
        {
            throw new InvalidOperationException("Cannot modify a plan that is not in Draft or Rejected status");
        }

        // Verify customer exists and is assigned to this rep
        var customer = await _context.Customers
            .Include(c => c.Addresses)
            .FirstOrDefaultAsync(c => c.Id == dto.CustomerId, cancellationToken);
        if (customer == null)
        {
            throw new InvalidOperationException("Customer not found");
        }

        var plannedVisit = new PlannedVisit
        {
            PlanId = planId,
            CustomerId = dto.CustomerId,
            PlannedDate = dto.PlannedDate.Date,
            PlannedTime = ParseTime(dto.PlannedTime),
            EstimatedDurationMinutes = dto.EstimatedDurationMinutes,
            VisitObjective = dto.VisitObjective,
            ProductsToPresent = dto.ProductsToPresent,
            Notes = dto.Notes,
            SequenceNumber = dto.SequenceNumber,
            CreatedAt = DateTime.UtcNow
        };

        _context.PlannedVisits.Add(plannedVisit);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Added planned visit {VisitId} to plan {PlanId}", plannedVisit.Id, planId);

        return MapToPlannedVisitDto(plannedVisit, customer);
    }

    public async Task<PlannedVisitDto?> UpdatePlannedVisitAsync(string userId, int planId, int visitId, UpdatePlannedVisitDto dto, CancellationToken cancellationToken = default)
    {
        var rep = await GetSalesRepAsync(userId, cancellationToken);
        if (rep == null) return null;

        var plan = await _context.VisitPlans
            .FirstOrDefaultAsync(p => p.Id == planId && p.RepId == rep.Id, cancellationToken);

        if (plan == null) return null;

        if (plan.Status != VisitPlanStatus.Draft && plan.Status != VisitPlanStatus.Rejected)
        {
            throw new InvalidOperationException("Cannot modify a plan that is not in Draft or Rejected status");
        }

        var visit = await _context.PlannedVisits
            .Include(pv => pv.Customer)
                .ThenInclude(c => c!.Addresses)
            .FirstOrDefaultAsync(pv => pv.Id == visitId && pv.PlanId == planId, cancellationToken);

        if (visit == null) return null;

        if (dto.PlannedDate.HasValue)
            visit.PlannedDate = dto.PlannedDate.Value.Date;
        if (dto.PlannedTime != null)
            visit.PlannedTime = ParseTime(dto.PlannedTime);
        if (dto.EstimatedDurationMinutes.HasValue)
            visit.EstimatedDurationMinutes = dto.EstimatedDurationMinutes.Value;
        if (dto.VisitObjective != null)
            visit.VisitObjective = dto.VisitObjective;
        if (dto.ProductsToPresent != null)
            visit.ProductsToPresent = dto.ProductsToPresent;
        if (dto.Notes != null)
            visit.Notes = dto.Notes;
        if (dto.SequenceNumber.HasValue)
            visit.SequenceNumber = dto.SequenceNumber.Value;

        visit.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return MapToPlannedVisitDto(visit, visit.Customer!);
    }

    public async Task<bool> DeletePlannedVisitAsync(string userId, int planId, int visitId, CancellationToken cancellationToken = default)
    {
        var rep = await GetSalesRepAsync(userId, cancellationToken);
        if (rep == null) return false;

        var plan = await _context.VisitPlans
            .FirstOrDefaultAsync(p => p.Id == planId && p.RepId == rep.Id, cancellationToken);

        if (plan == null) return false;

        if (plan.Status != VisitPlanStatus.Draft && plan.Status != VisitPlanStatus.Rejected)
        {
            throw new InvalidOperationException("Cannot modify a plan that is not in Draft or Rejected status");
        }

        var visit = await _context.PlannedVisits
            .FirstOrDefaultAsync(pv => pv.Id == visitId && pv.PlanId == planId, cancellationToken);

        if (visit == null) return false;

        _context.PlannedVisits.Remove(visit);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Deleted planned visit {VisitId} from plan {PlanId}", visitId, planId);

        return true;
    }

    public async Task<VisitPlanDetailDto?> SubmitForApprovalAsync(string userId, int planId, CancellationToken cancellationToken = default)
    {
        var rep = await GetSalesRepAsync(userId, cancellationToken);
        if (rep == null) return null;

        var plan = await _context.VisitPlans
            .Include(p => p.PlannedVisits)
                .ThenInclude(pv => pv.Customer)
                    .ThenInclude(c => c!.Addresses)
            .FirstOrDefaultAsync(p => p.Id == planId && p.RepId == rep.Id, cancellationToken);

        if (plan == null) return null;

        if (plan.Status != VisitPlanStatus.Draft && plan.Status != VisitPlanStatus.Rejected)
        {
            throw new InvalidOperationException("Only Draft or Rejected plans can be submitted for approval");
        }

        if (!plan.PlannedVisits.Any())
        {
            throw new InvalidOperationException("Cannot submit an empty plan");
        }

        plan.Status = VisitPlanStatus.Submitted;
        plan.SubmittedAt = DateTime.UtcNow;
        plan.RejectionReason = null; // Clear previous rejection reason
        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Plan {PlanId} submitted for approval by rep {RepId}", planId, rep.Id);

        return MapToDetailDto(plan);
    }

    // Manager methods

    public async Task<IReadOnlyList<TeamVisitPlanDto>> GetTeamPendingPlansAsync(string managerId, CancellationToken cancellationToken = default)
    {
        var teamRepIds = await GetTeamRepIdsAsync(managerId, cancellationToken);
        if (!teamRepIds.Any()) return new List<TeamVisitPlanDto>();

        var plans = await _context.VisitPlans
            .Include(p => p.Rep)
                .ThenInclude(r => r!.User)
            .Where(p => teamRepIds.Contains(p.RepId) && p.Status == VisitPlanStatus.Submitted)
            .OrderBy(p => p.SubmittedAt)
            .Select(p => MapToTeamPlanDto(p))
            .ToListAsync(cancellationToken);

        return plans;
    }

    public async Task<IReadOnlyList<TeamVisitPlanDto>> GetTeamPlansAsync(string managerId, DateTime? fromWeek = null, int? status = null, CancellationToken cancellationToken = default)
    {
        var teamRepIds = await GetTeamRepIdsAsync(managerId, cancellationToken);
        if (!teamRepIds.Any()) return new List<TeamVisitPlanDto>();

        var query = _context.VisitPlans
            .Include(p => p.Rep)
                .ThenInclude(r => r!.User)
            .Where(p => teamRepIds.Contains(p.RepId));

        if (fromWeek.HasValue)
        {
            query = query.Where(p => p.PlanWeek >= fromWeek.Value.Date);
        }

        if (status.HasValue && Enum.IsDefined(typeof(VisitPlanStatus), status.Value))
        {
            query = query.Where(p => p.Status == (VisitPlanStatus)status.Value);
        }

        var plans = await query
            .OrderByDescending(p => p.PlanWeek)
            .ThenBy(p => p.Rep!.User!.FirstName)
            .Select(p => MapToTeamPlanDto(p))
            .ToListAsync(cancellationToken);

        return plans;
    }

    public async Task<TeamVisitPlanDetailDto?> GetTeamPlanAsync(string managerId, int planId, CancellationToken cancellationToken = default)
    {
        var teamRepIds = await GetTeamRepIdsAsync(managerId, cancellationToken);
        if (!teamRepIds.Any()) return null;

        var plan = await _context.VisitPlans
            .Include(p => p.Rep)
                .ThenInclude(r => r!.User)
            .Include(p => p.PlannedVisits)
                .ThenInclude(pv => pv.Customer)
                    .ThenInclude(c => c!.Addresses)
            .Include(p => p.PlannedVisits)
                .ThenInclude(pv => pv.ExecutedVisit)
            .FirstOrDefaultAsync(p => p.Id == planId && teamRepIds.Contains(p.RepId), cancellationToken);

        if (plan == null) return null;

        return MapToTeamPlanDetailDto(plan);
    }

    public async Task<TeamVisitPlanDetailDto?> ApprovePlanAsync(string managerId, int planId, string? comments, CancellationToken cancellationToken = default)
    {
        var teamRepIds = await GetTeamRepIdsAsync(managerId, cancellationToken);
        if (!teamRepIds.Any()) return null;

        var plan = await _context.VisitPlans
            .Include(p => p.Rep)
                .ThenInclude(r => r!.User)
            .Include(p => p.PlannedVisits)
                .ThenInclude(pv => pv.Customer)
                    .ThenInclude(c => c!.Addresses)
            .FirstOrDefaultAsync(p => p.Id == planId && teamRepIds.Contains(p.RepId), cancellationToken);

        if (plan == null) return null;

        if (plan.Status != VisitPlanStatus.Submitted)
        {
            throw new InvalidOperationException("Only Submitted plans can be approved");
        }

        plan.Status = VisitPlanStatus.Approved;
        plan.ApprovedBy = managerId;
        plan.ApprovedAt = DateTime.UtcNow;
        plan.ApprovalComments = comments;
        plan.RejectionReason = null;
        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Plan {PlanId} approved by manager {ManagerId}", planId, managerId);

        return MapToTeamPlanDetailDto(plan);
    }

    public async Task<TeamVisitPlanDetailDto?> RejectPlanAsync(string managerId, int planId, string reason, CancellationToken cancellationToken = default)
    {
        var teamRepIds = await GetTeamRepIdsAsync(managerId, cancellationToken);
        if (!teamRepIds.Any()) return null;

        var plan = await _context.VisitPlans
            .Include(p => p.Rep)
                .ThenInclude(r => r!.User)
            .Include(p => p.PlannedVisits)
                .ThenInclude(pv => pv.Customer)
                    .ThenInclude(c => c!.Addresses)
            .FirstOrDefaultAsync(p => p.Id == planId && teamRepIds.Contains(p.RepId), cancellationToken);

        if (plan == null) return null;

        if (plan.Status != VisitPlanStatus.Submitted)
        {
            throw new InvalidOperationException("Only Submitted plans can be rejected");
        }

        plan.Status = VisitPlanStatus.Rejected;
        plan.RejectionReason = reason;
        plan.ApprovalComments = null;
        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Plan {PlanId} rejected by manager {ManagerId} with reason: {Reason}", planId, managerId, reason);

        return MapToTeamPlanDetailDto(plan);
    }

    private async Task<List<int>> GetTeamRepIdsAsync(string managerId, CancellationToken cancellationToken)
    {
        // Get the manager's user and check if they have management rights
        var managerUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == managerId, cancellationToken);

        if (managerUser == null) return new List<int>();

        // Get reps assigned to this manager (by User ID in RepManagerAssignments)
        var assignedRepIds = await _context.RepManagerAssignments
            .Where(a => a.ManagerUserId == managerId && a.IsActive)
            .Select(a => a.RepId)
            .ToListAsync(cancellationToken);

        // If user is SuperAdmin or Admin, they can see all reps
        var userRoles = await _context.UserRoles.Where(ur => ur.UserId == managerId).ToListAsync(cancellationToken);
        var roles = await _context.Roles.ToListAsync(cancellationToken);
        var userRoleNames = userRoles
            .Join(roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
            .ToList();

        if (userRoleNames.Contains("SuperAdmin") || userRoleNames.Contains("Admin"))
        {
            return await _context.SalesRepresentatives
                .Select(r => r.Id)
                .ToListAsync(cancellationToken);
        }

        return assignedRepIds;
    }

    private async Task<SalesRepresentative?> GetSalesRepAsync(string userId, CancellationToken cancellationToken)
    {
        return await _context.SalesRepresentatives
            .FirstOrDefaultAsync(r => r.UserId == userId, cancellationToken);
    }

    private static DateTime GetMondayOfWeek(DateTime date)
    {
        var diff = ((int)date.DayOfWeek + 6) % 7;
        return date.Date.AddDays(-diff);
    }

    private static TimeSpan? ParseTime(string? timeString)
    {
        if (string.IsNullOrWhiteSpace(timeString)) return null;
        if (TimeSpan.TryParse(timeString, out var time)) return time;
        return null;
    }

    private static VisitPlanDetailDto MapToDetailDto(VisitPlan plan)
    {
        return new VisitPlanDetailDto
        {
            Id = plan.Id,
            RepId = plan.RepId,
            PlanWeek = plan.PlanWeek,
            Status = plan.Status,
            SubmittedAt = plan.SubmittedAt,
            ApprovedBy = plan.ApprovedBy,
            ApprovedAt = plan.ApprovedAt,
            RejectionReason = plan.RejectionReason,
            PlannedVisits = plan.PlannedVisits
                .OrderBy(pv => pv.PlannedDate)
                .ThenBy(pv => pv.SequenceNumber)
                .Select(pv => MapToPlannedVisitDto(pv, pv.Customer!))
                .ToList()
        };
    }

    private static PlannedVisitDto MapToPlannedVisitDto(PlannedVisit pv, Customer customer)
    {
        return new PlannedVisitDto
        {
            Id = pv.Id,
            PlanId = pv.PlanId,
            CustomerId = pv.CustomerId,
            CustomerName = customer?.FullName ?? "Unknown",
            CustomerCity = customer?.Addresses.FirstOrDefault(a => a.IsDefault)?.City,
            PlannedDate = pv.PlannedDate,
            PlannedTime = pv.PlannedTime?.ToString(@"hh\:mm"),
            EstimatedDurationMinutes = pv.EstimatedDurationMinutes,
            VisitObjective = pv.VisitObjective,
            ProductsToPresent = pv.ProductsToPresent,
            Notes = pv.Notes,
            SequenceNumber = pv.SequenceNumber,
            HasExecutedVisit = pv.ExecutedVisit != null,
            ExecutedVisitId = pv.ExecutedVisit?.Id
        };
    }

    private static TeamVisitPlanDto MapToTeamPlanDto(VisitPlan p)
    {
        return new TeamVisitPlanDto
        {
            Id = p.Id,
            RepId = p.RepId,
            RepName = p.Rep?.User != null ? $"{p.Rep.User.FirstName} {p.Rep.User.LastName}" : "Unknown",
            PlanWeek = p.PlanWeek,
            Status = p.Status,
            PlannedVisitsCount = p.PlannedVisits.Count,
            ExecutedVisitsCount = p.PlannedVisits.Count(pv => pv.ExecutedVisit != null),
            SubmittedAt = p.SubmittedAt,
            ApprovedAt = p.ApprovedAt
        };
    }

    private static TeamVisitPlanDetailDto MapToTeamPlanDetailDto(VisitPlan plan)
    {
        return new TeamVisitPlanDetailDto
        {
            Id = plan.Id,
            RepId = plan.RepId,
            RepName = plan.Rep?.User != null ? $"{plan.Rep.User.FirstName} {plan.Rep.User.LastName}" : "Unknown",
            PlanWeek = plan.PlanWeek,
            Status = plan.Status,
            SubmittedAt = plan.SubmittedAt,
            ApprovedBy = plan.ApprovedBy,
            ApprovedAt = plan.ApprovedAt,
            RejectionReason = plan.RejectionReason,
            ApprovalComments = plan.ApprovalComments,
            PlannedVisits = plan.PlannedVisits
                .OrderBy(pv => pv.PlannedDate)
                .ThenBy(pv => pv.SequenceNumber)
                .Select(pv => MapToPlannedVisitDto(pv, pv.Customer!))
                .ToList()
        };
    }
}
