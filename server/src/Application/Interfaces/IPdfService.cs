using Application.DTOs.Common;
using Application.DTOs.Orders;
using Application.DTOs.Reports;

namespace Application.Interfaces;

/// <summary>
/// Service interface for PDF document generation
/// </summary>
public interface IPdfService
{
    // Invoice PDFs
    Task<byte[]> GenerateInvoicePdfAsync(InvoicePdfRequest request);
    Task<byte[]> GenerateSplitInvoicePdfAsync(SplitInvoicePdfRequest request);
    
    // Order PDFs
    Task<byte[]> GenerateOrderConfirmationPdfAsync(OrderPdfRequest request);
    Task<byte[]> GenerateDeliveryNotePdfAsync(DeliveryNotePdfRequest request);
    Task<byte[]> GeneratePackingSlipPdfAsync(PackingSlipPdfRequest request);
    
    // Report PDFs
    Task<byte[]> GenerateSalesReportPdfAsync(SalesReportDto data);
    Task<byte[]> GenerateInventoryReportPdfAsync(InventoryReportDto data);
    Task<byte[]> GenerateCustomerStatementPdfAsync(CustomerReportDto data);
    
    // Catalog PDFs
    Task<byte[]> GeneratePriceListPdfAsync(PriceListPdfRequest request);
    Task<byte[]> GenerateProductCatalogPdfAsync(ProductCatalogPdfRequest request);
}

/// <summary>
/// Request for generating an invoice PDF
/// </summary>
public class InvoicePdfRequest
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime InvoiceDate { get; set; }
    public DateTime DueDate { get; set; }
    
    // Seller info
    public string SellerName { get; set; } = "PharmaAssist d.o.o.";
    public string SellerAddress { get; set; } = string.Empty;
    public string SellerTaxId { get; set; } = string.Empty;
    public string SellerPhone { get; set; } = string.Empty;
    public string SellerEmail { get; set; } = string.Empty;
    
    // Buyer info
    public string BuyerName { get; set; } = string.Empty;
    public string BuyerAddress { get; set; } = string.Empty;
    public string BuyerTaxId { get; set; } = string.Empty;
    public string BuyerEmail { get; set; } = string.Empty;
    
    // Line items
    public List<InvoiceLineItem> Items { get; set; } = new();
    
    // Totals
    public decimal SubTotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    
    // Payment info
    public string PaymentTerms { get; set; } = string.Empty;
    public string BankAccount { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
}

/// <summary>
/// Request for generating split invoices (Commercial vs Essential)
/// </summary>
public class SplitInvoicePdfRequest
{
    public InvoicePdfRequest CommercialInvoice { get; set; } = new();
    public InvoicePdfRequest EssentialInvoice { get; set; } = new();
    public bool IncludeSummaryPage { get; set; } = true;
}

/// <summary>
/// Invoice line item
/// </summary>
public class InvoiceLineItem
{
    public int LineNumber { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string Unit { get; set; } = "kom";
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal TaxPercent { get; set; } = 17; // BiH VAT
    public decimal LineTotal { get; set; }
    public bool IsEssential { get; set; }
    public string? BatchNumber { get; set; }
    public DateTime? ExpiryDate { get; set; }
}

/// <summary>
/// Request for generating order confirmation PDF
/// </summary>
public class OrderPdfRequest
{
    public string OrderNumber { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerAddress { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string ShippingAddress { get; set; } = string.Empty;
    public string ShippingMethod { get; set; } = string.Empty;
    public DateTime? EstimatedDelivery { get; set; }
    public List<OrderLineItem> Items { get; set; } = new();
    public decimal SubTotal { get; set; }
    public decimal ShippingCost { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string Notes { get; set; } = string.Empty;
}

/// <summary>
/// Order line item
/// </summary>
public class OrderLineItem
{
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
}

/// <summary>
/// Request for generating delivery note PDF
/// </summary>
public class DeliveryNotePdfRequest
{
    public string DeliveryNumber { get; set; } = string.Empty;
    public string OrderNumber { get; set; } = string.Empty;
    public DateTime DeliveryDate { get; set; }
    public string RecipientName { get; set; } = string.Empty;
    public string DeliveryAddress { get; set; } = string.Empty;
    public string DriverName { get; set; } = string.Empty;
    public string VehicleNumber { get; set; } = string.Empty;
    public List<DeliveryLineItem> Items { get; set; } = new();
    public string Notes { get; set; } = string.Empty;
}

/// <summary>
/// Delivery line item
/// </summary>
public class DeliveryLineItem
{
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = "kom";
    public string? BatchNumber { get; set; }
    public DateTime? ExpiryDate { get; set; }
}

/// <summary>
/// Request for generating packing slip PDF
/// </summary>
public class PackingSlipPdfRequest
{
    public string OrderNumber { get; set; } = string.Empty;
    public DateTime PackDate { get; set; }
    public string RecipientName { get; set; } = string.Empty;
    public string DeliveryAddress { get; set; } = string.Empty;
    public List<PackingLineItem> Items { get; set; } = new();
    public int TotalPackages { get; set; }
    public string PackedBy { get; set; } = string.Empty;
}

/// <summary>
/// Packing line item
/// </summary>
public class PackingLineItem
{
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public int PackageNumber { get; set; }
    public bool IsChecked { get; set; }
}

/// <summary>
/// Request for generating price list PDF
/// </summary>
public class PriceListPdfRequest
{
    public string Title { get; set; } = "Price List";
    public DateTime ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    public int? CategoryId { get; set; }
    public int? ManufacturerId { get; set; }
    public bool IncludeInactive { get; set; }
    public string Currency { get; set; } = "KM";
}

/// <summary>
/// Request for generating product catalog PDF
/// </summary>
public class ProductCatalogPdfRequest
{
    public string Title { get; set; } = "Product Catalog";
    public int? CategoryId { get; set; }
    public int? ManufacturerId { get; set; }
    public bool IncludeDescriptions { get; set; } = true;
    public bool IncludeImages { get; set; } = false;
    public bool IncludePrices { get; set; } = true;
}
