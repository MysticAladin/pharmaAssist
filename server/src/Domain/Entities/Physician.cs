using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Physician/Doctor associated with a customer institution (Hospital, Clinic, Pharmacy)
/// Replaces free-text DoctorName in Prescription
/// </summary>
public class Physician : BaseEntity
{
    public string FullName { get; set; } = string.Empty;
    public string? FullNameLocal { get; set; }
    public PhysicianSpecialty Specialty { get; set; }
    public string? SpecialtyOther { get; set; }
    public int InstitutionId { get; set; }
    public int? DepartmentId { get; set; }
    public string? LicenseNumber { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public KOLStatus KOLStatus { get; set; } = KOLStatus.None;
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual Customer Institution { get; set; } = null!;
    public virtual Department? Department { get; set; }
    public virtual ICollection<Prescription> Prescriptions { get; set; } = new List<Prescription>();
}
