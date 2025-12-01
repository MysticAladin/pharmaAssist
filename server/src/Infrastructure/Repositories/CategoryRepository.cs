using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

/// <summary>
/// Category repository implementation
/// </summary>
public class CategoryRepository : Repository<Category>, ICategoryRepository
{
    public CategoryRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<Category>> GetRootCategoriesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(c => c.ParentCategoryId == null && c.IsActive)
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Category>> GetSubCategoriesAsync(int parentId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(c => c.ParentCategoryId == parentId && c.IsActive)
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Category?> GetWithSubCategoriesAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.SubCategories.Where(sc => sc.IsActive))
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<Category?> GetWithProductsAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.Products.Where(p => p.IsActive))
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<Category>> GetActiveCategoriesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(c => c.IsActive)
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Category>> GetCategoryHierarchyAsync(int categoryId, CancellationToken cancellationToken = default)
    {
        var hierarchy = new List<Category>();
        var current = await _dbSet
            .Include(c => c.ParentCategory)
            .FirstOrDefaultAsync(c => c.Id == categoryId, cancellationToken);

        while (current != null)
        {
            hierarchy.Insert(0, current);
            if (current.ParentCategoryId.HasValue)
            {
                current = await _dbSet
                    .Include(c => c.ParentCategory)
                    .FirstOrDefaultAsync(c => c.Id == current.ParentCategoryId, cancellationToken);
            }
            else
            {
                current = null;
            }
        }

        return hierarchy;
    }
}
