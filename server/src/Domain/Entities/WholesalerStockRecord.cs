namespace Domain.Entities;

/// <summary>
/// Wholesaler stock/inventory level report — one record per product per report date.
/// </summary>
public class WholesalerStockRecord : BaseEntity
{
    public int? ImportId { get; set; }
    public int WholesalerId { get; set; }
    public int? ProductId { get; set; }

    public string? ProductCode { get; set; }
    public string ProductName { get; set; } = string.Empty;

    public decimal Quantity { get; set; }
    public DateTime ReportDate { get; set; }

    // Navigation properties
    public WholesalerDataImport? Import { get; set; }
    public Customer? Wholesaler { get; set; }
    public Product? Product { get; set; }
}
