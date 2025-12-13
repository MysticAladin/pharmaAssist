import { Injectable } from '@angular/core';

export interface ExportColumn<T> {
  key: keyof T | string;
  header: string;
  format?: (value: any, row: T) => string;
}

export interface ExportOptions {
  filename: string;
  sheetName?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  /**
   * Export data to CSV format
   */
  exportToCSV<T>(
    data: T[],
    columns: ExportColumn<T>[],
    options: ExportOptions
  ): void {
    const headers = columns.map(col => col.header);
    const rows = data.map(row => this.formatRow(row, columns));

    let csvContent = '';

    if (options.includeHeaders !== false) {
      csvContent += this.escapeCSVRow(headers) + '\n';
    }

    rows.forEach(row => {
      csvContent += this.escapeCSVRow(row) + '\n';
    });

    this.downloadFile(csvContent, `${options.filename}.csv`, 'text/csv;charset=utf-8;');
  }

  /**
   * Export data to Excel-compatible format (using HTML table)
   * For proper Excel export, consider using a library like xlsx or exceljs
   */
  exportToExcel<T>(
    data: T[],
    columns: ExportColumn<T>[],
    options: ExportOptions
  ): void {
    const headers = columns.map(col => col.header);
    const rows = data.map(row => this.formatRow(row, columns));

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: var(--pharma-teal-500); color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
        </style>
      </head>
      <body>
        <table>
    `;

    if (options.includeHeaders !== false) {
      html += '<thead><tr>';
      headers.forEach(header => {
        html += `<th>${this.escapeHTML(header)}</th>`;
      });
      html += '</tr></thead>';
    }

    html += '<tbody>';
    rows.forEach(row => {
      html += '<tr>';
      row.forEach(cell => {
        html += `<td>${this.escapeHTML(cell)}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table></body></html>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    this.downloadBlob(blob, `${options.filename}.xls`);
  }

  /**
   * Export data to JSON format
   */
  exportToJSON<T>(data: T[], options: ExportOptions): void {
    const jsonContent = JSON.stringify(data, null, 2);
    this.downloadFile(jsonContent, `${options.filename}.json`, 'application/json;charset=utf-8;');
  }

  /**
   * Export data to PDF format (basic implementation using HTML)
   * For production, consider using libraries like jspdf or pdfmake
   */
  exportToPDF<T>(
    data: T[],
    columns: ExportColumn<T>[],
    options: ExportOptions & { title?: string; subtitle?: string }
  ): void {
    const headers = columns.map(col => col.header);
    const rows = data.map(row => this.formatRow(row, columns));

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${options.title || options.filename}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 12px; }
          .header { margin-bottom: 20px; }
          .header h1 { color: var(--pharma-teal-500); margin: 0 0 5px; font-size: 24px; }
          .header p { color: #666; margin: 0; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: var(--pharma-teal-500); color: white; font-weight: 600; font-size: 11px; text-transform: uppercase; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 30px; font-size: 10px; color: #888; text-align: center; }
          @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          ${options.title ? `<h1>${this.escapeHTML(options.title)}</h1>` : ''}
          ${options.subtitle ? `<p>${this.escapeHTML(options.subtitle)}</p>` : ''}
          <p>Generated: ${new Date().toLocaleString('bs-BA')}</p>
        </div>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${this.escapeHTML(h)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `<tr>${row.map(cell => `<td>${this.escapeHTML(cell)}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>PharmaAssist - ${new Date().toLocaleDateString('bs-BA')}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.error('Failed to open print window');
      return;
    }

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  }

  private formatRow<T>(row: T, columns: ExportColumn<T>[]): string[] {
    return columns.map(col => {
      const value = this.getNestedValue(row, col.key as string);
      if (col.format) {
        return col.format(value, row);
      }
      return this.formatValue(value);
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (value instanceof Date) {
      return value.toLocaleDateString('bs-BA');
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    return String(value);
  }

  private escapeCSVRow(values: string[]): string {
    return values.map(value => this.escapeCSVValue(value)).join(',');
  }

  private escapeCSVValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private escapeHTML(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob(['\ufeff' + content], { type: mimeType });
    this.downloadBlob(blob, filename);
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
