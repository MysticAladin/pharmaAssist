namespace Domain.Entities;

public class BrandGroup : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? NameLocal { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual ICollection<BrandGroupMember> Members { get; set; } = new List<BrandGroupMember>();
}
