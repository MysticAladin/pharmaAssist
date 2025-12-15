import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

export interface PrintOptions {
  title?: string;
  paperSize?: 'A4' | 'Letter' | 'A5';
  orientation?: 'portrait' | 'landscape';
  showHeader?: boolean;
  showFooter?: boolean;
  margins?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

export interface OrderPrintData {
  orderNumber: string;
  orderDate: string;
  customer: {
    name: string;
    address?: string;
    email?: string;
    phone?: string;
  };
  items: Array<{
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  taxAmount: number;
  discount?: number;
  total: number;
  paymentStatus: string;
  notes?: string;
}

export interface PrescriptionPrintData {
  prescriptionNumber: string;
  date: string;
  patient: {
    name: string;
    dateOfBirth?: string;
    insuranceNumber?: string;
  };
  prescriber: {
    name: string;
    license?: string;
    institution?: string;
  };
  items: Array<{
    medication: string;
    dosage: string;
    quantity: number;
    instructions: string;
    dispensed?: boolean;
  }>;
  notes?: string;
  validUntil?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PrintService {
  private readonly document = inject(DOCUMENT);
  private readonly translate = inject(TranslateService);

  private defaultOptions: PrintOptions = {
    paperSize: 'A4',
    orientation: 'portrait',
    showHeader: true,
    showFooter: true,
    margins: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm'
    }
  };

  /**
   * Print an order document
   */
  printOrder(data: OrderPrintData, options?: PrintOptions): void {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const html = this.generateOrderHTML(data, mergedOptions);
    this.print(html, mergedOptions);
  }

  /**
   * Print a prescription document
   */
  printPrescription(data: PrescriptionPrintData, options?: PrintOptions): void {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const html = this.generatePrescriptionHTML(data, mergedOptions);
    this.print(html, mergedOptions);
  }

  /**
   * Print custom HTML content
   */
  printCustom(content: string, options?: PrintOptions): void {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const html = this.wrapContent(content, mergedOptions);
    this.print(html, mergedOptions);
  }

  private print(html: string, options: PrintOptions): void {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      console.error('Failed to open print window');
      return;
    }

    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for content to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Close window after printing (optional)
        // printWindow.close();
      }, 250);
    };
  }

  private generateOrderHTML(data: OrderPrintData, options: PrintOptions): string {
    const t = (key: string) => this.translate.instant(key);

    const itemRows = data.items.map(item => `
      <tr>
        <td>${item.name}<br><small class="sku">${item.sku}</small></td>
        <td class="text-center">${item.quantity}</td>
        <td class="text-right">${this.formatCurrency(item.unitPrice)}</td>
        <td class="text-right">${this.formatCurrency(item.total)}</td>
      </tr>
    `).join('');

    const content = `
      <div class="document order-document">
        <!-- Header -->
        <div class="document-header">
          <div class="company-info">
            <h1>PharmaAssist</h1>
            <p>${t('branding.tagline')}</p>
          </div>
          <div class="document-info">
            <h2>${t('print.order.title')}</h2>
            <p><strong>${t('print.order.number')}:</strong> ${data.orderNumber}</p>
            <p><strong>${t('print.order.date')}:</strong> ${data.orderDate}</p>
          </div>
        </div>

        <!-- Customer Info -->
        <div class="section customer-section">
          <h3>${t('print.order.billTo')}</h3>
          <p><strong>${data.customer.name}</strong></p>
          ${data.customer.address ? `<p>${data.customer.address}</p>` : ''}
          ${data.customer.email ? `<p>${data.customer.email}</p>` : ''}
          ${data.customer.phone ? `<p>${data.customer.phone}</p>` : ''}
        </div>

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th>${t('print.order.product')}</th>
              <th class="text-center">${t('print.order.quantity')}</th>
              <th class="text-right">${t('print.order.unitPrice')}</th>
              <th class="text-right">${t('print.order.total')}</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-section">
          <div class="totals-row">
            <span>${t('print.order.subtotal')}</span>
            <span>${this.formatCurrency(data.subtotal)}</span>
          </div>
          ${data.discount ? `
          <div class="totals-row discount">
            <span>${t('print.order.discount')}</span>
            <span>-${this.formatCurrency(data.discount)}</span>
          </div>
          ` : ''}
          <div class="totals-row">
            <span>${t('print.order.tax')}</span>
            <span>${this.formatCurrency(data.taxAmount)}</span>
          </div>
          <div class="totals-row total">
            <span>${t('print.order.grandTotal')}</span>
            <span>${this.formatCurrency(data.total)}</span>
          </div>
        </div>

        <!-- Payment Status -->
        <div class="section status-section">
          <p><strong>${t('print.order.paymentStatus')}:</strong> ${data.paymentStatus}</p>
        </div>

        ${data.notes ? `
        <div class="section notes-section">
          <h3>${t('print.order.notes')}</h3>
          <p>${data.notes}</p>
        </div>
        ` : ''}
      </div>
    `;

    return this.wrapContent(content, options);
  }

  private generatePrescriptionHTML(data: PrescriptionPrintData, options: PrintOptions): string {
    const t = (key: string) => this.translate.instant(key);

    const itemRows = data.items.map(item => `
      <tr>
        <td>
          <strong>${item.medication}</strong>
          <br><small>${item.dosage}</small>
        </td>
        <td class="text-center">${item.quantity}</td>
        <td>${item.instructions}</td>
        <td class="text-center">
          ${item.dispensed ? '✓' : ''}
        </td>
      </tr>
    `).join('');

    const content = `
      <div class="document prescription-document">
        <!-- Header -->
        <div class="document-header">
          <div class="company-info">
            <h1>PharmaAssist</h1>
            <p>${t('branding.tagline')}</p>
          </div>
          <div class="document-info">
            <h2>${t('print.prescription.title')}</h2>
            <p><strong>${t('print.prescription.number')}:</strong> ${data.prescriptionNumber}</p>
            <p><strong>${t('print.prescription.date')}:</strong> ${data.date}</p>
            ${data.validUntil ? `<p><strong>${t('print.prescription.validUntil')}:</strong> ${data.validUntil}</p>` : ''}
          </div>
        </div>

        <!-- Patient & Prescriber Info -->
        <div class="two-column">
          <div class="section">
            <h3>${t('print.prescription.patient')}</h3>
            <p><strong>${data.patient.name}</strong></p>
            ${data.patient.dateOfBirth ? `<p>${t('print.prescription.dob')}: ${data.patient.dateOfBirth}</p>` : ''}
            ${data.patient.insuranceNumber ? `<p>${t('print.prescription.insurance')}: ${data.patient.insuranceNumber}</p>` : ''}
          </div>
          <div class="section">
            <h3>${t('print.prescription.prescriber')}</h3>
            <p><strong>${data.prescriber.name}</strong></p>
            ${data.prescriber.license ? `<p>${t('print.prescription.license')}: ${data.prescriber.license}</p>` : ''}
            ${data.prescriber.institution ? `<p>${data.prescriber.institution}</p>` : ''}
          </div>
        </div>

        <!-- Medications Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th>${t('print.prescription.medication')}</th>
              <th class="text-center">${t('print.prescription.quantity')}</th>
              <th>${t('print.prescription.instructions')}</th>
              <th class="text-center">${t('print.prescription.dispensed')}</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        ${data.notes ? `
        <div class="section notes-section">
          <h3>${t('print.prescription.notes')}</h3>
          <p>${data.notes}</p>
        </div>
        ` : ''}

        <!-- Signature Area -->
        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line"></div>
            <p>${t('print.prescription.pharmacistSignature')}</p>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <p>${t('print.prescription.dateDispensed')}</p>
          </div>
        </div>
      </div>
    `;

    return this.wrapContent(content, options);
  }

  private wrapContent(content: string, options: PrintOptions): string {
    const margins = options.margins || this.defaultOptions.margins!;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${options.title || 'Print Document'}</title>
        <style>
          @page {
            size: ${options.paperSize} ${options.orientation};
            margin: ${margins.top} ${margins.right} ${margins.bottom} ${margins.left};
          }

          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #1a1a1a;
            background: white;
          }

          .document {
            max-width: 100%;
            margin: 0 auto;
          }

          .document-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #2cc4c4;
          }

          .company-info h1 {
            font-size: 24px;
            color: var(--pharma-teal-500);
            margin-bottom: 4px;
          }

          .company-info p {
            font-size: 11px;
            color: #666;
          }

          .document-info {
            text-align: right;
          }

          .document-info h2 {
            font-size: 18px;
            color: #333;
            margin-bottom: 8px;
          }

          .document-info p {
            font-size: 11px;
            margin-bottom: 2px;
          }

          .section {
            margin-bottom: 20px;
          }

          .section h3 {
            font-size: 13px;
            color: var(--pharma-teal-500);
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .section p {
            margin-bottom: 4px;
          }

          .two-column {
            display: flex;
            gap: 40px;
            margin-bottom: 20px;
          }

          .two-column .section {
            flex: 1;
          }

          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }

          .items-table th,
          .items-table td {
            padding: 10px 12px;
            border: 1px solid #e5e5e5;
          }

          .items-table th {
            background: #f8f8f8;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #555;
          }

          .items-table td {
            vertical-align: top;
          }

          .items-table .sku {
            color: #888;
            font-size: 10px;
          }

          .text-center {
            text-align: center;
          }

          .text-right {
            text-align: right;
          }

          .totals-section {
            margin-left: auto;
            width: 250px;
            margin-bottom: 20px;
          }

          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e5e5;
          }

          .totals-row.discount {
            color: var(--color-error-dark);
          }

          .totals-row.total {
            font-size: 14px;
            font-weight: 600;
            border-bottom: 2px solid #2cc4c4;
          }

          .status-section {
            padding: 12px 16px;
            background: #f8f8f8;
            border-radius: 4px;
          }

          .notes-section {
            padding: 12px 16px;
            background: var(--color-warning-bg);
            border-left: 3px solid #f59e0b;
            margin-top: 20px;
          }

          .signature-section {
            display: flex;
            justify-content: space-between;
            gap: 60px;
            margin-top: 40px;
            padding-top: 40px;
          }

          .signature-box {
            flex: 1;
            text-align: center;
          }

          .signature-line {
            border-bottom: 1px solid #333;
            margin-bottom: 8px;
            height: 40px;
          }

          .signature-box p {
            font-size: 11px;
            color: #666;
          }

          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }

            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('bs-BA', {
      style: 'currency',
      currency: 'BAM',
      minimumFractionDigits: 2
    }).format(amount);
  }
}
