import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, of, catchError, map, tap } from 'rxjs';
import { Product } from '../models/product.model';
import { environment } from '../../../environments/environment';

export interface BarcodeScanResult {
  barcode: string;
  format: string;
  timestamp: Date;
}

export interface BarcodeSearchResult {
  found: boolean;
  product?: Product;
  barcode: string;
}

@Injectable({
  providedIn: 'root'
})
export class BarcodeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/products`;

  // Signals for scanner state
  isScanning = signal(false);
  lastScan = signal<BarcodeScanResult | null>(null);
  error = signal<string | null>(null);

  // Subject for scan events
  private scanSubject = new Subject<BarcodeScanResult>();
  scan$ = this.scanSubject.asObservable();

  /**
   * Search for a product by barcode
   */
  searchByBarcode(barcode: string): Observable<BarcodeSearchResult> {
    return this.http.get<Product>(`${this.apiUrl}/barcode/${barcode}`).pipe(
      map(product => ({
        found: true,
        product,
        barcode
      })),
      catchError(() => of({
        found: false,
        barcode
      }))
    );
  }

  /**
   * Process a scanned barcode
   */
  processScan(barcode: string, format: string = 'EAN-13'): void {
    const result: BarcodeScanResult = {
      barcode,
      format,
      timestamp: new Date()
    };

    this.lastScan.set(result);
    this.scanSubject.next(result);
  }

  /**
   * Validate barcode format (EAN-13, EAN-8, UPC-A)
   */
  validateBarcode(barcode: string): boolean {
    // Remove any spaces or dashes
    const cleaned = barcode.replace(/[\s-]/g, '');

    // Check common formats
    if (/^\d{13}$/.test(cleaned)) {
      // EAN-13
      return this.validateEAN13(cleaned);
    } else if (/^\d{12}$/.test(cleaned)) {
      // UPC-A
      return this.validateUPCA(cleaned);
    } else if (/^\d{8}$/.test(cleaned)) {
      // EAN-8
      return this.validateEAN8(cleaned);
    }

    return false;
  }

  private validateEAN13(barcode: string): boolean {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(barcode[i], 10);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(barcode[12], 10);
  }

  private validateUPCA(barcode: string): boolean {
    let sum = 0;
    for (let i = 0; i < 11; i++) {
      const digit = parseInt(barcode[i], 10);
      sum += i % 2 === 0 ? digit * 3 : digit;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(barcode[11], 10);
  }

  private validateEAN8(barcode: string): boolean {
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      const digit = parseInt(barcode[i], 10);
      sum += i % 2 === 0 ? digit * 3 : digit;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(barcode[7], 10);
  }

  /**
   * Start scanning mode
   */
  startScanning(): void {
    this.isScanning.set(true);
    this.error.set(null);
  }

  /**
   * Stop scanning mode
   */
  stopScanning(): void {
    this.isScanning.set(false);
  }

  /**
   * Clear the last scan
   */
  clearLastScan(): void {
    this.lastScan.set(null);
  }

  /**
   * Set an error message
   */
  setError(message: string): void {
    this.error.set(message);
  }

  /**
   * Clear the error
   */
  clearError(): void {
    this.error.set(null);
  }
}
