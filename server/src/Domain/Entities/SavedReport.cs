namespace Domain.Entities;

/// <summary>
/// Saved report configuration for the Report Builder
/// </summary>
public class SavedReport : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    
    /// <summary>
    /// Data source for the report (Orders, Products, Customers, Inventory)
    /// </summary>
    public ReportDataSource DataSource { get; set; }
    
    /// <summary>
    /// JSON serialized report configuration
    /// </summary>
    public string Configuration { get; set; } = "{}";
    
    /// <summary>
    /// Is this a shared report visible to all users
    /// </summary>
    public bool IsShared { get; set; }
    
    /// <summary>
    /// Is this a system-provided template
    /// </summary>
    public bool IsTemplate { get; set; }
    
    /// <summary>
    /// Category for organizing reports
    /// </summary>
    public string? Category { get; set; }
    
    /// <summary>
    /// Tags for searching
    /// </summary>
    public string? Tags { get; set; }
    
    /// <summary>
    /// Last time this report was run
    /// </summary>
    public DateTime? LastRunAt { get; set; }
    
    /// <summary>
    /// Number of times this report was run
    /// </summary>
    public int RunCount { get; set; }
}

public enum ReportDataSource
{
    Orders = 1,
    Products = 2,
    Customers = 3,
    Inventory = 4,
    Prescriptions = 5,
    Financial = 6
}
