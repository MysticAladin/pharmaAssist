using Application.Common;
using Application.DTOs.SalesReps;

namespace Application.Interfaces;

/// <summary>
/// Service interface for sales representative operations
/// </summary>
public interface ISalesRepService
{
    /// <summary>
    /// Get all sales representatives with pagination and filtering
    /// </summary>
    Task<PagedResult<SalesRepresentativeSummaryDto>> GetAllAsync(SalesRepQueryDto query, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get a sales representative by ID
    /// </summary>
    Task<SalesRepresentativeDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get a sales representative by user ID
    /// </summary>
    Task<SalesRepresentativeDto?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Create a new sales representative
    /// </summary>
    Task<SalesRepresentativeDto> CreateAsync(CreateSalesRepresentativeDto dto, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Update an existing sales representative
    /// </summary>
    Task<SalesRepresentativeDto?> UpdateAsync(int id, UpdateSalesRepresentativeDto dto, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Delete a sales representative (soft delete)
    /// </summary>
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get managers list
    /// </summary>
    Task<IReadOnlyList<SalesRepresentativeSummaryDto>> GetManagersAsync(Domain.Enums.RepresentativeType? repType, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Update manager assignments for a rep
    /// </summary>
    Task<SalesRepresentativeDto?> UpdateManagerAssignmentsAsync(int repId, UpdateManagerAssignmentsDto dto, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get customer assignments for a rep
    /// </summary>
    Task<IReadOnlyList<CustomerAssignmentDto>> GetCustomerAssignmentsAsync(int repId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Assign customers to a rep
    /// </summary>
    Task<bool> AssignCustomersAsync(int repId, AssignCustomersDto dto, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Remove customer assignments from a rep
    /// </summary>
    Task<bool> RemoveCustomerAssignmentsAsync(int repId, IEnumerable<int> customerIds, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get hierarchy view (managers and their teams)
    /// </summary>
    Task<IReadOnlyList<RepHierarchyDto>> GetHierarchyAsync(Domain.Enums.RepresentativeType? repType, CancellationToken cancellationToken = default);
}
