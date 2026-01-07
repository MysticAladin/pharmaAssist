using Domain.Enums;

namespace Application.DTOs.SalesReps;

/// <summary>
/// Sales representative response DTO
/// </summary>
public class SalesRepresentativeDto
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public RepresentativeType RepType { get; set; }
    public string RepTypeName { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Mobile { get; set; }
    public DateTime HireDate { get; set; }
    public RepresentativeStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public string? TerritoryDescription { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    // Manager info
    public List<ManagerAssignmentDto> Managers { get; set; } = new();
    
    // Customer assignment count
    public int AssignedCustomersCount { get; set; }
}

/// <summary>
/// Sales representative summary for lists
/// </summary>
public class SalesRepresentativeSummaryDto
{
    public int Id { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public RepresentativeType RepType { get; set; }
    public string RepTypeName { get; set; } = string.Empty;
    public RepresentativeStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public string? TerritoryDescription { get; set; }
    public string? PrimaryManagerName { get; set; }
    public int AssignedCustomersCount { get; set; }
}

/// <summary>
/// Create new sales representative DTO
/// </summary>
public class CreateSalesRepresentativeDto
{
    public string UserId { get; set; } = string.Empty;
    public RepresentativeType RepType { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string? Mobile { get; set; }
    public DateTime HireDate { get; set; }
    public string? TerritoryDescription { get; set; }
    public List<int> ManagerIds { get; set; } = new();
    public int? PrimaryManagerId { get; set; }
}

/// <summary>
/// Update sales representative DTO
/// </summary>
public class UpdateSalesRepresentativeDto
{
    public RepresentativeType RepType { get; set; }
    public string? Mobile { get; set; }
    public DateTime HireDate { get; set; }
    public RepresentativeStatus Status { get; set; }
    public string? TerritoryDescription { get; set; }
}

/// <summary>
/// Manager assignment info DTO
/// </summary>
public class ManagerAssignmentDto
{
    public int AssignmentId { get; set; }
    public int ManagerId { get; set; }
    public string ManagerName { get; set; } = string.Empty;
    public string ManagerEmployeeCode { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public bool IsActive { get; set; }
    public DateTime AssignmentDate { get; set; }
}

/// <summary>
/// Update manager assignments for a rep
/// </summary>
public class UpdateManagerAssignmentsDto
{
    public List<int> ManagerIds { get; set; } = new();
    public int? PrimaryManagerId { get; set; }
}

/// <summary>
/// Customer assignment DTO
/// </summary>
public class CustomerAssignmentDto
{
    public int AssignmentId { get; set; }
    public int CustomerId { get; set; }
    public string CustomerCode { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string? City { get; set; }
    public bool IsActive { get; set; }
    public DateTime AssignmentDate { get; set; }
}

/// <summary>
/// Assign customers to a rep
/// </summary>
public class AssignCustomersDto
{
    public List<int> CustomerIds { get; set; } = new();
}

/// <summary>
/// Rep hierarchy view DTO
/// </summary>
public class RepHierarchyDto
{
    public int ManagerId { get; set; }
    public string ManagerName { get; set; } = string.Empty;
    public string ManagerEmployeeCode { get; set; } = string.Empty;
    public RepresentativeType ManagerRepType { get; set; }
    public List<SalesRepresentativeSummaryDto> TeamMembers { get; set; } = new();
}

/// <summary>
/// Filter/query parameters for sales reps list
/// </summary>
public class SalesRepQueryDto
{
    public string? Search { get; set; }
    public RepresentativeType? RepType { get; set; }
    public RepresentativeStatus? Status { get; set; }
    public int? ManagerId { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SortBy { get; set; }
    public bool SortDescending { get; set; }
}
