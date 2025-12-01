namespace Domain.Entities;

/// <summary>
/// Represents cities and settlements (grad/naselje) in Bosnia and Herzegovina
/// </summary>
public class City : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string NameLocal { get; set; } = string.Empty;
    public int MunicipalityId { get; set; }
    public string PostalCode { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual Municipality Municipality { get; set; } = null!;
}
