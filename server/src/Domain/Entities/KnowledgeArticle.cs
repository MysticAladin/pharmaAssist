using Domain.Enums;

namespace Domain.Entities;

public class KnowledgeArticle : BaseEntity
{
    public int? ProductId { get; set; }
    public int? BrandId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TitleLocal { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? ContentLocal { get; set; }
    public KnowledgeCategory Category { get; set; }
    public int SortOrder { get; set; }
    public bool IsPublished { get; set; } = true;
    public string? Tags { get; set; }

    // Navigation properties
    public virtual Product? Product { get; set; }
    public virtual Brand? Brand { get; set; }
}
