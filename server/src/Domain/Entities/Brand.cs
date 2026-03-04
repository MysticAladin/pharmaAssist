namespace Domain.Entities;

public class Brand : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? NameLocal { get; set; }
    public int ManufacturerId { get; set; }
    public string? Description { get; set; }
    public string? DescriptionLocal { get; set; }
    public string? LogoPath { get; set; }
    public string? TherapeuticArea { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual Manufacturer Manufacturer { get; set; } = null!;
    public virtual ICollection<Product> Products { get; set; } = new List<Product>();
    public virtual ICollection<BrandGroupMember> BrandGroupMembers { get; set; } = new List<BrandGroupMember>();
}
