using Domain.Enums;

namespace Application.DTOs.Departments;

public class DepartmentDto
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? NameLocal { get; set; }
    public string? Floor { get; set; }
    public int? HeadPhysicianId { get; set; }
    public string? HeadPhysicianName { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
    public int PhysicianCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class DepartmentDetailDto : DepartmentDto
{
    public List<PhysicianSummaryDto> Physicians { get; set; } = new();
}

public class PhysicianSummaryDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public PhysicianSpecialty Specialty { get; set; }
    public string? SpecialtyName { get; set; }
    public KOLStatus KOLStatus { get; set; }
    public bool IsActive { get; set; }
}

public class CreateDepartmentRequest
{
    public int CustomerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameLocal { get; set; }
    public string? Floor { get; set; }
    public int? HeadPhysicianId { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    public int SortOrder { get; set; }
}

public class UpdateDepartmentRequest : CreateDepartmentRequest
{
    public int Id { get; set; }
}
