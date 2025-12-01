using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Customer address for billing and shipping
/// </summary>
public class CustomerAddress : BaseEntity
{
    public int CustomerId { get; set; }
    public AddressType AddressType { get; set; } = AddressType.Shipping;
    
    public string Street { get; set; } = string.Empty;
    public string? Street2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    
    // BiH Location references
    public int? MunicipalityId { get; set; }
    public int? CantonId { get; set; }
    public int? BiHEntityId { get; set; }
    
    public string? ContactName { get; set; }
    public string? ContactPhone { get; set; }
    public string? Notes { get; set; }
    
    public bool IsDefault { get; set; } = false;
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual Customer Customer { get; set; } = null!;
    public virtual Municipality? Municipality { get; set; }
    public virtual Canton? Canton { get; set; }
    public virtual BiHEntity? BiHEntity { get; set; }
}
