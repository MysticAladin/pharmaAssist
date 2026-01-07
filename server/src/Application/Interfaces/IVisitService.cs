using Application.DTOs.Visits;

namespace Application.Interfaces;

public interface IVisitService
{
    Task<IReadOnlyList<PlannedVisitSummaryDto>> GetTodayPlannedAsync(string userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ExecutedVisitSummaryDto>> GetTodayExecutedAsync(string userId, CancellationToken cancellationToken = default);

    Task<ExecutedVisitDto?> GetExecutedVisitAsync(string userId, int id, CancellationToken cancellationToken = default);

    Task<ExecutedVisitDto> CheckInAsync(string userId, CheckInVisitDto dto, CancellationToken cancellationToken = default);
    Task<ExecutedVisitDto?> UpdateExecutedVisitAsync(string userId, int id, UpdateExecutedVisitDto dto, CancellationToken cancellationToken = default);
    Task<ExecutedVisitDto?> CheckOutAsync(string userId, int id, CheckOutVisitDto dto, CancellationToken cancellationToken = default);
}
