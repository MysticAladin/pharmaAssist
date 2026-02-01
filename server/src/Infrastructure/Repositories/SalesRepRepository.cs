using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

/// <summary>
/// Sales Representative repository implementation
/// </summary>
public class SalesRepRepository : Repository<SalesRepresentative>, ISalesRepRepository
{
    public SalesRepRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<SalesRepresentative?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(sr => sr.User)
            .FirstOrDefaultAsync(sr => sr.UserId == userId, cancellationToken);
    }

    public async Task<SalesRepresentative?> GetByEmployeeCodeAsync(string employeeCode, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(sr => sr.User)
            .FirstOrDefaultAsync(sr => sr.EmployeeCode == employeeCode, cancellationToken);
    }

    public async Task<SalesRepresentative?> GetWithDetailsAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(sr => sr.User)
            .Include(sr => sr.ManagerAssignments.Where(ma => ma.IsActive && !ma.IsDeleted))
                .ThenInclude(ma => ma.ManagerUser)
            .Include(sr => sr.CustomerAssignments)
                .ThenInclude(ca => ca.Customer)
            .FirstOrDefaultAsync(sr => sr.Id == id, cancellationToken);
    }

    public async Task<(IReadOnlyList<SalesRepresentative> Items, int TotalCount)> GetPagedAsync(
        string? search,
        RepresentativeType? repType,
        RepresentativeStatus? status,
        string? managerUserId,
        int pageNumber,
        int pageSize,
        string? sortBy,
        bool sortDescending,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet
            .Include(sr => sr.User)
            .Include(sr => sr.ManagerAssignments.Where(ma => ma.IsActive && !ma.IsDeleted))
                .ThenInclude(ma => ma.ManagerUser)
            .Include(sr => sr.CustomerAssignments.Where(ca => ca.IsActive && !ca.IsDeleted))
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(sr =>
                sr.EmployeeCode.ToLower().Contains(searchLower) ||
                sr.User!.FirstName.ToLower().Contains(searchLower) ||
                sr.User.LastName.ToLower().Contains(searchLower) ||
                sr.User.Email!.ToLower().Contains(searchLower) ||
                (sr.TerritoryDescription != null && sr.TerritoryDescription.ToLower().Contains(searchLower)));
        }

        if (repType.HasValue)
        {
            query = query.Where(sr => sr.RepType == repType.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(sr => sr.Status == status.Value);
        }

        // Filter by manager user ID
        if (!string.IsNullOrWhiteSpace(managerUserId))
        {
            query = query.Where(sr => sr.ManagerAssignments.Any(ma => 
                ma.ManagerUserId == managerUserId && ma.IsActive && !ma.IsDeleted));
        }

        // Get total count before pagination
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply sorting
        query = sortBy?.ToLower() switch
        {
            "employeecode" => sortDescending 
                ? query.OrderByDescending(sr => sr.EmployeeCode) 
                : query.OrderBy(sr => sr.EmployeeCode),
            "name" => sortDescending 
                ? query.OrderByDescending(sr => sr.User!.LastName).ThenByDescending(sr => sr.User!.FirstName) 
                : query.OrderBy(sr => sr.User!.LastName).ThenBy(sr => sr.User!.FirstName),
            "reptype" => sortDescending 
                ? query.OrderByDescending(sr => sr.RepType) 
                : query.OrderBy(sr => sr.RepType),
            "status" => sortDescending 
                ? query.OrderByDescending(sr => sr.Status) 
                : query.OrderBy(sr => sr.Status),
            "hiredate" => sortDescending 
                ? query.OrderByDescending(sr => sr.HireDate) 
                : query.OrderBy(sr => sr.HireDate),
            _ => query.OrderBy(sr => sr.User!.LastName).ThenBy(sr => sr.User!.FirstName)
        };

        // Apply pagination
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<IReadOnlyList<RepCustomerAssignment>> GetCustomerAssignmentsAsync(int repId, CancellationToken cancellationToken = default)
    {
        return await _context.RepCustomerAssignments
            .Where(ca => ca.RepId == repId && !ca.IsDeleted)
            .Include(ca => ca.Customer)
                .ThenInclude(c => c!.Addresses)
            .ToListAsync(cancellationToken);
    }

    public async Task<RepCustomerAssignment?> GetCustomerAssignmentAsync(int repId, int customerId, CancellationToken cancellationToken = default)
    {
        return await _context.RepCustomerAssignments
            .FirstOrDefaultAsync(ca => ca.RepId == repId && ca.CustomerId == customerId && ca.IsActive && !ca.IsDeleted, cancellationToken);
    }

    public async Task AddCustomerAssignmentsAsync(int repId, IEnumerable<int> customerIds, CancellationToken cancellationToken = default)
    {
        var existingAssignments = await _context.RepCustomerAssignments
            .Where(ca => ca.RepId == repId && customerIds.Contains(ca.CustomerId))
            .ToListAsync(cancellationToken);

        foreach (var customerId in customerIds)
        {
            var existing = existingAssignments.FirstOrDefault(ca => ca.CustomerId == customerId);
            if (existing != null)
            {
                // Reactivate if soft deleted
                existing.IsActive = true;
                existing.IsDeleted = false;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                // Create new assignment
                _context.RepCustomerAssignments.Add(new RepCustomerAssignment
                {
                    RepId = repId,
                    CustomerId = customerId,
                    AssignmentDate = DateTime.UtcNow,
                    IsActive = true
                });
            }
        }
    }

    public async Task RemoveCustomerAssignmentsAsync(int repId, IEnumerable<int> customerIds, CancellationToken cancellationToken = default)
    {
        var assignments = await _context.RepCustomerAssignments
            .Where(ca => ca.RepId == repId && customerIds.Contains(ca.CustomerId) && !ca.IsDeleted)
            .ToListAsync(cancellationToken);

        foreach (var assignment in assignments)
        {
            assignment.IsActive = false;
            assignment.IsDeleted = true;
            assignment.UpdatedAt = DateTime.UtcNow;
        }
    }

    public async Task UpdateManagerAssignmentsAsync(int repId, IEnumerable<string> managerUserIds, string? primaryManagerUserId, CancellationToken cancellationToken = default)
    {
        var managerUserIdsList = managerUserIds.ToList();
        
        // Get existing assignments
        var existingAssignments = await _context.RepManagerAssignments
            .Where(ma => ma.RepId == repId)
            .ToListAsync(cancellationToken);

        // Mark all as inactive/deleted first for those not in the new list
        foreach (var existing in existingAssignments)
        {
            if (!managerUserIdsList.Contains(existing.ManagerUserId))
            {
                existing.IsActive = false;
                existing.IsDeleted = true;
                existing.UpdatedAt = DateTime.UtcNow;
            }
        }

        // Add/reactivate assignments
        foreach (var managerUserId in managerUserIdsList)
        {
            var existing = existingAssignments.FirstOrDefault(ma => ma.ManagerUserId == managerUserId);
            if (existing != null)
            {
                existing.IsActive = true;
                existing.IsDeleted = false;
                existing.IsPrimary = !string.IsNullOrEmpty(primaryManagerUserId) && managerUserId == primaryManagerUserId;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _context.RepManagerAssignments.Add(new RepManagerAssignment
                {
                    RepId = repId,
                    ManagerUserId = managerUserId,
                    AssignmentDate = DateTime.UtcNow,
                    IsActive = true,
                    IsPrimary = !string.IsNullOrEmpty(primaryManagerUserId) && managerUserId == primaryManagerUserId
                });
            }
        }
    }

    public async Task<IReadOnlyList<SalesRepresentative>> GetRepsByManagerUserIdAsync(string managerUserId, CancellationToken cancellationToken = default)
    {
        return await _context.SalesRepresentatives
            .Include(sr => sr.User)
            .Where(sr => !sr.IsDeleted && sr.ManagerAssignments.Any(ma => ma.ManagerUserId == managerUserId && ma.IsActive && !ma.IsDeleted))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<(ApplicationUser Manager, IReadOnlyList<SalesRepresentative> Team)>> GetHierarchyAsync(RepresentativeType? repType, CancellationToken cancellationToken = default)
    {
        // Get all active manager assignments with manager user and rep details
        var assignments = await _context.RepManagerAssignments
            .Include(ma => ma.ManagerUser)
            .Include(ma => ma.Rep)
                .ThenInclude(sr => sr!.User)
            .Where(ma => !ma.IsDeleted && ma.IsActive)
            .Where(ma => ma.Rep != null && !ma.Rep.IsDeleted)
            .Where(ma => repType == null || ma.Rep!.RepType == repType)
            .ToListAsync(cancellationToken);

        // Group by manager user
        var hierarchy = assignments
            .GroupBy(a => a.ManagerUser!)
            .Select(g => (
                Manager: g.Key,
                Team: (IReadOnlyList<SalesRepresentative>)g
                    .Select(a => a.Rep!)
                    .Where(r => r != null)
                    .DistinctBy(r => r.Id)
                    .ToList()
            ))
            .Where(h => h.Team.Count > 0)
            .OrderBy(h => h.Manager.FullName)
            .ToList();

        return hierarchy;
    }
}
