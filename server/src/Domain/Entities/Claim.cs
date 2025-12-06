using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Customer claim/return request entity
/// </summary>
public class Claim : BaseEntity
{
    public string ClaimNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public int OrderId { get; set; }
    public int? OrderItemId { get; set; }
    
    // Claim details
    public ClaimType Type { get; set; }
    public ClaimStatus Status { get; set; } = ClaimStatus.Submitted;
    public string Reason { get; set; } = string.Empty;
    public string? Description { get; set; }
    
    // Product info (if specific product claim)
    public int? ProductId { get; set; }
    public int Quantity { get; set; }
    public string? BatchNumber { get; set; }
    
    // Resolution
    public string? ResolutionNotes { get; set; }
    public decimal? RefundAmount { get; set; }
    public int? ReplacementOrderId { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? ResolvedBy { get; set; }
    
    // Return tracking
    public string? ReturnTrackingNumber { get; set; }
    public DateTime? ReturnReceivedAt { get; set; }
    
    // Attachments (photos of damaged products, etc.)
    public string? AttachmentIds { get; set; } // Comma-separated file IDs
    
    // Navigation properties
    public virtual Customer Customer { get; set; } = null!;
    public virtual Order Order { get; set; } = null!;
    public virtual OrderItem? OrderItem { get; set; }
    public virtual Product? Product { get; set; }
    public virtual Order? ReplacementOrder { get; set; }
}
