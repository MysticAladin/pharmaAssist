using Domain.Enums;

namespace Application.DTOs.Claims;

/// <summary>
/// Claim summary DTO for list views
/// </summary>
public class ClaimSummaryDto
{
    public int Id { get; set; }
    public string ClaimNumber { get; set; } = string.Empty;
    public string OrderNumber { get; set; } = string.Empty;
    public int OrderId { get; set; }
    public ClaimType Type { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public ClaimStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public decimal? RefundAmount { get; set; }
}

/// <summary>
/// Full claim details DTO
/// </summary>
public class ClaimDto : ClaimSummaryDto
{
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public int? OrderItemId { get; set; }
    public int? ProductId { get; set; }
    public string? ProductSku { get; set; }
    public string? BatchNumber { get; set; }
    public string? Description { get; set; }
    public string? ResolutionNotes { get; set; }
    public int? ReplacementOrderId { get; set; }
    public string? ReplacementOrderNumber { get; set; }
    public string? ResolvedBy { get; set; }
    public string? ReturnTrackingNumber { get; set; }
    public DateTime? ReturnReceivedAt { get; set; }
    public List<int> AttachmentIds { get; set; } = new();
    public DateTime? UpdatedAt { get; set; }
    
    // Timeline events
    public List<ClaimTimelineEvent> Timeline { get; set; } = new();
}

/// <summary>
/// Claim timeline event for tracking status changes
/// </summary>
public class ClaimTimelineEvent
{
    public DateTime Date { get; set; }
    public ClaimStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? UpdatedBy { get; set; }
}

/// <summary>
/// DTO for creating a new claim
/// </summary>
public class CreateClaimDto
{
    public int OrderId { get; set; }
    public int? OrderItemId { get; set; }
    public ClaimType Type { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? ProductId { get; set; }
    public int Quantity { get; set; }
    public string? BatchNumber { get; set; }
    public List<int>? AttachmentIds { get; set; }
}

/// <summary>
/// DTO for updating claim status
/// </summary>
public class UpdateClaimStatusDto
{
    public ClaimStatus Status { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// DTO for resolving a claim
/// </summary>
public class ResolveClaimDto
{
    public ClaimStatus Status { get; set; } // Approved, Rejected, Resolved
    public string? ResolutionNotes { get; set; }
    public decimal? RefundAmount { get; set; }
    public bool CreateReplacementOrder { get; set; }
}

/// <summary>
/// DTO for updating return tracking info
/// </summary>
public class UpdateReturnTrackingDto
{
    public string TrackingNumber { get; set; } = string.Empty;
}

/// <summary>
/// Customer portal claim request for quick submission
/// </summary>
public class PortalCreateClaimDto
{
    public int OrderId { get; set; }
    public int OrderItemId { get; set; }
    public ClaimType Type { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Quantity { get; set; } = 1;
    public List<int>? AttachmentIds { get; set; }
}
