namespace Application.DTOs.Email;

public class EmailMessageDto
{
    public string ToEmail { get; set; } = string.Empty;
    public string? ToName { get; set; }
    public string? CcEmail { get; set; }
    public string? BccEmail { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public bool IsHtml { get; set; } = true;
    public int EmailType { get; set; }
    public string? RelatedEntityType { get; set; }
    public int? RelatedEntityId { get; set; }
}

public class EmailLogDto
{
    public int Id { get; set; }
    public string ToEmail { get; set; } = string.Empty;
    public string? ToName { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
    public int RetryCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? SentAt { get; set; }
    public string EmailType { get; set; } = string.Empty;
}

public class EmailTemplateDto
{
    public string TemplateName { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public Dictionary<string, string> Placeholders { get; set; } = [];
}

public class SendEmailResultDto
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public int? EmailLogId { get; set; }
}

public class EmailQueryParams
{
    public string? ToEmail { get; set; }
    public int? Status { get; set; }
    public int? EmailType { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class EmailStatisticsDto
{
    public int TotalSent { get; set; }
    public int TotalFailed { get; set; }
    public int TotalPending { get; set; }
    public int TotalToday { get; set; }
    public int TotalThisWeek { get; set; }
    public int TotalThisMonth { get; set; }
    public Dictionary<string, int> ByType { get; set; } = [];
}
