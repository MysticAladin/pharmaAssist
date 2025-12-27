namespace Application.DTOs.Inventory;

public class CreateStockTransferRequestDto
{
    public int SourceLocationId { get; set; }
    public int DestinationLocationId { get; set; }
    public List<CreateStockTransferItemDto> Items { get; set; } = new();
    public string? Notes { get; set; }
}

public class CreateStockTransferItemDto
{
    public int ProductId { get; set; }
    public int? BatchId { get; set; }
    public int Quantity { get; set; }
}

public class StockTransferItemDto
{
    public int Id { get; set; }
    public int TransferId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public int? BatchId { get; set; }
    public string? BatchNumber { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public int Quantity { get; set; }
    public int? ReceivedQuantity { get; set; }
}

public class StockTransferListItemDto
{
    public int Id { get; set; }
    public string ReferenceNumber { get; set; } = string.Empty;

    public int SourceLocationId { get; set; }
    public string SourceLocationName { get; set; } = string.Empty;

    public int DestinationLocationId { get; set; }
    public string DestinationLocationName { get; set; } = string.Empty;

    /// <summary>
    /// pending | in_transit | completed | cancelled
    /// </summary>
    public string Status { get; set; } = "completed";

    public List<StockTransferItemDto> Items { get; set; } = new();

    public string? Notes { get; set; }

    public string CreatedBy { get; set; } = string.Empty;
    public string CreatedById { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public DateTime? CompletedAt { get; set; }
    public string? CompletedBy { get; set; }
}
