namespace Application.DTOs.Inventory;

/// <summary>
/// Create stock adjustment request DTO (UI-friendly)
/// </summary>
public class CreateStockAdjustmentRequestDto
{
    public int ProductId { get; set; }
    public int? BatchId { get; set; }
    
    /// <summary>
    /// Required for additions - creates a new batch if BatchId is not provided
    /// </summary>
    public string? BatchNumber { get; set; }
    
    /// <summary>
    /// Required for additions when creating a new batch
    /// </summary>
    public DateTime? ExpiryDate { get; set; }
    
    /// <summary>
    /// Optional cost price for new batches
    /// </summary>
    public decimal? CostPrice { get; set; }
    
    public string AdjustmentType { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

/// <summary>
/// Stock adjustment list item DTO (UI-friendly)
/// </summary>
public class StockAdjustmentListItemDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public int? BatchId { get; set; }
    public string? BatchNumber { get; set; }
    public string AdjustmentType { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string AdjustedBy { get; set; } = string.Empty;
    public DateTime AdjustedAt { get; set; }
}
