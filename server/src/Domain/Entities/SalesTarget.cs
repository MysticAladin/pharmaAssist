using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Sales target for sales representatives, customers, products, or territories
/// </summary>
public class SalesTarget : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    
    // Target scope
    public SalesTargetType TargetType { get; set; } = SalesTargetType.SalesRep;
    
    // Target assignment (based on TargetType)
    public string? UserId { get; set; } // For SalesRep targets
    public int? CustomerId { get; set; } // For Customer targets
    public int? ProductId { get; set; } // For Product targets
    public int? CategoryId { get; set; } // For Category targets
    public int? ManufacturerId { get; set; } // For Manufacturer targets
    public int? CantonId { get; set; } // For Territory targets
    
    // Target period
    public int Year { get; set; }
    public int? Month { get; set; } // null = annual target
    public int? Quarter { get; set; } // 1-4, null = not quarterly
    
    // Target values
    public SalesTargetMetric Metric { get; set; } = SalesTargetMetric.Revenue;
    public decimal TargetValue { get; set; }
    public decimal CurrentValue { get; set; } = 0;
    
    // Calculated achievement
    public decimal AchievementPercentage => TargetValue > 0 
        ? Math.Round((CurrentValue / TargetValue) * 100, 2) 
        : 0;
    
    public bool IsAchieved => CurrentValue >= TargetValue;
    public bool IsOverAchieved => CurrentValue > TargetValue * 1.1m; // 110%+
    
    // Status
    public bool IsActive { get; set; } = true;
    public DateTime? LockedAt { get; set; } // Once locked, cannot be modified
    public string? LockedBy { get; set; }
    
    // Navigation properties
    public virtual ApplicationUser? User { get; set; }
    public virtual Customer? Customer { get; set; }
    public virtual Product? Product { get; set; }
    public virtual Category? Category { get; set; }
    public virtual Manufacturer? Manufacturer { get; set; }
    public virtual Canton? Canton { get; set; }
    public virtual ICollection<SalesTargetProgress> ProgressHistory { get; set; } = new List<SalesTargetProgress>();
}

/// <summary>
/// Tracks periodic progress updates for a sales target
/// </summary>
public class SalesTargetProgress : BaseEntity
{
    public int SalesTargetId { get; set; }
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
    public decimal Value { get; set; }
    public decimal PreviousValue { get; set; }
    public decimal IncrementalValue => Value - PreviousValue;
    public string? Notes { get; set; }
    public string? RecordedBy { get; set; }
    
    public virtual SalesTarget SalesTarget { get; set; } = null!;
}

/// <summary>
/// Budget allocation for departments, categories, or periods
/// </summary>
public class Budget : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    
    // Budget scope
    public BudgetType BudgetType { get; set; } = BudgetType.Marketing;
    
    // Budget assignment
    public int? CategoryId { get; set; }
    public int? ManufacturerId { get; set; }
    public string? UserId { get; set; } // Responsible person
    
    // Period
    public int Year { get; set; }
    public int? Month { get; set; }
    public int? Quarter { get; set; }
    
    // Budget values (in KM)
    public decimal AllocatedAmount { get; set; }
    public decimal SpentAmount { get; set; } = 0;
    public decimal RemainingAmount => AllocatedAmount - SpentAmount;
    public decimal UtilizationPercentage => AllocatedAmount > 0 
        ? Math.Round((SpentAmount / AllocatedAmount) * 100, 2) 
        : 0;
    
    public bool IsOverBudget => SpentAmount > AllocatedAmount;
    
    // Approval workflow
    public BudgetStatus Status { get; set; } = BudgetStatus.Draft;
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    
    // Navigation properties
    public virtual Category? Category { get; set; }
    public virtual Manufacturer? Manufacturer { get; set; }
    public virtual ApplicationUser? ResponsibleUser { get; set; }
    public virtual ICollection<BudgetExpense> Expenses { get; set; } = new List<BudgetExpense>();
}

/// <summary>
/// Individual expense against a budget
/// </summary>
public class BudgetExpense : BaseEntity
{
    public int BudgetId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime ExpenseDate { get; set; }
    public string? ReferenceNumber { get; set; }
    public ExpenseCategory ExpenseCategory { get; set; } = ExpenseCategory.Other;
    public string? Notes { get; set; }
    public string? RecordedBy { get; set; } // User who recorded the expense
    
    // Optional link to order/promotion
    public int? OrderId { get; set; }
    public int? PromotionId { get; set; }
    
    public virtual Budget Budget { get; set; } = null!;
    public virtual Order? Order { get; set; }
    public virtual Promotion? Promotion { get; set; }
}

/// <summary>
/// Type of sales target
/// </summary>
public enum SalesTargetType
{
    SalesRep = 1,       // Individual sales rep
    Customer = 2,       // Specific customer
    Product = 3,        // Product sales
    Category = 4,       // Category sales
    Manufacturer = 5,   // Manufacturer sales
    Territory = 6,      // Canton/region
    Company = 7         // Overall company
}

/// <summary>
/// Metric used for measuring target achievement
/// </summary>
public enum SalesTargetMetric
{
    Revenue = 1,        // Total revenue in KM
    Quantity = 2,       // Units sold
    Orders = 3,         // Number of orders
    NewCustomers = 4,   // New customers acquired
    Visits = 5          // Customer visits (SFA)
}

/// <summary>
/// Type of budget
/// </summary>
public enum BudgetType
{
    Marketing = 1,      // Marketing activities
    Promotions = 2,     // Promotional pricing/discounts
    Samples = 3,        // Free samples (FOC)
    Travel = 4,         // Sales rep travel
    Training = 5,       // Training expenses
    Events = 6,         // Trade shows, conferences
    Other = 99
}

/// <summary>
/// Budget approval status
/// </summary>
public enum BudgetStatus
{
    Draft = 1,
    Submitted = 2,
    Approved = 3,
    Rejected = 4,
    Closed = 5
}

/// <summary>
/// Category of expense
/// </summary>
public enum ExpenseCategory
{
    Advertising = 1,
    Discount = 2,
    Sample = 3,
    Travel = 4,
    Accommodation = 5,
    Meals = 6,
    Materials = 7,
    EventFees = 8,
    Consulting = 9,
    Other = 99
}
