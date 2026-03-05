using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Individual customer target within a campaign
/// </summary>
public class CampaignTarget : BaseEntity
{
    /// <summary>
    /// Parent campaign
    /// </summary>
    public int CampaignId { get; set; }

    /// <summary>
    /// Target customer
    /// </summary>
    public int CustomerId { get; set; }

    /// <summary>
    /// Assigned sales representative
    /// </summary>
    public int? RepId { get; set; }

    /// <summary>
    /// Target status
    /// </summary>
    public CampaignTargetStatus Status { get; set; } = CampaignTargetStatus.Pending;

    /// <summary>
    /// Date the customer was contacted
    /// </summary>
    public DateTime? ContactedAt { get; set; }

    /// <summary>
    /// Date marked as completed
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Outcome / feedback notes
    /// </summary>
    public string? Notes { get; set; }

    // Navigation properties
    public virtual Campaign Campaign { get; set; } = null!;
    public virtual Customer Customer { get; set; } = null!;
    public virtual SalesRepresentative? Rep { get; set; }
}
