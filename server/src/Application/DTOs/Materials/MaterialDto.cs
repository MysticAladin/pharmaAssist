using Domain.Enums;

namespace Application.DTOs.Materials;

// ───── Material Distribution DTOs ─────

public record MaterialDistributionDto
{
    public int Id { get; init; }
    public int RepId { get; init; }
    public string RepName { get; init; } = string.Empty;
    public int CustomerId { get; init; }
    public string CustomerName { get; init; } = string.Empty;
    public int? VisitId { get; init; }
    public int? ProductId { get; init; }
    public string? ProductName { get; init; }
    public string MaterialName { get; init; } = string.Empty;
    public MaterialType MaterialType { get; init; }
    public string MaterialTypeName => MaterialType.ToString();
    public int Quantity { get; init; }
    public string? LotNumber { get; init; }
    public DateTime DistributedAt { get; init; }
    public string? Notes { get; init; }
}

public record CreateDistributionRequest
{
    public int RepId { get; init; }
    public int CustomerId { get; init; }
    public int? VisitId { get; init; }
    public int? ProductId { get; init; }
    public string MaterialName { get; init; } = string.Empty;
    public MaterialType MaterialType { get; init; }
    public int Quantity { get; init; }
    public string? LotNumber { get; init; }
    public string? Notes { get; init; }
}

public record DistributionFilterDto
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public int? RepId { get; init; }
    public int? CustomerId { get; init; }
    public MaterialType? MaterialType { get; init; }
    public DateTime? From { get; init; }
    public DateTime? To { get; init; }
    public string? Search { get; init; }
    public string? SortBy { get; init; }
    public string? SortDirection { get; init; }
}

// ───── Rep Inventory DTOs ─────

public record RepInventoryDto
{
    public int Id { get; init; }
    public int RepId { get; init; }
    public string RepName { get; init; } = string.Empty;
    public int? ProductId { get; init; }
    public string? ProductName { get; init; }
    public string MaterialName { get; init; } = string.Empty;
    public int Quantity { get; init; }
    public int? MinQuantity { get; init; }
    public bool IsLowStock => MinQuantity.HasValue && Quantity <= MinQuantity.Value;
    public DateTime? LastRestockedAt { get; init; }
}

public record UpdateRepInventoryRequest
{
    public int RepId { get; init; }
    public int? ProductId { get; init; }
    public string MaterialName { get; init; } = string.Empty;
    public int Quantity { get; init; }
    public int? MinQuantity { get; init; }
}

public record RestockInventoryRequest
{
    public int Quantity { get; init; }
}

// ───── Distribution Report DTOs ─────

public record DistributionSummaryDto
{
    public int TotalDistributions { get; init; }
    public int TotalQuantity { get; init; }
    public int UniqueCustomers { get; init; }
    public int UniqueReps { get; init; }
    public List<MaterialTypeSummaryDto> ByMaterialType { get; init; } = new();
    public List<RepDistributionSummaryDto> ByRep { get; init; } = new();
    public List<ProductDistributionSummaryDto> ByProduct { get; init; } = new();
}

public record MaterialTypeSummaryDto
{
    public MaterialType MaterialType { get; init; }
    public string MaterialTypeName => MaterialType.ToString();
    public int Count { get; init; }
    public int TotalQuantity { get; init; }
}

public record RepDistributionSummaryDto
{
    public int RepId { get; init; }
    public string RepName { get; init; } = string.Empty;
    public int DistributionCount { get; init; }
    public int TotalQuantity { get; init; }
    public int UniqueCustomers { get; init; }
}

public record ProductDistributionSummaryDto
{
    public int? ProductId { get; init; }
    public string MaterialName { get; init; } = string.Empty;
    public int DistributionCount { get; init; }
    public int TotalQuantity { get; init; }
}
