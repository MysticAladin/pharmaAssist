namespace Domain.Entities;

/// <summary>
/// Represents administrative units used for location selection.
/// FBiH has 10 cantons; RS and Brčko District are modeled as single units.
/// </summary>
public class Canton : BaseEntity
{
    public string Code { get; set; } = string.Empty; // USK, TK, KS, BL, etc.
    public string Name { get; set; } = string.Empty;
    public string NameLocal { get; set; } = string.Empty;
    public int BiHEntityId { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual BiHEntity BiHEntity { get; set; } = null!;
    public virtual ICollection<Municipality> Municipalities { get; set; } = new List<Municipality>();
}
