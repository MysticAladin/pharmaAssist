namespace Domain.Entities;

/// <summary>
/// Individual sales record from a wholesaler report — one line per invoice item.
/// </summary>
public class WholesalerSalesRecord : BaseEntity
{
    public int ImportId { get; set; }

    // Raw data from wholesaler report
    public string? ProductCode { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? CustomerCode { get; set; }
    public string? CustomerName { get; set; }

    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalAmount { get; set; }

    public DateTime? InvoiceDate { get; set; }
    public string? InvoiceNumber { get; set; }

    // Matched system references (null if unmatched)
    public int? ProductId { get; set; }
    public int? CustomerId { get; set; }

    /// <summary>
    /// Whether this record was auto-matched or manually resolved
    /// </summary>
    public bool IsManuallyMatched { get; set; }

    // Navigation properties
    public WholesalerDataImport? Import { get; set; }
    public Product? Product { get; set; }
    public Customer? Customer { get; set; }
}
