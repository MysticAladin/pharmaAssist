using Application.DTOs.Reports;
using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Infrastructure.Services;

/// <summary>
/// PDF generation service using QuestPDF
/// </summary>
public class PdfService : IPdfService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PdfService> _logger;

    // Company branding
    private const string CompanyName = "PharmaAssist d.o.o.";
    private const string CompanyAddress = "Sarajevo, Bosnia and Herzegovina";
    private const string CompanyPhone = "+387 33 123 456";
    private const string CompanyEmail = "info@pharmaassist.ba";
    private const string CompanyTaxId = "4200123456789";

    static PdfService()
    {
        // Set QuestPDF license (Community license is free)
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public PdfService(ApplicationDbContext context, ILogger<PdfService> logger)
    {
        _context = context;
        _logger = logger;
    }

    #region Invoice PDFs

    public async Task<byte[]> GenerateInvoicePdfAsync(InvoicePdfRequest request)
    {
        try
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(40);
                    page.DefaultTextStyle(x => x.FontSize(10));

                    page.Header().Element(c => ComposeInvoiceHeader(c, request));
                    page.Content().Element(c => ComposeInvoiceContent(c, request));
                    page.Footer().Element(ComposeFooter);
                });
            });

            return await Task.FromResult(document.GeneratePdf());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating invoice PDF");
            throw;
        }
    }

    public async Task<byte[]> GenerateSplitInvoicePdfAsync(SplitInvoicePdfRequest request)
    {
        try
        {
            var document = Document.Create(container =>
            {
                // Commercial Invoice Page
                if (request.CommercialInvoice.Items.Any())
                {
                    container.Page(page =>
                    {
                        page.Size(PageSizes.A4);
                        page.Margin(40);
                        page.DefaultTextStyle(x => x.FontSize(10));
                        page.Header().Element(c => ComposeInvoiceHeader(c, request.CommercialInvoice, "COMMERCIAL"));
                        page.Content().Element(c => ComposeInvoiceContent(c, request.CommercialInvoice));
                        page.Footer().Element(ComposeFooter);
                    });
                }

                // Essential Invoice Page
                if (request.EssentialInvoice.Items.Any())
                {
                    container.Page(page =>
                    {
                        page.Size(PageSizes.A4);
                        page.Margin(40);
                        page.DefaultTextStyle(x => x.FontSize(10));
                        page.Header().Element(c => ComposeInvoiceHeader(c, request.EssentialInvoice, "ESSENTIAL"));
                        page.Content().Element(c => ComposeInvoiceContent(c, request.EssentialInvoice));
                        page.Footer().Element(ComposeFooter);
                    });
                }

                // Summary Page
                if (request.IncludeSummaryPage)
                {
                    container.Page(page =>
                    {
                        page.Size(PageSizes.A4);
                        page.Margin(40);
                        page.DefaultTextStyle(x => x.FontSize(10));
                        page.Header().Element(c => ComposeSplitSummaryHeader(c, request));
                        page.Content().Element(c => ComposeSplitSummaryContent(c, request));
                        page.Footer().Element(ComposeFooter);
                    });
                }
            });

            return await Task.FromResult(document.GeneratePdf());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating split invoice PDF");
            throw;
        }
    }

    private void ComposeInvoiceHeader(IContainer container, InvoicePdfRequest request, string? invoiceType = null)
    {
        container.Row(row =>
        {
            row.RelativeItem().Column(col =>
            {
                col.Item().Text(request.SellerName).FontSize(16).Bold().FontColor(Colors.Blue.Darken2);
                col.Item().Text(request.SellerAddress);
                col.Item().Text($"PDV: {request.SellerTaxId}");
                col.Item().Text($"Tel: {request.SellerPhone}");
                col.Item().Text($"Email: {request.SellerEmail}");
            });

            row.RelativeItem().AlignRight().Column(col =>
            {
                var title = invoiceType != null ? $"FAKTURA - {invoiceType}" : "FAKTURA";
                col.Item().Text(title).FontSize(20).Bold().FontColor(Colors.Blue.Darken2);
                col.Item().Text($"Broj: {request.InvoiceNumber}").FontSize(12);
                col.Item().Text($"Datum: {request.InvoiceDate:dd.MM.yyyy}");
                col.Item().Text($"Valuta: {request.DueDate:dd.MM.yyyy}");
            });
        });
    }

    private void ComposeInvoiceContent(IContainer container, InvoicePdfRequest request)
    {
        container.PaddingVertical(20).Column(col =>
        {
            // Buyer info
            col.Item().Background(Colors.Grey.Lighten3).Padding(10).Column(buyer =>
            {
                buyer.Item().Text("KUPAC:").Bold();
                buyer.Item().Text(request.BuyerName).FontSize(12).Bold();
                buyer.Item().Text(request.BuyerAddress);
                buyer.Item().Text($"PDV: {request.BuyerTaxId}");
                buyer.Item().Text($"Email: {request.BuyerEmail}");
            });

            col.Item().PaddingVertical(15);

            // Items table
            col.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(30);  // #
                    columns.ConstantColumn(80);  // Code
                    columns.RelativeColumn(3);   // Name
                    columns.ConstantColumn(50);  // Qty
                    columns.ConstantColumn(70);  // Price
                    columns.ConstantColumn(50);  // Disc%
                    columns.ConstantColumn(50);  // Tax%
                    columns.ConstantColumn(80);  // Total
                });

                table.Header(header =>
                {
                    header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("#").FontColor(Colors.White).Bold();
                    header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Šifra").FontColor(Colors.White).Bold();
                    header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Naziv").FontColor(Colors.White).Bold();
                    header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Kol.").FontColor(Colors.White).Bold();
                    header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Cijena").FontColor(Colors.White).Bold();
                    header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Rab.%").FontColor(Colors.White).Bold();
                    header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("PDV%").FontColor(Colors.White).Bold();
                    header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Iznos").FontColor(Colors.White).Bold();
                });

                var lineNum = 1;
                foreach (var item in request.Items)
                {
                    var bgColor = lineNum % 2 == 0 ? Colors.Grey.Lighten4 : Colors.White;
                    table.Cell().Background(bgColor).Padding(5).Text(lineNum.ToString());
                    table.Cell().Background(bgColor).Padding(5).Text(item.ProductCode);
                    table.Cell().Background(bgColor).Padding(5).Text(item.ProductName);
                    table.Cell().Background(bgColor).Padding(5).AlignRight().Text(item.Quantity.ToString("N2"));
                    table.Cell().Background(bgColor).Padding(5).AlignRight().Text(item.UnitPrice.ToString("N2"));
                    table.Cell().Background(bgColor).Padding(5).AlignRight().Text(item.DiscountPercent.ToString("N1"));
                    table.Cell().Background(bgColor).Padding(5).AlignRight().Text(item.TaxPercent.ToString("N1"));
                    table.Cell().Background(bgColor).Padding(5).AlignRight().Text(item.LineTotal.ToString("N2"));
                    lineNum++;
                }
            });

            col.Item().PaddingVertical(10);

            // Totals
            col.Item().AlignRight().Width(250).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn();
                    columns.ConstantColumn(100);
                });

                table.Cell().Padding(5).Text("Osnovica:");
                table.Cell().Padding(5).AlignRight().Text($"{request.SubTotal:N2} KM");

                if (request.DiscountAmount > 0)
                {
                    table.Cell().Padding(5).Text("Rabat:");
                    table.Cell().Padding(5).AlignRight().Text($"-{request.DiscountAmount:N2} KM");
                }

                table.Cell().Padding(5).Text("PDV (17%):");
                table.Cell().Padding(5).AlignRight().Text($"{request.TaxAmount:N2} KM");

                table.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("UKUPNO:").Bold().FontColor(Colors.White);
                table.Cell().Background(Colors.Blue.Darken2).Padding(5).AlignRight().Text($"{request.TotalAmount:N2} KM").Bold().FontColor(Colors.White);
            });

            // Payment info
            if (!string.IsNullOrEmpty(request.BankAccount))
            {
                col.Item().PaddingTop(20).Column(payment =>
                {
                    payment.Item().Text("PODACI ZA PLAĆANJE:").Bold();
                    payment.Item().Text($"Žiro račun: {request.BankAccount}");
                    payment.Item().Text($"Rok plaćanja: {request.PaymentTerms}");
                });
            }

            // Notes
            if (!string.IsNullOrEmpty(request.Notes))
            {
                col.Item().PaddingTop(10).Text($"Napomena: {request.Notes}").Italic();
            }
        });
    }

    private void ComposeSplitSummaryHeader(IContainer container, SplitInvoicePdfRequest request)
    {
        container.Row(row =>
        {
            row.RelativeItem().Column(col =>
            {
                col.Item().Text(CompanyName).FontSize(16).Bold().FontColor(Colors.Blue.Darken2);
                col.Item().Text(CompanyAddress);
            });

            row.RelativeItem().AlignRight().Column(col =>
            {
                col.Item().Text("SAŽETAK PODIJELJENE FAKTURE").FontSize(16).Bold().FontColor(Colors.Blue.Darken2);
                col.Item().Text($"Datum: {DateTime.Now:dd.MM.yyyy}");
            });
        });
    }

    private void ComposeSplitSummaryContent(IContainer container, SplitInvoicePdfRequest request)
    {
        container.PaddingVertical(20).Column(col =>
        {
            col.Item().Text("Ovaj dokument sadrži sažetak podijeljenih faktura za Komercijalne i Esencijalne lijekove.").Italic();

            col.Item().PaddingVertical(20).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(2);
                    columns.RelativeColumn();
                    columns.RelativeColumn();
                    columns.RelativeColumn();
                });

                table.Header(header =>
                {
                    header.Cell().Background(Colors.Blue.Darken2).Padding(10).Text("Tip").FontColor(Colors.White).Bold();
                    header.Cell().Background(Colors.Blue.Darken2).Padding(10).Text("Broj fakture").FontColor(Colors.White).Bold();
                    header.Cell().Background(Colors.Blue.Darken2).Padding(10).Text("Stavki").FontColor(Colors.White).Bold();
                    header.Cell().Background(Colors.Blue.Darken2).Padding(10).Text("Iznos").FontColor(Colors.White).Bold();
                });

                // Commercial
                table.Cell().Background(Colors.Grey.Lighten4).Padding(10).Text("Komercijalni lijekovi");
                table.Cell().Background(Colors.Grey.Lighten4).Padding(10).Text(request.CommercialInvoice.InvoiceNumber);
                table.Cell().Background(Colors.Grey.Lighten4).Padding(10).Text(request.CommercialInvoice.Items.Count.ToString());
                table.Cell().Background(Colors.Grey.Lighten4).Padding(10).AlignRight().Text($"{request.CommercialInvoice.TotalAmount:N2} KM");

                // Essential
                table.Cell().Padding(10).Text("Esencijalni lijekovi");
                table.Cell().Padding(10).Text(request.EssentialInvoice.InvoiceNumber);
                table.Cell().Padding(10).Text(request.EssentialInvoice.Items.Count.ToString());
                table.Cell().Padding(10).AlignRight().Text($"{request.EssentialInvoice.TotalAmount:N2} KM");

                // Total
                var grandTotal = request.CommercialInvoice.TotalAmount + request.EssentialInvoice.TotalAmount;
                table.Cell().Background(Colors.Blue.Darken2).Padding(10).Text("UKUPNO").FontColor(Colors.White).Bold();
                table.Cell().Background(Colors.Blue.Darken2).Padding(10).Text("-").FontColor(Colors.White);
                table.Cell().Background(Colors.Blue.Darken2).Padding(10).Text((request.CommercialInvoice.Items.Count + request.EssentialInvoice.Items.Count).ToString()).FontColor(Colors.White);
                table.Cell().Background(Colors.Blue.Darken2).Padding(10).AlignRight().Text($"{grandTotal:N2} KM").FontColor(Colors.White).Bold();
            });
        });
    }

    #endregion

    #region Order PDFs

    public async Task<byte[]> GenerateOrderConfirmationPdfAsync(OrderPdfRequest request)
    {
        try
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(40);
                    page.DefaultTextStyle(x => x.FontSize(10));

                    page.Header().Element(c => ComposeOrderHeader(c, request));
                    page.Content().Element(c => ComposeOrderContent(c, request));
                    page.Footer().Element(ComposeFooter);
                });
            });

            return await Task.FromResult(document.GeneratePdf());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating order confirmation PDF");
            throw;
        }
    }

    public async Task<byte[]> GenerateDeliveryNotePdfAsync(DeliveryNotePdfRequest request)
    {
        try
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(40);
                    page.DefaultTextStyle(x => x.FontSize(10));

                    page.Header().Element(c => ComposeDeliveryHeader(c, request));
                    page.Content().Element(c => ComposeDeliveryContent(c, request));
                    page.Footer().Element(ComposeFooter);
                });
            });

            return await Task.FromResult(document.GeneratePdf());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating delivery note PDF");
            throw;
        }
    }

    public async Task<byte[]> GeneratePackingSlipPdfAsync(PackingSlipPdfRequest request)
    {
        try
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(40);
                    page.DefaultTextStyle(x => x.FontSize(10));

                    page.Header().Element(c => ComposePackingHeader(c, request));
                    page.Content().Element(c => ComposePackingContent(c, request));
                    page.Footer().Element(ComposeFooter);
                });
            });

            return await Task.FromResult(document.GeneratePdf());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating packing slip PDF");
            throw;
        }
    }

    private void ComposeOrderHeader(IContainer container, OrderPdfRequest request)
    {
        container.Row(row =>
        {
            row.RelativeItem().Column(col =>
            {
                col.Item().Text(CompanyName).FontSize(16).Bold().FontColor(Colors.Green.Darken2);
                col.Item().Text(CompanyAddress);
                col.Item().Text($"Tel: {CompanyPhone}");
            });

            row.RelativeItem().AlignRight().Column(col =>
            {
                col.Item().Text("POTVRDA NARUDŽBE").FontSize(18).Bold().FontColor(Colors.Green.Darken2);
                col.Item().Text($"Narudžba: {request.OrderNumber}").FontSize(12);
                col.Item().Text($"Datum: {request.OrderDate:dd.MM.yyyy HH:mm}");
            });
        });
    }

    private void ComposeOrderContent(IContainer container, OrderPdfRequest request)
    {
        container.PaddingVertical(20).Column(col =>
        {
            // Customer & Shipping info
            col.Item().Row(row =>
            {
                row.RelativeItem().Background(Colors.Grey.Lighten3).Padding(10).Column(c =>
                {
                    c.Item().Text("KUPAC:").Bold();
                    c.Item().Text(request.CustomerName);
                    c.Item().Text(request.CustomerAddress);
                    c.Item().Text(request.CustomerEmail);
                    c.Item().Text(request.CustomerPhone);
                });

                row.ConstantItem(20);

                row.RelativeItem().Background(Colors.Grey.Lighten3).Padding(10).Column(c =>
                {
                    c.Item().Text("DOSTAVA:").Bold();
                    c.Item().Text(request.ShippingAddress);
                    c.Item().Text($"Način: {request.ShippingMethod}");
                    if (request.EstimatedDelivery.HasValue)
                        c.Item().Text($"Očekivana dostava: {request.EstimatedDelivery:dd.MM.yyyy}");
                });
            });

            col.Item().PaddingVertical(15);

            // Items
            col.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(80);
                    columns.RelativeColumn();
                    columns.ConstantColumn(60);
                    columns.ConstantColumn(80);
                    columns.ConstantColumn(100);
                });

                table.Header(header =>
                {
                    header.Cell().Background(Colors.Green.Darken2).Padding(5).Text("Šifra").FontColor(Colors.White).Bold();
                    header.Cell().Background(Colors.Green.Darken2).Padding(5).Text("Naziv").FontColor(Colors.White).Bold();
                    header.Cell().Background(Colors.Green.Darken2).Padding(5).Text("Količina").FontColor(Colors.White).Bold();
                    header.Cell().Background(Colors.Green.Darken2).Padding(5).Text("Cijena").FontColor(Colors.White).Bold();
                    header.Cell().Background(Colors.Green.Darken2).Padding(5).Text("Ukupno").FontColor(Colors.White).Bold();
                });

                var lineNum = 1;
                foreach (var item in request.Items)
                {
                    var bgColor = lineNum % 2 == 0 ? Colors.Grey.Lighten4 : Colors.White;
                    table.Cell().Background(bgColor).Padding(5).Text(item.ProductCode);
                    table.Cell().Background(bgColor).Padding(5).Text(item.ProductName);
                    table.Cell().Background(bgColor).Padding(5).AlignRight().Text(item.Quantity.ToString("N0"));
                    table.Cell().Background(bgColor).Padding(5).AlignRight().Text($"{item.UnitPrice:N2} KM");
                    table.Cell().Background(bgColor).Padding(5).AlignRight().Text($"{item.LineTotal:N2} KM");
                    lineNum++;
                }
            });

            col.Item().PaddingVertical(10);

            // Totals
            col.Item().AlignRight().Width(250).Column(totals =>
            {
                totals.Item().Row(r => { r.RelativeItem().Text("Međuzbir:"); r.ConstantItem(100).AlignRight().Text($"{request.SubTotal:N2} KM"); });
                if (request.DiscountAmount > 0)
                    totals.Item().Row(r => { r.RelativeItem().Text("Popust:"); r.ConstantItem(100).AlignRight().Text($"-{request.DiscountAmount:N2} KM"); });
                totals.Item().Row(r => { r.RelativeItem().Text("Dostava:"); r.ConstantItem(100).AlignRight().Text($"{request.ShippingCost:N2} KM"); });
                totals.Item().Row(r => { r.RelativeItem().Text("PDV:"); r.ConstantItem(100).AlignRight().Text($"{request.TaxAmount:N2} KM"); });
                totals.Item().Background(Colors.Green.Darken2).Padding(5).Row(r =>
                {
                    r.RelativeItem().Text("UKUPNO:").Bold().FontColor(Colors.White);
                    r.ConstantItem(100).AlignRight().Text($"{request.TotalAmount:N2} KM").Bold().FontColor(Colors.White);
                });
            });

            if (!string.IsNullOrEmpty(request.Notes))
                col.Item().PaddingTop(15).Text($"Napomena: {request.Notes}").Italic();
        });
    }

    private void ComposeDeliveryHeader(IContainer container, DeliveryNotePdfRequest request)
    {
        container.Row(row =>
        {
            row.RelativeItem().Column(col =>
            {
                col.Item().Text(CompanyName).FontSize(16).Bold().FontColor(Colors.Orange.Darken2);
                col.Item().Text(CompanyAddress);
            });

            row.RelativeItem().AlignRight().Column(col =>
            {
                col.Item().Text("OTPREMNICA").FontSize(18).Bold().FontColor(Colors.Orange.Darken2);
                col.Item().Text($"Broj: {request.DeliveryNumber}");
                col.Item().Text($"Narudžba: {request.OrderNumber}");
                col.Item().Text($"Datum: {request.DeliveryDate:dd.MM.yyyy}");
            });
        });
    }

    private void ComposeDeliveryContent(IContainer container, DeliveryNotePdfRequest request)
    {
        container.PaddingVertical(20).Column(col =>
        {
            col.Item().Row(row =>
            {
                row.RelativeItem().Background(Colors.Grey.Lighten3).Padding(10).Column(c =>
                {
                    c.Item().Text("PRIMALAC:").Bold();
                    c.Item().Text(request.RecipientName);
                    c.Item().Text(request.DeliveryAddress);
                });

                row.ConstantItem(20);

                row.RelativeItem().Background(Colors.Grey.Lighten3).Padding(10).Column(c =>
                {
                    c.Item().Text("DOSTAVLJAČ:").Bold();
                    c.Item().Text($"Vozač: {request.DriverName}");
                    c.Item().Text($"Vozilo: {request.VehicleNumber}");
                });
            });

            col.Item().PaddingVertical(15);

            col.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(80);
                    columns.RelativeColumn();
                    columns.ConstantColumn(60);
                    columns.ConstantColumn(50);
                    columns.ConstantColumn(80);
                    columns.ConstantColumn(80);
                });

                table.Header(header =>
                {
                    header.Cell().Background(Colors.Orange.Darken2).Padding(5).Text("Šifra").FontColor(Colors.White).Bold();
                    header.Cell().Background(Colors.Orange.Darken2).Padding(5).Text("Naziv").FontColor(Colors.White).Bold();
                    header.Cell().Background(Colors.Orange.Darken2).Padding(5).Text("Količina").FontColor(Colors.White).Bold();
                    header.Cell().Background(Colors.Orange.Darken2).Padding(5).Text("JM").FontColor(Colors.White).Bold();
                    header.Cell().Background(Colors.Orange.Darken2).Padding(5).Text("Serija").FontColor(Colors.White).Bold();
                    header.Cell().Background(Colors.Orange.Darken2).Padding(5).Text("Rok").FontColor(Colors.White).Bold();
                });

                var lineNum = 1;
                foreach (var item in request.Items)
                {
                    var bgColor = lineNum % 2 == 0 ? Colors.Grey.Lighten4 : Colors.White;
                    table.Cell().Background(bgColor).Padding(5).Text(item.ProductCode);
                    table.Cell().Background(bgColor).Padding(5).Text(item.ProductName);
                    table.Cell().Background(bgColor).Padding(5).AlignRight().Text(item.Quantity.ToString("N0"));
                    table.Cell().Background(bgColor).Padding(5).Text(item.Unit);
                    table.Cell().Background(bgColor).Padding(5).Text(item.BatchNumber ?? "-");
                    table.Cell().Background(bgColor).Padding(5).Text(item.ExpiryDate?.ToString("MM/yyyy") ?? "-");
                    lineNum++;
                }
            });

            col.Item().PaddingTop(30).Row(row =>
            {
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text("Primio (potpis):").Bold();
                    c.Item().PaddingTop(30).LineHorizontal(1);
                });
                row.ConstantItem(50);
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text("Predao (potpis):").Bold();
                    c.Item().PaddingTop(30).LineHorizontal(1);
                });
            });

            if (!string.IsNullOrEmpty(request.Notes))
                col.Item().PaddingTop(15).Text($"Napomena: {request.Notes}").Italic();
        });
    }

    private void ComposePackingHeader(IContainer container, PackingSlipPdfRequest request)
    {
        container.Row(row =>
        {
            row.RelativeItem().Column(col =>
            {
                col.Item().Text(CompanyName).FontSize(16).Bold().FontColor(Colors.Purple.Darken2);
                col.Item().Text($"Narudžba: {request.OrderNumber}");
                col.Item().Text($"Datum: {request.PackDate:dd.MM.yyyy}");
            });

            row.RelativeItem().AlignRight().Column(col =>
            {
                col.Item().Text("LISTA PAKOVANJA").FontSize(18).Bold().FontColor(Colors.Purple.Darken2);
                col.Item().Text($"Paketa: {request.TotalPackages}");
                col.Item().Text($"Pakovao: {request.PackedBy}");
            });
        });
    }

    private void ComposePackingContent(IContainer container, PackingSlipPdfRequest request)
    {
        container.PaddingVertical(20).Column(col =>
        {
            col.Item().Background(Colors.Grey.Lighten3).Padding(10).Column(c =>
            {
                c.Item().Text("PRIMALAC:").Bold();
                c.Item().Text(request.RecipientName);
                c.Item().Text(request.DeliveryAddress);
            });

            col.Item().PaddingVertical(15);

            col.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(30);
                    columns.ConstantColumn(80);
                    columns.RelativeColumn();
                    columns.ConstantColumn(60);
                    columns.ConstantColumn(60);
                });

                table.Header(header =>
                {
                    header.Cell().Background(Colors.Purple.Darken2).Padding(5).Text("✓").FontColor(Colors.White).Bold();
                    header.Cell().Background(Colors.Purple.Darken2).Padding(5).Text("Šifra").FontColor(Colors.White).Bold();
                    header.Cell().Background(Colors.Purple.Darken2).Padding(5).Text("Naziv").FontColor(Colors.White).Bold();
                    header.Cell().Background(Colors.Purple.Darken2).Padding(5).Text("Količina").FontColor(Colors.White).Bold();
                    header.Cell().Background(Colors.Purple.Darken2).Padding(5).Text("Paket").FontColor(Colors.White).Bold();
                });

                var lineNum = 1;
                foreach (var item in request.Items)
                {
                    var bgColor = lineNum % 2 == 0 ? Colors.Grey.Lighten4 : Colors.White;
                    table.Cell().Background(bgColor).Padding(5).Text(item.IsChecked ? "☑" : "☐");
                    table.Cell().Background(bgColor).Padding(5).Text(item.ProductCode);
                    table.Cell().Background(bgColor).Padding(5).Text(item.ProductName);
                    table.Cell().Background(bgColor).Padding(5).AlignRight().Text(item.Quantity.ToString("N0"));
                    table.Cell().Background(bgColor).Padding(5).AlignCenter().Text(item.PackageNumber.ToString());
                    lineNum++;
                }
            });
        });
    }

    #endregion

    private void ComposeFooter(IContainer container)
    {
        container.AlignCenter().Text(text =>
        {
            text.Span("Stranica ");
            text.CurrentPageNumber();
            text.Span(" od ");
            text.TotalPages();
            text.Span($" | {CompanyName} | {CompanyEmail}");
        });
    }

    #region Report PDFs

    public async Task<byte[]> GenerateSalesReportPdfAsync(SalesReportDto data)
    {
        try
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(40);
                    page.DefaultTextStyle(x => x.FontSize(10));

                    page.Header().Element(c => ComposeReportHeader(c, "IZVJEŠTAJ O PRODAJI", data.StartDate, data.EndDate));
                    page.Content().Element(c => ComposeSalesReportContent(c, data));
                    page.Footer().Element(ComposeFooter);
                });
            });

            return await Task.FromResult(document.GeneratePdf());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating sales report PDF");
            throw;
        }
    }

    public async Task<byte[]> GenerateInventoryReportPdfAsync(InventoryReportDto data)
    {
        try
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4.Landscape());
                    page.Margin(30);
                    page.DefaultTextStyle(x => x.FontSize(9));

                    page.Header().Element(c => ComposeReportHeader(c, "IZVJEŠTAJ O ZALIHAMA", data.ReportDate.AddMonths(-1), data.ReportDate));
                    page.Content().Element(c => ComposeInventoryReportContent(c, data));
                    page.Footer().Element(ComposeFooter);
                });
            });

            return await Task.FromResult(document.GeneratePdf());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating inventory report PDF");
            throw;
        }
    }

    public async Task<byte[]> GenerateCustomerStatementPdfAsync(CustomerReportDto data)
    {
        try
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(40);
                    page.DefaultTextStyle(x => x.FontSize(10));

                    page.Header().Element(c => ComposeReportHeader(c, "IZVOD KUPCA", data.StartDate, data.EndDate));
                    page.Content().Element(c => ComposeCustomerReportContent(c, data));
                    page.Footer().Element(ComposeFooter);
                });
            });

            return await Task.FromResult(document.GeneratePdf());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating customer statement PDF");
            throw;
        }
    }

    public async Task<byte[]> GeneratePriceListPdfAsync(PriceListPdfRequest request)
    {
        try
        {
            var products = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Manufacturer)
                .Where(p => request.IncludeInactive || p.IsActive)
                .Where(p => !request.CategoryId.HasValue || p.CategoryId == request.CategoryId)
                .Where(p => !request.ManufacturerId.HasValue || p.ManufacturerId == request.ManufacturerId)
                .OrderBy(p => p.Category!.Name)
                .ThenBy(p => p.Name)
                .ToListAsync();

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(40);
                    page.DefaultTextStyle(x => x.FontSize(10));

                    page.Header().Element(c => ComposePriceListHeader(c, request));
                    page.Content().Element(c => ComposePriceListContent(c, products, request.Currency));
                    page.Footer().Element(ComposeFooter);
                });
            });

            return await Task.FromResult(document.GeneratePdf());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating price list PDF");
            throw;
        }
    }

    public async Task<byte[]> GenerateProductCatalogPdfAsync(ProductCatalogPdfRequest request)
    {
        try
        {
            var products = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Manufacturer)
                .Where(p => p.IsActive)
                .Where(p => !request.CategoryId.HasValue || p.CategoryId == request.CategoryId)
                .Where(p => !request.ManufacturerId.HasValue || p.ManufacturerId == request.ManufacturerId)
                .OrderBy(p => p.Category!.Name)
                .ThenBy(p => p.Name)
                .ToListAsync();

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(40);
                    page.DefaultTextStyle(x => x.FontSize(10));

                    page.Header().Element(c => ComposeCatalogHeader(c, request));
                    page.Content().Element(c => ComposeCatalogContent(c, products, request));
                    page.Footer().Element(ComposeFooter);
                });
            });

            return await Task.FromResult(document.GeneratePdf());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating product catalog PDF");
            throw;
        }
    }

    private void ComposeReportHeader(IContainer container, string title, DateTime startDate, DateTime endDate)
    {
        container.Row(row =>
        {
            row.RelativeItem().Column(col =>
            {
                col.Item().Text(CompanyName).FontSize(16).Bold().FontColor(Colors.Blue.Darken2);
                col.Item().Text(CompanyAddress);
            });

            row.RelativeItem().AlignRight().Column(col =>
            {
                col.Item().Text(title).FontSize(16).Bold().FontColor(Colors.Blue.Darken2);
                col.Item().Text($"Period: {startDate:dd.MM.yyyy} - {endDate:dd.MM.yyyy}");
                col.Item().Text($"Generirano: {DateTime.Now:dd.MM.yyyy HH:mm}");
            });
        });
    }

    private void ComposeSalesReportContent(IContainer container, SalesReportDto data)
    {
        container.PaddingVertical(20).Column(col =>
        {
            // Summary
            col.Item().Background(Colors.Blue.Lighten4).Padding(15).Column(summary =>
            {
                summary.Item().Text("SAŽETAK PRODAJE").Bold().FontSize(12);
                summary.Item().PaddingTop(10).Row(row =>
                {
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Text($"Ukupni prihod: {data.TotalRevenue:N2} KM").Bold();
                        c.Item().Text($"Ukupno narudžbi: {data.TotalOrders}");
                    });
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Text($"Prosječna narudžba: {data.AverageOrderValue:N2} KM");
                        c.Item().Text($"Ukupni popust: {data.TotalDiscount:N2} KM");
                    });
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Text($"Neto prihod: {data.NetRevenue:N2} KM").Bold();
                    });
                });
            });

            // Daily sales
            if (data.DailySales?.Any() == true)
            {
                col.Item().PaddingTop(20).Text("DNEVNA PRODAJA").Bold().FontSize(11);
                col.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                    });

                    table.Header(header =>
                    {
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Datum").FontColor(Colors.White).Bold();
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Narudžbi").FontColor(Colors.White).Bold();
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Prihod").FontColor(Colors.White).Bold();
                    });

                    var lineNum = 1;
                    foreach (var day in data.DailySales)
                    {
                        var bgColor = lineNum % 2 == 0 ? Colors.Grey.Lighten4 : Colors.White;
                        table.Cell().Background(bgColor).Padding(5).Text(day.Date.ToString("dd.MM.yyyy"));
                        table.Cell().Background(bgColor).Padding(5).AlignRight().Text(day.OrderCount.ToString());
                        table.Cell().Background(bgColor).Padding(5).AlignRight().Text($"{day.Revenue:N2} KM");
                        lineNum++;
                    }
                });
            }

            // Product details
            if (data.Items?.Any() == true)
            {
                col.Item().PaddingTop(20).Text("DETALJI PRODAJE PO PROIZVODU").Bold().FontSize(11);
                col.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(80);
                        columns.RelativeColumn(2);
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                    });

                    table.Header(header =>
                    {
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Šifra").FontColor(Colors.White).Bold();
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Naziv").FontColor(Colors.White).Bold();
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Količina").FontColor(Colors.White).Bold();
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Popust").FontColor(Colors.White).Bold();
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Neto").FontColor(Colors.White).Bold();
                    });

                    var lineNum = 1;
                    foreach (var item in data.Items)
                    {
                        var bgColor = lineNum % 2 == 0 ? Colors.Grey.Lighten4 : Colors.White;
                        table.Cell().Background(bgColor).Padding(5).Text(item.SKU);
                        table.Cell().Background(bgColor).Padding(5).Text(item.ProductName);
                        table.Cell().Background(bgColor).Padding(5).AlignRight().Text(item.QuantitySold.ToString("N0"));
                        table.Cell().Background(bgColor).Padding(5).AlignRight().Text($"{item.DiscountAmount:N2} KM");
                        table.Cell().Background(bgColor).Padding(5).AlignRight().Text($"{item.NetAmount:N2} KM");
                        lineNum++;
                    }
                });
            }
        });
    }

    private void ComposeInventoryReportContent(IContainer container, InventoryReportDto data)
    {
        container.PaddingVertical(20).Column(col =>
        {
            // Summary
            col.Item().Row(row =>
            {
                row.RelativeItem().Background(Colors.Blue.Lighten4).Padding(10).Column(c =>
                {
                    c.Item().Text("Ukupna vrijednost zaliha").Bold();
                    c.Item().Text($"{data.TotalInventoryValue:N2} KM").FontSize(14);
                });
                row.ConstantItem(10);
                row.RelativeItem().Background(Colors.Green.Lighten4).Padding(10).Column(c =>
                {
                    c.Item().Text("Na zalihama").Bold();
                    c.Item().Text(data.TotalInStock.ToString()).FontSize(14);
                });
                row.ConstantItem(10);
                row.RelativeItem().Background(Colors.Orange.Lighten4).Padding(10).Column(c =>
                {
                    c.Item().Text("Niske zalihe").Bold();
                    c.Item().Text(data.TotalLowStock.ToString()).FontSize(14);
                });
                row.ConstantItem(10);
                row.RelativeItem().Background(Colors.Red.Lighten4).Padding(10).Column(c =>
                {
                    c.Item().Text("Bez zaliha").Bold();
                    c.Item().Text(data.TotalOutOfStock.ToString()).FontSize(14);
                });
                row.ConstantItem(10);
                row.RelativeItem().Background(Colors.Yellow.Lighten4).Padding(10).Column(c =>
                {
                    c.Item().Text("Ističe uskoro").Bold();
                    c.Item().Text(data.TotalExpiringSoon.ToString()).FontSize(14);
                });
            });

            if (data.Items?.Any() == true)
            {
                col.Item().PaddingTop(20).Text("DETALJI ZALIHA").Bold().FontSize(11);
                col.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(70);
                        columns.RelativeColumn(2);
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                    });

                    table.Header(header =>
                    {
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Šifra").FontColor(Colors.White).Bold();
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Naziv").FontColor(Colors.White).Bold();
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Zaliha").FontColor(Colors.White).Bold();
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Min.").FontColor(Colors.White).Bold();
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Cijena").FontColor(Colors.White).Bold();
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Vrijednost").FontColor(Colors.White).Bold();
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Status").FontColor(Colors.White).Bold();
                    });

                    var lineNum = 1;
                    foreach (var item in data.Items)
                    {
                        var bgColor = lineNum % 2 == 0 ? Colors.Grey.Lighten4 : Colors.White;
                        var statusColor = item.StockStatus switch
                        {
                            "OutOfStock" => Colors.Red.Darken2,
                            "LowStock" => Colors.Orange.Darken2,
                            _ => Colors.Green.Darken2
                        };
                        
                        table.Cell().Background(bgColor).Padding(5).Text(item.SKU);
                        table.Cell().Background(bgColor).Padding(5).Text(item.ProductName);
                        table.Cell().Background(bgColor).Padding(5).AlignRight().Text(item.CurrentStock.ToString("N0"));
                        table.Cell().Background(bgColor).Padding(5).AlignRight().Text(item.ReorderLevel.ToString("N0"));
                        table.Cell().Background(bgColor).Padding(5).AlignRight().Text($"{item.UnitCost:N2}");
                        table.Cell().Background(bgColor).Padding(5).AlignRight().Text($"{item.TotalValue:N2} KM");
                        table.Cell().Background(bgColor).Padding(5).Text(item.StockStatus).FontColor(statusColor);
                        lineNum++;
                    }
                });
            }
        });
    }

    private void ComposeCustomerReportContent(IContainer container, CustomerReportDto data)
    {
        container.PaddingVertical(20).Column(col =>
        {
            // Customer Info
            col.Item().Background(Colors.Blue.Lighten4).Padding(15).Column(summary =>
            {
                summary.Item().Text("PODACI O KUPCU").Bold().FontSize(12);
                summary.Item().PaddingTop(10).Row(row =>
                {
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Text($"Ime: {data.CustomerName}").Bold();
                        c.Item().Text($"Email: {data.Email}");
                    });
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Text($"Ukupno narudžbi: {data.TotalOrders}");
                        c.Item().Text($"Ukupno potrošeno: {data.TotalSpent:N2} KM").Bold();
                    });
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Text($"Ukupni popust: {data.TotalDiscount:N2} KM");
                    });
                });
            });

            // Orders
            if (data.Orders?.Any() == true)
            {
                col.Item().PaddingTop(20).Text("POVIJEST NARUDŽBI").Bold().FontSize(11);
                col.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(100);
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                    });

                    table.Header(header =>
                    {
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Broj").FontColor(Colors.White).Bold();
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Datum").FontColor(Colors.White).Bold();
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Status").FontColor(Colors.White).Bold();
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Stavki").FontColor(Colors.White).Bold();
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Ukupno").FontColor(Colors.White).Bold();
                    });

                    var lineNum = 1;
                    foreach (var order in data.Orders)
                    {
                        var bgColor = lineNum % 2 == 0 ? Colors.Grey.Lighten4 : Colors.White;
                        table.Cell().Background(bgColor).Padding(5).Text(order.OrderNumber);
                        table.Cell().Background(bgColor).Padding(5).Text(order.OrderDate.ToString("dd.MM.yyyy"));
                        table.Cell().Background(bgColor).Padding(5).Text(order.Status);
                        table.Cell().Background(bgColor).Padding(5).AlignRight().Text(order.ItemCount.ToString());
                        table.Cell().Background(bgColor).Padding(5).AlignRight().Text($"{order.Total:N2} KM");
                        lineNum++;
                    }

                    // Total row
                    table.Cell().ColumnSpan(4).Background(Colors.Blue.Darken2).Padding(5).Text("UKUPNO").FontColor(Colors.White).Bold();
                    table.Cell().Background(Colors.Blue.Darken2).Padding(5).AlignRight().Text($"{data.TotalSpent:N2} KM").FontColor(Colors.White).Bold();
                });
            }
        });
    }

    private void ComposePriceListHeader(IContainer container, PriceListPdfRequest request)
    {
        container.Row(row =>
        {
            row.RelativeItem().Column(col =>
            {
                col.Item().Text(CompanyName).FontSize(16).Bold().FontColor(Colors.Blue.Darken2);
                col.Item().Text(CompanyAddress);
                col.Item().Text($"Tel: {CompanyPhone}");
            });

            row.RelativeItem().AlignRight().Column(col =>
            {
                col.Item().Text(request.Title).FontSize(18).Bold().FontColor(Colors.Blue.Darken2);
                col.Item().Text($"Važi od: {request.ValidFrom:dd.MM.yyyy}");
                if (request.ValidTo.HasValue)
                    col.Item().Text($"Važi do: {request.ValidTo:dd.MM.yyyy}");
                col.Item().Text($"Valuta: {request.Currency}");
            });
        });
    }

    private void ComposePriceListContent(IContainer container, List<Product> products, string currency)
    {
        container.PaddingVertical(20).Column(col =>
        {
            var groupedProducts = products.GroupBy(p => p.Category?.Name ?? "Bez kategorije");

            foreach (var group in groupedProducts)
            {
                col.Item().Background(Colors.Grey.Lighten3).Padding(10).Text(group.Key).Bold().FontSize(11);

                col.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(80);
                        columns.RelativeColumn(3);
                        columns.RelativeColumn();
                        columns.ConstantColumn(50);
                        columns.ConstantColumn(80);
                    });

                    table.Header(header =>
                    {
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Šifra").FontColor(Colors.White).Bold();
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Naziv").FontColor(Colors.White).Bold();
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Proizvođač").FontColor(Colors.White).Bold();
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("JM").FontColor(Colors.White).Bold();
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5).Text("Cijena").FontColor(Colors.White).Bold();
                    });

                    var lineNum = 1;
                    foreach (var product in group)
                    {
                        var bgColor = lineNum % 2 == 0 ? Colors.Grey.Lighten4 : Colors.White;
                        table.Cell().Background(bgColor).Padding(5).Text(product.SKU);
                        table.Cell().Background(bgColor).Padding(5).Text(product.Name);
                        table.Cell().Background(bgColor).Padding(5).Text(product.Manufacturer?.Name ?? "-");
                        table.Cell().Background(bgColor).Padding(5).Text(product.PackageSize ?? "kom");
                        table.Cell().Background(bgColor).Padding(5).AlignRight().Text($"{product.UnitPrice:N2} {currency}");
                        lineNum++;
                    }
                });

                col.Item().PaddingBottom(10);
            }
        });
    }

    private void ComposeCatalogHeader(IContainer container, ProductCatalogPdfRequest request)
    {
        container.Row(row =>
        {
            row.RelativeItem().Column(col =>
            {
                col.Item().Text(CompanyName).FontSize(16).Bold().FontColor(Colors.Blue.Darken2);
                col.Item().Text(CompanyAddress);
            });

            row.RelativeItem().AlignRight().Column(col =>
            {
                col.Item().Text(request.Title).FontSize(18).Bold().FontColor(Colors.Blue.Darken2);
                col.Item().Text($"Datum: {DateTime.Now:dd.MM.yyyy}");
            });
        });
    }

    private void ComposeCatalogContent(IContainer container, List<Product> products, ProductCatalogPdfRequest request)
    {
        container.PaddingVertical(20).Column(col =>
        {
            var groupedProducts = products.GroupBy(p => p.Category?.Name ?? "Bez kategorije");

            foreach (var group in groupedProducts)
            {
                col.Item().Background(Colors.Blue.Lighten4).Padding(10).Text(group.Key).Bold().FontSize(12);
                col.Item().PaddingVertical(5);

                foreach (var product in group)
                {
                    col.Item().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(10).Row(row =>
                    {
                        row.RelativeItem(3).Column(prod =>
                        {
                            prod.Item().Text(product.Name).Bold().FontSize(11);
                            prod.Item().Text($"Šifra: {product.SKU} | Proizvođač: {product.Manufacturer?.Name ?? "-"}");
                            
                            if (request.IncludeDescriptions && !string.IsNullOrEmpty(product.Description))
                                prod.Item().PaddingTop(5).Text(product.Description).FontSize(9).FontColor(Colors.Grey.Darken1);
                        });

                        if (request.IncludePrices)
                        {
                            row.RelativeItem().AlignRight().Column(price =>
                            {
                                price.Item().Text($"{product.UnitPrice:N2} KM").Bold().FontSize(12);
                                price.Item().Text($"PDV uključen").FontSize(8).FontColor(Colors.Grey.Medium);
                            });
                        }
                    });
                }

                col.Item().PaddingBottom(15);
            }
        });
    }

    #endregion
}
