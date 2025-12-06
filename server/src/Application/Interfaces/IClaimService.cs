using Application.DTOs.Claims;
using Application.DTOs.Common;
using Domain.Enums;

namespace Application.Interfaces;

/// <summary>
/// Service interface for claim/return management
/// </summary>
public interface IClaimService
{
    // Query operations
    Task<ApiResponse<IEnumerable<ClaimSummaryDto>>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<PagedResponse<ClaimSummaryDto>> GetPagedAsync(int page, int pageSize, int? customerId = null, ClaimStatus? status = null, ClaimType? type = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<ClaimDto>> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<ClaimDto>> GetByClaimNumberAsync(string claimNumber, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<ClaimSummaryDto>>> GetByCustomerAsync(int customerId, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<ClaimSummaryDto>>> GetByOrderAsync(int orderId, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<ClaimSummaryDto>>> GetByStatusAsync(ClaimStatus status, CancellationToken cancellationToken = default);
    
    // Command operations
    Task<ApiResponse<ClaimDto>> CreateAsync(CreateClaimDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<ClaimDto>> CreateFromPortalAsync(int customerId, PortalCreateClaimDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<ClaimDto>> UpdateStatusAsync(int id, UpdateClaimStatusDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<ClaimDto>> ResolveAsync(int id, ResolveClaimDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<ClaimDto>> UpdateReturnTrackingAsync(int id, UpdateReturnTrackingDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<ClaimDto>> MarkReturnReceivedAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> CancelAsync(int id, string reason, CancellationToken cancellationToken = default);
    
    // Utility
    Task<string> GenerateClaimNumberAsync(CancellationToken cancellationToken = default);
}
