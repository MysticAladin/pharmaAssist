using Application.DTOs.Reports;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Controller for PDF document generation endpoints
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PdfController : ControllerBase
{
    private readonly IPdfService _pdfService;
    private readonly ILogger<PdfController> _logger;

    public PdfController(IPdfService pdfService, ILogger<PdfController> logger)
    {
        _pdfService = pdfService;
        _logger = logger;
    }

    /// <summary>
    /// Generate invoice PDF
    /// </summary>
    [HttpPost("invoice")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GenerateInvoice([FromBody] InvoicePdfRequest request)
    {
        try
        {
            var pdfBytes = await _pdfService.GenerateInvoicePdfAsync(request);
            return File(pdfBytes, "application/pdf", $"Faktura-{request.InvoiceNumber}.pdf");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating invoice PDF");
            return BadRequest(new { error = "Failed to generate invoice PDF" });
        }
    }

    /// <summary>
    /// Generate split invoice PDF (Commercial + Essential)
    /// </summary>
    [HttpPost("invoice/split")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GenerateSplitInvoice([FromBody] SplitInvoicePdfRequest request)
    {
        try
        {
            var pdfBytes = await _pdfService.GenerateSplitInvoicePdfAsync(request);
            var fileName = $"Faktura-Podijeljena-{request.CommercialInvoice.InvoiceNumber}.pdf";
            return File(pdfBytes, "application/pdf", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating split invoice PDF");
            return BadRequest(new { error = "Failed to generate split invoice PDF" });
        }
    }

    /// <summary>
    /// Generate order confirmation PDF
    /// </summary>
    [HttpPost("order")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GenerateOrderConfirmation([FromBody] OrderPdfRequest request)
    {
        try
        {
            var pdfBytes = await _pdfService.GenerateOrderConfirmationPdfAsync(request);
            return File(pdfBytes, "application/pdf", $"Narudzba-{request.OrderNumber}.pdf");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating order confirmation PDF");
            return BadRequest(new { error = "Failed to generate order confirmation PDF" });
        }
    }

    /// <summary>
    /// Generate delivery note PDF
    /// </summary>
    [HttpPost("delivery-note")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GenerateDeliveryNote([FromBody] DeliveryNotePdfRequest request)
    {
        try
        {
            var pdfBytes = await _pdfService.GenerateDeliveryNotePdfAsync(request);
            return File(pdfBytes, "application/pdf", $"Otpremnica-{request.DeliveryNumber}.pdf");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating delivery note PDF");
            return BadRequest(new { error = "Failed to generate delivery note PDF" });
        }
    }

    /// <summary>
    /// Generate packing slip PDF
    /// </summary>
    [HttpPost("packing-slip")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GeneratePackingSlip([FromBody] PackingSlipPdfRequest request)
    {
        try
        {
            var pdfBytes = await _pdfService.GeneratePackingSlipPdfAsync(request);
            return File(pdfBytes, "application/pdf", $"Lista-Pakovanja-{request.OrderNumber}.pdf");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating packing slip PDF");
            return BadRequest(new { error = "Failed to generate packing slip PDF" });
        }
    }

    /// <summary>
    /// Generate sales report PDF
    /// </summary>
    [HttpPost("reports/sales")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GenerateSalesReport([FromBody] SalesReportDto request)
    {
        try
        {
            var pdfBytes = await _pdfService.GenerateSalesReportPdfAsync(request);
            var fileName = $"Izvjestaj-Prodaja-{request.StartDate:yyyyMMdd}-{request.EndDate:yyyyMMdd}.pdf";
            return File(pdfBytes, "application/pdf", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating sales report PDF");
            return BadRequest(new { error = "Failed to generate sales report PDF" });
        }
    }

    /// <summary>
    /// Generate inventory report PDF
    /// </summary>
    [HttpPost("reports/inventory")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GenerateInventoryReport([FromBody] InventoryReportDto request)
    {
        try
        {
            var pdfBytes = await _pdfService.GenerateInventoryReportPdfAsync(request);
            var fileName = $"Izvjestaj-Zalihe-{DateTime.Now:yyyyMMdd}.pdf";
            return File(pdfBytes, "application/pdf", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating inventory report PDF");
            return BadRequest(new { error = "Failed to generate inventory report PDF" });
        }
    }

    /// <summary>
    /// Generate customer statement PDF
    /// </summary>
    [HttpPost("reports/customer")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GenerateCustomerStatement([FromBody] CustomerReportDto request)
    {
        try
        {
            var pdfBytes = await _pdfService.GenerateCustomerStatementPdfAsync(request);
            var fileName = $"Izvod-Kupac-{request.CustomerId}-{DateTime.Now:yyyyMMdd}.pdf";
            return File(pdfBytes, "application/pdf", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating customer statement PDF");
            return BadRequest(new { error = "Failed to generate customer statement PDF" });
        }
    }

    /// <summary>
    /// Generate price list PDF
    /// </summary>
    [HttpPost("price-list")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GeneratePriceList([FromBody] PriceListPdfRequest request)
    {
        try
        {
            var pdfBytes = await _pdfService.GeneratePriceListPdfAsync(request);
            var fileName = $"Cjenovnik-{DateTime.Now:yyyyMMdd}.pdf";
            return File(pdfBytes, "application/pdf", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating price list PDF");
            return BadRequest(new { error = "Failed to generate price list PDF" });
        }
    }

    /// <summary>
    /// Generate product catalog PDF
    /// </summary>
    [HttpPost("catalog")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GenerateProductCatalog([FromBody] ProductCatalogPdfRequest request)
    {
        try
        {
            var pdfBytes = await _pdfService.GenerateProductCatalogPdfAsync(request);
            var fileName = $"Katalog-{DateTime.Now:yyyyMMdd}.pdf";
            return File(pdfBytes, "application/pdf", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating product catalog PDF");
            return BadRequest(new { error = "Failed to generate product catalog PDF" });
        }
    }
}
