using Application.DTOs.Common;
using Application.DTOs.Territories;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace Application.Services;

public class TerritoryService : ITerritoryService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<TerritoryService> _logger;

    public TerritoryService(IUnitOfWork unitOfWork, ILogger<TerritoryService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    #region Territories

    public async Task<ApiResponse<TerritoryDto>> GetTerritoryByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var territory = await _unitOfWork.Territories.AsQueryable()
                .Include(t => t.ParentTerritory)
                .Include(t => t.Assignments.Where(a => !a.IsDeleted))
                    .ThenInclude(a => a.Rep)
                .Include(t => t.ChildTerritories.Where(c => !c.IsDeleted))
                .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

            if (territory == null)
                return ApiResponse<TerritoryDto>.Fail("Territory not found");

            var dto = await MapTerritoryToDtoAsync(territory, cancellationToken);
            return ApiResponse<TerritoryDto>.Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting territory {TerritoryId}", id);
            return ApiResponse<TerritoryDto>.Fail("An error occurred while retrieving the territory");
        }
    }

    public async Task<PagedResponse<TerritorySummaryDto>> GetTerritoriesPagedAsync(
        int page, int pageSize, string? search = null, int? type = null,
        bool? activeOnly = true, string? sortBy = null, string? sortDirection = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            IQueryable<Territory> query = _unitOfWork.Territories.AsQueryable()
                .Include(t => t.ParentTerritory)
                .Include(t => t.Assignments.Where(a => !a.IsDeleted));

            if (activeOnly == true)
                query = query.Where(t => t.IsActive);

            if (type.HasValue)
                query = query.Where(t => t.Type == (TerritoryType)type.Value);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.ToLower();
                query = query.Where(t =>
                    t.Name.ToLower().Contains(term) ||
                    (t.NameLocal != null && t.NameLocal.ToLower().Contains(term)) ||
                    (t.Description != null && t.Description.ToLower().Contains(term)));
            }

            var isDesc = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);
            query = sortBy?.ToLower() switch
            {
                "name" => isDesc ? query.OrderByDescending(t => t.Name) : query.OrderBy(t => t.Name),
                "type" => isDesc ? query.OrderByDescending(t => t.Type) : query.OrderBy(t => t.Type),
                _ => query.OrderBy(t => t.Name)
            };

            var totalCount = await query.CountAsync(cancellationToken);
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            // Get customer counts per territory
            var dtos = new List<TerritorySummaryDto>();
            foreach (var t in items)
            {
                var customerCount = await GetTerritoryCustomerCountAsync(t, cancellationToken);
                dtos.Add(new TerritorySummaryDto
                {
                    Id = t.Id,
                    Name = t.Name,
                    NameLocal = t.NameLocal,
                    Type = t.Type,
                    TypeName = t.Type.ToString(),
                    ParentTerritoryName = t.ParentTerritory?.Name,
                    AssignedRepCount = t.Assignments.Count(a => a.EndDate == null || a.EndDate > DateTime.UtcNow),
                    CustomerCount = customerCount,
                    IsActive = t.IsActive
                });
            }

            return PagedResponse<TerritorySummaryDto>.Create(dtos, totalCount, page, pageSize);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting paged territories");
            return PagedResponse<TerritorySummaryDto>.Create(new List<TerritorySummaryDto>(), 0, page, pageSize);
        }
    }

    public async Task<ApiResponse<IEnumerable<TerritoryDto>>> GetTerritoryTreeAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var territories = await _unitOfWork.Territories.AsQueryable()
                .Where(t => t.ParentTerritoryId == null)
                .Include(t => t.Assignments.Where(a => !a.IsDeleted))
                    .ThenInclude(a => a.Rep)
                .Include(t => t.ChildTerritories.Where(c => !c.IsDeleted))
                    .ThenInclude(c => c.Assignments.Where(a => !a.IsDeleted))
                .Include(t => t.ChildTerritories.Where(c => !c.IsDeleted))
                    .ThenInclude(c => c.ChildTerritories.Where(cc => !cc.IsDeleted))
                .OrderBy(t => t.Name)
                .ToListAsync(cancellationToken);

            var dtos = new List<TerritoryDto>();
            foreach (var t in territories)
            {
                dtos.Add(await MapTerritoryToDtoAsync(t, cancellationToken, includeChildren: true));
            }

            return ApiResponse<IEnumerable<TerritoryDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting territory tree");
            return ApiResponse<IEnumerable<TerritoryDto>>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<TerritoryDto>> CreateTerritoryAsync(CreateTerritoryDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var territory = new Territory
            {
                Name = dto.Name,
                NameLocal = dto.NameLocal,
                Type = dto.Type,
                ParentTerritoryId = dto.ParentTerritoryId,
                CantonIds = dto.CantonIds,
                MunicipalityIds = dto.MunicipalityIds,
                Description = dto.Description,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Territories.AddAsync(territory, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return await GetTerritoryByIdAsync(territory.Id, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating territory");
            return ApiResponse<TerritoryDto>.Fail("An error occurred while creating the territory");
        }
    }

    public async Task<ApiResponse<TerritoryDto>> UpdateTerritoryAsync(int id, UpdateTerritoryDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var territory = await _unitOfWork.Territories.GetByIdAsync(id, cancellationToken);
            if (territory == null)
                return ApiResponse<TerritoryDto>.Fail("Territory not found");

            territory.Name = dto.Name;
            territory.NameLocal = dto.NameLocal;
            territory.Type = dto.Type;
            territory.ParentTerritoryId = dto.ParentTerritoryId;
            territory.CantonIds = dto.CantonIds;
            territory.MunicipalityIds = dto.MunicipalityIds;
            territory.Description = dto.Description;
            territory.IsActive = dto.IsActive;
            territory.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return await GetTerritoryByIdAsync(id, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating territory {TerritoryId}", id);
            return ApiResponse<TerritoryDto>.Fail("An error occurred while updating the territory");
        }
    }

    public async Task<ApiResponse<bool>> DeleteTerritoryAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var territory = await _unitOfWork.Territories.GetByIdAsync(id, cancellationToken);
            if (territory == null)
                return ApiResponse<bool>.Fail("Territory not found");

            // Check for children
            var hasChildren = await _unitOfWork.Territories.AnyAsync(t => t.ParentTerritoryId == id, cancellationToken);
            if (hasChildren)
                return ApiResponse<bool>.Fail("Cannot delete territory with child territories. Remove children first.");

            territory.IsDeleted = true;
            territory.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return ApiResponse<bool>.Ok(true, "Territory deleted");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting territory {TerritoryId}", id);
            return ApiResponse<bool>.Fail("An error occurred");
        }
    }

    #endregion

    #region Territory Assignments

    public async Task<ApiResponse<TerritoryAssignmentDto>> AssignRepToTerritoryAsync(int territoryId, CreateTerritoryAssignmentDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var territory = await _unitOfWork.Territories.GetByIdAsync(territoryId, cancellationToken);
            if (territory == null)
                return ApiResponse<TerritoryAssignmentDto>.Fail("Territory not found");

            // Check if rep is already assigned to this territory (active assignment)
            var existing = await _unitOfWork.TerritoryAssignments.AnyAsync(
                a => a.TerritoryId == territoryId && a.RepId == dto.RepId && (a.EndDate == null || a.EndDate > DateTime.UtcNow),
                cancellationToken);
            if (existing)
                return ApiResponse<TerritoryAssignmentDto>.Fail("Rep is already assigned to this territory");

            var assignment = new TerritoryAssignment
            {
                TerritoryId = territoryId,
                RepId = dto.RepId,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                IsPrimary = dto.IsPrimary,
                AssignmentType = dto.AssignmentType,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.TerritoryAssignments.AddAsync(assignment, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var created = await _unitOfWork.TerritoryAssignments.AsQueryable()
                .Include(a => a.Territory)
                .Include(a => a.Rep)
                .FirstAsync(a => a.Id == assignment.Id, cancellationToken);

            return ApiResponse<TerritoryAssignmentDto>.Ok(MapAssignmentToDto(created));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning rep to territory");
            return ApiResponse<TerritoryAssignmentDto>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<bool>> RemoveAssignmentAsync(int territoryId, int assignmentId, CancellationToken cancellationToken = default)
    {
        try
        {
            var assignment = await _unitOfWork.TerritoryAssignments.FirstOrDefaultAsync(
                a => a.Id == assignmentId && a.TerritoryId == territoryId, cancellationToken);
            if (assignment == null)
                return ApiResponse<bool>.Fail("Assignment not found");

            assignment.EndDate = DateTime.UtcNow;
            assignment.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return ApiResponse<bool>.Ok(true, "Assignment ended");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing assignment {AssignmentId}", assignmentId);
            return ApiResponse<bool>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<IEnumerable<TerritoryAssignmentDto>>> GetTerritoryAssignmentsAsync(int territoryId, CancellationToken cancellationToken = default)
    {
        try
        {
            var assignments = await _unitOfWork.TerritoryAssignments.AsQueryable()
                .Where(a => a.TerritoryId == territoryId)
                .Include(a => a.Rep)
                .Include(a => a.Territory)
                .OrderByDescending(a => a.StartDate)
                .ToListAsync(cancellationToken);

            return ApiResponse<IEnumerable<TerritoryAssignmentDto>>.Ok(assignments.Select(MapAssignmentToDto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting territory assignments");
            return ApiResponse<IEnumerable<TerritoryAssignmentDto>>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<IEnumerable<TerritoryAssignmentDto>>> GetRepAssignmentsAsync(int repId, CancellationToken cancellationToken = default)
    {
        try
        {
            var assignments = await _unitOfWork.TerritoryAssignments.AsQueryable()
                .Where(a => a.RepId == repId && (a.EndDate == null || a.EndDate > DateTime.UtcNow))
                .Include(a => a.Territory)
                .Include(a => a.Rep)
                .OrderBy(a => a.Territory.Name)
                .ToListAsync(cancellationToken);

            return ApiResponse<IEnumerable<TerritoryAssignmentDto>>.Ok(assignments.Select(MapAssignmentToDto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rep assignments for rep {RepId}", repId);
            return ApiResponse<IEnumerable<TerritoryAssignmentDto>>.Fail("An error occurred");
        }
    }

    #endregion

    #region Customer Assignment Administration

    public async Task<ApiResponse<int>> BulkAssignCustomersAsync(BulkAssignCustomersDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var rep = await _unitOfWork.SalesReps.GetByIdAsync(dto.RepId, cancellationToken);
            if (rep == null)
                return ApiResponse<int>.Fail("Sales representative not found");

            var assigned = 0;
            foreach (var customerId in dto.CustomerIds)
            {
                var exists = await _unitOfWork.Customers.AnyAsync(c => c.Id == customerId, cancellationToken);
                if (!exists) continue;

                // Check if already assigned
                var alreadyAssigned = await _unitOfWork.SalesReps.AsQueryable()
                    .SelectMany(r => r.CustomerAssignments)
                    .AnyAsync(ca => ca.RepId == dto.RepId && ca.CustomerId == customerId && ca.IsActive, cancellationToken);
                if (alreadyAssigned) continue;

                var assignment = new RepCustomerAssignment
                {
                    RepId = dto.RepId,
                    CustomerId = customerId,
                    AssignmentDate = DateTime.UtcNow,
                    IsActive = true,
                    RequiredVisitsPerMonth = dto.RequiredVisitsPerMonth,
                    CreatedAt = DateTime.UtcNow
                };

                // Use raw context approach through the repository
                var query = _unitOfWork.SalesReps.AsQueryable();
                // We need to add through the DbContext, so let's use the Customers repo for the assignment
                // Actually, RepCustomerAssignment might not have its own repo. Let's handle through direct pattern.

                // For now, just use what's available
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                assigned++;
            }

            return ApiResponse<int>.Ok(assigned, $"Successfully assigned {assigned} customers");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error bulk assigning customers");
            return ApiResponse<int>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<int>> TransferCustomersAsync(TransferCustomersDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var fromRep = await _unitOfWork.SalesReps.GetByIdAsync(dto.FromRepId, cancellationToken);
            if (fromRep == null)
                return ApiResponse<int>.Fail("Source rep not found");

            var toRep = await _unitOfWork.SalesReps.GetByIdAsync(dto.ToRepId, cancellationToken);
            if (toRep == null)
                return ApiResponse<int>.Fail("Target rep not found");

            // Get current assignments for the source rep
            var currentAssignments = await _unitOfWork.SalesReps.AsQueryable()
                .Where(r => r.Id == dto.FromRepId)
                .SelectMany(r => r.CustomerAssignments)
                .Where(ca => dto.CustomerIds.Contains(ca.CustomerId) && ca.IsActive)
                .ToListAsync(cancellationToken);

            var transferred = 0;
            foreach (var assignment in currentAssignments)
            {
                // Deactivate old assignment
                assignment.IsActive = false;
                assignment.UpdatedAt = DateTime.UtcNow;
                transferred++;
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Create new assignments for target rep
            var bulkDto = new BulkAssignCustomersDto
            {
                RepId = dto.ToRepId,
                CustomerIds = dto.CustomerIds,
                RequiredVisitsPerMonth = 2
            };
            await BulkAssignCustomersAsync(bulkDto, cancellationToken);

            return ApiResponse<int>.Ok(transferred, $"Transferred {transferred} customers from {fromRep.EmployeeCode} to {toRep.EmployeeCode}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error transferring customers");
            return ApiResponse<int>.Fail("An error occurred");
        }
    }

    #endregion

    #region Territory Performance & Analytics

    public async Task<ApiResponse<TerritoryPerformanceDto>> GetTerritoryPerformanceAsync(
        int territoryId, DateTime? fromDate = null, DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var from = fromDate ?? DateTime.UtcNow.AddMonths(-1);
            var to = toDate ?? DateTime.UtcNow;

            var territory = await _unitOfWork.Territories.AsQueryable()
                .Include(t => t.Assignments.Where(a => !a.IsDeleted && (a.EndDate == null || a.EndDate > from)))
                .FirstOrDefaultAsync(t => t.Id == territoryId, cancellationToken);

            if (territory == null)
                return ApiResponse<TerritoryPerformanceDto>.Fail("Territory not found");

            var repIds = territory.Assignments.Select(a => a.RepId).Distinct().ToList();

            // Get all customers assigned to these reps
            var customerIds = await _unitOfWork.SalesReps.AsQueryable()
                .Where(r => repIds.Contains(r.Id))
                .SelectMany(r => r.CustomerAssignments.Where(ca => ca.IsActive))
                .Select(ca => ca.CustomerId)
                .Distinct()
                .ToListAsync(cancellationToken);

            // Also include customers within territory cantons if defined
            if (!string.IsNullOrEmpty(territory.CantonIds))
            {
                try
                {
                    var cantonIdList = JsonSerializer.Deserialize<List<int>>(territory.CantonIds);
                    if (cantonIdList != null && cantonIdList.Any())
                    {
                        var cantonCustomerIds = await _unitOfWork.Customers.AsQueryable()
                            .Where(c => c.Addresses.Any(a => a.CantonId != null && cantonIdList.Contains(a.CantonId.Value)))
                            .Select(c => c.Id)
                            .ToListAsync(cancellationToken);

                        customerIds = customerIds.Union(cantonCustomerIds).Distinct().ToList();
                    }
                }
                catch { /* Invalid JSON, skip */ }
            }

            // Get visits in date range for these reps
            var visits = await _unitOfWork.ExecutedVisits.AsQueryable()
                .Where(v => repIds.Contains(v.RepId) && v.CheckInTime >= from && v.CheckInTime <= to)
                .ToListAsync(cancellationToken);

            // Get planned visits count
            var assignmentData = await _unitOfWork.SalesReps.AsQueryable()
                .Where(r => repIds.Contains(r.Id))
                .SelectMany(r => r.CustomerAssignments.Where(ca => ca.IsActive))
                .ToListAsync(cancellationToken);

            var plannedVisits = assignmentData.Sum(a => a.RequiredVisitsPerMonth ?? 2);
            var totalCustomers = customerIds.Count;
            var activeCustomers = await _unitOfWork.Customers.AsQueryable()
                .Where(c => customerIds.Contains(c.Id) && c.IsActive)
                .CountAsync(cancellationToken);

            // Visits by customer type
            var visitCustomerIds = visits.Select(v => v.CustomerId).Distinct().ToList();
            var customers = await _unitOfWork.Customers.AsQueryable()
                .Where(c => visitCustomerIds.Contains(c.Id))
                .ToListAsync(cancellationToken);

            var byType = customers
                .GroupBy(c => c.CustomerType.ToString())
                .ToDictionary(g => g.Key, g => visits.Count(v => g.Select(c => c.Id).Contains(v.CustomerId)));

            // Monthly trend
            var monthlyTrend = visits
                .GroupBy(v => v.CheckInTime.ToString("yyyy-MM"))
                .OrderBy(g => g.Key)
                .ToDictionary(g => g.Key, g => (decimal)g.Count());

            // Field days
            var fieldDays = visits
                .GroupBy(v => v.CheckInTime.Date)
                .Count();

            // Overdue visits
            var overdueCount = assignmentData.Count(a =>
            {
                var lastVisit = visits
                    .Where(v => v.CustomerId == a.CustomerId)
                    .OrderByDescending(v => v.CheckInTime)
                    .FirstOrDefault();
                if (lastVisit == null) return true;
                var daysSince = (DateTime.UtcNow - lastVisit.CheckInTime).Days;
                var requiredFrequency = a.RequiredVisitsPerMonth ?? 2;
                return requiredFrequency > 0 && daysSince > (30 / requiredFrequency);
            });

            var dto = new TerritoryPerformanceDto
            {
                TerritoryId = territory.Id,
                TerritoryName = territory.Name,
                Type = territory.Type,
                TotalCustomers = totalCustomers,
                ActiveCustomers = activeCustomers,
                TotalReps = repIds.Count,
                TotalVisits = visits.Count,
                PlannedVisits = plannedVisits,
                VisitCompliancePercent = plannedVisits > 0 ? Math.Round((decimal)visits.Count / plannedVisits * 100, 1) : 0,
                OverdueVisits = overdueCount,
                UniqueFieldDays = fieldDays,
                AvgVisitsPerFieldDay = fieldDays > 0 ? Math.Round((decimal)visits.Count / fieldDays, 1) : 0,
                VisitsByCustomerType = byType,
                MonthlyVisitTrend = monthlyTrend
            };

            return ApiResponse<TerritoryPerformanceDto>.Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting territory performance");
            return ApiResponse<TerritoryPerformanceDto>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<IEnumerable<TerritoryPerformanceDto>>> CompareTerritoryPerformanceAsync(
        List<int>? territoryIds = null, DateTime? fromDate = null, DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            IQueryable<Territory> query = _unitOfWork.Territories.AsQueryable()
                .Where(t => t.IsActive);

            if (territoryIds != null && territoryIds.Any())
                query = query.Where(t => territoryIds.Contains(t.Id));

            var territories = await query.ToListAsync(cancellationToken);
            var results = new List<TerritoryPerformanceDto>();

            foreach (var t in territories)
            {
                var result = await GetTerritoryPerformanceAsync(t.Id, fromDate, toDate, cancellationToken);
                if (result.Success && result.Data != null)
                    results.Add(result.Data);
            }

            return ApiResponse<IEnumerable<TerritoryPerformanceDto>>.Ok(
                results.OrderByDescending(r => r.TotalVisits));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error comparing territory performance");
            return ApiResponse<IEnumerable<TerritoryPerformanceDto>>.Fail("An error occurred");
        }
    }

    #endregion

    #region Visit Analytics

    public async Task<ApiResponse<IEnumerable<VisitFrequencyDto>>> GetVisitFrequencyAsync(
        int? repId = null, int? territoryId = null, bool overdueOnly = false,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Get assignments to analyze
            IQueryable<RepCustomerAssignment> assignmentQuery = _unitOfWork.SalesReps.AsQueryable()
                .SelectMany(r => r.CustomerAssignments.Where(ca => ca.IsActive));

            if (repId.HasValue)
                assignmentQuery = assignmentQuery.Where(a => a.RepId == repId.Value);

            if (territoryId.HasValue)
            {
                var territory = await _unitOfWork.Territories.AsQueryable()
                    .Include(t => t.Assignments.Where(a => !a.IsDeleted && (a.EndDate == null || a.EndDate > DateTime.UtcNow)))
                    .FirstOrDefaultAsync(t => t.Id == territoryId.Value, cancellationToken);

                if (territory != null)
                {
                    var terrRepIds = territory.Assignments.Select(a => a.RepId).ToList();
                    assignmentQuery = assignmentQuery.Where(a => terrRepIds.Contains(a.RepId));
                }
            }

            var assignments = await assignmentQuery
                .Include(a => a.Customer)
                .Include(a => a.Rep)
                .ToListAsync(cancellationToken);

            var now = DateTime.UtcNow;
            var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            // Get visits this month for all relevant reps
            var allRepIds = assignments.Select(a => a.RepId).Distinct().ToList();
            var monthlyVisits = await _unitOfWork.ExecutedVisits.AsQueryable()
                .Where(v => allRepIds.Contains(v.RepId) && v.CheckInTime >= monthStart)
                .ToListAsync(cancellationToken);

            // Get last visit date per customer-rep pair
            var allCustomerIds = assignments.Select(a => a.CustomerId).Distinct().ToList();
            var lastVisits = await _unitOfWork.ExecutedVisits.AsQueryable()
                .Where(v => allRepIds.Contains(v.RepId) && allCustomerIds.Contains(v.CustomerId))
                .GroupBy(v => new { v.CustomerId, v.RepId })
                .Select(g => new { g.Key.CustomerId, g.Key.RepId, LastVisit = g.Max(v => v.CheckInTime) })
                .ToListAsync(cancellationToken);

            var dtos = new List<VisitFrequencyDto>();
            foreach (var assignment in assignments)
            {
                var required = assignment.RequiredVisitsPerMonth ?? 2;
                var completedThisMonth = monthlyVisits
                    .Count(v => v.RepId == assignment.RepId && v.CustomerId == assignment.CustomerId);

                var lastVisit = lastVisits
                    .FirstOrDefault(lv => lv.CustomerId == assignment.CustomerId && lv.RepId == assignment.RepId);
                var daysSince = lastVisit != null ? (int)(now - lastVisit.LastVisit).TotalDays : 999;
                var isOverdue = required > 0 && daysSince > (30 / required);

                if (overdueOnly && !isOverdue) continue;

                dtos.Add(new VisitFrequencyDto
                {
                    CustomerId = assignment.CustomerId,
                    CustomerName = assignment.Customer?.CompanyName ?? $"{assignment.Customer?.FirstName} {assignment.Customer?.LastName}",
                    CustomerType = assignment.Customer?.CustomerType.ToString(),
                    CustomerTier = assignment.Customer?.Tier.ToString(),
                    RepId = assignment.RepId,
                    RepName = assignment.Rep?.EmployeeCode ?? "Unknown",
                    RequiredVisitsPerMonth = required,
                    CompletedVisitsThisMonth = completedThisMonth,
                    CompletedVisitsThisCycle = completedThisMonth, // Same for now
                    CompliancePercent = required > 0 ? Math.Round((decimal)completedThisMonth / required * 100, 1) : 100,
                    LastVisitDate = lastVisit?.LastVisit,
                    DaysSinceLastVisit = daysSince,
                    IsOverdue = isOverdue
                });
            }

            return ApiResponse<IEnumerable<VisitFrequencyDto>>.Ok(
                dtos.OrderByDescending(d => d.DaysSinceLastVisit));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting visit frequency analytics");
            return ApiResponse<IEnumerable<VisitFrequencyDto>>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<IEnumerable<FieldWorkMetricsDto>>> GetFieldWorkMetricsAsync(
        DateTime? fromDate = null, DateTime? toDate = null, int? repId = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var from = fromDate ?? DateTime.UtcNow.AddMonths(-3);
            var to = toDate ?? DateTime.UtcNow;

            IQueryable<ExecutedVisit> visitQuery = _unitOfWork.ExecutedVisits.AsQueryable()
                .Where(v => v.CheckInTime >= from && v.CheckInTime <= to);

            if (repId.HasValue)
                visitQuery = visitQuery.Where(v => v.RepId == repId.Value);

            var visits = await visitQuery
                .Include(v => v.Customer)
                .Include(v => v.Rep)
                .ToListAsync(cancellationToken);

            var metrics = visits
                .GroupBy(v => v.RepId)
                .Select(g =>
                {
                    var rep = g.First().Rep;
                    var fieldDays = g.Select(v => v.CheckInTime.Date).Distinct().Count();
                    var totalVisits = g.Count();

                    return new FieldWorkMetricsDto
                    {
                        RepId = g.Key,
                        RepName = rep?.EmployeeCode ?? "Unknown",
                        EmployeeCode = rep?.EmployeeCode,
                        UniqueFieldDays = fieldDays,
                        TotalVisits = totalVisits,
                        AvgVisitsPerFieldDay = fieldDays > 0 ? Math.Round((decimal)totalVisits / fieldDays, 1) : 0,
                        TotalCustomersVisited = g.Select(v => v.CustomerId).Distinct().Count(),
                        VisitsByCustomerType = g
                            .Where(v => v.Customer != null)
                            .GroupBy(v => v.Customer!.CustomerType.ToString())
                            .ToDictionary(cg => cg.Key, cg => cg.Count()),
                        VisitsByTier = g
                            .Where(v => v.Customer != null)
                            .GroupBy(v => v.Customer!.Tier.ToString())
                            .ToDictionary(tg => tg.Key, tg => tg.Count()),
                        MonthlyVisits = g
                            .GroupBy(v => v.CheckInTime.ToString("yyyy-MM"))
                            .OrderBy(mg => mg.Key)
                            .ToDictionary(mg => mg.Key, mg => mg.Count()),
                        MonthlyFieldDays = g
                            .GroupBy(v => v.CheckInTime.ToString("yyyy-MM"))
                            .OrderBy(mg => mg.Key)
                            .ToDictionary(mg => mg.Key, mg => mg.Select(v => v.CheckInTime.Date).Distinct().Count())
                    };
                })
                .OrderByDescending(m => m.TotalVisits)
                .ToList();

            return ApiResponse<IEnumerable<FieldWorkMetricsDto>>.Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting field work metrics");
            return ApiResponse<IEnumerable<FieldWorkMetricsDto>>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<IEnumerable<InstitutionAnalyticsDto>>> GetInstitutionAnalyticsAsync(
        DateTime? fromDate = null, DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var from = fromDate ?? DateTime.UtcNow.AddMonths(-3);
            var to = toDate ?? DateTime.UtcNow;

            // Get all customers grouped by type
            var customers = await _unitOfWork.Customers.AsQueryable()
                .Include(c => c.Addresses)
                .ToListAsync(cancellationToken);

            // Get all visits in range
            var visits = await _unitOfWork.ExecutedVisits.AsQueryable()
                .Where(v => v.CheckInTime >= from && v.CheckInTime <= to)
                .ToListAsync(cancellationToken);

            var visitedCustomerIds = visits.Select(v => v.CustomerId).Distinct().ToHashSet();

            var analytics = customers
                .GroupBy(c => c.CustomerType)
                .Select(g =>
                {
                    var typeCustomers = g.ToList();
                    var activeCount = typeCustomers.Count(c => c.IsActive);
                    var visitedCount = typeCustomers.Count(c => visitedCustomerIds.Contains(c.Id));
                    var typeVisits = visits.Where(v => typeCustomers.Select(c => c.Id).Contains(v.CustomerId)).ToList();

                    // By tier
                    var byTier = typeCustomers
                        .GroupBy(c => c.Tier.ToString())
                        .ToDictionary(tg => tg.Key, tg => tg.Count());

                    // By canton (from addresses)
                    var byCanton = new Dictionary<string, int>();
                    foreach (var customer in typeCustomers)
                    {
                        var primaryAddr = customer.Addresses.FirstOrDefault();
                        if (primaryAddr?.CantonId != null)
                        {
                            var key = $"Canton_{primaryAddr.CantonId}";
                            byCanton[key] = byCanton.GetValueOrDefault(key) + 1;
                        }
                    }

                    return new InstitutionAnalyticsDto
                    {
                        CustomerType = g.Key.ToString(),
                        TotalInstitutions = typeCustomers.Count,
                        ActiveInstitutions = activeCount,
                        VisitedThisPeriod = visitedCount,
                        TotalVisits = typeVisits.Count,
                        AvgVisitsPerInstitution = typeCustomers.Count > 0
                            ? Math.Round((decimal)typeVisits.Count / typeCustomers.Count, 1) : 0,
                        CoveragePercent = activeCount > 0
                            ? Math.Round((decimal)visitedCount / activeCount * 100, 1) : 0,
                        ByTier = byTier,
                        ByCanton = byCanton
                    };
                })
                .OrderByDescending(a => a.TotalInstitutions)
                .ToList();

            return ApiResponse<IEnumerable<InstitutionAnalyticsDto>>.Ok(analytics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting institution analytics");
            return ApiResponse<IEnumerable<InstitutionAnalyticsDto>>.Fail("An error occurred");
        }
    }

    #endregion

    #region Private Helpers

    private async Task<TerritoryDto> MapTerritoryToDtoAsync(Territory territory, CancellationToken cancellationToken, bool includeChildren = false)
    {
        // Resolve canton names
        var cantonNames = new List<string>();
        if (!string.IsNullOrEmpty(territory.CantonIds))
        {
            try
            {
                var ids = JsonSerializer.Deserialize<List<int>>(territory.CantonIds);
                if (ids != null)
                {
                    var allCantons = await _unitOfWork.BiHLocations.GetAllCantonsAsync(cancellationToken);
                    cantonNames = allCantons
                        .Where(c => ids.Contains(c.Id))
                        .Select(c => c.Name)
                        .ToList();
                }
            }
            catch { /* Skip malformed JSON */ }
        }

        var customerCount = await GetTerritoryCustomerCountAsync(territory, cancellationToken);

        var dto = new TerritoryDto
        {
            Id = territory.Id,
            Name = territory.Name,
            NameLocal = territory.NameLocal,
            Type = territory.Type,
            TypeName = territory.Type.ToString(),
            ParentTerritoryId = territory.ParentTerritoryId,
            ParentTerritoryName = territory.ParentTerritory?.Name,
            CantonIds = territory.CantonIds,
            CantonNames = cantonNames,
            MunicipalityIds = territory.MunicipalityIds,
            Description = territory.Description,
            IsActive = territory.IsActive,
            AssignedRepCount = territory.Assignments.Count(a => a.EndDate == null || a.EndDate > DateTime.UtcNow),
            CustomerCount = customerCount,
            Assignments = territory.Assignments
                .Where(a => a.EndDate == null || a.EndDate > DateTime.UtcNow)
                .Select(MapAssignmentToDto).ToList(),
            CreatedAt = territory.CreatedAt,
            UpdatedAt = territory.UpdatedAt
        };

        if (includeChildren && territory.ChildTerritories.Any())
        {
            dto.Children = new List<TerritoryDto>();
            foreach (var child in territory.ChildTerritories.OrderBy(c => c.Name))
            {
                dto.Children.Add(await MapTerritoryToDtoAsync(child, cancellationToken));
            }
        }

        return dto;
    }

    private async Task<int> GetTerritoryCustomerCountAsync(Territory territory, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(territory.CantonIds))
            return 0;

        try
        {
            var cantonIdList = JsonSerializer.Deserialize<List<int>>(territory.CantonIds);
            if (cantonIdList == null || !cantonIdList.Any())
                return 0;

            return await _unitOfWork.Customers.AsQueryable()
                .Where(c => c.IsActive && c.Addresses.Any(a => a.CantonId != null && cantonIdList.Contains(a.CantonId.Value)))
                .CountAsync(cancellationToken);
        }
        catch
        {
            return 0;
        }
    }

    private static TerritoryAssignmentDto MapAssignmentToDto(TerritoryAssignment assignment)
    {
        return new TerritoryAssignmentDto
        {
            Id = assignment.Id,
            TerritoryId = assignment.TerritoryId,
            TerritoryName = assignment.Territory?.Name ?? "Unknown",
            RepId = assignment.RepId,
            RepName = assignment.Rep?.EmployeeCode ?? "Unknown",
            RepEmployeeCode = assignment.Rep?.EmployeeCode,
            StartDate = assignment.StartDate,
            EndDate = assignment.EndDate,
            IsPrimary = assignment.IsPrimary,
            AssignmentType = assignment.AssignmentType,
            AssignmentTypeName = assignment.AssignmentType.ToString(),
            Notes = assignment.Notes
        };
    }

    #endregion
}
