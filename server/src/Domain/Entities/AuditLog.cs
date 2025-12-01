namespace Domain.Entities;

/// <summary>
/// Audit log entry for tracking entity changes
/// </summary>
public class AuditLog
{
    public long Id { get; set; }
    
    // Who
    public string? UserId { get; set; }
    public string? UserName { get; set; }
    
    // What
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty; // Created, Updated, Deleted
    
    // When
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    
    // Details
    public string? OldValues { get; set; } // JSON
    public string? NewValues { get; set; } // JSON
    public string? AffectedColumns { get; set; } // Comma-separated
    
    // Context
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? RequestPath { get; set; }
}
