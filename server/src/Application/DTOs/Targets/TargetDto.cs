using Domain.Entities;
using Domain.Enums;

namespace Application.DTOs.Targets;

#region Sales Targets

/// <summary>
/// DTO for sales target
/// </summary>
public class SalesTargetDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public SalesTargetType TargetType { get; set; }
    public string TargetTypeName { get; set; } = string.Empty;
    
    // Assignment info
    public string? UserId { get; set; }
    public string? UserName { get; set; }
    public int? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public int? ProductId { get; set; }
    public string? ProductName { get; set; }
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public int? ManufacturerId { get; set; }
    public string? ManufacturerName { get; set; }
    public int? CantonId { get; set; }
    public string? CantonName { get; set; }
    
    // Period
    public int Year { get; set; }
    public int? Month { get; set; }
    public int? Quarter { get; set; }
    public string PeriodDisplay { get; set; } = string.Empty;
    
    // Values
    public SalesTargetMetric Metric { get; set; }
    public string MetricName { get; set; } = string.Empty;
    public decimal TargetValue { get; set; }
    public decimal CurrentValue { get; set; }
    public decimal AchievementPercentage { get; set; }
    public bool IsAchieved { get; set; }
    public bool IsOverAchieved { get; set; }
    
    // Status
    public bool IsActive { get; set; }
    public bool IsLocked { get; set; }
    public DateTime? LockedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO for creating/updating a sales target
/// </summary>
public class CreateSalesTargetDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public SalesTargetType TargetType { get; set; } = SalesTargetType.SalesRep;
    public string? UserId { get; set; }
    public int? CustomerId { get; set; }
    public int? ProductId { get; set; }
    public int? CategoryId { get; set; }
    public int? ManufacturerId { get; set; }
    public int? CantonId { get; set; }
    public int Year { get; set; }
    public int? Month { get; set; }
    public int? Quarter { get; set; }
    public SalesTargetMetric Metric { get; set; } = SalesTargetMetric.Revenue;
    public decimal TargetValue { get; set; }
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// DTO for updating target progress
/// </summary>
public class UpdateTargetProgressDto
{
    public decimal NewValue { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// DTO for target progress entry
/// </summary>
public class SalesTargetProgressDto
{
    public int Id { get; set; }
    public int SalesTargetId { get; set; }
    public DateTime RecordedAt { get; set; }
    public decimal Value { get; set; }
    public decimal PreviousValue { get; set; }
    public decimal IncrementalValue { get; set; }
    public string? Notes { get; set; }
    public string? RecordedBy { get; set; }
}

/// <summary>
/// Summary DTO for target dashboard
/// </summary>
public class TargetSummaryDto
{
    public int TotalTargets { get; set; }
    public int AchievedTargets { get; set; }
    public int OverAchievedTargets { get; set; }
    public int InProgressTargets { get; set; }
    public decimal OverallAchievementPercentage { get; set; }
    public List<SalesTargetDto> TopPerformers { get; set; } = new();
    public List<SalesTargetDto> NeedsAttention { get; set; } = new();
}

#endregion

#region Budgets

/// <summary>
/// DTO for budget
/// </summary>
public class BudgetDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public BudgetType BudgetType { get; set; }
    public string BudgetTypeName { get; set; } = string.Empty;
    
    // Assignment
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public int? ManufacturerId { get; set; }
    public string? ManufacturerName { get; set; }
    public string? UserId { get; set; }
    public string? UserName { get; set; }
    
    // Period
    public int Year { get; set; }
    public int? Month { get; set; }
    public int? Quarter { get; set; }
    public string PeriodDisplay { get; set; } = string.Empty;
    
    // Values
    public decimal AllocatedAmount { get; set; }
    public decimal SpentAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public decimal UtilizationPercentage { get; set; }
    public bool IsOverBudget { get; set; }
    
    // Status
    public BudgetStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO for creating/updating a budget
/// </summary>
public class CreateBudgetDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public BudgetType BudgetType { get; set; } = BudgetType.Marketing;
    public int? CategoryId { get; set; }
    public int? ManufacturerId { get; set; }
    public string? UserId { get; set; }
    public int Year { get; set; }
    public int? Month { get; set; }
    public int? Quarter { get; set; }
    public decimal AllocatedAmount { get; set; }
}

/// <summary>
/// DTO for budget expense
/// </summary>
public class BudgetExpenseDto
{
    public int Id { get; set; }
    public int BudgetId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime ExpenseDate { get; set; }
    public string? ReferenceNumber { get; set; }
    public ExpenseCategory ExpenseCategory { get; set; }
    public string ExpenseCategoryName { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? CreatedBy { get; set; }
    public int? OrderId { get; set; }
    public int? PromotionId { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO for creating an expense
/// </summary>
public class CreateBudgetExpenseDto
{
    public int BudgetId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime ExpenseDate { get; set; }
    public string? ReferenceNumber { get; set; }
    public ExpenseCategory ExpenseCategory { get; set; } = ExpenseCategory.Other;
    public string? Notes { get; set; }
    public int? OrderId { get; set; }
    public int? PromotionId { get; set; }
}

/// <summary>
/// Summary DTO for budget dashboard
/// </summary>
public class BudgetSummaryDto
{
    public int TotalBudgets { get; set; }
    public decimal TotalAllocated { get; set; }
    public decimal TotalSpent { get; set; }
    public decimal TotalRemaining { get; set; }
    public decimal OverallUtilizationPercentage { get; set; }
    public int OverBudgetCount { get; set; }
    public List<BudgetDto> ByType { get; set; } = new();
}

#endregion
