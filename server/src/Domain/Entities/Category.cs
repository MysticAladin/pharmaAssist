namespace Domain.Entities;

/// <summary>
/// Product category with hierarchical support
/// </summary>
public class Category : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string NameLocal { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? DescriptionLocal { get; set; }
    public int? ParentCategoryId { get; set; }
    public string? ImageUrl { get; set; }
    public int DisplayOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual Category? ParentCategory { get; set; }
    public virtual ICollection<Category> SubCategories { get; set; } = new List<Category>();
    public virtual ICollection<Product> Products { get; set; } = new List<Product>();
}
