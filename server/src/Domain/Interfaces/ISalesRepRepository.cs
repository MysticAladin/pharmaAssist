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
        int? managerId,
        int pageNumber,
        int pageSize,
        string? sortBy,
        bool sortDescending,
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get all reps managed by a specific manager
    /// </summary>
    Task<IReadOnlyList<SalesRepresentative>> GetByManagerIdAsync(int managerId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get managers (reps who have managed reps)
    /// </summary>
    Task<IReadOnlyList<SalesRepresentative>> GetManagersAsync(RepresentativeType? repType, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get customer assignments for a rep
    /// </summary>
    Task<IReadOnlyList<RepCustomerAssignment>> GetCustomerAssignmentsAsync(int repId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Add customer assignments
    /// </summary>
    Task AddCustomerAssignmentsAsync(int repId, IEnumerable<int> customerIds, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Remove customer assignments
    /// </summary>
    Task RemoveCustomerAssignmentsAsync(int repId, IEnumerable<int> customerIds, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Update manager assignments for a rep
    /// </summary>
    Task UpdateManagerAssignmentsAsync(int repId, IEnumerable<int> managerIds, int? primaryManagerId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get hierarchy view (managers and their teams)
    /// </summary>
    Task<IReadOnlyList<(SalesRepresentative Manager, IReadOnlyList<SalesRepresentative> Team)>> GetHierarchyAsync(
        RepresentativeType? repType,
        CancellationToken cancellationToken = default);
}
