using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Tracks distribution of materials (samples, brochures, gifts) by a rep to a customer
/// </summary>
public class MaterialDistribution : BaseEntity
{
    public int RepId { get; set; }
    public int CustomerId { get; set; }
    public int? VisitId { get; set; }
    public int? ProductId { get; set; }
    public string MaterialName { get; set; } = string.Empty;
    public MaterialType MaterialType { get; set; }
    public int Quantity { get; set; }
    public string? LotNumber { get; set; }
    public DateTime DistributedAt { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }

    // Navigation
    public SalesRepresentative Rep { get; set; } = null!;
    public Customer Customer { get; set; } = null!;
    public ExecutedVisit? Visit { get; set; }
    public Product? Product { get; set; }
}
