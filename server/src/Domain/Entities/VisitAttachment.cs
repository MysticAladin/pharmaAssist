namespace Domain.Entities;

/// <summary>
/// Attachments (photos, documents) from a visit
/// </summary>
public class VisitAttachment : BaseEntity
{
    /// <summary>
    /// FK to the executed visit
    /// </summary>
    public int VisitId { get; set; }
    
    /// <summary>
    /// Original filename
    /// </summary>
    public string FileName { get; set; } = string.Empty;
    
    /// <summary>
    /// MIME type of the file
    /// </summary>
    public string FileType { get; set; } = string.Empty;
    
    /// <summary>
    /// Storage path or URL
    /// </summary>
    public string FilePath { get; set; } = string.Empty;
    
    /// <summary>
    /// File size in bytes
    /// </summary>
    public long FileSize { get; set; }
    
    /// <summary>
    /// When the file was uploaded
    /// </summary>
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    
    /// <summary>
    /// The executed visit this attachment belongs to
    /// </summary>
    public virtual ExecutedVisit? Visit { get; set; }
}
