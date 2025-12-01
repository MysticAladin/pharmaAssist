using Application.DTOs.Categories;
using Application.DTOs.Common;

namespace Application.Interfaces;

/// <summary>
/// Category service interface
/// </summary>
public interface ICategoryService
{
    Task<ApiResponse<CategoryDto>> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<CategoryDto>>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<CategoryDto>>> GetRootCategoriesAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<CategoryDto>>> GetSubCategoriesAsync(int parentId, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<CategoryTreeDto>>> GetCategoryTreeAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<CategoryDto>> CreateAsync(CreateCategoryDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<CategoryDto>> UpdateAsync(int id, UpdateCategoryDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> ActivateAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeactivateAsync(int id, CancellationToken cancellationToken = default);
}
