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
}
