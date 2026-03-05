using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Territory entity — hierarchical geographic territory for sales rep management
/// </summary>
public class Territory : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? NameLocal { get; set; }
    public TerritoryType Type { get; set; }
    public int? ParentTerritoryId { get; set; }
    public string? CantonIds { get; set; } // JSON array of canton IDs
    public string? MunicipalityIds { get; set; } // JSON array of municipality IDs
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public Territory? ParentTerritory { get; set; }
    public ICollection<Territory> ChildTerritories { get; set; } = new List<Territory>();
    public ICollection<TerritoryAssignment> Assignments { get; set; } = new List<TerritoryAssignment>();
}
