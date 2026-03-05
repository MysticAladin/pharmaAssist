using Domain.Enums;

namespace Application.DTOs.Cycles;

/// <summary>
/// Cycle response DTO
/// </summary>
public class CycleDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameLocal { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public CycleStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public string? FocusBrandIds { get; set; }
    public List<string> FocusBrandNames { get; set; } = new();
    public string? Description { get; set; }
    public int? OwnerId { get; set; }
    public string? OwnerName { get; set; }
    public decimal? PlannedBudget { get; set; }
    public bool IsActive { get; set; }
    public int TotalTargets { get; set; }
    public int CompletedTargets { get; set; }
    public decimal CompletionPercentage { get; set; }
    public List<CycleTargetDto> Targets { get; set; } = new();
    public List<CampaignSummaryDto> Campaigns { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// Cycle summary for list views
/// </summary>
public class CycleSummaryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameLocal { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public CycleStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public string? OwnerName { get; set; }
    public decimal? PlannedBudget { get; set; }
    public int TotalTargets { get; set; }
    public int CompletedTargets { get; set; }
    public decimal CompletionPercentage { get; set; }
    public int CampaignCount { get; set; }
    public bool IsActive { get; set; }
}

/// <summary>
/// Create cycle request
/// </summary>
public class CreateCycleDto
{
    public string Name { get; set; } = string.Empty;
    public string? NameLocal { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string? FocusBrandIds { get; set; }
    public string? Description { get; set; }
    public int? OwnerId { get; set; }
    public decimal? PlannedBudget { get; set; }
}

/// <summary>
/// Update cycle request
/// </summary>
public class UpdateCycleDto
{
    public string Name { get; set; } = string.Empty;
    public string? NameLocal { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string? FocusBrandIds { get; set; }
    public string? Description { get; set; }
    public int? OwnerId { get; set; }
    public decimal? PlannedBudget { get; set; }
    public bool IsActive { get; set; }
}

/// <summary>
/// Cycle target DTO
/// </summary>
public class CycleTargetDto
{
    public int Id { get; set; }
    public int CycleId { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerType { get; set; }
    public int RepId { get; set; }
    public string RepName { get; set; } = string.Empty;
    public int RequiredVisits { get; set; }
    public int CompletedVisits { get; set; }
    public decimal CompletionPercentage { get; set; }
    public int Priority { get; set; }
    public string? TargetProducts { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Create cycle target request
/// </summary>
public class CreateCycleTargetDto
{
    public int CustomerId { get; set; }
    public int RepId { get; set; }
    public int RequiredVisits { get; set; }
    public int Priority { get; set; } = 3;
    public string? TargetProducts { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Bulk create targets request
/// </summary>
public class BulkCreateCycleTargetsDto
{
    public List<int> CustomerIds { get; set; } = new();
    public int RepId { get; set; }
    public int RequiredVisits { get; set; }
    public int Priority { get; set; } = 3;
    public string? TargetProducts { get; set; }
}

/// <summary>
/// Campaign response DTO
/// </summary>
public class CampaignDto
{
    public int Id { get; set; }
    public int? CycleId { get; set; }
    public string? CycleName { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameLocal { get; set; }
    public CampaignType Type { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal? PlannedBudget { get; set; }
    public decimal ActualSpent { get; set; }
    public CampaignStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public string? TargetingCriteria { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int TotalTargets { get; set; }
    public int CompletedTargets { get; set; }
    public int ContactedTargets { get; set; }
    public decimal CompletionPercentage { get; set; }
    public List<CampaignTargetDto> Targets { get; set; } = new();
    public List<CampaignExpenseDto> Expenses { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// Campaign summary for list views
/// </summary>
public class CampaignSummaryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameLocal { get; set; }
    public int? CycleId { get; set; }
    public string? CycleName { get; set; }
    public CampaignType Type { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public CampaignStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public decimal? PlannedBudget { get; set; }
    public decimal ActualSpent { get; set; }
    public int TotalTargets { get; set; }
    public int CompletedTargets { get; set; }
    public decimal CompletionPercentage { get; set; }
    public bool IsActive { get; set; }
}

/// <summary>
/// Create campaign request
/// </summary>
public class CreateCampaignDto
{
    public int? CycleId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameLocal { get; set; }
    public CampaignType Type { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal? PlannedBudget { get; set; }
    public string? TargetingCriteria { get; set; }
    public string? Description { get; set; }
}

/// <summary>
/// Update campaign request
/// </summary>
public class UpdateCampaignDto
{
    public int? CycleId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameLocal { get; set; }
    public CampaignType Type { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal? PlannedBudget { get; set; }
    public string? TargetingCriteria { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
}

/// <summary>
/// Campaign target DTO
/// </summary>
public class CampaignTargetDto
{
    public int Id { get; set; }
    public int CampaignId { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerType { get; set; }
    public int? RepId { get; set; }
    public string? RepName { get; set; }
    public CampaignTargetStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public DateTime? ContactedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Create campaign target request
/// </summary>
public class CreateCampaignTargetDto
{
    public int CustomerId { get; set; }
    public int? RepId { get; set; }
}

/// <summary>
/// Update campaign target status
/// </summary>
public class UpdateCampaignTargetStatusDto
{
    public CampaignTargetStatus Status { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Campaign expense DTO
/// </summary>
public class CampaignExpenseDto
{
    public int Id { get; set; }
    public int? CampaignId { get; set; }
    public string? CampaignName { get; set; }
    public int? CycleId { get; set; }
    public string? CycleName { get; set; }
    public int? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public int? RepId { get; set; }
    public string? RepName { get; set; }
    public CampaignExpenseCategory Category { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime ExpenseDate { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? AttachmentPath { get; set; }
    public bool IsApproved { get; set; }
    public string? ApprovalNotes { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Create campaign expense request
/// </summary>
public class CreateCampaignExpenseDto
{
    public int? CampaignId { get; set; }
    public int? CycleId { get; set; }
    public int? CustomerId { get; set; }
    public int? RepId { get; set; }
    public CampaignExpenseCategory Category { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime ExpenseDate { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? AttachmentPath { get; set; }
}

/// <summary>
/// Client investment summary
/// </summary>
public class ClientInvestmentDto
{
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerType { get; set; }
    public int TotalVisits { get; set; }
    public decimal TravelExpenses { get; set; }
    public decimal MaterialExpenses { get; set; }
    public decimal SampleExpenses { get; set; }
    public decimal EventExpenses { get; set; }
    public decimal PromotionalExpenses { get; set; }
    public decimal OtherExpenses { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal CampaignSpend { get; set; }
    public decimal TotalInvestment { get; set; }
    public List<CampaignExpenseDto> RecentExpenses { get; set; } = new();
    public Dictionary<string, decimal> ByCategory { get; set; } = new();
    public Dictionary<string, decimal> ByMonth { get; set; } = new();
}
