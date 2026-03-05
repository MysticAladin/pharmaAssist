namespace Domain.Entities;

/// <summary>
/// Tracks a rep's current inventory of materials available for distribution (their "bag")
/// </summary>
public class RepInventory : BaseEntity
{
    public int RepId { get; set; }
    public int? ProductId { get; set; }
    public string MaterialName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int? MinQuantity { get; set; }
    public DateTime? LastRestockedAt { get; set; }

    // Navigation
    public SalesRepresentative Rep { get; set; } = null!;
    public Product? Product { get; set; }
}
