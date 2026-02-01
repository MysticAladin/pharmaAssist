using Domain.Entities;
using Domain.Enums;

namespace Domain.Interfaces;

/// <summary>
/// Repository interface for sales representative operations
/// </summary>
public interface ISalesRepRepository : IRepository<SalesRepresentative>
{
    /// <summary>
    /// Get sales representative by user ID
    /// </summary>
    Task<SalesRepresentative?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get sales representative by employee code
    /// </summary>
    Task<SalesRepresentative?> GetByEmployeeCodeAsync(string employeeCode, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get sales representative with all relationships loaded
    /// </summary>
    Task<SalesRepresentative?> GetWithDetailsAsync(int id, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get all sales representatives with pagination and filtering
    /// </summary>
    Task<(IReadOnlyList<SalesRepresentative> Items, int TotalCount)> GetPagedAsync(
        string? search,
        RepresentativeType? repType,
        RepresentativeStatus? status,
        string? managerUserId,
        int pageNumber,
        int pageSize,
        string? sortBy,
        bool sortDescending,
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get customer assignments for a rep
    /// </summary>
    Task<IReadOnlyList<RepCustomerAssignment>> GetCustomerAssignmentsAsync(int repId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get a specific customer assignment for a rep
    /// </summary>
    Task<RepCustomerAssignment?> GetCustomerAssignmentAsync(int repId, int customerId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Add customer assignments
    /// </summary>
    Task AddCustomerAssignmentsAsync(int repId, IEnumerable<int> customerIds, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Remove customer assignments
    /// </summary>
    Task RemoveCustomerAssignmentsAsync(int repId, IEnumerable<int> customerIds, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Update manager/supervisor assignments for a rep (managers are Users with Manager role)
    /// </summary>
    Task UpdateManagerAssignmentsAsync(int repId, IEnumerable<string> managerUserIds, string? primaryManagerUserId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get reps managed by a specific user
    /// </summary>
    Task<IReadOnlyList<SalesRepresentative>> GetRepsByManagerUserIdAsync(string managerUserId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get the organizational hierarchy - all manager users and their teams
    /// Returns tuples of (ManagerUser, ListOfManagedReps)
    /// </summary>
    Task<IReadOnlyList<(ApplicationUser Manager, IReadOnlyList<SalesRepresentative> Team)>> GetHierarchyAsync(RepresentativeType? repType, CancellationToken cancellationToken = default);
}
