namespace Domain.Entities;

public class BrandGroupMember : BaseEntity
{
    public int BrandGroupId { get; set; }
    public int BrandId { get; set; }
    public int SortOrder { get; set; }

    // Navigation properties
    public virtual BrandGroup BrandGroup { get; set; } = null!;
    public virtual Brand Brand { get; set; } = null!;
}
