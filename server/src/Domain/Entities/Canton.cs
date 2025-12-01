namespace Domain.Entities;

/// <summary>
/// Represents Cantons in FBiH or Regions in RS
/// FBiH has 10 cantons, RS has 5 regions + Brčko District
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
