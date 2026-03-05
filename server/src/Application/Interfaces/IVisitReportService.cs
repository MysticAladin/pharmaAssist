using Application.DTOs.Visits;
using Application.DTOs.Visits.Reports;

namespace Application.Interfaces;

public interface IVisitReportService
{
    Task<IReadOnlyList<TeamVisitPlanSummaryDto>> GetTeamPlansForWeekAsync(
        string managerUserId,
        DateTime weekStartUtc,
        CancellationToken cancellationToken = default);

    Task<VisitPlanReportDto?> GetTeamPlanAsync(
        string managerUserId,
        int planId,
        CancellationToken cancellationToken = default);

    Task<ExecutedVisitDto?> GetTeamExecutedVisitAsync(
        string managerUserId,
        int executedVisitId,
        CancellationToken cancellationToken = default);

    Task<TeamActivityDashboardDto> GetTeamActivityAsync(
        string managerUserId,
        DateTime? date,
        CancellationToken cancellationToken = default);

    Task<VisitAuditResultDto> GetVisitAuditAsync(
        string managerUserId,
        VisitAuditFilterDto filter,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all visits for a customer across all reps (admin/manager view)
    /// </summary>
    Task<CustomerVisitHistoryDto> GetCustomerVisitsAcrossRepsAsync(
        int customerId, int page = 1, int pageSize = 10,
        DateTime? from = null, DateTime? to = null,
        CancellationToken cancellationToken = default);
}
