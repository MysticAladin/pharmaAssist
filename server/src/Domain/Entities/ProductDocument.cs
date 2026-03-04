using Domain.Enums;

namespace Domain.Entities;

public class ProductDocument : BaseEntity
{
    public int ProductId { get; set; }
    public ProductDocumentType DocumentType { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string? FileType { get; set; }
    public long FileSize { get; set; }
    public string? Version { get; set; }
    public DateTime? EffectiveDate { get; set; }
    public string? UploadedBy { get; set; }
    public bool IsCurrentVersion { get; set; } = true;
    public string? Notes { get; set; }

    // Navigation properties
    public virtual Product Product { get; set; } = null!;
}
