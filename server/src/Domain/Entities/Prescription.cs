namespace Domain.Entities;

/// <summary>
/// Medical prescription for controlled products
/// </summary>
public class Prescription : BaseEntity
{
    public int CustomerId { get; set; }
    
    public string PrescriptionNumber { get; set; } = null!;
    public DateTime IssuedDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    
    // Doctor information
    public string DoctorName { get; set; } = null!;
    public string? DoctorLicenseNumber { get; set; }
    public string? MedicalInstitution { get; set; }
    
    // Patient information
    public string PatientName { get; set; } = null!;
    public string? PatientIdNumber { get; set; }
    
    // Status
    public bool IsUsed { get; set; } = false;
    public DateTime? UsedDate { get; set; }
    
    // Document storage
    public string? ImagePath { get; set; }
    
    public string? Notes { get; set; }

    // Navigation properties
    public virtual Customer Customer { get; set; } = null!;
    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
