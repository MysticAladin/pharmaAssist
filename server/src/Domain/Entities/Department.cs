namespace Domain.Entities;

/// <summary>
/// Hospital/Clinic department within a customer institution
/// Only applicable when Customer.CustomerType is Hospital or Clinic
/// </summary>
public class Department : BaseEntity
{
    public int CustomerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameLocal { get; set; }
    public string? Floor { get; set; }
    public int? HeadPhysicianId { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }

    // Navigation properties
    public virtual Customer Customer { get; set; } = null!;
    public virtual Physician? HeadPhysician { get; set; }
    public virtual ICollection<Physician> Physicians { get; set; } = new List<Physician>();
}
