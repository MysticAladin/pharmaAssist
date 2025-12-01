using Domain.Entities;

namespace Domain.Interfaces;

/// <summary>
/// Category repository with category-specific operations
/// </summary>
public interface ICategoryRepository : IRepository<Category>
{
    Task<IReadOnlyList<Category>> GetRootCategoriesAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Category>> GetSubCategoriesAsync(int parentId, CancellationToken cancellationToken = default);
    Task<Category?> GetWithSubCategoriesAsync(int id, CancellationToken cancellationToken = default);
    Task<Category?> GetWithProductsAsync(int id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Category>> GetActiveCategoriesAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Category>> GetCategoryHierarchyAsync(int categoryId, CancellationToken cancellationToken = default);
}
