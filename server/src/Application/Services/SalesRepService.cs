using Application.Common;
using Application.DTOs.SalesReps;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Application.Services;

/// <summary>
/// Service implementation for sales representative operations
/// </summary>
public class SalesRepService : ISalesRepService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<SalesRepService> _logger;

    public SalesRepService(IUnitOfWork unitOfWork, ILogger<SalesRepService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PagedResult<SalesRepresentativeSummaryDto>> GetAllAsync(SalesRepQueryDto query, CancellationToken cancellationToken = default)
    {
        var (items, totalCount) = await _unitOfWork.SalesReps.GetPagedAsync(
            query.Search,
            query.RepType,
            query.Status,
            query.ManagerId,
            query.PageNumber,
            query.PageSize,
            query.SortBy,
            query.SortDescending,
            cancellationToken);

        var dtos = items.Select(MapToSummaryDto).ToList();

        return new PagedResult<SalesRepresentativeSummaryDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            Page = query.PageNumber,
            PageSize = query.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)query.PageSize)
        };
    }

    public async Task<SalesRepresentativeDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var rep = await _unitOfWork.SalesReps.GetWithDetailsAsync(id, cancellationToken);
        return rep == null ? null : MapToDto(rep);
    }

    public async Task<SalesRepresentativeDto?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        var rep = await _unitOfWork.SalesReps.GetByUserIdAsync(userId, cancellationToken);
        if (rep == null) return null;

        // Load full details
        return await GetByIdAsync(rep.Id, cancellationToken);
    }

    public async Task<SalesRepresentativeDto> CreateAsync(CreateSalesRepresentativeDto dto, CancellationToken cancellationToken = default)
    {
        // Validate employee code is unique
        var existing = await _unitOfWork.SalesReps.GetByEmployeeCodeAsync(dto.EmployeeCode, cancellationToken);
        if (existing != null)
        {
            throw new InvalidOperationException($"Employee code '{dto.EmployeeCode}' is already in use.");
        }

        // Validate user exists and not already a sales rep
        var existingByUser = await _unitOfWork.SalesReps.GetByUserIdAsync(dto.UserId, cancellationToken);
        if (existingByUser != null)
        {
            throw new InvalidOperationException("User is already registered as a sales representative.");
        }

        var salesRep = new SalesRepresentative
        {
            UserId = dto.UserId,
            RepType = dto.RepType,
            EmployeeCode = dto.EmployeeCode,
            Mobile = dto.Mobile,
            HireDate = dto.HireDate,
            TerritoryDescription = dto.TerritoryDescription,
            Status = RepresentativeStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.SalesReps.AddAsync(salesRep, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Add manager assignments if provided
        if (dto.ManagerIds.Any())
        {
            await _unitOfWork.SalesReps.UpdateManagerAssignmentsAsync(
                salesRep.Id,
                dto.ManagerIds,
                dto.PrimaryManagerId,
                cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        _logger.LogInformation("Created sales representative {EmployeeCode} with ID {Id}", dto.EmployeeCode, salesRep.Id);

        return (await GetByIdAsync(salesRep.Id, cancellationToken))!;
    }

    public async Task<SalesRepresentativeDto?> UpdateAsync(int id, UpdateSalesRepresentativeDto dto, CancellationToken cancellationToken = default)
    {
        var salesRep = await _unitOfWork.SalesReps.GetByIdAsync(id, cancellationToken);
        if (salesRep == null) return null;

        salesRep.RepType = dto.RepType;
        salesRep.Mobile = dto.Mobile;
        salesRep.HireDate = dto.HireDate;
        salesRep.Status = dto.Status;
        salesRep.TerritoryDescription = dto.TerritoryDescription;
        salesRep.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SalesReps.UpdateAsync(salesRep, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated sales representative {Id}", id);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var salesRep = await _unitOfWork.SalesReps.GetByIdAsync(id, cancellationToken);
        if (salesRep == null) return false;

        salesRep.IsDeleted = true;
        salesRep.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SalesReps.UpdateAsync(salesRep, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Deleted sales representative {Id}", id);
        return true;
    }

    public async Task<IReadOnlyList<SalesRepresentativeSummaryDto>> GetManagersAsync(RepresentativeType? repType, CancellationToken cancellationToken = default)
    {
        var managers = await _unitOfWork.SalesReps.GetManagersAsync(repType, cancellationToken);
        return managers.Select(MapToSummaryDto).ToList();
    }

    public async Task<SalesRepresentativeDto?> UpdateManagerAssignmentsAsync(int repId, UpdateManagerAssignmentsDto dto, CancellationToken cancellationToken = default)
    {
        var salesRep = await _unitOfWork.SalesReps.GetByIdAsync(repId, cancellationToken);
        if (salesRep == null) return null;

        await _unitOfWork.SalesReps.UpdateManagerAssignmentsAsync(
            repId,
            dto.ManagerIds,
            dto.PrimaryManagerId,
            cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated manager assignments for sales rep {Id}", repId);

        return await GetByIdAsync(repId, cancellationToken);
    }

    public async Task<IReadOnlyList<CustomerAssignmentDto>> GetCustomerAssignmentsAsync(int repId, CancellationToken cancellationToken = default)
    {
        var assignments = await _unitOfWork.SalesReps.GetCustomerAssignmentsAsync(repId, cancellationToken);
        return assignments.Select(ca => new CustomerAssignmentDto
        {
            AssignmentId = ca.Id,
            CustomerId = ca.CustomerId,
            CustomerCode = ca.Customer?.CustomerCode ?? "",
            CustomerName = ca.Customer?.CompanyName ?? $"{ca.Customer?.FirstName} {ca.Customer?.LastName}",
            City = ca.Customer?.Addresses?.FirstOrDefault(a => a.IsDefault)?.City,
            IsActive = ca.IsActive,
            AssignmentDate = ca.AssignmentDate
        }).ToList();
    }

    public async Task<bool> AssignCustomersAsync(int repId, AssignCustomersDto dto, CancellationToken cancellationToken = default)
    {
        var salesRep = await _unitOfWork.SalesReps.GetByIdAsync(repId, cancellationToken);
        if (salesRep == null) return false;

        await _unitOfWork.SalesReps.AddCustomerAssignmentsAsync(repId, dto.CustomerIds, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Assigned {Count} customers to sales rep {Id}", dto.CustomerIds.Count, repId);
        return true;
    }

    public async Task<bool> RemoveCustomerAssignmentsAsync(int repId, IEnumerable<int> customerIds, CancellationToken cancellationToken = default)
    {
        var salesRep = await _unitOfWork.SalesReps.GetByIdAsync(repId, cancellationToken);
        if (salesRep == null) return false;

        await _unitOfWork.SalesReps.RemoveCustomerAssignmentsAsync(repId, customerIds, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Removed customer assignments from sales rep {Id}", repId);
        return true;
    }

    public async Task<IReadOnlyList<RepHierarchyDto>> GetHierarchyAsync(RepresentativeType? repType, CancellationToken cancellationToken = default)
    {
        var hierarchy = await _unitOfWork.SalesReps.GetHierarchyAsync(repType, cancellationToken);
        return hierarchy.Select(h => new RepHierarchyDto
        {
            ManagerId = h.Manager.Id,
            ManagerName = h.Manager.User?.FullName ?? "",
            ManagerEmployeeCode = h.Manager.EmployeeCode,
            ManagerRepType = h.Manager.RepType,
            TeamMembers = h.Team.Select(MapToSummaryDto).ToList()
        }).ToList();
    }

    // Mapping helpers
    private static SalesRepresentativeDto MapToDto(SalesRepresentative rep)
    {
        return new SalesRepresentativeDto
        {
            Id = rep.Id,
            UserId = rep.UserId,
            RepType = rep.RepType,
            RepTypeName = rep.RepType.ToString(),
            EmployeeCode = rep.EmployeeCode,
            FirstName = rep.User?.FirstName ?? "",
            LastName = rep.User?.LastName ?? "",
            FullName = rep.User?.FullName ?? "",
            Email = rep.User?.Email ?? "",
            Mobile = rep.Mobile,
            HireDate = rep.HireDate,
            Status = rep.Status,
            StatusName = rep.Status.ToString(),
            TerritoryDescription = rep.TerritoryDescription,
            CreatedAt = rep.CreatedAt,
            UpdatedAt = rep.UpdatedAt,
            Managers = rep.ManagerAssignments
                .Where(ma => ma.IsActive && !ma.IsDeleted)
                .Select(ma => new ManagerAssignmentDto
                {
                    AssignmentId = ma.Id,
                    ManagerId = ma.ManagerId,
                    ManagerName = ma.Manager?.User?.FullName ?? "",
                    ManagerEmployeeCode = ma.Manager?.EmployeeCode ?? "",
                    IsPrimary = ma.IsPrimary,
                    IsActive = ma.IsActive,
                    AssignmentDate = ma.AssignmentDate
                }).ToList(),
            AssignedCustomersCount = rep.CustomerAssignments?.Count(ca => ca.IsActive && !ca.IsDeleted) ?? 0
        };
    }

    private static SalesRepresentativeSummaryDto MapToSummaryDto(SalesRepresentative rep)
    {
        var primaryManager = rep.ManagerAssignments?
            .FirstOrDefault(ma => ma.IsPrimary && ma.IsActive && !ma.IsDeleted);

        return new SalesRepresentativeSummaryDto
        {
            Id = rep.Id,
            EmployeeCode = rep.EmployeeCode,
            FullName = rep.User?.FullName ?? "",
            Email = rep.User?.Email ?? "",
            RepType = rep.RepType,
            RepTypeName = rep.RepType.ToString(),
            Status = rep.Status,
            StatusName = rep.Status.ToString(),
            TerritoryDescription = rep.TerritoryDescription,
            PrimaryManagerName = primaryManager?.Manager?.User?.FullName,
            AssignedCustomersCount = rep.CustomerAssignments?.Count(ca => ca.IsActive && !ca.IsDeleted) ?? 0
        };
    }
}
