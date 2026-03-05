namespace Domain.Entities;

/// <summary>
/// Individual product price within a price list.
/// </summary>
public class PriceListItem : BaseEntity
{
    public int PriceListId { get; set; }
    public int ProductId { get; set; }
    public decimal Price { get; set; }
    public decimal? DiscountPercent { get; set; }
    public string? Notes { get; set; }

    // Navigation properties
    public PriceList? PriceList { get; set; }
    public Product? Product { get; set; }
}
