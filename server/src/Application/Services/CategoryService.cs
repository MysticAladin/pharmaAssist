using Application.DTOs.Categories;
using Application.DTOs.Common;
using Application.Interfaces;
using AutoMapper;
using Domain.Entities;
using Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Application.Services;

/// <summary>
/// Category service implementation
/// </summary>
public class CategoryService : ICategoryService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<CategoryService> _logger;

    public CategoryService(IUnitOfWork unitOfWork, IMapper mapper, ILogger<CategoryService> logger)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<ApiResponse<CategoryDto>> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var category = await _unitOfWork.Categories.GetByIdAsync(id, cancellationToken);
            if (category == null)
            {
                return ApiResponse<CategoryDto>.Fail($"Category with ID {id} not found");
            }

            var dto = _mapper.Map<CategoryDto>(category);
            return ApiResponse<CategoryDto>.Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting category by ID {Id}", id);
            return ApiResponse<CategoryDto>.Fail("An error occurred while retrieving the category");
        }
    }

    public async Task<ApiResponse<IEnumerable<CategoryDto>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var categories = await _unitOfWork.Categories.GetAllWithIncludesAsync(
                cancellationToken,
                c => c.ParentCategory!,
                c => c.Products.Where(p => p.IsActive && !p.IsDeleted));
            var dtos = _mapper.Map<IEnumerable<CategoryDto>>(categories);
            return ApiResponse<IEnumerable<CategoryDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all categories");
            return ApiResponse<IEnumerable<CategoryDto>>.Fail("An error occurred while retrieving categories");
        }
    }

    public async Task<ApiResponse<IEnumerable<CategoryDto>>> GetRootCategoriesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var categories = await _unitOfWork.Categories.FindWithIncludesAsync(
                c => c.ParentCategoryId == null && c.IsActive,
                cancellationToken,
                c => c.ParentCategory!,
                c => c.Products.Where(p => p.IsActive && !p.IsDeleted));
            var dtos = _mapper.Map<IEnumerable<CategoryDto>>(categories);
            return ApiResponse<IEnumerable<CategoryDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting root categories");
            return ApiResponse<IEnumerable<CategoryDto>>.Fail("An error occurred while retrieving root categories");
        }
    }

    public async Task<ApiResponse<IEnumerable<CategoryDto>>> GetSubCategoriesAsync(int parentId, CancellationToken cancellationToken = default)
    {
        try
        {
            var parent = await _unitOfWork.Categories.GetByIdAsync(parentId, cancellationToken);
            if (parent == null)
            {
                return ApiResponse<IEnumerable<CategoryDto>>.Fail($"Parent category with ID {parentId} not found");
            }

            var subcategories = await _unitOfWork.Categories.FindWithIncludesAsync(
                c => c.ParentCategoryId == parentId && c.IsActive,
                cancellationToken,
                c => c.ParentCategory!,
                c => c.Products.Where(p => p.IsActive && !p.IsDeleted));
            var dtos = _mapper.Map<IEnumerable<CategoryDto>>(subcategories);
            return ApiResponse<IEnumerable<CategoryDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting subcategories for parent {ParentId}", parentId);
            return ApiResponse<IEnumerable<CategoryDto>>.Fail("An error occurred while retrieving subcategories");
        }
    }

    public async Task<ApiResponse<IEnumerable<CategoryTreeDto>>> GetCategoryTreeAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var rootCategories = await _unitOfWork.Categories.GetRootCategoriesAsync(cancellationToken);
            var tree = new List<CategoryTreeDto>();

            foreach (var category in rootCategories)
            {
                var treeNode = await BuildCategoryTreeAsync(category, cancellationToken);
                tree.Add(treeNode);
            }

            return ApiResponse<IEnumerable<CategoryTreeDto>>.Ok(tree);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting category tree");
            return ApiResponse<IEnumerable<CategoryTreeDto>>.Fail("An error occurred while retrieving the category tree");
        }
    }

    public async Task<ApiResponse<CategoryDto>> CreateAsync(CreateCategoryDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            // Validate parent category if provided
            if (dto.ParentCategoryId.HasValue)
            {
                var parent = await _unitOfWork.Categories.GetByIdAsync(dto.ParentCategoryId.Value, cancellationToken);
                if (parent == null)
                {
                    return ApiResponse<CategoryDto>.Fail($"Parent category with ID {dto.ParentCategoryId} not found");
                }
            }

            // Check for duplicate name under same parent
            var existingCategories = await _unitOfWork.Categories.FindAsync(
                c => c.Name == dto.Name && c.ParentCategoryId == dto.ParentCategoryId,
                cancellationToken);

            if (existingCategories.Any())
            {
                return ApiResponse<CategoryDto>.Fail($"Category '{dto.Name}' already exists under this parent");
            }

            var category = _mapper.Map<Category>(dto);
            await _unitOfWork.Categories.AddAsync(category, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Created category {CategoryId} with name {Name}", category.Id, category.Name);

            var resultDto = _mapper.Map<CategoryDto>(category);
            return ApiResponse<CategoryDto>.Ok(resultDto, "Category created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating category with name {Name}", dto.Name);
            return ApiResponse<CategoryDto>.Fail("An error occurred while creating the category");
        }
    }

    public async Task<ApiResponse<CategoryDto>> UpdateAsync(int id, UpdateCategoryDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var category = await _unitOfWork.Categories.GetByIdAsync(id, cancellationToken);
            if (category == null)
            {
                return ApiResponse<CategoryDto>.Fail($"Category with ID {id} not found");
            }

            // Validate parent category if changed
            if (dto.ParentCategoryId.HasValue && dto.ParentCategoryId != category.ParentCategoryId)
            {
                // Prevent setting itself as parent
                if (dto.ParentCategoryId.Value == id)
                {
                    return ApiResponse<CategoryDto>.Fail("A category cannot be its own parent");
                }

                var parent = await _unitOfWork.Categories.GetByIdAsync(dto.ParentCategoryId.Value, cancellationToken);
                if (parent == null)
                {
                    return ApiResponse<CategoryDto>.Fail($"Parent category with ID {dto.ParentCategoryId} not found");
                }

                // Prevent circular reference (don't allow setting a descendant as parent)
                if (await IsDescendantAsync(dto.ParentCategoryId.Value, id, cancellationToken))
                {
                    return ApiResponse<CategoryDto>.Fail("Cannot set a descendant category as parent (circular reference)");
                }
            }

            _mapper.Map(dto, category);
            await _unitOfWork.Categories.UpdateAsync(category, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Updated category {CategoryId}", id);

            var resultDto = _mapper.Map<CategoryDto>(category);
            return ApiResponse<CategoryDto>.Ok(resultDto, "Category updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating category {CategoryId}", id);
            return ApiResponse<CategoryDto>.Fail("An error occurred while updating the category");
        }
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var category = await _unitOfWork.Categories.GetByIdAsync(id, cancellationToken);
            if (category == null)
            {
                return ApiResponse<bool>.Fail($"Category with ID {id} not found");
            }

            // Check for subcategories
            var subcategories = await _unitOfWork.Categories.GetSubCategoriesAsync(id, cancellationToken);
            if (subcategories.Any())
            {
                return ApiResponse<bool>.Fail("Cannot delete category with subcategories. Please delete or reassign subcategories first.");
            }

            // Check for products in this category
            var products = await _unitOfWork.Products.GetByCategoryAsync(id, cancellationToken);
            if (products.Any())
            {
                return ApiResponse<bool>.Fail("Cannot delete category with products. Please reassign products first.");
            }

            await _unitOfWork.Categories.DeleteAsync(category, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Deleted category {CategoryId}", id);
            return ApiResponse<bool>.Ok(true, "Category deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting category {CategoryId}", id);
            return ApiResponse<bool>.Fail("An error occurred while deleting the category");
        }
    }

    public async Task<ApiResponse<bool>> ActivateAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var category = await _unitOfWork.Categories.GetByIdAsync(id, cancellationToken);
            if (category == null)
            {
                return ApiResponse<bool>.Fail($"Category with ID {id} not found");
            }

            category.IsActive = true;
            category.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.Categories.UpdateAsync(category, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Activated category {CategoryId}", id);
            return ApiResponse<bool>.Ok(true, "Category activated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error activating category {CategoryId}", id);
            return ApiResponse<bool>.Fail("An error occurred while activating the category");
        }
    }

    public async Task<ApiResponse<bool>> DeactivateAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var category = await _unitOfWork.Categories.GetByIdAsync(id, cancellationToken);
            if (category == null)
            {
                return ApiResponse<bool>.Fail($"Category with ID {id} not found");
            }

            category.IsActive = false;
            category.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.Categories.UpdateAsync(category, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Deactivated category {CategoryId}", id);
            return ApiResponse<bool>.Ok(true, "Category deactivated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deactivating category {CategoryId}", id);
            return ApiResponse<bool>.Fail("An error occurred while deactivating the category");
        }
    }

    // Helper methods
    private async Task<CategoryTreeDto> BuildCategoryTreeAsync(Category category, CancellationToken cancellationToken)
    {
        var treeNode = _mapper.Map<CategoryTreeDto>(category);
        treeNode.Children = new List<CategoryTreeDto>();

        var subcategories = await _unitOfWork.Categories.GetSubCategoriesAsync(category.Id, cancellationToken);
        foreach (var subcategory in subcategories)
        {
            var childNode = await BuildCategoryTreeAsync(subcategory, cancellationToken);
            treeNode.Children.Add(childNode);
        }

        return treeNode;
    }

    private async Task<bool> IsDescendantAsync(int categoryId, int potentialAncestorId, CancellationToken cancellationToken)
    {
        var category = await _unitOfWork.Categories.GetByIdAsync(categoryId, cancellationToken);
        if (category == null) return false;

        if (category.ParentCategoryId == potentialAncestorId) return true;
        if (!category.ParentCategoryId.HasValue) return false;

        return await IsDescendantAsync(category.ParentCategoryId.Value, potentialAncestorId, cancellationToken);
    }
}
