namespace Application.DTOs.Categories;

/// <summary>
/// Category response DTO
/// </summary>
public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string NameLocal { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? DescriptionLocal { get; set; }
    public int? ParentCategoryId { get; set; }
    public string? ParentCategoryName { get; set; }
    public string? ImageUrl { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public int ProductCount { get; set; }
    public List<CategoryDto> SubCategories { get; set; } = new();
}

/// <summary>
/// Create category request DTO
/// </summary>
public class CreateCategoryDto
{
    public string Name { get; set; } = string.Empty;
    public string NameLocal { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? DescriptionLocal { get; set; }
    public int? ParentCategoryId { get; set; }
    public string? ImageUrl { get; set; }
    public int DisplayOrder { get; set; } = 0;
}

/// <summary>
/// Update category request DTO
/// </summary>
public class UpdateCategoryDto
{
    public string Name { get; set; } = string.Empty;
    public string NameLocal { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? DescriptionLocal { get; set; }
    public int? ParentCategoryId { get; set; }
    public string? ImageUrl { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
}

/// <summary>
/// Category tree item for hierarchical display
/// </summary>
public class CategoryTreeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string NameLocal { get; set; } = string.Empty;
    public int Level { get; set; }
    public bool HasChildren { get; set; }
    public List<CategoryTreeDto> Children { get; set; } = new();
}
