using Application.DTOs.Common;
using Application.DTOs.SalesReps;

namespace Application.Interfaces;

/// <summary>
/// Service interface for sales representative customer management
/// </summary>
public interface IRepCustomerService
{
    /// <summary>
    /// Get assigned customers for the current rep with filtering and pagination
    /// </summary>
    Task<ApiResponse<RepCustomerResultDto>> GetMyCustomersAsync(
        int repId, 
        RepCustomerFilterDto filter, 
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get customer details with rep-specific information
    /// </summary>
    Task<ApiResponse<RepCustomerDto>> GetCustomerDetailsAsync(
        int repId, 
        int customerId, 
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get customer credit status
    /// </summary>
    Task<ApiResponse<RepCustomerCreditDto>> GetCustomerCreditAsync(
        int repId, 
        int customerId, 
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get customer's recent orders
    /// </summary>
    Task<ApiResponse<List<RepCustomerOrderDto>>> GetCustomerOrdersAsync(
        int repId, 
        int customerId, 
        int count = 10, 
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get customer's recent visits by this rep
    /// </summary>
    Task<ApiResponse<List<RepCustomerVisitDto>>> GetCustomerVisitsAsync(
        int repId, 
        int customerId, 
        int count = 10, 
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get statistics for rep's assigned customers
    /// </summary>
    Task<ApiResponse<RepCustomerStatsDto>> GetMyCustomerStatsAsync(
        int repId, 
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if customer is assigned to the rep
    /// </summary>
    Task<bool> IsCustomerAssignedAsync(
        int repId, 
        int customerId, 
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get photo archive for a customer (aggregated from visit attachments)
    /// </summary>
    Task<ApiResponse<CustomerPhotoArchiveDto>> GetCustomerPhotosAsync(
        int repId,
        int customerId,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default);
}
