using Domain.Enums;

namespace Application.DTOs.Territories;

/// <summary>
/// Territory response DTO
/// </summary>
public class TerritoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameLocal { get; set; }
    public TerritoryType Type { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public int? ParentTerritoryId { get; set; }
    public string? ParentTerritoryName { get; set; }
    public string? CantonIds { get; set; }
    public List<string> CantonNames { get; set; } = new();
    public string? MunicipalityIds { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int AssignedRepCount { get; set; }
    public int CustomerCount { get; set; }
    public List<TerritoryAssignmentDto> Assignments { get; set; } = new();
    public List<TerritoryDto> Children { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// Territory summary for list views
/// </summary>
public class TerritorySummaryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameLocal { get; set; }
    public TerritoryType Type { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public string? ParentTerritoryName { get; set; }
    public int AssignedRepCount { get; set; }
    public int CustomerCount { get; set; }
    public bool IsActive { get; set; }
}

/// <summary>
/// Create territory request
/// </summary>
public class CreateTerritoryDto
{
    public string Name { get; set; } = string.Empty;
    public string? NameLocal { get; set; }
    public TerritoryType Type { get; set; }
    public int? ParentTerritoryId { get; set; }
    public string? CantonIds { get; set; }
    public string? MunicipalityIds { get; set; }
    public string? Description { get; set; }
}

/// <summary>
/// Update territory request
/// </summary>
public class UpdateTerritoryDto
{
    public string Name { get; set; } = string.Empty;
    public string? NameLocal { get; set; }
    public TerritoryType Type { get; set; }
    public int? ParentTerritoryId { get; set; }
    public string? CantonIds { get; set; }
    public string? MunicipalityIds { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
}

/// <summary>
/// Territory assignment DTO
/// </summary>
public class TerritoryAssignmentDto
{
    public int Id { get; set; }
    public int TerritoryId { get; set; }
    public string TerritoryName { get; set; } = string.Empty;
    public int RepId { get; set; }
    public string RepName { get; set; } = string.Empty;
    public string? RepEmployeeCode { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsPrimary { get; set; }
    public AssignmentType AssignmentType { get; set; }
    public string AssignmentTypeName { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

/// <summary>
/// Create territory assignment request
/// </summary>
public class CreateTerritoryAssignmentDto
{
    public int RepId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsPrimary { get; set; }
    public AssignmentType AssignmentType { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Bulk assign customers to rep request
/// </summary>
public class BulkAssignCustomersDto
{
    public int RepId { get; set; }
    public List<int> CustomerIds { get; set; } = new();
    public int RequiredVisitsPerMonth { get; set; } = 2;
}

/// <summary>
/// Transfer customers between reps request
/// </summary>
public class TransferCustomersDto
{
    public int FromRepId { get; set; }
    public int ToRepId { get; set; }
    public List<int> CustomerIds { get; set; } = new();
}

/// <summary>
/// Territory performance comparison DTO
/// </summary>
public class TerritoryPerformanceDto
{
    public int TerritoryId { get; set; }
    public string TerritoryName { get; set; } = string.Empty;
    public TerritoryType Type { get; set; }
    public int TotalCustomers { get; set; }
    public int ActiveCustomers { get; set; }
    public int TotalReps { get; set; }
    public int TotalVisits { get; set; }
    public int PlannedVisits { get; set; }
    public decimal VisitCompliancePercent { get; set; }
    public int OverdueVisits { get; set; }
    public int UniqueFieldDays { get; set; }
    public decimal AvgVisitsPerFieldDay { get; set; }
    public Dictionary<string, int> VisitsByCustomerType { get; set; } = new();
    public Dictionary<string, decimal> MonthlyVisitTrend { get; set; } = new();
}

/// <summary>
/// Visit frequency analytics DTO
/// </summary>
public class VisitFrequencyDto
{
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerType { get; set; }
    public string? CustomerTier { get; set; }
    public int RepId { get; set; }
    public string RepName { get; set; } = string.Empty;
    public int RequiredVisitsPerMonth { get; set; }
    public int CompletedVisitsThisMonth { get; set; }
    public int CompletedVisitsThisCycle { get; set; }
    public decimal CompliancePercent { get; set; }
    public DateTime? LastVisitDate { get; set; }
    public int DaysSinceLastVisit { get; set; }
    public bool IsOverdue { get; set; }
}

/// <summary>
/// Field work metrics DTO for a rep
/// </summary>
public class FieldWorkMetricsDto
{
    public int RepId { get; set; }
    public string RepName { get; set; } = string.Empty;
    public string? EmployeeCode { get; set; }
    public int UniqueFieldDays { get; set; }
    public int TotalVisits { get; set; }
    public decimal AvgVisitsPerFieldDay { get; set; }
    public int TotalCustomersVisited { get; set; }
    public Dictionary<string, int> VisitsByCustomerType { get; set; } = new();
    public Dictionary<string, int> VisitsByTier { get; set; } = new();
    public Dictionary<string, int> MonthlyVisits { get; set; } = new();
    public Dictionary<string, int> MonthlyFieldDays { get; set; } = new();
}

/// <summary>
/// Institution-level analytics DTO
/// </summary>
public class InstitutionAnalyticsDto
{
    public string CustomerType { get; set; } = string.Empty;
    public int TotalInstitutions { get; set; }
    public int ActiveInstitutions { get; set; }
    public int VisitedThisPeriod { get; set; }
    public int TotalVisits { get; set; }
    public decimal AvgVisitsPerInstitution { get; set; }
    public decimal CoveragePercent { get; set; }
    public Dictionary<string, int> ByTier { get; set; } = new();
    public Dictionary<string, int> ByCanton { get; set; } = new();
}
