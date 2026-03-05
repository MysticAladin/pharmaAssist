using Application.DTOs.Common;
using Application.DTOs.Cycles;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace Application.Services;

public class CycleService : ICycleService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CycleService> _logger;

    public CycleService(IUnitOfWork unitOfWork, ILogger<CycleService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    #region Cycles

    public async Task<ApiResponse<CycleDto>> GetCycleByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var cycle = await _unitOfWork.Cycles.AsQueryable()
                .Include(c => c.Owner)
                .Include(c => c.Targets.Where(t => !t.IsDeleted))
                    .ThenInclude(t => t.Customer)
                .Include(c => c.Targets.Where(t => !t.IsDeleted))
                    .ThenInclude(t => t.Rep)
                .Include(c => c.Campaigns.Where(ca => !ca.IsDeleted))
                .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

            if (cycle == null)
                return ApiResponse<CycleDto>.Fail("Cycle not found");

            return ApiResponse<CycleDto>.Ok(await MapCycleToDtoAsync(cycle, cancellationToken));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cycle {CycleId}", id);
            return ApiResponse<CycleDto>.Fail("An error occurred while retrieving the cycle");
        }
    }

    public async Task<PagedResponse<CycleSummaryDto>> GetCyclesPagedAsync(
        int page, int pageSize, string? search = null, int? status = null,
        bool? activeOnly = true, string? sortBy = null, string? sortDirection = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            IQueryable<Cycle> query = _unitOfWork.Cycles.AsQueryable()
                .Include(c => c.Owner)
                .Include(c => c.Targets.Where(t => !t.IsDeleted))
                .Include(c => c.Campaigns.Where(ca => !ca.IsDeleted));

            if (activeOnly == true)
                query = query.Where(c => c.IsActive);

            if (status.HasValue)
                query = query.Where(c => c.Status == (CycleStatus)status.Value);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.ToLower();
                query = query.Where(c =>
                    c.Name.ToLower().Contains(term) ||
                    (c.NameLocal != null && c.NameLocal.ToLower().Contains(term)) ||
                    (c.Description != null && c.Description.ToLower().Contains(term)));
            }

            var isDesc = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);
            query = sortBy?.ToLower() switch
            {
                "name" => isDesc ? query.OrderByDescending(c => c.Name) : query.OrderBy(c => c.Name),
                "startdate" => isDesc ? query.OrderByDescending(c => c.StartDate) : query.OrderBy(c => c.StartDate),
                "enddate" => isDesc ? query.OrderByDescending(c => c.EndDate) : query.OrderBy(c => c.EndDate),
                "status" => isDesc ? query.OrderByDescending(c => c.Status) : query.OrderBy(c => c.Status),
                _ => query.OrderByDescending(c => c.StartDate)
            };

            var totalCount = await query.CountAsync(cancellationToken);
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            var dtos = items.Select(c =>
            {
                var totalTargetVisits = c.Targets.Sum(t => t.RequiredVisits);
                var completedVisits = c.Targets.Sum(t => t.CompletedVisits);
                return new CycleSummaryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    NameLocal = c.NameLocal,
                    StartDate = c.StartDate,
                    EndDate = c.EndDate,
                    Status = c.Status,
                    StatusName = c.Status.ToString(),
                    OwnerName = c.Owner != null ? $"{c.Owner.EmployeeCode}" : null,
                    PlannedBudget = c.PlannedBudget,
                    TotalTargets = c.Targets.Count,
                    CompletedTargets = c.Targets.Count(t => t.CompletedVisits >= t.RequiredVisits),
                    CompletionPercentage = totalTargetVisits > 0 ? Math.Round((decimal)completedVisits / totalTargetVisits * 100, 1) : 0,
                    CampaignCount = c.Campaigns.Count,
                    IsActive = c.IsActive
                };
            }).ToList();

            return PagedResponse<CycleSummaryDto>.Create(dtos, totalCount, page, pageSize);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting paged cycles");
            return PagedResponse<CycleSummaryDto>.Create(new List<CycleSummaryDto>(), 0, page, pageSize);
        }
    }

    public async Task<ApiResponse<CycleDto>> CreateCycleAsync(CreateCycleDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            if (dto.EndDate <= dto.StartDate)
                return ApiResponse<CycleDto>.Fail("End date must be after start date");

            var cycle = new Cycle
            {
                Name = dto.Name,
                NameLocal = dto.NameLocal,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Status = CycleStatus.Draft,
                FocusBrandIds = dto.FocusBrandIds,
                Description = dto.Description,
                OwnerId = dto.OwnerId,
                PlannedBudget = dto.PlannedBudget,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Cycles.AddAsync(cycle, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return await GetCycleByIdAsync(cycle.Id, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating cycle");
            return ApiResponse<CycleDto>.Fail("An error occurred while creating the cycle");
        }
    }

    public async Task<ApiResponse<CycleDto>> UpdateCycleAsync(int id, UpdateCycleDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var cycle = await _unitOfWork.Cycles.GetByIdAsync(id, cancellationToken);
            if (cycle == null)
                return ApiResponse<CycleDto>.Fail("Cycle not found");

            if (cycle.Status == CycleStatus.Completed)
                return ApiResponse<CycleDto>.Fail("Cannot edit a completed cycle");

            cycle.Name = dto.Name;
            cycle.NameLocal = dto.NameLocal;
            cycle.StartDate = dto.StartDate;
            cycle.EndDate = dto.EndDate;
            cycle.FocusBrandIds = dto.FocusBrandIds;
            cycle.Description = dto.Description;
            cycle.OwnerId = dto.OwnerId;
            cycle.PlannedBudget = dto.PlannedBudget;
            cycle.IsActive = dto.IsActive;
            cycle.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return await GetCycleByIdAsync(id, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating cycle {CycleId}", id);
            return ApiResponse<CycleDto>.Fail("An error occurred while updating the cycle");
        }
    }

    public async Task<ApiResponse<bool>> DeleteCycleAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var cycle = await _unitOfWork.Cycles.GetByIdAsync(id, cancellationToken);
            if (cycle == null)
                return ApiResponse<bool>.Fail("Cycle not found");

            cycle.IsDeleted = true;
            cycle.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return ApiResponse<bool>.Ok(true, "Cycle deleted");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting cycle {CycleId}", id);
            return ApiResponse<bool>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<bool>> ActivateCycleAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var cycle = await _unitOfWork.Cycles.GetByIdAsync(id, cancellationToken);
            if (cycle == null)
                return ApiResponse<bool>.Fail("Cycle not found");

            if (cycle.Status != CycleStatus.Draft && cycle.Status != CycleStatus.Paused)
                return ApiResponse<bool>.Fail("Only draft or paused cycles can be activated");

            cycle.Status = CycleStatus.Active;
            cycle.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return ApiResponse<bool>.Ok(true, "Cycle activated");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error activating cycle {CycleId}", id);
            return ApiResponse<bool>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<bool>> CompleteCycleAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var cycle = await _unitOfWork.Cycles.GetByIdAsync(id, cancellationToken);
            if (cycle == null)
                return ApiResponse<bool>.Fail("Cycle not found");

            cycle.Status = CycleStatus.Completed;
            cycle.IsActive = false;
            cycle.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return ApiResponse<bool>.Ok(true, "Cycle completed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing cycle {CycleId}", id);
            return ApiResponse<bool>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<CycleDto>> CopyCycleAsync(int id, string newName, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default)
    {
        try
        {
            var source = await _unitOfWork.Cycles.AsQueryable()
                .Include(c => c.Targets.Where(t => !t.IsDeleted))
                .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

            if (source == null)
                return ApiResponse<CycleDto>.Fail("Source cycle not found");

            var newCycle = new Cycle
            {
                Name = newName,
                NameLocal = source.NameLocal,
                StartDate = startDate,
                EndDate = endDate,
                Status = CycleStatus.Draft,
                FocusBrandIds = source.FocusBrandIds,
                Description = source.Description,
                OwnerId = source.OwnerId,
                PlannedBudget = source.PlannedBudget,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Cycles.AddAsync(newCycle, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Copy targets
            foreach (var target in source.Targets)
            {
                await _unitOfWork.CycleTargets.AddAsync(new CycleTarget
                {
                    CycleId = newCycle.Id,
                    CustomerId = target.CustomerId,
                    RepId = target.RepId,
                    RequiredVisits = target.RequiredVisits,
                    Priority = target.Priority,
                    TargetProducts = target.TargetProducts,
                    Notes = target.Notes,
                    CreatedAt = DateTime.UtcNow
                }, cancellationToken);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return await GetCycleByIdAsync(newCycle.Id, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error copying cycle {CycleId}", id);
            return ApiResponse<CycleDto>.Fail("An error occurred while copying the cycle");
        }
    }

    #endregion

    #region Cycle Targets

    public async Task<ApiResponse<CycleTargetDto>> AddCycleTargetAsync(int cycleId, CreateCycleTargetDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var cycle = await _unitOfWork.Cycles.GetByIdAsync(cycleId, cancellationToken);
            if (cycle == null)
                return ApiResponse<CycleTargetDto>.Fail("Cycle not found");

            var exists = await _unitOfWork.CycleTargets.AnyAsync(
                t => t.CycleId == cycleId && t.CustomerId == dto.CustomerId && t.RepId == dto.RepId, cancellationToken);
            if (exists)
                return ApiResponse<CycleTargetDto>.Fail("Target already exists for this customer-rep pair");

            var target = new CycleTarget
            {
                CycleId = cycleId,
                CustomerId = dto.CustomerId,
                RepId = dto.RepId,
                RequiredVisits = dto.RequiredVisits,
                Priority = dto.Priority,
                TargetProducts = dto.TargetProducts,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.CycleTargets.AddAsync(target, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var created = await _unitOfWork.CycleTargets.AsQueryable()
                .Include(t => t.Customer)
                .Include(t => t.Rep)
                .FirstAsync(t => t.Id == target.Id, cancellationToken);

            return ApiResponse<CycleTargetDto>.Ok(MapCycleTargetToDto(created));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding cycle target");
            return ApiResponse<CycleTargetDto>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<IEnumerable<CycleTargetDto>>> BulkAddCycleTargetsAsync(int cycleId, BulkCreateCycleTargetsDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var cycle = await _unitOfWork.Cycles.GetByIdAsync(cycleId, cancellationToken);
            if (cycle == null)
                return ApiResponse<IEnumerable<CycleTargetDto>>.Fail("Cycle not found");

            var added = new List<CycleTarget>();
            foreach (var customerId in dto.CustomerIds)
            {
                var exists = await _unitOfWork.CycleTargets.AnyAsync(
                    t => t.CycleId == cycleId && t.CustomerId == customerId && t.RepId == dto.RepId, cancellationToken);
                if (exists) continue;

                var target = new CycleTarget
                {
                    CycleId = cycleId,
                    CustomerId = customerId,
                    RepId = dto.RepId,
                    RequiredVisits = dto.RequiredVisits,
                    Priority = dto.Priority,
                    TargetProducts = dto.TargetProducts,
                    CreatedAt = DateTime.UtcNow
                };

                await _unitOfWork.CycleTargets.AddAsync(target, cancellationToken);
                added.Add(target);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var ids = added.Select(t => t.Id).ToList();
            var results = await _unitOfWork.CycleTargets.AsQueryable()
                .Where(t => ids.Contains(t.Id))
                .Include(t => t.Customer)
                .Include(t => t.Rep)
                .ToListAsync(cancellationToken);

            return ApiResponse<IEnumerable<CycleTargetDto>>.Ok(
                results.Select(MapCycleTargetToDto),
                $"Added {added.Count} targets");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error bulk adding cycle targets");
            return ApiResponse<IEnumerable<CycleTargetDto>>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<bool>> RemoveCycleTargetAsync(int cycleId, int targetId, CancellationToken cancellationToken = default)
    {
        try
        {
            var target = await _unitOfWork.CycleTargets.FirstOrDefaultAsync(
                t => t.Id == targetId && t.CycleId == cycleId, cancellationToken);
            if (target == null)
                return ApiResponse<bool>.Fail("Target not found");

            target.IsDeleted = true;
            target.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return ApiResponse<bool>.Ok(true, "Target removed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing cycle target {TargetId}", targetId);
            return ApiResponse<bool>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<IEnumerable<CycleTargetDto>>> GetCycleTargetsAsync(int cycleId, int? repId = null, CancellationToken cancellationToken = default)
    {
        try
        {
            IQueryable<CycleTarget> query = _unitOfWork.CycleTargets.AsQueryable()
                .Where(t => t.CycleId == cycleId)
                .Include(t => t.Customer)
                .Include(t => t.Rep);

            if (repId.HasValue)
                query = query.Where(t => t.RepId == repId.Value);

            var targets = await query
                .OrderBy(t => t.Priority)
                .ThenBy(t => t.Customer.CompanyName)
                .ToListAsync(cancellationToken);

            return ApiResponse<IEnumerable<CycleTargetDto>>.Ok(targets.Select(MapCycleTargetToDto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cycle targets");
            return ApiResponse<IEnumerable<CycleTargetDto>>.Fail("An error occurred");
        }
    }

    #endregion

    #region Campaigns

    public async Task<ApiResponse<CampaignDto>> GetCampaignByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var campaign = await _unitOfWork.Campaigns.AsQueryable()
                .Include(c => c.Cycle)
                .Include(c => c.Targets.Where(t => !t.IsDeleted))
                    .ThenInclude(t => t.Customer)
                .Include(c => c.Targets.Where(t => !t.IsDeleted))
                    .ThenInclude(t => t.Rep)
                .Include(c => c.Expenses.Where(e => !e.IsDeleted))
                .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

            if (campaign == null)
                return ApiResponse<CampaignDto>.Fail("Campaign not found");

            return ApiResponse<CampaignDto>.Ok(MapCampaignToDto(campaign));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting campaign {CampaignId}", id);
            return ApiResponse<CampaignDto>.Fail("An error occurred");
        }
    }

    public async Task<PagedResponse<CampaignSummaryDto>> GetCampaignsPagedAsync(
        int page, int pageSize, string? search = null, int? cycleId = null,
        int? type = null, int? status = null,
        string? sortBy = null, string? sortDirection = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            IQueryable<Campaign> query = _unitOfWork.Campaigns.AsQueryable()
                .Include(c => c.Cycle)
                .Include(c => c.Targets.Where(t => !t.IsDeleted));

            if (cycleId.HasValue)
                query = query.Where(c => c.CycleId == cycleId.Value);

            if (type.HasValue)
                query = query.Where(c => c.Type == (CampaignType)type.Value);

            if (status.HasValue)
                query = query.Where(c => c.Status == (CampaignStatus)status.Value);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.ToLower();
                query = query.Where(c =>
                    c.Name.ToLower().Contains(term) ||
                    (c.NameLocal != null && c.NameLocal.ToLower().Contains(term)));
            }

            var isDesc = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);
            query = sortBy?.ToLower() switch
            {
                "name" => isDesc ? query.OrderByDescending(c => c.Name) : query.OrderBy(c => c.Name),
                "startdate" => isDesc ? query.OrderByDescending(c => c.StartDate) : query.OrderBy(c => c.StartDate),
                "status" => isDesc ? query.OrderByDescending(c => c.Status) : query.OrderBy(c => c.Status),
                "budget" => isDesc ? query.OrderByDescending(c => c.PlannedBudget) : query.OrderBy(c => c.PlannedBudget),
                _ => query.OrderByDescending(c => c.StartDate)
            };

            var totalCount = await query.CountAsync(cancellationToken);
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            var dtos = items.Select(c => new CampaignSummaryDto
            {
                Id = c.Id,
                Name = c.Name,
                NameLocal = c.NameLocal,
                CycleId = c.CycleId,
                CycleName = c.Cycle?.Name,
                Type = c.Type,
                TypeName = c.Type.ToString(),
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                Status = c.Status,
                StatusName = c.Status.ToString(),
                PlannedBudget = c.PlannedBudget,
                ActualSpent = c.ActualSpent,
                TotalTargets = c.Targets.Count,
                CompletedTargets = c.Targets.Count(t => t.Status == CampaignTargetStatus.Completed),
                CompletionPercentage = c.Targets.Count > 0
                    ? Math.Round((decimal)c.Targets.Count(t => t.Status == CampaignTargetStatus.Completed) / c.Targets.Count * 100, 1)
                    : 0,
                IsActive = c.IsActive
            }).ToList();

            return PagedResponse<CampaignSummaryDto>.Create(dtos, totalCount, page, pageSize);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting paged campaigns");
            return PagedResponse<CampaignSummaryDto>.Create(new List<CampaignSummaryDto>(), 0, page, pageSize);
        }
    }

    public async Task<ApiResponse<CampaignDto>> CreateCampaignAsync(CreateCampaignDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            if (dto.EndDate <= dto.StartDate)
                return ApiResponse<CampaignDto>.Fail("End date must be after start date");

            var campaign = new Campaign
            {
                CycleId = dto.CycleId,
                Name = dto.Name,
                NameLocal = dto.NameLocal,
                Type = dto.Type,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                PlannedBudget = dto.PlannedBudget,
                Status = CampaignStatus.Draft,
                TargetingCriteria = dto.TargetingCriteria,
                Description = dto.Description,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Campaigns.AddAsync(campaign, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return await GetCampaignByIdAsync(campaign.Id, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating campaign");
            return ApiResponse<CampaignDto>.Fail("An error occurred while creating the campaign");
        }
    }

    public async Task<ApiResponse<CampaignDto>> UpdateCampaignAsync(int id, UpdateCampaignDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var campaign = await _unitOfWork.Campaigns.GetByIdAsync(id, cancellationToken);
            if (campaign == null)
                return ApiResponse<CampaignDto>.Fail("Campaign not found");

            campaign.CycleId = dto.CycleId;
            campaign.Name = dto.Name;
            campaign.NameLocal = dto.NameLocal;
            campaign.Type = dto.Type;
            campaign.StartDate = dto.StartDate;
            campaign.EndDate = dto.EndDate;
            campaign.PlannedBudget = dto.PlannedBudget;
            campaign.TargetingCriteria = dto.TargetingCriteria;
            campaign.Description = dto.Description;
            campaign.IsActive = dto.IsActive;
            campaign.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return await GetCampaignByIdAsync(id, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating campaign {CampaignId}", id);
            return ApiResponse<CampaignDto>.Fail("An error occurred while updating the campaign");
        }
    }

    public async Task<ApiResponse<bool>> DeleteCampaignAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var campaign = await _unitOfWork.Campaigns.GetByIdAsync(id, cancellationToken);
            if (campaign == null)
                return ApiResponse<bool>.Fail("Campaign not found");

            campaign.IsDeleted = true;
            campaign.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return ApiResponse<bool>.Ok(true, "Campaign deleted");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting campaign {CampaignId}", id);
            return ApiResponse<bool>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<bool>> ActivateCampaignAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var campaign = await _unitOfWork.Campaigns.GetByIdAsync(id, cancellationToken);
            if (campaign == null)
                return ApiResponse<bool>.Fail("Campaign not found");

            campaign.Status = CampaignStatus.Active;
            campaign.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return ApiResponse<bool>.Ok(true, "Campaign activated");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error activating campaign {CampaignId}", id);
            return ApiResponse<bool>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<bool>> CompleteCampaignAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var campaign = await _unitOfWork.Campaigns.GetByIdAsync(id, cancellationToken);
            if (campaign == null)
                return ApiResponse<bool>.Fail("Campaign not found");

            campaign.Status = CampaignStatus.Completed;
            campaign.IsActive = false;
            campaign.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return ApiResponse<bool>.Ok(true, "Campaign completed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing campaign {CampaignId}", id);
            return ApiResponse<bool>.Fail("An error occurred");
        }
    }

    #endregion

    #region Campaign Targets

    public async Task<ApiResponse<CampaignTargetDto>> AddCampaignTargetAsync(int campaignId, CreateCampaignTargetDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var exists = await _unitOfWork.CampaignTargets.AnyAsync(
                t => t.CampaignId == campaignId && t.CustomerId == dto.CustomerId, cancellationToken);
            if (exists)
                return ApiResponse<CampaignTargetDto>.Fail("Customer is already a target in this campaign");

            var target = new CampaignTarget
            {
                CampaignId = campaignId,
                CustomerId = dto.CustomerId,
                RepId = dto.RepId,
                Status = CampaignTargetStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.CampaignTargets.AddAsync(target, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var created = await _unitOfWork.CampaignTargets.AsQueryable()
                .Include(t => t.Customer)
                .Include(t => t.Rep)
                .FirstAsync(t => t.Id == target.Id, cancellationToken);

            return ApiResponse<CampaignTargetDto>.Ok(MapCampaignTargetToDto(created));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding campaign target");
            return ApiResponse<CampaignTargetDto>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<bool>> RemoveCampaignTargetAsync(int campaignId, int targetId, CancellationToken cancellationToken = default)
    {
        try
        {
            var target = await _unitOfWork.CampaignTargets.FirstOrDefaultAsync(
                t => t.Id == targetId && t.CampaignId == campaignId, cancellationToken);
            if (target == null)
                return ApiResponse<bool>.Fail("Target not found");

            target.IsDeleted = true;
            target.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return ApiResponse<bool>.Ok(true, "Target removed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing campaign target {TargetId}", targetId);
            return ApiResponse<bool>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<CampaignTargetDto>> UpdateCampaignTargetStatusAsync(
        int campaignId, int targetId, UpdateCampaignTargetStatusDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var target = await _unitOfWork.CampaignTargets.AsQueryable()
                .Include(t => t.Customer)
                .Include(t => t.Rep)
                .FirstOrDefaultAsync(t => t.Id == targetId && t.CampaignId == campaignId, cancellationToken);

            if (target == null)
                return ApiResponse<CampaignTargetDto>.Fail("Target not found");

            target.Status = dto.Status;
            target.Notes = dto.Notes;
            target.UpdatedAt = DateTime.UtcNow;

            if (dto.Status == CampaignTargetStatus.Contacted && target.ContactedAt == null)
                target.ContactedAt = DateTime.UtcNow;
            if (dto.Status == CampaignTargetStatus.Completed && target.CompletedAt == null)
                target.CompletedAt = DateTime.UtcNow;

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Update campaign's actual spent if completing (recalculate)
            await RecalculateCampaignSpendAsync(campaignId, cancellationToken);

            return ApiResponse<CampaignTargetDto>.Ok(MapCampaignTargetToDto(target));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating campaign target status");
            return ApiResponse<CampaignTargetDto>.Fail("An error occurred");
        }
    }

    #endregion

    #region Campaign Expenses

    public async Task<ApiResponse<CampaignExpenseDto>> CreateCampaignExpenseAsync(CreateCampaignExpenseDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var expense = new CampaignExpense
            {
                CampaignId = dto.CampaignId,
                CycleId = dto.CycleId,
                CustomerId = dto.CustomerId,
                RepId = dto.RepId,
                Category = dto.Category,
                Description = dto.Description,
                Amount = dto.Amount,
                ExpenseDate = dto.ExpenseDate,
                ReferenceNumber = dto.ReferenceNumber,
                AttachmentPath = dto.AttachmentPath,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.CampaignExpenses.AddAsync(expense, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Update campaign actual spent if linked
            if (dto.CampaignId.HasValue)
                await RecalculateCampaignSpendAsync(dto.CampaignId.Value, cancellationToken);

            return ApiResponse<CampaignExpenseDto>.Ok(MapExpenseToDto(expense), "Expense created");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating campaign expense");
            return ApiResponse<CampaignExpenseDto>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<bool>> DeleteCampaignExpenseAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var expense = await _unitOfWork.CampaignExpenses.GetByIdAsync(id, cancellationToken);
            if (expense == null)
                return ApiResponse<bool>.Fail("Expense not found");

            var campaignId = expense.CampaignId;
            expense.IsDeleted = true;
            expense.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            if (campaignId.HasValue)
                await RecalculateCampaignSpendAsync(campaignId.Value, cancellationToken);

            return ApiResponse<bool>.Ok(true, "Expense deleted");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting expense {ExpenseId}", id);
            return ApiResponse<bool>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<IEnumerable<CampaignExpenseDto>>> GetExpensesByCampaignAsync(int campaignId, CancellationToken cancellationToken = default)
    {
        try
        {
            var expenses = await _unitOfWork.CampaignExpenses.AsQueryable()
                .Where(e => e.CampaignId == campaignId)
                .Include(e => e.Customer)
                .Include(e => e.Rep)
                .OrderByDescending(e => e.ExpenseDate)
                .ToListAsync(cancellationToken);

            return ApiResponse<IEnumerable<CampaignExpenseDto>>.Ok(expenses.Select(MapExpenseToDto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting expenses for campaign {CampaignId}", campaignId);
            return ApiResponse<IEnumerable<CampaignExpenseDto>>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<bool>> ApproveCampaignExpenseAsync(int id, string? notes = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var expense = await _unitOfWork.CampaignExpenses.GetByIdAsync(id, cancellationToken);
            if (expense == null)
                return ApiResponse<bool>.Fail("Expense not found");

            expense.IsApproved = true;
            expense.ApprovalNotes = notes;
            expense.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return ApiResponse<bool>.Ok(true, "Expense approved");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving expense {ExpenseId}", id);
            return ApiResponse<bool>.Fail("An error occurred");
        }
    }

    #endregion

    #region Client Investment

    public async Task<ApiResponse<ClientInvestmentDto>> GetClientInvestmentAsync(
        int customerId, DateTime? fromDate = null, DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var from = fromDate ?? DateTime.UtcNow.AddYears(-1);
            var to = toDate ?? DateTime.UtcNow;

            var customer = await _unitOfWork.Customers.GetByIdAsync(customerId, cancellationToken);
            if (customer == null)
                return ApiResponse<ClientInvestmentDto>.Fail("Customer not found");

            // Get all expenses for this customer
            var expenses = await _unitOfWork.CampaignExpenses.AsQueryable()
                .Where(e => e.CustomerId == customerId && e.ExpenseDate >= from && e.ExpenseDate <= to)
                .OrderByDescending(e => e.ExpenseDate)
                .ToListAsync(cancellationToken);

            // Get campaign spend targeting this customer
            var campaignIds = await _unitOfWork.CampaignTargets.AsQueryable()
                .Where(t => t.CustomerId == customerId && t.Status == CampaignTargetStatus.Completed)
                .Select(t => t.CampaignId)
                .Distinct()
                .ToListAsync(cancellationToken);

            var campaignSpend = campaignIds.Any()
                ? await _unitOfWork.CampaignExpenses.AsQueryable()
                    .Where(e => e.CampaignId != null && campaignIds.Contains(e.CampaignId!.Value) && e.ExpenseDate >= from && e.ExpenseDate <= to)
                    .SumAsync(e => e.Amount, cancellationToken)
                : 0m;

            // Get visit count
            var visitCount = await _unitOfWork.ExecutedVisits.AsQueryable()
                .Where(v => v.CustomerId == customerId && v.CheckInTime >= from && v.CheckInTime <= to)
                .CountAsync(cancellationToken);

            // Aggregate by category
            var byCategory = expenses
                .GroupBy(e => e.Category.ToString())
                .ToDictionary(g => g.Key, g => g.Sum(e => e.Amount));

            // Aggregate by month
            var byMonth = expenses
                .GroupBy(e => e.ExpenseDate.ToString("yyyy-MM"))
                .OrderBy(g => g.Key)
                .ToDictionary(g => g.Key, g => g.Sum(e => e.Amount));

            var travel = expenses.Where(e => e.Category == CampaignExpenseCategory.Travel).Sum(e => e.Amount);
            var materials = expenses.Where(e => e.Category == CampaignExpenseCategory.Materials).Sum(e => e.Amount);
            var samples = expenses.Where(e => e.Category == CampaignExpenseCategory.Samples).Sum(e => e.Amount);
            var events = expenses.Where(e => e.Category == CampaignExpenseCategory.Events).Sum(e => e.Amount);
            var promotional = expenses.Where(e => e.Category == CampaignExpenseCategory.Promotional).Sum(e => e.Amount);
            var other = expenses.Where(e =>
                e.Category != CampaignExpenseCategory.Travel &&
                e.Category != CampaignExpenseCategory.Materials &&
                e.Category != CampaignExpenseCategory.Samples &&
                e.Category != CampaignExpenseCategory.Events &&
                e.Category != CampaignExpenseCategory.Promotional).Sum(e => e.Amount);

            var totalExpenses = expenses.Sum(e => e.Amount);

            var dto = new ClientInvestmentDto
            {
                CustomerId = customerId,
                CustomerName = customer.CompanyName ?? $"{customer.FirstName} {customer.LastName}",
                CustomerType = customer.CustomerType.ToString(),
                TotalVisits = visitCount,
                TravelExpenses = travel,
                MaterialExpenses = materials,
                SampleExpenses = samples,
                EventExpenses = events,
                PromotionalExpenses = promotional,
                OtherExpenses = other,
                TotalExpenses = totalExpenses,
                CampaignSpend = campaignSpend,
                TotalInvestment = totalExpenses + campaignSpend,
                RecentExpenses = expenses.Take(10).Select(MapExpenseToDto).ToList(),
                ByCategory = byCategory,
                ByMonth = byMonth
            };

            return ApiResponse<ClientInvestmentDto>.Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting client investment for customer {CustomerId}", customerId);
            return ApiResponse<ClientInvestmentDto>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<IEnumerable<ClientInvestmentDto>>> GetTopInvestmentsAsync(
        int top = 20, DateTime? fromDate = null, DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var from = fromDate ?? DateTime.UtcNow.AddYears(-1);
            var to = toDate ?? DateTime.UtcNow;

            // Get top customers by expense amount
            var topCustomers = await _unitOfWork.CampaignExpenses.AsQueryable()
                .Where(e => e.CustomerId != null && e.ExpenseDate >= from && e.ExpenseDate <= to)
                .GroupBy(e => e.CustomerId!.Value)
                .Select(g => new { CustomerId = g.Key, Total = g.Sum(e => e.Amount) })
                .OrderByDescending(x => x.Total)
                .Take(top)
                .ToListAsync(cancellationToken);

            var results = new List<ClientInvestmentDto>();
            foreach (var tc in topCustomers)
            {
                var result = await GetClientInvestmentAsync(tc.CustomerId, from, to, cancellationToken);
                if (result.Success && result.Data != null)
                    results.Add(result.Data);
            }

            return ApiResponse<IEnumerable<ClientInvestmentDto>>.Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting top investments");
            return ApiResponse<IEnumerable<ClientInvestmentDto>>.Fail("An error occurred");
        }
    }

    #endregion

    #region Private Helpers

    private async Task<CycleDto> MapCycleToDtoAsync(Cycle cycle, CancellationToken cancellationToken)
    {
        // Resolve brand names from FocusBrandIds JSON
        var brandNames = new List<string>();
        if (!string.IsNullOrEmpty(cycle.FocusBrandIds))
        {
            try
            {
                var ids = JsonSerializer.Deserialize<List<int>>(cycle.FocusBrandIds);
                if (ids != null)
                {
                    var brands = await _unitOfWork.Brands.AsQueryable()
                        .Where(b => ids.Contains(b.Id))
                        .Select(b => b.Name)
                        .ToListAsync(cancellationToken);
                    brandNames = brands;
                }
            }
            catch { /* Skip malformed JSON */ }
        }

        var totalVisits = cycle.Targets.Sum(t => t.RequiredVisits);
        var completedVisits = cycle.Targets.Sum(t => t.CompletedVisits);

        return new CycleDto
        {
            Id = cycle.Id,
            Name = cycle.Name,
            NameLocal = cycle.NameLocal,
            StartDate = cycle.StartDate,
            EndDate = cycle.EndDate,
            Status = cycle.Status,
            StatusName = cycle.Status.ToString(),
            FocusBrandIds = cycle.FocusBrandIds,
            FocusBrandNames = brandNames,
            Description = cycle.Description,
            OwnerId = cycle.OwnerId,
            OwnerName = cycle.Owner != null ? $"{cycle.Owner.EmployeeCode}" : null,
            PlannedBudget = cycle.PlannedBudget,
            IsActive = cycle.IsActive,
            TotalTargets = cycle.Targets.Count,
            CompletedTargets = cycle.Targets.Count(t => t.CompletedVisits >= t.RequiredVisits),
            CompletionPercentage = totalVisits > 0 ? Math.Round((decimal)completedVisits / totalVisits * 100, 1) : 0,
            Targets = cycle.Targets.Select(MapCycleTargetToDto).ToList(),
            Campaigns = cycle.Campaigns.Select(c => new CampaignSummaryDto
            {
                Id = c.Id,
                Name = c.Name,
                NameLocal = c.NameLocal,
                CycleId = c.CycleId,
                Type = c.Type,
                TypeName = c.Type.ToString(),
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                Status = c.Status,
                StatusName = c.Status.ToString(),
                PlannedBudget = c.PlannedBudget,
                ActualSpent = c.ActualSpent,
                IsActive = c.IsActive
            }).ToList(),
            CreatedAt = cycle.CreatedAt,
            UpdatedAt = cycle.UpdatedAt
        };
    }

    private static CycleTargetDto MapCycleTargetToDto(CycleTarget target)
    {
        return new CycleTargetDto
        {
            Id = target.Id,
            CycleId = target.CycleId,
            CustomerId = target.CustomerId,
            CustomerName = target.Customer?.CompanyName ?? "Unknown",
            CustomerType = target.Customer?.CustomerType.ToString(),
            RepId = target.RepId,
            RepName = target.Rep?.EmployeeCode ?? "Unknown",
            RequiredVisits = target.RequiredVisits,
            CompletedVisits = target.CompletedVisits,
            CompletionPercentage = target.RequiredVisits > 0
                ? Math.Round((decimal)target.CompletedVisits / target.RequiredVisits * 100, 1)
                : 0,
            Priority = target.Priority,
            TargetProducts = target.TargetProducts,
            Notes = target.Notes
        };
    }

    private static CampaignDto MapCampaignToDto(Campaign campaign)
    {
        return new CampaignDto
        {
            Id = campaign.Id,
            CycleId = campaign.CycleId,
            CycleName = campaign.Cycle?.Name,
            Name = campaign.Name,
            NameLocal = campaign.NameLocal,
            Type = campaign.Type,
            TypeName = campaign.Type.ToString(),
            StartDate = campaign.StartDate,
            EndDate = campaign.EndDate,
            PlannedBudget = campaign.PlannedBudget,
            ActualSpent = campaign.ActualSpent,
            Status = campaign.Status,
            StatusName = campaign.Status.ToString(),
            TargetingCriteria = campaign.TargetingCriteria,
            Description = campaign.Description,
            IsActive = campaign.IsActive,
            TotalTargets = campaign.Targets.Count,
            CompletedTargets = campaign.Targets.Count(t => t.Status == CampaignTargetStatus.Completed),
            ContactedTargets = campaign.Targets.Count(t => t.Status >= CampaignTargetStatus.Contacted),
            CompletionPercentage = campaign.Targets.Count > 0
                ? Math.Round((decimal)campaign.Targets.Count(t => t.Status == CampaignTargetStatus.Completed) / campaign.Targets.Count * 100, 1)
                : 0,
            Targets = campaign.Targets.Select(MapCampaignTargetToDto).ToList(),
            Expenses = campaign.Expenses.Select(MapExpenseToDto).ToList(),
            CreatedAt = campaign.CreatedAt,
            UpdatedAt = campaign.UpdatedAt
        };
    }

    private static CampaignTargetDto MapCampaignTargetToDto(CampaignTarget target)
    {
        return new CampaignTargetDto
        {
            Id = target.Id,
            CampaignId = target.CampaignId,
            CustomerId = target.CustomerId,
            CustomerName = target.Customer?.CompanyName ?? "Unknown",
            CustomerType = target.Customer?.CustomerType.ToString(),
            RepId = target.RepId,
            RepName = target.Rep?.EmployeeCode,
            Status = target.Status,
            StatusName = target.Status.ToString(),
            ContactedAt = target.ContactedAt,
            CompletedAt = target.CompletedAt,
            Notes = target.Notes
        };
    }

    private static CampaignExpenseDto MapExpenseToDto(CampaignExpense expense)
    {
        return new CampaignExpenseDto
        {
            Id = expense.Id,
            CampaignId = expense.CampaignId,
            CampaignName = expense.Campaign?.Name,
            CycleId = expense.CycleId,
            CycleName = expense.Cycle?.Name,
            CustomerId = expense.CustomerId,
            CustomerName = expense.Customer?.CompanyName,
            RepId = expense.RepId,
            RepName = expense.Rep?.EmployeeCode,
            Category = expense.Category,
            CategoryName = expense.Category.ToString(),
            Description = expense.Description,
            Amount = expense.Amount,
            ExpenseDate = expense.ExpenseDate,
            ReferenceNumber = expense.ReferenceNumber,
            AttachmentPath = expense.AttachmentPath,
            IsApproved = expense.IsApproved,
            ApprovalNotes = expense.ApprovalNotes,
            CreatedAt = expense.CreatedAt
        };
    }

    private async Task RecalculateCampaignSpendAsync(int campaignId, CancellationToken cancellationToken)
    {
        var total = await _unitOfWork.CampaignExpenses.AsQueryable()
            .Where(e => e.CampaignId == campaignId)
            .SumAsync(e => e.Amount, cancellationToken);

        var campaign = await _unitOfWork.Campaigns.GetByIdAsync(campaignId, cancellationToken);
        if (campaign != null)
        {
            campaign.ActualSpent = total;
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }

    #endregion
}
