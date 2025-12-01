using Application.DTOs.Audit;
using Application.DTOs.Common;

namespace Application.Interfaces;

/// <summary>
/// Audit log service interface
/// </summary>
public interface IAuditService
{
    Task<PagedResponse<AuditLogDto>> GetAuditLogsAsync(AuditLogQueryDto query, CancellationToken cancellationToken = default);
    Task<ApiResponse<EntityHistoryDto>> GetEntityHistoryAsync(string entityName, string entityId, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<AuditLogDto>>> GetUserActivityAsync(string userId, int count = 50, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<string>>> GetAuditedEntityNamesAsync(CancellationToken cancellationToken = default);
}
