using Application.DTOs.Common;
using Application.DTOs.Departments;
using Application.DTOs.Physicians;

namespace Application.Interfaces;

public interface IDepartmentService
{
    Task<ApiResponse<List<DepartmentDto>>> GetByCustomerAsync(int customerId, CancellationToken ct = default);
    Task<ApiResponse<DepartmentDetailDto>> GetByIdAsync(int id, CancellationToken ct = default);
    Task<ApiResponse<DepartmentDto>> CreateAsync(CreateDepartmentRequest request, CancellationToken ct = default);
    Task<ApiResponse<DepartmentDto>> UpdateAsync(UpdateDepartmentRequest request, CancellationToken ct = default);
    Task<ApiResponse<bool>> DeleteAsync(int id, CancellationToken ct = default);
}

public interface IPhysicianService
{
    Task<PagedResponse<PhysicianDto>> GetPagedAsync(int? institutionId, int? departmentId,
        string? search, int page = 1, int pageSize = 10, CancellationToken ct = default);
    Task<ApiResponse<PhysicianDto>> GetByIdAsync(int id, CancellationToken ct = default);
    Task<ApiResponse<List<PhysicianDto>>> GetByInstitutionAsync(int institutionId, CancellationToken ct = default);
    Task<ApiResponse<List<PhysicianDto>>> GetByDepartmentAsync(int departmentId, CancellationToken ct = default);
    Task<ApiResponse<PhysicianDto>> CreateAsync(CreatePhysicianRequest request, CancellationToken ct = default);
    Task<ApiResponse<PhysicianDto>> UpdateAsync(UpdatePhysicianRequest request, CancellationToken ct = default);
    Task<ApiResponse<bool>> DeleteAsync(int id, CancellationToken ct = default);
}
