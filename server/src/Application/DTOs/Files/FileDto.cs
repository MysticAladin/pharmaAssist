namespace Application.DTOs.Files;

public class FileUploadDto
{
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public byte[] Content { get; set; } = [];
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public int Category { get; set; }
    public string? Description { get; set; }
    public string? Alt { get; set; }
    public bool IsPublic { get; set; } = false;
    public int DisplayOrder { get; set; } = 0;
}

public class FileAttachmentDto
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public string? ThumbnailPath { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string Category { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Alt { get; set; }
    public bool IsPublic { get; set; }
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public string Url { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
}

public class FileUploadResultDto
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public FileAttachmentDto? File { get; set; }
}

public class MultiFileUploadResultDto
{
    public bool Success { get; set; }
    public int TotalFiles { get; set; }
    public int SuccessfulUploads { get; set; }
    public int FailedUploads { get; set; }
    public List<FileAttachmentDto> Files { get; set; } = [];
    public List<string> Errors { get; set; } = [];
}

public class FileQueryParams
{
    public string? EntityType { get; set; }
    public int? EntityId { get; set; }
    public int? Category { get; set; }
    public bool? IsPublic { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
