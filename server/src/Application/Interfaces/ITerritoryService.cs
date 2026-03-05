using Application.DTOs.Common;
using Application.DTOs.Territories;

namespace Application.Interfaces;

/// <summary>
/// Service interface for territory management, customer assignments, and visit analytics
/// </summary>
public interface ITerritoryService
{
    // Territories
    Task<ApiResponse<TerritoryDto>> GetTerritoryByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<PagedResponse<TerritorySummaryDto>> GetTerritoriesPagedAsync(int page, int pageSize, string? search = null, int? type = null, bool? activeOnly = true, string? sortBy = null, string? sortDirection = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<TerritoryDto>>> GetTerritoryTreeAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<TerritoryDto>> CreateTerritoryAsync(CreateTerritoryDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<TerritoryDto>> UpdateTerritoryAsync(int id, UpdateTerritoryDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteTerritoryAsync(int id, CancellationToken cancellationToken = default);

    // Territory Assignments
    Task<ApiResponse<TerritoryAssignmentDto>> AssignRepToTerritoryAsync(int territoryId, CreateTerritoryAssignmentDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> RemoveAssignmentAsync(int territoryId, int assignmentId, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<TerritoryAssignmentDto>>> GetTerritoryAssignmentsAsync(int territoryId, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<TerritoryAssignmentDto>>> GetRepAssignmentsAsync(int repId, CancellationToken cancellationToken = default);

    // Customer Assignments (Admin)
    Task<ApiResponse<int>> BulkAssignCustomersAsync(BulkAssignCustomersDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<int>> TransferCustomersAsync(TransferCustomersDto dto, CancellationToken cancellationToken = default);

    // Territory Performance & Analytics
    Task<ApiResponse<TerritoryPerformanceDto>> GetTerritoryPerformanceAsync(int territoryId, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<TerritoryPerformanceDto>>> CompareTerritoryPerformanceAsync(List<int>? territoryIds = null, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default);

    // Visit Analytics
    Task<ApiResponse<IEnumerable<VisitFrequencyDto>>> GetVisitFrequencyAsync(int? repId = null, int? territoryId = null, bool overdueOnly = false, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<FieldWorkMetricsDto>>> GetFieldWorkMetricsAsync(DateTime? fromDate = null, DateTime? toDate = null, int? repId = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<InstitutionAnalyticsDto>>> GetInstitutionAnalyticsAsync(DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default);
}
