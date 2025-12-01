using Application.DTOs.Common;
using Application.DTOs.Manufacturers;

namespace Application.Interfaces;

/// <summary>
/// Manufacturer service interface
/// </summary>
public interface IManufacturerService
{
    Task<ApiResponse<ManufacturerDto>> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<ManufacturerDto>>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<PagedResponse<ManufacturerDto>> GetPagedAsync(int page, int pageSize, string? search = null, string? country = null, bool? activeOnly = true, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<ManufacturerSummaryDto>>> GetSummaryListAsync(bool activeOnly = true, CancellationToken cancellationToken = default);
    Task<ApiResponse<ManufacturerDto>> CreateAsync(CreateManufacturerDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<ManufacturerDto>> UpdateAsync(int id, UpdateManufacturerDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> ActivateAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeactivateAsync(int id, CancellationToken cancellationToken = default);
}
