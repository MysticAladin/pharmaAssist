using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Tracks a wholesaler data file import job — status, record/error counts, and audit trail.
/// </summary>
public class WholesalerDataImport : BaseEntity
{
    public int WholesalerId { get; set; }
    public string WholesalerName { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public DateTime ImportDate { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Reporting period (e.g., "2025-01", "2025-Q1") for grouping
    /// </summary>
    public string? Period { get; set; }
    public ImportStatus Status { get; set; } = ImportStatus.Pending;
    public int RecordCount { get; set; }
    public int ErrorCount { get; set; }
    public int MatchedProductCount { get; set; }
    public int MatchedCustomerCount { get; set; }
    public int UnmatchedProductCount { get; set; }
    public int UnmatchedCustomerCount { get; set; }

    /// <summary>
    /// JSON column-mapping template used during import
    /// </summary>
    public string? ColumnMapping { get; set; }

    /// <summary>
    /// JSON error log messages
    /// </summary>
    public string? ErrorLog { get; set; }

    public string? Notes { get; set; }

    // Navigation properties
    public Customer? Wholesaler { get; set; }
    public ICollection<WholesalerSalesRecord> SalesRecords { get; set; } = new List<WholesalerSalesRecord>();
    public ICollection<WholesalerStockRecord> StockRecords { get; set; } = new List<WholesalerStockRecord>();
}
