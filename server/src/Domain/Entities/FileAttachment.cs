namespace Domain.Entities;

/// <summary>
/// File attachment entity for storing uploaded files metadata
/// </summary>
public class FileAttachment : BaseEntity
{
    public string FileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public string? ThumbnailPath { get; set; }
    
    // Reference to the entity this file belongs to
    public string EntityType { get; set; } = string.Empty; // Product, Prescription, Customer, etc.
    public int EntityId { get; set; }
    
    public FileCategory Category { get; set; }
    public string? Description { get; set; }
    public string? Alt { get; set; } // For images - alt text
    
    public bool IsPublic { get; set; } = false;
    public int DisplayOrder { get; set; } = 0;
}

public enum FileCategory
{
    ProductImage = 1,
    ProductDocument = 2,
    PrescriptionScan = 3,
    CustomerDocument = 4,
    ManufacturerLogo = 5,
    InvoiceDocument = 6,
    ReportDocument = 7,
    Other = 99
}
