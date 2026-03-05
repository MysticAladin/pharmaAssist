using Domain.Enums;

namespace Application.DTOs.Physicians;

public class PhysicianDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? FullNameLocal { get; set; }
    public PhysicianSpecialty Specialty { get; set; }
    public string? SpecialtyName { get; set; }
    public string? SpecialtyOther { get; set; }
    public int InstitutionId { get; set; }
    public string InstitutionName { get; set; } = string.Empty;
    public int? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public string? LicenseNumber { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public KOLStatus KOLStatus { get; set; }
    public string? KOLStatusName { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; }
    public int PrescriptionCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePhysicianRequest
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
    public KOLStatus KOLStatus { get; set; }
    public string? Notes { get; set; }
}

public class UpdatePhysicianRequest : CreatePhysicianRequest
{
    public int Id { get; set; }
}
