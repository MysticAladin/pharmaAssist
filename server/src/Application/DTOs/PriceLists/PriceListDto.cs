using Domain.Enums;

namespace Application.DTOs.PriceLists;

public class PriceListDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameLocal { get; set; }
    public PriceListType Type { get; set; }
    public string TypeName => Type.ToString();
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public bool IsActive { get; set; }
    public string? Description { get; set; }
    public int ItemCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PriceListDetailDto : PriceListDto
{
    public List<PriceListItemDto> Items { get; set; } = new();
}

public class PriceListItemDto
{
    public int Id { get; set; }
    public int PriceListId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductCode { get; set; }
    public decimal Price { get; set; }
    public decimal? DiscountPercent { get; set; }
    public string? Notes { get; set; }
}

public class CreatePriceListRequest
{
    public string Name { get; set; } = string.Empty;
    public string? NameLocal { get; set; }
    public PriceListType Type { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Description { get; set; }
}

public class UpdatePriceListRequest : CreatePriceListRequest
{
    public int Id { get; set; }
}

public class CreatePriceListItemRequest
{
    public int PriceListId { get; set; }
    public int ProductId { get; set; }
    public decimal Price { get; set; }
    public decimal? DiscountPercent { get; set; }
    public string? Notes { get; set; }
}

public class UpdatePriceListItemRequest : CreatePriceListItemRequest
{
    public int Id { get; set; }
}

public class BulkPriceListItemRequest
{
    public int PriceListId { get; set; }
    public List<CreatePriceListItemRequest> Items { get; set; } = new();
}

public class PriceComparisonDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductCode { get; set; }
    public List<PriceListPriceDto> Prices { get; set; } = new();
}

public class PriceListPriceDto
{
    public int PriceListId { get; set; }
    public string PriceListName { get; set; } = string.Empty;
    public PriceListType PriceListType { get; set; }
    public decimal Price { get; set; }
    public decimal? DiscountPercent { get; set; }
}

public class PriceListFilterRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public PriceListType? Type { get; set; }
    public bool? ActiveOnly { get; set; }
    public string? SortBy { get; set; }
    public string? SortDirection { get; set; }
}
