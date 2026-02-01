using Application.DTOs.Planning;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

/// <summary>
/// Service for managing planning hierarchy (Annual -> Quarterly -> Monthly -> Weekly)
/// </summary>
public class PlanningHierarchyService : IPlanningHierarchyService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PlanningHierarchyService> _logger;

    public PlanningHierarchyService(ApplicationDbContext context, ILogger<PlanningHierarchyService> logger)
    {
        _context = context;
        _logger = logger;
    }

    #region Overview

    public async Task<PlanningHierarchyOverviewDto> GetOverviewAsync(int repId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var currentYear = now.Year;
        var currentQuarter = (now.Month - 1) / 3 + 1;
        var currentMonth = now.Month;

        var overview = new PlanningHierarchyOverviewDto();

        // Get current annual plan
        var annualPlan = await _context.AnnualPlans
            .Where(p => p.RepId == repId && p.Year == currentYear)
            .Select(p => new AnnualPlanSummaryDto
            {
                Id = p.Id,
                RepId = p.RepId,
                Year = p.Year,
                Title = p.Title,
                Status = p.Status,
                RevenueTarget = p.RevenueTarget,
                VisitsTarget = p.VisitsTarget,
                NewCustomersTarget = p.NewCustomersTarget,
                QuarterlyPlansCount = p.QuarterlyPlans.Count,
                CreatedAt = p.CreatedAt,
                ApprovedAt = p.ApprovedAt
            })
            .FirstOrDefaultAsync(cancellationToken);

        overview.CurrentAnnualPlan = annualPlan;

        if (annualPlan != null)
        {
            // Get current quarterly plan
            var quarterlyPlan = await _context.QuarterlyPlans
                .Where(p => p.AnnualPlanId == annualPlan.Id && p.Quarter == currentQuarter)
                .Select(p => new QuarterlyPlanSummaryDto
                {
                    Id = p.Id,
                    AnnualPlanId = p.AnnualPlanId,
                    RepId = p.RepId,
                    Year = p.Year,
                    Quarter = p.Quarter,
                    Title = p.Title,
                    Status = p.Status,
                    RevenueTarget = p.RevenueTarget,
                    VisitsTarget = p.VisitsTarget,
                    NewCustomersTarget = p.NewCustomersTarget,
                    MonthlyPlansCount = p.MonthlyPlans.Count,
                    CreatedAt = p.CreatedAt,
                    ApprovedAt = p.ApprovedAt
                })
                .FirstOrDefaultAsync(cancellationToken);

            overview.CurrentQuarterlyPlan = quarterlyPlan;

            if (quarterlyPlan != null)
            {
                // Get current monthly plan
                var monthlyPlan = await _context.MonthlyPlans
                    .Where(p => p.QuarterlyPlanId == quarterlyPlan.Id && p.Month == currentMonth)
                    .Select(p => new MonthlyPlanSummaryDto
                    {
                        Id = p.Id,
                        QuarterlyPlanId = p.QuarterlyPlanId,
                        RepId = p.RepId,
                        Year = p.Year,
                        Month = p.Month,
                        Title = p.Title,
                        Status = p.Status,
                        RevenueTarget = p.RevenueTarget,
                        VisitsTarget = p.VisitsTarget,
                        WeeklyPlansCount = p.WeeklyPlans.Count,
                        ActualRevenue = p.ActualRevenue,
                        ActualVisits = p.ActualVisits,
                        CreatedAt = p.CreatedAt,
                        ApprovedAt = p.ApprovedAt
                    })
                    .FirstOrDefaultAsync(cancellationToken);

                overview.CurrentMonthlyPlan = monthlyPlan;

                if (monthlyPlan != null)
                {
                    // Get current weekly plan
                    var weekStart = GetMondayOfWeek(now);
                    var weeklyPlan = await _context.VisitPlans
                        .Where(p => p.MonthlyPlanId == monthlyPlan.Id && p.PlanWeek == weekStart)
                        .Select(p => new WeeklyPlanSummaryDto
                        {
                            Id = p.Id,
                            PlanWeek = p.PlanWeek,
                            Status = p.Status.ToString(),
                            PlannedVisitsCount = p.PlannedVisits.Count,
                            ExecutedVisitsCount = p.PlannedVisits.Count(pv => pv.ExecutedVisit != null),
                            SubmittedAt = p.SubmittedAt,
                            ApprovedAt = p.ApprovedAt
                        })
                        .FirstOrDefaultAsync(cancellationToken);

                    overview.CurrentWeeklyPlan = weeklyPlan;
                }
            }
        }

        // Calculate progress
        await CalculateProgressAsync(repId, currentYear, overview.Progress, cancellationToken);

        return overview;
    }

    #endregion

    #region Annual Plans

    public async Task<IReadOnlyList<AnnualPlanSummaryDto>> GetAnnualPlansAsync(int repId, CancellationToken cancellationToken = default)
    {
        var rep = await _context.SalesRepresentatives
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == repId, cancellationToken);

        return await _context.AnnualPlans
            .Where(p => p.RepId == repId)
            .OrderByDescending(p => p.Year)
            .Select(p => new AnnualPlanSummaryDto
            {
                Id = p.Id,
                RepId = p.RepId,
                RepName = rep != null ? $"{rep.User.FirstName} {rep.User.LastName}" : "",
                Year = p.Year,
                Title = p.Title,
                Status = p.Status,
                RevenueTarget = p.RevenueTarget,
                VisitsTarget = p.VisitsTarget,
                NewCustomersTarget = p.NewCustomersTarget,
                QuarterlyPlansCount = p.QuarterlyPlans.Count,
                CreatedAt = p.CreatedAt,
                ApprovedAt = p.ApprovedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<AnnualPlanDetailDto?> GetAnnualPlanByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var plan = await _context.AnnualPlans
            .Include(p => p.Rep)
                .ThenInclude(r => r.User)
            .Include(p => p.QuarterlyPlans)
                .ThenInclude(q => q.MonthlyPlans)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (plan == null) return null;

        return MapToAnnualPlanDetailDto(plan);
    }

    public async Task<AnnualPlanDetailDto?> GetAnnualPlanByYearAsync(int repId, int year, CancellationToken cancellationToken = default)
    {
        var plan = await _context.AnnualPlans
            .Include(p => p.Rep)
                .ThenInclude(r => r.User)
            .Include(p => p.QuarterlyPlans)
                .ThenInclude(q => q.MonthlyPlans)
            .FirstOrDefaultAsync(p => p.RepId == repId && p.Year == year, cancellationToken);

        if (plan == null) return null;

        return MapToAnnualPlanDetailDto(plan);
    }

    public async Task<AnnualPlanDetailDto> CreateAnnualPlanAsync(int repId, CreateAnnualPlanDto dto, CancellationToken cancellationToken = default)
    {
        // Check if annual plan already exists for this year
        var existing = await _context.AnnualPlans
            .AnyAsync(p => p.RepId == repId && p.Year == dto.Year, cancellationToken);

        if (existing)
        {
            throw new InvalidOperationException($"Annual plan for year {dto.Year} already exists");
        }

        var plan = new AnnualPlan
        {
            RepId = repId,
            Year = dto.Year,
            Title = dto.Title,
            TerritoryDescription = dto.TerritoryDescription,
            AssignedCantons = dto.AssignedCantons,
            RevenueTarget = dto.RevenueTarget,
            VisitsTarget = dto.VisitsTarget,
            NewCustomersTarget = dto.NewCustomersTarget,
            MajorEvents = dto.MajorEvents,
            StrategicPriorities = dto.StrategicPriorities,
            FocusProducts = dto.FocusProducts,
            Notes = dto.Notes,
            Status = PlanStatus.Draft,
            CreatedAt = DateTime.UtcNow
        };

        _context.AnnualPlans.Add(plan);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created annual plan {PlanId} for rep {RepId}, year {Year}", plan.Id, repId, dto.Year);

        return (await GetAnnualPlanByIdAsync(plan.Id, cancellationToken))!;
    }

    public async Task<AnnualPlanDetailDto> UpdateAnnualPlanAsync(int id, UpdateAnnualPlanDto dto, CancellationToken cancellationToken = default)
    {
        var plan = await _context.AnnualPlans.FindAsync([id], cancellationToken);
        if (plan == null)
        {
            throw new InvalidOperationException("Annual plan not found");
        }

        if (plan.Status != PlanStatus.Draft && plan.Status != PlanStatus.Rejected)
        {
            throw new InvalidOperationException("Only draft or rejected plans can be updated");
        }

        if (dto.Title != null) plan.Title = dto.Title;
        if (dto.TerritoryDescription != null) plan.TerritoryDescription = dto.TerritoryDescription;
        if (dto.AssignedCantons != null) plan.AssignedCantons = dto.AssignedCantons;
        if (dto.RevenueTarget.HasValue) plan.RevenueTarget = dto.RevenueTarget;
        if (dto.VisitsTarget.HasValue) plan.VisitsTarget = dto.VisitsTarget;
        if (dto.NewCustomersTarget.HasValue) plan.NewCustomersTarget = dto.NewCustomersTarget;
        if (dto.MajorEvents != null) plan.MajorEvents = dto.MajorEvents;
        if (dto.StrategicPriorities != null) plan.StrategicPriorities = dto.StrategicPriorities;
        if (dto.FocusProducts != null) plan.FocusProducts = dto.FocusProducts;
        if (dto.Notes != null) plan.Notes = dto.Notes;

        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return (await GetAnnualPlanByIdAsync(id, cancellationToken))!;
    }

    public async Task<AnnualPlanDetailDto> SubmitAnnualPlanAsync(int id, CancellationToken cancellationToken = default)
    {
        var plan = await _context.AnnualPlans.FindAsync([id], cancellationToken);
        if (plan == null)
        {
            throw new InvalidOperationException("Annual plan not found");
        }

        if (plan.Status != PlanStatus.Draft && plan.Status != PlanStatus.Rejected)
        {
            throw new InvalidOperationException("Only draft or rejected plans can be submitted");
        }

        plan.Status = PlanStatus.Submitted;
        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Annual plan {PlanId} submitted for approval", id);

        return (await GetAnnualPlanByIdAsync(id, cancellationToken))!;
    }

    public async Task<AnnualPlanDetailDto> ApproveAnnualPlanAsync(int id, string approvedBy, string? comments = null, CancellationToken cancellationToken = default)
    {
        var plan = await _context.AnnualPlans.FindAsync([id], cancellationToken);
        if (plan == null)
        {
            throw new InvalidOperationException("Annual plan not found");
        }

        if (plan.Status != PlanStatus.Submitted)
        {
            throw new InvalidOperationException("Only submitted plans can be approved");
        }

        plan.Status = PlanStatus.Approved;
        plan.ApprovedBy = approvedBy;
        plan.ApprovedAt = DateTime.UtcNow;
        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Annual plan {PlanId} approved by {ApprovedBy}", id, approvedBy);

        return (await GetAnnualPlanByIdAsync(id, cancellationToken))!;
    }

    public async Task<AnnualPlanDetailDto> RejectAnnualPlanAsync(int id, string reason, CancellationToken cancellationToken = default)
    {
        var plan = await _context.AnnualPlans.FindAsync([id], cancellationToken);
        if (plan == null)
        {
            throw new InvalidOperationException("Annual plan not found");
        }

        if (plan.Status != PlanStatus.Submitted)
        {
            throw new InvalidOperationException("Only submitted plans can be rejected");
        }

        plan.Status = PlanStatus.Rejected;
        plan.Notes = reason;
        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Annual plan {PlanId} rejected: {Reason}", id, reason);

        return (await GetAnnualPlanByIdAsync(id, cancellationToken))!;
    }

    public async Task DeleteAnnualPlanAsync(int id, CancellationToken cancellationToken = default)
    {
        var plan = await _context.AnnualPlans.FindAsync([id], cancellationToken);
        if (plan == null)
        {
            throw new InvalidOperationException("Annual plan not found");
        }

        if (plan.Status != PlanStatus.Draft)
        {
            throw new InvalidOperationException("Only draft plans can be deleted");
        }

        _context.AnnualPlans.Remove(plan);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Annual plan {PlanId} deleted", id);
    }

    #endregion

    #region Quarterly Plans

    public async Task<IReadOnlyList<QuarterlyPlanSummaryDto>> GetQuarterlyPlansAsync(int annualPlanId, CancellationToken cancellationToken = default)
    {
        return await _context.QuarterlyPlans
            .Where(p => p.AnnualPlanId == annualPlanId)
            .OrderBy(p => p.Quarter)
            .Select(p => new QuarterlyPlanSummaryDto
            {
                Id = p.Id,
                AnnualPlanId = p.AnnualPlanId,
                RepId = p.RepId,
                Year = p.Year,
                Quarter = p.Quarter,
                Title = p.Title,
                Status = p.Status,
                RevenueTarget = p.RevenueTarget,
                VisitsTarget = p.VisitsTarget,
                NewCustomersTarget = p.NewCustomersTarget,
                MonthlyPlansCount = p.MonthlyPlans.Count,
                CreatedAt = p.CreatedAt,
                ApprovedAt = p.ApprovedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<QuarterlyPlanDetailDto?> GetQuarterlyPlanByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var plan = await _context.QuarterlyPlans
            .Include(p => p.Rep)
                .ThenInclude(r => r.User)
            .Include(p => p.MonthlyPlans)
                .ThenInclude(m => m.WeeklyPlans)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (plan == null) return null;

        return MapToQuarterlyPlanDetailDto(plan);
    }

    public async Task<QuarterlyPlanDetailDto> CreateQuarterlyPlanAsync(int repId, CreateQuarterlyPlanDto dto, CancellationToken cancellationToken = default)
    {
        var annualPlan = await _context.AnnualPlans.FindAsync([dto.AnnualPlanId], cancellationToken);
        if (annualPlan == null)
        {
            throw new InvalidOperationException("Annual plan not found");
        }

        if (dto.Quarter < 1 || dto.Quarter > 4)
        {
            throw new InvalidOperationException("Quarter must be between 1 and 4");
        }

        var existing = await _context.QuarterlyPlans
            .AnyAsync(p => p.AnnualPlanId == dto.AnnualPlanId && p.Quarter == dto.Quarter, cancellationToken);

        if (existing)
        {
            throw new InvalidOperationException($"Quarterly plan for Q{dto.Quarter} already exists");
        }

        var plan = new QuarterlyPlan
        {
            AnnualPlanId = dto.AnnualPlanId,
            RepId = repId,
            Year = annualPlan.Year,
            Quarter = dto.Quarter,
            Title = dto.Title,
            RevenueTarget = dto.RevenueTarget,
            VisitsTarget = dto.VisitsTarget,
            NewCustomersTarget = dto.NewCustomersTarget,
            CampaignSchedule = dto.CampaignSchedule,
            TrainingSchedule = dto.TrainingSchedule,
            ResourceAllocation = dto.ResourceAllocation,
            KeyObjectives = dto.KeyObjectives,
            FocusProducts = dto.FocusProducts,
            Notes = dto.Notes,
            Status = PlanStatus.Draft,
            CreatedAt = DateTime.UtcNow
        };

        _context.QuarterlyPlans.Add(plan);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created quarterly plan {PlanId} for Q{Quarter} {Year}", plan.Id, dto.Quarter, annualPlan.Year);

        return (await GetQuarterlyPlanByIdAsync(plan.Id, cancellationToken))!;
    }

    public async Task<QuarterlyPlanDetailDto> UpdateQuarterlyPlanAsync(int id, UpdateQuarterlyPlanDto dto, CancellationToken cancellationToken = default)
    {
        var plan = await _context.QuarterlyPlans.FindAsync([id], cancellationToken);
        if (plan == null)
        {
            throw new InvalidOperationException("Quarterly plan not found");
        }

        if (plan.Status != PlanStatus.Draft && plan.Status != PlanStatus.Rejected)
        {
            throw new InvalidOperationException("Only draft or rejected plans can be updated");
        }

        if (dto.Title != null) plan.Title = dto.Title;
        if (dto.RevenueTarget.HasValue) plan.RevenueTarget = dto.RevenueTarget;
        if (dto.VisitsTarget.HasValue) plan.VisitsTarget = dto.VisitsTarget;
        if (dto.NewCustomersTarget.HasValue) plan.NewCustomersTarget = dto.NewCustomersTarget;
        if (dto.CampaignSchedule != null) plan.CampaignSchedule = dto.CampaignSchedule;
        if (dto.TrainingSchedule != null) plan.TrainingSchedule = dto.TrainingSchedule;
        if (dto.ResourceAllocation != null) plan.ResourceAllocation = dto.ResourceAllocation;
        if (dto.KeyObjectives != null) plan.KeyObjectives = dto.KeyObjectives;
        if (dto.FocusProducts != null) plan.FocusProducts = dto.FocusProducts;
        if (dto.Notes != null) plan.Notes = dto.Notes;

        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return (await GetQuarterlyPlanByIdAsync(id, cancellationToken))!;
    }

    public async Task<QuarterlyPlanDetailDto> SubmitQuarterlyPlanAsync(int id, CancellationToken cancellationToken = default)
    {
        var plan = await _context.QuarterlyPlans.FindAsync([id], cancellationToken);
        if (plan == null)
        {
            throw new InvalidOperationException("Quarterly plan not found");
        }

        if (plan.Status != PlanStatus.Draft && plan.Status != PlanStatus.Rejected)
        {
            throw new InvalidOperationException("Only draft or rejected plans can be submitted");
        }

        plan.Status = PlanStatus.Submitted;
        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return (await GetQuarterlyPlanByIdAsync(id, cancellationToken))!;
    }

    public async Task<QuarterlyPlanDetailDto> ApproveQuarterlyPlanAsync(int id, string approvedBy, string? comments = null, CancellationToken cancellationToken = default)
    {
        var plan = await _context.QuarterlyPlans.FindAsync([id], cancellationToken);
        if (plan == null)
        {
            throw new InvalidOperationException("Quarterly plan not found");
        }

        if (plan.Status != PlanStatus.Submitted)
        {
            throw new InvalidOperationException("Only submitted plans can be approved");
        }

        plan.Status = PlanStatus.Approved;
        plan.ApprovedBy = approvedBy;
        plan.ApprovedAt = DateTime.UtcNow;
        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return (await GetQuarterlyPlanByIdAsync(id, cancellationToken))!;
    }

    public async Task<QuarterlyPlanDetailDto> RejectQuarterlyPlanAsync(int id, string reason, CancellationToken cancellationToken = default)
    {
        var plan = await _context.QuarterlyPlans.FindAsync([id], cancellationToken);
        if (plan == null)
        {
            throw new InvalidOperationException("Quarterly plan not found");
        }

        if (plan.Status != PlanStatus.Submitted)
        {
            throw new InvalidOperationException("Only submitted plans can be rejected");
        }

        plan.Status = PlanStatus.Rejected;
        plan.RejectionReason = reason;
        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return (await GetQuarterlyPlanByIdAsync(id, cancellationToken))!;
    }

    public async Task DeleteQuarterlyPlanAsync(int id, CancellationToken cancellationToken = default)
    {
        var plan = await _context.QuarterlyPlans.FindAsync([id], cancellationToken);
        if (plan == null)
        {
            throw new InvalidOperationException("Quarterly plan not found");
        }

        if (plan.Status != PlanStatus.Draft)
        {
            throw new InvalidOperationException("Only draft plans can be deleted");
        }

        _context.QuarterlyPlans.Remove(plan);
        await _context.SaveChangesAsync(cancellationToken);
    }

    #endregion

    #region Monthly Plans

    public async Task<IReadOnlyList<MonthlyPlanSummaryDto>> GetMonthlyPlansAsync(int quarterlyPlanId, CancellationToken cancellationToken = default)
    {
        return await _context.MonthlyPlans
            .Where(p => p.QuarterlyPlanId == quarterlyPlanId)
            .OrderBy(p => p.Month)
            .Select(p => new MonthlyPlanSummaryDto
            {
                Id = p.Id,
                QuarterlyPlanId = p.QuarterlyPlanId,
                RepId = p.RepId,
                Year = p.Year,
                Month = p.Month,
                Title = p.Title,
                Status = p.Status,
                RevenueTarget = p.RevenueTarget,
                VisitsTarget = p.VisitsTarget,
                WeeklyPlansCount = p.WeeklyPlans.Count,
                ActualRevenue = p.ActualRevenue,
                ActualVisits = p.ActualVisits,
                CreatedAt = p.CreatedAt,
                ApprovedAt = p.ApprovedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<MonthlyPlanDetailDto?> GetMonthlyPlanByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var plan = await _context.MonthlyPlans
            .Include(p => p.Rep)
                .ThenInclude(r => r.User)
            .Include(p => p.WeeklyPlans)
                .ThenInclude(w => w.PlannedVisits)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (plan == null) return null;

        return MapToMonthlyPlanDetailDto(plan);
    }

    public async Task<MonthlyPlanDetailDto> CreateMonthlyPlanAsync(int repId, CreateMonthlyPlanDto dto, CancellationToken cancellationToken = default)
    {
        var quarterlyPlan = await _context.QuarterlyPlans.FindAsync([dto.QuarterlyPlanId], cancellationToken);
        if (quarterlyPlan == null)
        {
            throw new InvalidOperationException("Quarterly plan not found");
        }

        // Validate month is in correct quarter
        var quarterStartMonth = (quarterlyPlan.Quarter - 1) * 3 + 1;
        var quarterEndMonth = quarterlyPlan.Quarter * 3;
        if (dto.Month < quarterStartMonth || dto.Month > quarterEndMonth)
        {
            throw new InvalidOperationException($"Month {dto.Month} is not in Q{quarterlyPlan.Quarter}");
        }

        var existing = await _context.MonthlyPlans
            .AnyAsync(p => p.QuarterlyPlanId == dto.QuarterlyPlanId && p.Month == dto.Month, cancellationToken);

        if (existing)
        {
            throw new InvalidOperationException($"Monthly plan for month {dto.Month} already exists");
        }

        var plan = new MonthlyPlan
        {
            QuarterlyPlanId = dto.QuarterlyPlanId,
            RepId = repId,
            Year = quarterlyPlan.Year,
            Month = dto.Month,
            Title = dto.Title,
            RevenueTarget = dto.RevenueTarget,
            VisitsTarget = dto.VisitsTarget,
            TierACoverageTarget = dto.TierACoverageTarget,
            TierBCoverageTarget = dto.TierBCoverageTarget,
            TierCCoverageTarget = dto.TierCCoverageTarget,
            PromotionalActivities = dto.PromotionalActivities,
            TrainingSchedule = dto.TrainingSchedule,
            FocusProducts = dto.FocusProducts,
            PriorityCustomers = dto.PriorityCustomers,
            Notes = dto.Notes,
            Status = PlanStatus.Draft,
            CreatedAt = DateTime.UtcNow
        };

        _context.MonthlyPlans.Add(plan);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created monthly plan {PlanId} for month {Month} {Year}", plan.Id, dto.Month, quarterlyPlan.Year);

        return (await GetMonthlyPlanByIdAsync(plan.Id, cancellationToken))!;
    }

    public async Task<MonthlyPlanDetailDto> UpdateMonthlyPlanAsync(int id, UpdateMonthlyPlanDto dto, CancellationToken cancellationToken = default)
    {
        var plan = await _context.MonthlyPlans.FindAsync([id], cancellationToken);
        if (plan == null)
        {
            throw new InvalidOperationException("Monthly plan not found");
        }

        if (plan.Status != PlanStatus.Draft && plan.Status != PlanStatus.Rejected)
        {
            throw new InvalidOperationException("Only draft or rejected plans can be updated");
        }

        if (dto.Title != null) plan.Title = dto.Title;
        if (dto.RevenueTarget.HasValue) plan.RevenueTarget = dto.RevenueTarget;
        if (dto.VisitsTarget.HasValue) plan.VisitsTarget = dto.VisitsTarget;
        if (dto.TierACoverageTarget.HasValue) plan.TierACoverageTarget = dto.TierACoverageTarget;
        if (dto.TierBCoverageTarget.HasValue) plan.TierBCoverageTarget = dto.TierBCoverageTarget;
        if (dto.TierCCoverageTarget.HasValue) plan.TierCCoverageTarget = dto.TierCCoverageTarget;
        if (dto.PromotionalActivities != null) plan.PromotionalActivities = dto.PromotionalActivities;
        if (dto.TrainingSchedule != null) plan.TrainingSchedule = dto.TrainingSchedule;
        if (dto.FocusProducts != null) plan.FocusProducts = dto.FocusProducts;
        if (dto.PriorityCustomers != null) plan.PriorityCustomers = dto.PriorityCustomers;
        if (dto.Notes != null) plan.Notes = dto.Notes;

        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return (await GetMonthlyPlanByIdAsync(id, cancellationToken))!;
    }

    public async Task<MonthlyPlanDetailDto> SubmitMonthlyPlanAsync(int id, CancellationToken cancellationToken = default)
    {
        var plan = await _context.MonthlyPlans.FindAsync([id], cancellationToken);
        if (plan == null)
        {
            throw new InvalidOperationException("Monthly plan not found");
        }

        if (plan.Status != PlanStatus.Draft && plan.Status != PlanStatus.Rejected)
        {
            throw new InvalidOperationException("Only draft or rejected plans can be submitted");
        }

        plan.Status = PlanStatus.Submitted;
        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return (await GetMonthlyPlanByIdAsync(id, cancellationToken))!;
    }

    public async Task<MonthlyPlanDetailDto> ApproveMonthlyPlanAsync(int id, string approvedBy, string? comments = null, CancellationToken cancellationToken = default)
    {
        var plan = await _context.MonthlyPlans.FindAsync([id], cancellationToken);
        if (plan == null)
        {
            throw new InvalidOperationException("Monthly plan not found");
        }

        if (plan.Status != PlanStatus.Submitted)
        {
            throw new InvalidOperationException("Only submitted plans can be approved");
        }

        plan.Status = PlanStatus.Approved;
        plan.ApprovedBy = approvedBy;
        plan.ApprovedAt = DateTime.UtcNow;
        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return (await GetMonthlyPlanByIdAsync(id, cancellationToken))!;
    }

    public async Task<MonthlyPlanDetailDto> RejectMonthlyPlanAsync(int id, string reason, CancellationToken cancellationToken = default)
    {
        var plan = await _context.MonthlyPlans.FindAsync([id], cancellationToken);
        if (plan == null)
        {
            throw new InvalidOperationException("Monthly plan not found");
        }

        if (plan.Status != PlanStatus.Submitted)
        {
            throw new InvalidOperationException("Only submitted plans can be rejected");
        }

        plan.Status = PlanStatus.Rejected;
        plan.RejectionReason = reason;
        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return (await GetMonthlyPlanByIdAsync(id, cancellationToken))!;
    }

    public async Task DeleteMonthlyPlanAsync(int id, CancellationToken cancellationToken = default)
    {
        var plan = await _context.MonthlyPlans.FindAsync([id], cancellationToken);
        if (plan == null)
        {
            throw new InvalidOperationException("Monthly plan not found");
        }

        if (plan.Status != PlanStatus.Draft)
        {
            throw new InvalidOperationException("Only draft plans can be deleted");
        }

        _context.MonthlyPlans.Remove(plan);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task LinkWeeklyPlanAsync(int monthlyPlanId, int weeklyPlanId, CancellationToken cancellationToken = default)
    {
        var weeklyPlan = await _context.VisitPlans.FindAsync([weeklyPlanId], cancellationToken);
        if (weeklyPlan == null)
        {
            throw new InvalidOperationException("Weekly plan not found");
        }

        var monthlyPlan = await _context.MonthlyPlans.FindAsync([monthlyPlanId], cancellationToken);
        if (monthlyPlan == null)
        {
            throw new InvalidOperationException("Monthly plan not found");
        }

        weeklyPlan.MonthlyPlanId = monthlyPlanId;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Linked weekly plan {WeeklyPlanId} to monthly plan {MonthlyPlanId}", weeklyPlanId, monthlyPlanId);
    }

    #endregion

    #region Team Plans (Manager)

    public async Task<IReadOnlyList<AnnualPlanSummaryDto>> GetTeamPendingAnnualPlansAsync(string managerId, CancellationToken cancellationToken = default)
    {
        var teamRepIds = await GetTeamRepIdsAsync(managerId, cancellationToken);
        if (!teamRepIds.Any()) return new List<AnnualPlanSummaryDto>();

        return await _context.AnnualPlans
            .Where(p => teamRepIds.Contains(p.RepId) && p.Status == PlanStatus.Submitted)
            .Include(p => p.Rep)
                .ThenInclude(r => r.User)
            .OrderBy(p => p.CreatedAt)
            .Select(p => new AnnualPlanSummaryDto
            {
                Id = p.Id,
                RepId = p.RepId,
                RepName = p.Rep.User.FirstName + " " + p.Rep.User.LastName,
                Year = p.Year,
                Title = p.Title,
                Status = p.Status,
                RevenueTarget = p.RevenueTarget,
                VisitsTarget = p.VisitsTarget,
                NewCustomersTarget = p.NewCustomersTarget,
                QuarterlyPlansCount = p.QuarterlyPlans.Count,
                CreatedAt = p.CreatedAt,
                ApprovedAt = p.ApprovedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<QuarterlyPlanSummaryDto>> GetTeamPendingQuarterlyPlansAsync(string managerId, CancellationToken cancellationToken = default)
    {
        var teamRepIds = await GetTeamRepIdsAsync(managerId, cancellationToken);
        if (!teamRepIds.Any()) return new List<QuarterlyPlanSummaryDto>();

        return await _context.QuarterlyPlans
            .Where(p => teamRepIds.Contains(p.RepId) && p.Status == PlanStatus.Submitted)
            .Include(p => p.Rep)
                .ThenInclude(r => r.User)
            .OrderBy(p => p.CreatedAt)
            .Select(p => new QuarterlyPlanSummaryDto
            {
                Id = p.Id,
                AnnualPlanId = p.AnnualPlanId,
                RepId = p.RepId,
                RepName = p.Rep.User.FirstName + " " + p.Rep.User.LastName,
                Year = p.Year,
                Quarter = p.Quarter,
                Title = p.Title,
                Status = p.Status,
                RevenueTarget = p.RevenueTarget,
                VisitsTarget = p.VisitsTarget,
                NewCustomersTarget = p.NewCustomersTarget,
                MonthlyPlansCount = p.MonthlyPlans.Count,
                CreatedAt = p.CreatedAt,
                ApprovedAt = p.ApprovedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<MonthlyPlanSummaryDto>> GetTeamPendingMonthlyPlansAsync(string managerId, CancellationToken cancellationToken = default)
    {
        var teamRepIds = await GetTeamRepIdsAsync(managerId, cancellationToken);
        if (!teamRepIds.Any()) return new List<MonthlyPlanSummaryDto>();

        return await _context.MonthlyPlans
            .Where(p => teamRepIds.Contains(p.RepId) && p.Status == PlanStatus.Submitted)
            .Include(p => p.Rep)
                .ThenInclude(r => r.User)
            .OrderBy(p => p.CreatedAt)
            .Select(p => new MonthlyPlanSummaryDto
            {
                Id = p.Id,
                QuarterlyPlanId = p.QuarterlyPlanId,
                RepId = p.RepId,
                RepName = p.Rep.User.FirstName + " " + p.Rep.User.LastName,
                Year = p.Year,
                Month = p.Month,
                Title = p.Title,
                Status = p.Status,
                RevenueTarget = p.RevenueTarget,
                VisitsTarget = p.VisitsTarget,
                WeeklyPlansCount = p.WeeklyPlans.Count,
                ActualRevenue = p.ActualRevenue,
                ActualVisits = p.ActualVisits,
                CreatedAt = p.CreatedAt,
                ApprovedAt = p.ApprovedAt
            })
            .ToListAsync(cancellationToken);
    }

    #endregion

    #region Auto-Generation

    public async Task<IReadOnlyList<QuarterlyPlanDetailDto>> GenerateQuarterlyPlansFromAnnualAsync(int annualPlanId, CancellationToken cancellationToken = default)
    {
        var annualPlan = await _context.AnnualPlans
            .Include(p => p.QuarterlyPlans)
            .FirstOrDefaultAsync(p => p.Id == annualPlanId, cancellationToken);

        if (annualPlan == null)
        {
            throw new InvalidOperationException("Annual plan not found");
        }

        var existingQuarters = annualPlan.QuarterlyPlans.Select(q => q.Quarter).ToHashSet();
        var result = new List<QuarterlyPlanDetailDto>();

        for (int quarter = 1; quarter <= 4; quarter++)
        {
            if (existingQuarters.Contains(quarter)) continue;

            var quarterlyRevenueTarget = annualPlan.RevenueTarget.HasValue
                ? annualPlan.RevenueTarget.Value / 4
                : (decimal?)null;
            var quarterlyVisitsTarget = annualPlan.VisitsTarget.HasValue
                ? annualPlan.VisitsTarget.Value / 4
                : (int?)null;
            var quarterlyNewCustomersTarget = annualPlan.NewCustomersTarget.HasValue
                ? annualPlan.NewCustomersTarget.Value / 4
                : (int?)null;

            var plan = new QuarterlyPlan
            {
                AnnualPlanId = annualPlanId,
                RepId = annualPlan.RepId,
                Year = annualPlan.Year,
                Quarter = quarter,
                Title = $"Q{quarter} {annualPlan.Year} Plan",
                RevenueTarget = quarterlyRevenueTarget,
                VisitsTarget = quarterlyVisitsTarget,
                NewCustomersTarget = quarterlyNewCustomersTarget,
                FocusProducts = annualPlan.FocusProducts,
                Status = PlanStatus.Draft,
                CreatedAt = DateTime.UtcNow
            };

            _context.QuarterlyPlans.Add(plan);
            await _context.SaveChangesAsync(cancellationToken);

            var dto = await GetQuarterlyPlanByIdAsync(plan.Id, cancellationToken);
            if (dto != null) result.Add(dto);
        }

        _logger.LogInformation("Generated {Count} quarterly plans from annual plan {AnnualPlanId}", result.Count, annualPlanId);

        return result;
    }

    public async Task<IReadOnlyList<MonthlyPlanDetailDto>> GenerateMonthlyPlansFromQuarterlyAsync(int quarterlyPlanId, CancellationToken cancellationToken = default)
    {
        var quarterlyPlan = await _context.QuarterlyPlans
            .Include(p => p.MonthlyPlans)
            .FirstOrDefaultAsync(p => p.Id == quarterlyPlanId, cancellationToken);

        if (quarterlyPlan == null)
        {
            throw new InvalidOperationException("Quarterly plan not found");
        }

        var startMonth = (quarterlyPlan.Quarter - 1) * 3 + 1;
        var existingMonths = quarterlyPlan.MonthlyPlans.Select(m => m.Month).ToHashSet();
        var result = new List<MonthlyPlanDetailDto>();

        for (int month = startMonth; month < startMonth + 3; month++)
        {
            if (existingMonths.Contains(month)) continue;

            var monthlyRevenueTarget = quarterlyPlan.RevenueTarget.HasValue
                ? quarterlyPlan.RevenueTarget.Value / 3
                : (decimal?)null;
            var monthlyVisitsTarget = quarterlyPlan.VisitsTarget.HasValue
                ? quarterlyPlan.VisitsTarget.Value / 3
                : (int?)null;

            var monthName = new DateTime(quarterlyPlan.Year, month, 1).ToString("MMMM");

            var plan = new MonthlyPlan
            {
                QuarterlyPlanId = quarterlyPlanId,
                RepId = quarterlyPlan.RepId,
                Year = quarterlyPlan.Year,
                Month = month,
                Title = $"{monthName} {quarterlyPlan.Year} Plan",
                RevenueTarget = monthlyRevenueTarget,
                VisitsTarget = monthlyVisitsTarget,
                FocusProducts = quarterlyPlan.FocusProducts,
                Status = PlanStatus.Draft,
                CreatedAt = DateTime.UtcNow
            };

            _context.MonthlyPlans.Add(plan);
            await _context.SaveChangesAsync(cancellationToken);

            var dto = await GetMonthlyPlanByIdAsync(plan.Id, cancellationToken);
            if (dto != null) result.Add(dto);
        }

        _logger.LogInformation("Generated {Count} monthly plans from quarterly plan {QuarterlyPlanId}", result.Count, quarterlyPlanId);

        return result;
    }

    #endregion

    #region Private Helpers

    private static DateTime GetMondayOfWeek(DateTime date)
    {
        var diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
        return date.AddDays(-1 * diff).Date;
    }

    private async Task<List<int>> GetTeamRepIdsAsync(string managerId, CancellationToken cancellationToken)
    {
        return await _context.RepManagerAssignments
            .Where(a => a.ManagerUserId == managerId && a.IsActive)
            .Select(a => a.RepId)
            .ToListAsync(cancellationToken);
    }

    private async Task CalculateProgressAsync(int repId, int year, PlanningProgressDto progress, CancellationToken cancellationToken)
    {
        var annualPlan = await _context.AnnualPlans
            .Include(p => p.QuarterlyPlans)
                .ThenInclude(q => q.MonthlyPlans)
            .FirstOrDefaultAsync(p => p.RepId == repId && p.Year == year, cancellationToken);

        if (annualPlan == null) return;

        progress.AnnualRevenueTarget = annualPlan.RevenueTarget ?? 0;
        progress.AnnualVisitsTarget = annualPlan.VisitsTarget ?? 0;

        // Sum up actuals from monthly plans
        foreach (var quarterly in annualPlan.QuarterlyPlans)
        {
            if (quarterly.Status == PlanStatus.Completed) progress.QuarterlyPlansCompleted++;

            foreach (var monthly in quarterly.MonthlyPlans)
            {
                progress.AnnualRevenueActual += monthly.ActualRevenue ?? 0;
                progress.AnnualVisitsActual += monthly.ActualVisits ?? 0;

                if (monthly.Status == PlanStatus.Completed) progress.MonthlyPlansCompleted++;
            }
        }

        // Count completed weekly plans
        progress.WeeklyPlansCompleted = await _context.VisitPlans
            .Where(p => p.RepId == repId && p.PlanWeek.Year == year && p.Status == VisitPlanStatus.Approved)
            .CountAsync(cancellationToken);
    }

    private static AnnualPlanDetailDto MapToAnnualPlanDetailDto(AnnualPlan plan)
    {
        return new AnnualPlanDetailDto
        {
            Id = plan.Id,
            RepId = plan.RepId,
            RepName = $"{plan.Rep.User.FirstName} {plan.Rep.User.LastName}",
            Year = plan.Year,
            Title = plan.Title,
            TerritoryDescription = plan.TerritoryDescription,
            AssignedCantons = plan.AssignedCantons,
            RevenueTarget = plan.RevenueTarget,
            VisitsTarget = plan.VisitsTarget,
            NewCustomersTarget = plan.NewCustomersTarget,
            MajorEvents = plan.MajorEvents,
            StrategicPriorities = plan.StrategicPriorities,
            FocusProducts = plan.FocusProducts,
            Status = plan.Status,
            ApprovedBy = plan.ApprovedBy,
            ApprovedAt = plan.ApprovedAt,
            Notes = plan.Notes,
            CreatedAt = plan.CreatedAt,
            UpdatedAt = plan.UpdatedAt,
            QuarterlyPlans = plan.QuarterlyPlans
                .OrderBy(q => q.Quarter)
                .Select(q => new QuarterlyPlanSummaryDto
                {
                    Id = q.Id,
                    AnnualPlanId = q.AnnualPlanId,
                    RepId = q.RepId,
                    Year = q.Year,
                    Quarter = q.Quarter,
                    Title = q.Title,
                    Status = q.Status,
                    RevenueTarget = q.RevenueTarget,
                    VisitsTarget = q.VisitsTarget,
                    NewCustomersTarget = q.NewCustomersTarget,
                    MonthlyPlansCount = q.MonthlyPlans.Count,
                    CreatedAt = q.CreatedAt,
                    ApprovedAt = q.ApprovedAt
                })
                .ToList()
        };
    }

    private static QuarterlyPlanDetailDto MapToQuarterlyPlanDetailDto(QuarterlyPlan plan)
    {
        return new QuarterlyPlanDetailDto
        {
            Id = plan.Id,
            AnnualPlanId = plan.AnnualPlanId,
            RepId = plan.RepId,
            RepName = $"{plan.Rep.User.FirstName} {plan.Rep.User.LastName}",
            Year = plan.Year,
            Quarter = plan.Quarter,
            Title = plan.Title,
            RevenueTarget = plan.RevenueTarget,
            VisitsTarget = plan.VisitsTarget,
            NewCustomersTarget = plan.NewCustomersTarget,
            CampaignSchedule = plan.CampaignSchedule,
            TrainingSchedule = plan.TrainingSchedule,
            ResourceAllocation = plan.ResourceAllocation,
            KeyObjectives = plan.KeyObjectives,
            FocusProducts = plan.FocusProducts,
            Status = plan.Status,
            ApprovedBy = plan.ApprovedBy,
            ApprovedAt = plan.ApprovedAt,
            RejectionReason = plan.RejectionReason,
            Notes = plan.Notes,
            CreatedAt = plan.CreatedAt,
            UpdatedAt = plan.UpdatedAt,
            MonthlyPlans = plan.MonthlyPlans
                .OrderBy(m => m.Month)
                .Select(m => new MonthlyPlanSummaryDto
                {
                    Id = m.Id,
                    QuarterlyPlanId = m.QuarterlyPlanId,
                    RepId = m.RepId,
                    Year = m.Year,
                    Month = m.Month,
                    Title = m.Title,
                    Status = m.Status,
                    RevenueTarget = m.RevenueTarget,
                    VisitsTarget = m.VisitsTarget,
                    WeeklyPlansCount = m.WeeklyPlans.Count,
                    ActualRevenue = m.ActualRevenue,
                    ActualVisits = m.ActualVisits,
                    CreatedAt = m.CreatedAt,
                    ApprovedAt = m.ApprovedAt
                })
                .ToList()
        };
    }

    private static MonthlyPlanDetailDto MapToMonthlyPlanDetailDto(MonthlyPlan plan)
    {
        return new MonthlyPlanDetailDto
        {
            Id = plan.Id,
            QuarterlyPlanId = plan.QuarterlyPlanId,
            RepId = plan.RepId,
            RepName = $"{plan.Rep.User.FirstName} {plan.Rep.User.LastName}",
            Year = plan.Year,
            Month = plan.Month,
            Title = plan.Title,
            RevenueTarget = plan.RevenueTarget,
            VisitsTarget = plan.VisitsTarget,
            TierACoverageTarget = plan.TierACoverageTarget,
            TierBCoverageTarget = plan.TierBCoverageTarget,
            TierCCoverageTarget = plan.TierCCoverageTarget,
            PromotionalActivities = plan.PromotionalActivities,
            TrainingSchedule = plan.TrainingSchedule,
            FocusProducts = plan.FocusProducts,
            PriorityCustomers = plan.PriorityCustomers,
            Status = plan.Status,
            ApprovedBy = plan.ApprovedBy,
            ApprovedAt = plan.ApprovedAt,
            RejectionReason = plan.RejectionReason,
            Notes = plan.Notes,
            ActualRevenue = plan.ActualRevenue,
            ActualVisits = plan.ActualVisits,
            CreatedAt = plan.CreatedAt,
            UpdatedAt = plan.UpdatedAt,
            WeeklyPlans = plan.WeeklyPlans
                .OrderBy(w => w.PlanWeek)
                .Select(w => new WeeklyPlanSummaryDto
                {
                    Id = w.Id,
                    PlanWeek = w.PlanWeek,
                    Status = w.Status.ToString(),
                    PlannedVisitsCount = w.PlannedVisits.Count,
                    ExecutedVisitsCount = w.PlannedVisits.Count(pv => pv.ExecutedVisit != null),
                    SubmittedAt = w.SubmittedAt,
                    ApprovedAt = w.ApprovedAt
                })
                .ToList()
        };
    }

    #endregion
}
