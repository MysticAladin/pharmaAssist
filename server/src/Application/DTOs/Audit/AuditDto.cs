namespace Application.DTOs.Audit;

/// <summary>
/// Audit log entry DTO
/// </summary>
public class AuditLogDto
{
    public long Id { get; set; }
    public string? UserId { get; set; }
    public string? UserName { get; set; }
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public Dictionary<string, object?>? OldValues { get; set; }
    public Dictionary<string, object?>? NewValues { get; set; }
    public List<string>? AffectedColumns { get; set; }
    public string? IpAddress { get; set; }
    public string? RequestPath { get; set; }
}

/// <summary>
/// Audit log query parameters
/// </summary>
public class AuditLogQueryDto
{
    public string? EntityName { get; set; }
    public string? EntityId { get; set; }
    public string? UserId { get; set; }
    public string? Action { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

/// <summary>
/// Entity change history
/// </summary>
public class EntityHistoryDto
{
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public List<AuditLogDto> History { get; set; } = new();
}
