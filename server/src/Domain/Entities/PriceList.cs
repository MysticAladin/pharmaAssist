using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Price list header — e.g., "Hospital PL 2025", "Retail PL Q1 2025"
/// </summary>
public class PriceList : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? NameLocal { get; set; }
    public PriceListType Type { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Description { get; set; }

    // Navigation properties
    public ICollection<PriceListItem> Items { get; set; } = new List<PriceListItem>();
}
