import { Injectable, inject } from '@angular/core';
import { Observable, from, of, catchError, map, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * PDF Document types supported
 */
export enum PdfDocumentType {
  Invoice = 'invoice',
  Order = 'order',
  Report = 'report',
  DeliveryNote = 'delivery-note',
  PriceList = 'price-list',
  Statement = 'statement',
  Receipt = 'receipt',
  Custom = 'custom'
}

/**
 * Page size options
 */
export enum PdfPageSize {
  A4 = 'a4',
  A5 = 'a5',
  Letter = 'letter',
  Legal = 'legal'
}

/**
 * Page orientation
 */
export enum PdfOrientation {
  Portrait = 'portrait',
  Landscape = 'landscape'
}

/**
 * PDF Generation options
 */
export interface PdfOptions {
  pageSize?: PdfPageSize;
  orientation?: PdfOrientation;
  margins?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  header?: PdfHeaderFooter;
  footer?: PdfHeaderFooter;
  watermark?: string;
  password?: string;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
  };
  compress?: boolean;
}

/**
 * Header/Footer configuration
 */
export interface PdfHeaderFooter {
  content?: string;
  height?: number;
  showPageNumbers?: boolean;
  showDate?: boolean;
  logo?: string; // Base64 or URL
}

/**
 * Invoice data for PDF generation
 */
export interface InvoicePdfData {
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  seller: {
    name: string;
    address: string;
    city: string;
    vatNumber?: string;
    phone?: string;
    email?: string;
    logo?: string;
  };
  buyer: {
    name: string;
    address: string;
    city: string;
    vatNumber?: string;
    phone?: string;
    email?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    discount?: number;
    taxRate: number;
    total: number;
  }>;
  subtotal: number;
  discount?: number;
  taxAmount: number;
  total: number;
  currency: string;
  notes?: string;
  paymentTerms?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    iban?: string;
    swift?: string;
  };
}

/**
 * Order data for PDF generation
 */
export interface OrderPdfData {
  orderNumber: string;
  orderDate: Date;
  expectedDelivery?: Date;
  customer: {
    name: string;
    address: string;
    city: string;
    phone?: string;
    email?: string;
  };
  shippingAddress?: {
    name: string;
    address: string;
    city: string;
    phone?: string;
  };
  items: Array<{
    sku: string;
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  shipping?: number;
  discount?: number;
  tax: number;
  total: number;
  currency: string;
  notes?: string;
  status: string;
}

/**
 * Report data for PDF generation
 */
export interface ReportPdfData {
  title: string;
  subtitle?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  generatedAt: Date;
  generatedBy: string;
  sections: Array<{
    title: string;
    type: 'table' | 'chart' | 'text' | 'summary';
    content: unknown;
  }>;
  summary?: Record<string, unknown>;
}

/**
 * PDF Generation Service
 * Provides client-side and server-side PDF generation capabilities
 */
@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/pdf`;

  /**
   * Generate a PDF invoice
   */
  generateInvoice(data: InvoicePdfData, options?: PdfOptions): Observable<Blob> {
    return this.generatePdf(PdfDocumentType.Invoice, data, options);
  }

  /**
   * Generate a PDF invoice for split invoices (Commercial/Essential)
   */
  generateSplitInvoices(
    commercialData: InvoicePdfData | null,
    essentialData: InvoicePdfData | null,
    options?: PdfOptions
  ): Observable<{ commercial?: Blob; essential?: Blob }> {
    const requests: Array<{ key: 'commercial' | 'essential'; data: InvoicePdfData }> = [];

    if (commercialData) {
      requests.push({ key: 'commercial', data: commercialData });
    }
    if (essentialData) {
      requests.push({ key: 'essential', data: essentialData });
    }

    // Generate PDFs sequentially
    return from(this.generateSplitInvoicesAsync(requests, options));
  }

  private async generateSplitInvoicesAsync(
    requests: Array<{ key: 'commercial' | 'essential'; data: InvoicePdfData }>,
    options?: PdfOptions
  ): Promise<{ commercial?: Blob; essential?: Blob }> {
    const result: { commercial?: Blob; essential?: Blob } = {};

    for (const req of requests) {
      const blob = await this.generatePdf(PdfDocumentType.Invoice, req.data, options).toPromise();
      result[req.key] = blob;
    }

    return result;
  }

  /**
   * Generate a PDF order confirmation
   */
  generateOrder(data: OrderPdfData, options?: PdfOptions): Observable<Blob> {
    return this.generatePdf(PdfDocumentType.Order, data, options);
  }

  /**
   * Generate a PDF report
   */
  generateReport(data: ReportPdfData, options?: PdfOptions): Observable<Blob> {
    return this.generatePdf(PdfDocumentType.Report, data, options);
  }

  /**
   * Generate a delivery note
   */
  generateDeliveryNote(data: OrderPdfData, options?: PdfOptions): Observable<Blob> {
    return this.generatePdf(PdfDocumentType.DeliveryNote, data, options);
  }

  /**
   * Generate a price list PDF
   */
  generatePriceList(data: {
    title: string;
    effectiveDate: Date;
    items: Array<{
      sku: string;
      name: string;
      category: string;
      price: number;
      unit: string;
    }>;
    currency: string;
  }, options?: PdfOptions): Observable<Blob> {
    return this.generatePdf(PdfDocumentType.PriceList, data, options);
  }

  /**
   * Generate a custom PDF from HTML content
   */
  generateFromHtml(html: string, options?: PdfOptions): Observable<Blob> {
    return this.generatePdf(PdfDocumentType.Custom, { html }, options);
  }

  /**
   * Generate PDF via server-side rendering
   */
  private generatePdf(type: PdfDocumentType, data: unknown, options?: PdfOptions): Observable<Blob> {
    const defaultOptions: PdfOptions = {
      pageSize: PdfPageSize.A4,
      orientation: PdfOrientation.Portrait,
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      compress: true,
      metadata: {
        author: 'PharmaAssist',
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Document`
      }
    };

    const mergedOptions = { ...defaultOptions, ...options };

    return this.http.post(`${this.apiUrl}/generate`, {
      type,
      data,
      options: mergedOptions
    }, {
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('PDF generation failed:', error);
        // Return an empty PDF blob on error
        return of(new Blob([], { type: 'application/pdf' }));
      })
    );
  }

  /**
   * Download a PDF with a specific filename
   */
  downloadPdf(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Open PDF in a new browser tab
   */
  openPdfInNewTab(blob: Blob, filename?: string): void {
    const url = window.URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');

    // Clean up the URL after a delay
    if (newWindow) {
      newWindow.onload = () => {
        if (filename) {
          newWindow.document.title = filename;
        }
      };
    }

    setTimeout(() => window.URL.revokeObjectURL(url), 10000);
  }

  /**
   * Print PDF directly
   */
  printPdf(blob: Blob): void {
    const url = window.URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;

    document.body.appendChild(iframe);

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          window.URL.revokeObjectURL(url);
        }, 1000);
      }, 500);
    };
  }

  /**
   * Convert PDF blob to Base64
   */
  blobToBase64(blob: Blob): Observable<string> {
    return new Observable<string>(subscriber => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        subscriber.next(reader.result as string);
        subscriber.complete();
      };
      reader.onerror = () => {
        subscriber.error(new Error('Failed to convert blob to base64'));
      };
    });
  }

  /**
   * Get PDF from server by ID (for previously generated PDFs)
   */
  getPdf(pdfId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${pdfId}`, {
      responseType: 'blob'
    });
  }

  /**
   * Delete a previously generated PDF
   */
  deletePdf(pdfId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${pdfId}`);
  }

  /**
   * Generate invoice number
   */
  generateInvoiceNumber(prefix = 'INV', year?: number): string {
    const currentYear = year ?? new Date().getFullYear();
    const timestamp = Date.now().toString(36).toUpperCase();
    return `${prefix}-${currentYear}-${timestamp}`;
  }

  /**
   * Create invoice data from order for split invoices
   */
  createInvoiceFromOrder(
    order: OrderPdfData,
    seller: InvoicePdfData['seller'],
    priceType: 'commercial' | 'essential'
  ): InvoicePdfData {
    const invoicePrefix = priceType === 'commercial' ? 'C-INV' : 'E-INV';

    return {
      invoiceNumber: this.generateInvoiceNumber(invoicePrefix),
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      seller,
      buyer: {
        name: order.customer.name,
        address: order.customer.address,
        city: order.customer.city,
        phone: order.customer.phone,
        email: order.customer.email
      },
      items: order.items.map(item => ({
        description: item.name,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        taxRate: 17, // 17% PDV
        total: item.total
      })),
      subtotal: order.subtotal,
      discount: order.discount,
      taxAmount: order.tax,
      total: order.total,
      currency: order.currency,
      notes: priceType === 'essential'
        ? 'Esencijalni lijekovi - oslobođeni PDV-a prema članu 24. Zakona o PDV-u'
        : undefined
    };
  }
}
