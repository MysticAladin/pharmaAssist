using Application.DTOs.Common;
using Application.DTOs.Cycles;

namespace Application.Interfaces;

/// <summary>
/// Service interface for cycle, campaign, campaign expense, and investment management
/// </summary>
public interface ICycleService
{
    // Cycles
    Task<ApiResponse<CycleDto>> GetCycleByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<PagedResponse<CycleSummaryDto>> GetCyclesPagedAsync(int page, int pageSize, string? search = null, int? status = null, bool? activeOnly = true, string? sortBy = null, string? sortDirection = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<CycleDto>> CreateCycleAsync(CreateCycleDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<CycleDto>> UpdateCycleAsync(int id, UpdateCycleDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteCycleAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> ActivateCycleAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> CompleteCycleAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<CycleDto>> CopyCycleAsync(int id, string newName, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);

    // Cycle Targets
    Task<ApiResponse<CycleTargetDto>> AddCycleTargetAsync(int cycleId, CreateCycleTargetDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<CycleTargetDto>>> BulkAddCycleTargetsAsync(int cycleId, BulkCreateCycleTargetsDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> RemoveCycleTargetAsync(int cycleId, int targetId, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<CycleTargetDto>>> GetCycleTargetsAsync(int cycleId, int? repId = null, CancellationToken cancellationToken = default);

    // Campaigns
    Task<ApiResponse<CampaignDto>> GetCampaignByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<PagedResponse<CampaignSummaryDto>> GetCampaignsPagedAsync(int page, int pageSize, string? search = null, int? cycleId = null, int? type = null, int? status = null, string? sortBy = null, string? sortDirection = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<CampaignDto>> CreateCampaignAsync(CreateCampaignDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<CampaignDto>> UpdateCampaignAsync(int id, UpdateCampaignDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteCampaignAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> ActivateCampaignAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> CompleteCampaignAsync(int id, CancellationToken cancellationToken = default);

    // Campaign Targets
    Task<ApiResponse<CampaignTargetDto>> AddCampaignTargetAsync(int campaignId, CreateCampaignTargetDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> RemoveCampaignTargetAsync(int campaignId, int targetId, CancellationToken cancellationToken = default);
    Task<ApiResponse<CampaignTargetDto>> UpdateCampaignTargetStatusAsync(int campaignId, int targetId, UpdateCampaignTargetStatusDto dto, CancellationToken cancellationToken = default);

    // Campaign Expenses
    Task<ApiResponse<CampaignExpenseDto>> CreateCampaignExpenseAsync(CreateCampaignExpenseDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteCampaignExpenseAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<CampaignExpenseDto>>> GetExpensesByCampaignAsync(int campaignId, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> ApproveCampaignExpenseAsync(int id, string? notes = null, CancellationToken cancellationToken = default);

    // Client Investment
    Task<ApiResponse<ClientInvestmentDto>> GetClientInvestmentAsync(int customerId, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<ClientInvestmentDto>>> GetTopInvestmentsAsync(int top = 20, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default);
}
