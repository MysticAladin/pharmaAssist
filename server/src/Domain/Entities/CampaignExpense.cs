using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Budget expense — tracks spending against campaigns, cycles, or general field operations
/// </summary>
public class CampaignExpense : BaseEntity
{
    /// <summary>
    /// Optional campaign link
    /// </summary>
    public int? CampaignId { get; set; }

    /// <summary>
    /// Optional cycle link
    /// </summary>
    public int? CycleId { get; set; }

    /// <summary>
    /// Optional customer link
    /// </summary>
    public int? CustomerId { get; set; }

    /// <summary>
    /// Responsible sales representative
    /// </summary>
    public int? RepId { get; set; }

    /// <summary>
    /// Expense category
    /// </summary>
    public CampaignExpenseCategory Category { get; set; }

    /// <summary>
    /// Short description of the expense
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Expense amount (KM)
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>
    /// Date the expense was incurred
    /// </summary>
    public DateTime ExpenseDate { get; set; }

    /// <summary>
    /// Reference document / receipt number
    /// </summary>
    public string? ReferenceNumber { get; set; }

    /// <summary>
    /// Path to receipt/invoice attachment
    /// </summary>
    public string? AttachmentPath { get; set; }

    /// <summary>
    /// Whether this expense has been approved
    /// </summary>
    public bool IsApproved { get; set; }

    /// <summary>
    /// Approver notes
    /// </summary>
    public string? ApprovalNotes { get; set; }

    // Navigation properties
    public virtual Campaign? Campaign { get; set; }
    public virtual Cycle? Cycle { get; set; }
    public virtual Customer? Customer { get; set; }
    public virtual SalesRepresentative? Rep { get; set; }
}
