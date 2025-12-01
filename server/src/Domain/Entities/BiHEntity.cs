namespace Domain.Entities;

/// <summary>
/// Represents the administrative entities of Bosnia and Herzegovina:
/// Federation of BiH (FBiH), Republika Srpska (RS), and Brčko District (BD)
/// </summary>
public class BiHEntity : BaseEntity
{
    public string Code { get; set; } = string.Empty; // FBIH, RS, BD
    public string Name { get; set; } = string.Empty;
    public string NameLocal { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual ICollection<Canton> Cantons { get; set; } = new List<Canton>();
}
