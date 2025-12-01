using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Warehouse/Storage location
/// </summary>
public class Warehouse : BaseEntity
{
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string NameLocal { get; set; } = null!;
    
    public int? CityId { get; set; }
    public string? Address { get; set; }
    public string? PostalCode { get; set; }
    
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    
    public bool IsActive { get; set; } = true;
    public bool IsDefault { get; set; } = false;
    
    // Storage capabilities
    public bool HasColdStorage { get; set; } = false;
    public bool HasControlledSubstanceArea { get; set; } = false;
    public decimal? CapacityCubicMeters { get; set; }

    // Navigation properties
    public virtual City? City { get; set; }
    public virtual ICollection<InventoryStock> InventoryStocks { get; set; } = new List<InventoryStock>();
    public virtual ICollection<StockMovement> StockMovements { get; set; } = new List<StockMovement>();
}
