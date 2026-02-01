using Application.DTOs.Planning;

namespace Application.Interfaces;

/// <summary>
/// Service for managing planning hierarchy (Annual -> Quarterly -> Monthly -> Weekly)
/// </summary>
public interface IPlanningHierarchyService
{
    #region Overview
    
    /// <summary>
    /// Gets planning hierarchy overview for a rep's dashboard
    /// </summary>
    Task<PlanningHierarchyOverviewDto> GetOverviewAsync(int repId, CancellationToken cancellationToken = default);
    
    #endregion
    
    #region Annual Plans
    
    /// <summary>
    /// Gets all annual plans for a rep
    /// </summary>
    Task<IReadOnlyList<AnnualPlanSummaryDto>> GetAnnualPlansAsync(int repId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets annual plan by id
    /// </summary>
    Task<AnnualPlanDetailDto?> GetAnnualPlanByIdAsync(int id, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets annual plan for a specific year
    /// </summary>
    Task<AnnualPlanDetailDto?> GetAnnualPlanByYearAsync(int repId, int year, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Creates a new annual plan
    /// </summary>
    Task<AnnualPlanDetailDto> CreateAnnualPlanAsync(int repId, CreateAnnualPlanDto dto, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Updates an existing annual plan
    /// </summary>
    Task<AnnualPlanDetailDto> UpdateAnnualPlanAsync(int id, UpdateAnnualPlanDto dto, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Submits annual plan for approval
    /// </summary>
    Task<AnnualPlanDetailDto> SubmitAnnualPlanAsync(int id, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Approves annual plan (manager only)
    /// </summary>
    Task<AnnualPlanDetailDto> ApproveAnnualPlanAsync(int id, string approvedBy, string? comments = null, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Rejects annual plan (manager only)
    /// </summary>
    Task<AnnualPlanDetailDto> RejectAnnualPlanAsync(int id, string reason, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Deletes an annual plan (only drafts)
    /// </summary>
    Task DeleteAnnualPlanAsync(int id, CancellationToken cancellationToken = default);
    
    #endregion
    
    #region Quarterly Plans
    
    /// <summary>
    /// Gets all quarterly plans for an annual plan
    /// </summary>
    Task<IReadOnlyList<QuarterlyPlanSummaryDto>> GetQuarterlyPlansAsync(int annualPlanId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets quarterly plan by id
    /// </summary>
    Task<QuarterlyPlanDetailDto?> GetQuarterlyPlanByIdAsync(int id, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Creates a new quarterly plan
    /// </summary>
    Task<QuarterlyPlanDetailDto> CreateQuarterlyPlanAsync(int repId, CreateQuarterlyPlanDto dto, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Updates an existing quarterly plan
    /// </summary>
    Task<QuarterlyPlanDetailDto> UpdateQuarterlyPlanAsync(int id, UpdateQuarterlyPlanDto dto, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Submits quarterly plan for approval
    /// </summary>
    Task<QuarterlyPlanDetailDto> SubmitQuarterlyPlanAsync(int id, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Approves quarterly plan (manager only)
    /// </summary>
    Task<QuarterlyPlanDetailDto> ApproveQuarterlyPlanAsync(int id, string approvedBy, string? comments = null, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Rejects quarterly plan (manager only)
    /// </summary>
    Task<QuarterlyPlanDetailDto> RejectQuarterlyPlanAsync(int id, string reason, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Deletes a quarterly plan (only drafts)
    /// </summary>
    Task DeleteQuarterlyPlanAsync(int id, CancellationToken cancellationToken = default);
    
    #endregion
    
    #region Monthly Plans
    
    /// <summary>
    /// Gets all monthly plans for a quarterly plan
    /// </summary>
    Task<IReadOnlyList<MonthlyPlanSummaryDto>> GetMonthlyPlansAsync(int quarterlyPlanId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets monthly plan by id
    /// </summary>
    Task<MonthlyPlanDetailDto?> GetMonthlyPlanByIdAsync(int id, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Creates a new monthly plan
    /// </summary>
    Task<MonthlyPlanDetailDto> CreateMonthlyPlanAsync(int repId, CreateMonthlyPlanDto dto, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Updates an existing monthly plan
    /// </summary>
    Task<MonthlyPlanDetailDto> UpdateMonthlyPlanAsync(int id, UpdateMonthlyPlanDto dto, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Submits monthly plan for approval
    /// </summary>
    Task<MonthlyPlanDetailDto> SubmitMonthlyPlanAsync(int id, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Approves monthly plan (manager only)
    /// </summary>
    Task<MonthlyPlanDetailDto> ApproveMonthlyPlanAsync(int id, string approvedBy, string? comments = null, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Rejects monthly plan (manager only)
    /// </summary>
    Task<MonthlyPlanDetailDto> RejectMonthlyPlanAsync(int id, string reason, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Deletes a monthly plan (only drafts)
    /// </summary>
    Task DeleteMonthlyPlanAsync(int id, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Links a weekly plan to a monthly plan
    /// </summary>
    Task LinkWeeklyPlanAsync(int monthlyPlanId, int weeklyPlanId, CancellationToken cancellationToken = default);
    
    #endregion
    
    #region Team Plans (Manager)
    
    /// <summary>
    /// Gets all pending annual plans for approval (manager's team)
    /// </summary>
    Task<IReadOnlyList<AnnualPlanSummaryDto>> GetTeamPendingAnnualPlansAsync(string managerId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets all pending quarterly plans for approval (manager's team)
    /// </summary>
    Task<IReadOnlyList<QuarterlyPlanSummaryDto>> GetTeamPendingQuarterlyPlansAsync(string managerId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets all pending monthly plans for approval (manager's team)
    /// </summary>
    Task<IReadOnlyList<MonthlyPlanSummaryDto>> GetTeamPendingMonthlyPlansAsync(string managerId, CancellationToken cancellationToken = default);
    
    #endregion
    
    #region Auto-Generation
    
    /// <summary>
    /// Generates quarterly plans from annual plan
    /// </summary>
    Task<IReadOnlyList<QuarterlyPlanDetailDto>> GenerateQuarterlyPlansFromAnnualAsync(int annualPlanId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Generates monthly plans from quarterly plan
    /// </summary>
    Task<IReadOnlyList<MonthlyPlanDetailDto>> GenerateMonthlyPlansFromQuarterlyAsync(int quarterlyPlanId, CancellationToken cancellationToken = default);
    
    #endregion
}
