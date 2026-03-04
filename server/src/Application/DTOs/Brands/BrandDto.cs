using Domain.Enums;

namespace Application.DTOs.Brands;

/// <summary>
/// Brand response DTO
/// </summary>
public class BrandDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameLocal { get; set; }
    public int ManufacturerId { get; set; }
    public string? ManufacturerName { get; set; }
    public string? Description { get; set; }
    public string? DescriptionLocal { get; set; }
    public string? LogoPath { get; set; }
    public string? TherapeuticArea { get; set; }
    public bool IsActive { get; set; }
    public int ProductCount { get; set; }
    public List<BrandProductDto> Products { get; set; } = new();
    public List<string> BrandGroups { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// Brand summary for lists
/// </summary>
public class BrandSummaryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameLocal { get; set; }
    public string? ManufacturerName { get; set; }
    public string? TherapeuticArea { get; set; }
    public string? LogoPath { get; set; }
    public int ProductCount { get; set; }
    public bool IsActive { get; set; }
}

/// <summary>
/// Simplified product DTO for brand detail
/// </summary>
public class BrandProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? DosageForm { get; set; }
    public string? Strength { get; set; }
    public string? PackageSize { get; set; }
    public decimal UnitPrice { get; set; }
    public bool IsActive { get; set; }
}

/// <summary>
/// Create brand request
/// </summary>
public class CreateBrandDto
{
    public string Name { get; set; } = string.Empty;
    public string? NameLocal { get; set; }
    public int ManufacturerId { get; set; }
    public string? Description { get; set; }
    public string? DescriptionLocal { get; set; }
    public string? LogoPath { get; set; }
    public string? TherapeuticArea { get; set; }
}

/// <summary>
/// Update brand request
/// </summary>
public class UpdateBrandDto
{
    public string Name { get; set; } = string.Empty;
    public string? NameLocal { get; set; }
    public int ManufacturerId { get; set; }
    public string? Description { get; set; }
    public string? DescriptionLocal { get; set; }
    public string? LogoPath { get; set; }
    public string? TherapeuticArea { get; set; }
    public bool IsActive { get; set; }
}

/// <summary>
/// Brand group response DTO
/// </summary>
public class BrandGroupDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameLocal { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public List<BrandSummaryDto> Brands { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Create brand group request
/// </summary>
public class CreateBrandGroupDto
{
    public string Name { get; set; } = string.Empty;
    public string? NameLocal { get; set; }
    public string? Description { get; set; }
    public List<int>? BrandIds { get; set; }
}

/// <summary>
/// Update brand group request
/// </summary>
public class UpdateBrandGroupDto
{
    public string Name { get; set; } = string.Empty;
    public string? NameLocal { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public List<int>? BrandIds { get; set; }
}

/// <summary>
/// Product document response DTO
/// </summary>
public class ProductDocumentDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string? ProductName { get; set; }
    public ProductDocumentType DocumentType { get; set; }
    public string DocumentTypeName { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string? FileType { get; set; }
    public long FileSize { get; set; }
    public string? Version { get; set; }
    public DateTime? EffectiveDate { get; set; }
    public string? UploadedBy { get; set; }
    public bool IsCurrentVersion { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Create product document request
/// </summary>
public class CreateProductDocumentDto
{
    public int ProductId { get; set; }
    public ProductDocumentType DocumentType { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string? FileType { get; set; }
    public long FileSize { get; set; }
    public string? Version { get; set; }
    public DateTime? EffectiveDate { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Knowledge article response DTO
/// </summary>
public class KnowledgeArticleDto
{
    public int Id { get; set; }
    public int? ProductId { get; set; }
    public string? ProductName { get; set; }
    public int? BrandId { get; set; }
    public string? BrandName { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TitleLocal { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? ContentLocal { get; set; }
    public KnowledgeCategory Category { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsPublished { get; set; }
    public string? Tags { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// Knowledge article summary for lists
/// </summary>
public class KnowledgeArticleSummaryDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TitleLocal { get; set; }
    public KnowledgeCategory Category { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string? ProductName { get; set; }
    public string? BrandName { get; set; }
    public bool IsPublished { get; set; }
}

/// <summary>
/// Create knowledge article request
/// </summary>
public class CreateKnowledgeArticleDto
{
    public int? ProductId { get; set; }
    public int? BrandId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TitleLocal { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? ContentLocal { get; set; }
    public KnowledgeCategory Category { get; set; }
    public int SortOrder { get; set; }
    public bool IsPublished { get; set; } = true;
    public string? Tags { get; set; }
}

/// <summary>
/// Update knowledge article request
/// </summary>
public class UpdateKnowledgeArticleDto
{
    public int? ProductId { get; set; }
    public int? BrandId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TitleLocal { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? ContentLocal { get; set; }
    public KnowledgeCategory Category { get; set; }
    public int SortOrder { get; set; }
    public bool IsPublished { get; set; }
    public string? Tags { get; set; }
}

/// <summary>
/// Product promotion detail — recorded during visit discussion
/// </summary>
public class ProductDiscussionDetailDto
{
    public int ProductId { get; set; }
    public string? ProductName { get; set; }
    public ProductReactionType ReactionType { get; set; }
    public string? Questions { get; set; }
    public CommitmentLevel CommitmentLevel { get; set; }
}

/// <summary>
/// Product promotion effectiveness report
/// </summary>
public class ProductPromotionReportDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? BrandName { get; set; }
    public int TotalPresentations { get; set; }
    public int PositiveReactions { get; set; }
    public int NeutralReactions { get; set; }
    public int NegativeReactions { get; set; }
    public decimal AcceptanceRate { get; set; }
    public Dictionary<string, int> ByCustomerType { get; set; } = new();
    public Dictionary<string, int> ByRegion { get; set; } = new();
    public List<CommitmentBreakdownDto> CommitmentBreakdown { get; set; } = new();
}

public class CommitmentBreakdownDto
{
    public CommitmentLevel Level { get; set; }
    public string LevelName { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}
