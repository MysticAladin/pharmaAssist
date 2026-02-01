using Application.DTOs.Visits;

namespace Application.Interfaces;

/// <summary>
/// Service for managing sales rep weekly visit plans
/// </summary>
public interface IVisitPlanService
{
    /// <summary>
    /// Get all plans for a sales rep
    /// </summary>
    Task<IReadOnlyList<VisitPlanSummaryDto>> GetPlansAsync(string userId, DateTime? fromWeek = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get a specific plan with all visits
    /// </summary>
    Task<VisitPlanDetailDto?> GetPlanAsync(string userId, int planId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get or create a plan for a specific week
    /// </summary>
    Task<VisitPlanDetailDto> GetOrCreateWeekPlanAsync(string userId, DateTime weekStart, CancellationToken cancellationToken = default);

    /// <summary>
    /// Add a planned visit to a plan
    /// </summary>
    Task<PlannedVisitDto> AddPlannedVisitAsync(string userId, int planId, CreatePlannedVisitDto dto, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update a planned visit
    /// </summary>
    Task<PlannedVisitDto?> UpdatePlannedVisitAsync(string userId, int planId, int visitId, UpdatePlannedVisitDto dto, CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete a planned visit
    /// </summary>
    Task<bool> DeletePlannedVisitAsync(string userId, int planId, int visitId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Submit a plan for approval
    /// </summary>
    Task<VisitPlanDetailDto?> SubmitForApprovalAsync(string userId, int planId, CancellationToken cancellationToken = default);

    // Manager methods

    /// <summary>
    /// Get pending plans from team members for approval
    /// </summary>
    Task<IReadOnlyList<TeamVisitPlanDto>> GetTeamPendingPlansAsync(string managerId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all plans from team members with optional filters
    /// </summary>
    Task<IReadOnlyList<TeamVisitPlanDto>> GetTeamPlansAsync(string managerId, DateTime? fromWeek = null, int? status = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get a specific plan for manager review
    /// </summary>
    Task<TeamVisitPlanDetailDto?> GetTeamPlanAsync(string managerId, int planId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Approve a plan
    /// </summary>
    Task<TeamVisitPlanDetailDto?> ApprovePlanAsync(string managerId, int planId, string? comments, CancellationToken cancellationToken = default);

    /// <summary>
    /// Reject a plan
    /// </summary>
    Task<TeamVisitPlanDetailDto?> RejectPlanAsync(string managerId, int planId, string reason, CancellationToken cancellationToken = default);
}
