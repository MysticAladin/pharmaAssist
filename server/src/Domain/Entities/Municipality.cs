namespace Domain.Entities;

/// <summary>
/// Represents municipalities (općina/opština) in Bosnia and Herzegovina
/// </summary>
public class Municipality : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string NameLocal { get; set; } = string.Empty;
    public int CantonId { get; set; }
    public string? PostalCode { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual Canton Canton { get; set; } = null!;
    public virtual ICollection<City> Cities { get; set; } = new List<City>();
}
