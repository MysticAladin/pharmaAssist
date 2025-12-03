import { Component, inject, signal, output, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BarcodeService, BarcodeSearchResult } from '../../../core/services/barcode.service';
import { Product } from '../../../core/models/product.model';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-barcode-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="scanner-overlay" (click)="close()">
      <div class="scanner-modal" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="scanner-header">
          <h3>{{ 'barcode.title' | translate }}</h3>
          <button class="btn-close" (click)="close()">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Scanner Mode Tabs -->
        <div class="scanner-tabs">
          <button class="tab" [class.active]="mode() === 'manual'" (click)="setMode('manual')">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 10H3"/><path d="M21 6H3"/><path d="M21 14H3"/><path d="M17 18H3"/>
            </svg>
            {{ 'barcode.manualEntry' | translate }}
          </button>
          <button class="tab" [class.active]="mode() === 'camera'" (click)="setMode('camera')">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>
            </svg>
            {{ 'barcode.cameraScanner' | translate }}
          </button>
        </div>

        <!-- Content -->
        <div class="scanner-content">
          <!-- Manual Entry Mode -->
          @if (mode() === 'manual') {
            <div class="manual-entry">
              <div class="input-group">
                <div class="input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 5v14"/><path d="M21 5v14"/><path d="M6 5v14"/><path d="M18 5v14"/><path d="M10 5v14"/><path d="M14 5v14"/>
                  </svg>
                </div>
                <input
                  #barcodeInput
                  type="text"
                  class="barcode-input"
                  [placeholder]="'barcode.enterBarcode' | translate"
                  [(ngModel)]="manualBarcode"
                  (ngModelChange)="onBarcodeChange($event)"
                  (keyup.enter)="searchBarcode()"
                  [class.invalid]="manualBarcode.length > 0 && !isValidBarcode()">
                <button class="btn-search" (click)="searchBarcode()" [disabled]="!manualBarcode || searching()">
                  @if (searching()) {
                    <div class="spinner"></div>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                  }
                </button>
              </div>
              @if (manualBarcode.length > 0 && !isValidBarcode()) {
                <p class="validation-error">{{ 'barcode.invalidFormat' | translate }}</p>
              }
              <p class="hint">{{ 'barcode.manualHint' | translate }}</p>
            </div>
          }

          <!-- Camera Mode -->
          @if (mode() === 'camera') {
            <div class="camera-scanner">
              @if (cameraError()) {
                <div class="camera-error">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
                  </svg>
                  <h4>{{ 'barcode.cameraError' | translate }}</h4>
                  <p>{{ cameraError() }}</p>
                  <button class="btn btn-secondary" (click)="retryCamera()">
                    {{ 'barcode.retry' | translate }}
                  </button>
                </div>
              } @else if (!cameraActive()) {
                <div class="camera-placeholder">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>
                  </svg>
                  <p>{{ 'barcode.cameraLoading' | translate }}</p>
                  <div class="spinner"></div>
                </div>
              } @else {
                <div class="video-container">
                  <video #videoElement autoplay playsinline></video>
                  <div class="scan-overlay">
                    <div class="scan-region">
                      <div class="corner top-left"></div>
                      <div class="corner top-right"></div>
                      <div class="corner bottom-left"></div>
                      <div class="corner bottom-right"></div>
                      <div class="scan-line"></div>
                    </div>
                  </div>
                </div>
                <p class="camera-hint">{{ 'barcode.cameraHint' | translate }}</p>
              }
            </div>
          }

          <!-- Search Result -->
          @if (searchResult()) {
            <div class="search-result" [class.found]="searchResult()?.found" [class.not-found]="!searchResult()?.found">
              @if (searchResult()?.found && searchResult()?.product) {
                <div class="result-found">
                  <div class="result-icon success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <div class="result-content">
                    <h4>{{ searchResult()?.product?.name }}</h4>
                    <p class="product-details">
                      <span class="sku">{{ searchResult()?.product?.sku }}</span>
                      <span class="price">{{ formatCurrency(searchResult()?.product?.unitPrice || 0) }}</span>
                    </p>
                    <p class="barcode-display">{{ 'barcode.scannedCode' | translate }}: {{ searchResult()?.barcode }}</p>
                  </div>
                  <button class="btn btn-primary" (click)="selectProduct(searchResult()?.product!)">
                    {{ 'barcode.selectProduct' | translate }}
                  </button>
                </div>
              } @else {
                <div class="result-not-found">
                  <div class="result-icon error">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  <div class="result-content">
                    <h4>{{ 'barcode.productNotFound' | translate }}</h4>
                    <p>{{ 'barcode.noProductForBarcode' | translate }}: {{ searchResult()?.barcode }}</p>
                  </div>
                  <button class="btn btn-secondary" (click)="clearResult()">
                    {{ 'barcode.tryAgain' | translate }}
                  </button>
                </div>
              }
            </div>
          }

          <!-- Recent Scans -->
          @if (recentScans().length > 0 && !searchResult()) {
            <div class="recent-scans">
              <h4>{{ 'barcode.recentScans' | translate }}</h4>
              <div class="scans-list">
                @for (scan of recentScans(); track scan.barcode) {
                  <button class="scan-item" (click)="rescan(scan.barcode)">
                    <span class="scan-barcode">{{ scan.barcode }}</span>
                    <span class="scan-time">{{ formatTime(scan.timestamp) }}</span>
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .scanner-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .scanner-modal {
      background: #fff;
      border-radius: 16px;
      width: 100%;
      max-width: 480px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .scanner-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #e5e7eb;
    }

    .scanner-header h3 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1a1a2e;
    }

    .btn-close {
      background: none;
      border: none;
      padding: 8px;
      border-radius: 8px;
      cursor: pointer;
      color: #6b7280;
      transition: all 0.2s;
    }

    .btn-close:hover {
      background: #f3f4f6;
      color: #1a1a2e;
    }

    .scanner-tabs {
      display: flex;
      border-bottom: 1px solid #e5e7eb;
    }

    .tab {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      background: none;
      border: none;
      font-size: 0.875rem;
      font-weight: 500;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s;
      border-bottom: 2px solid transparent;
    }

    .tab:hover {
      background: #f9fafb;
      color: #1a1a2e;
    }

    .tab.active {
      color: #0d9488;
      border-bottom-color: #0d9488;
    }

    .scanner-content {
      padding: 20px;
      overflow-y: auto;
    }

    /* Manual Entry */
    .manual-entry {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .input-group {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 4px;
      transition: border-color 0.2s;
    }

    .input-group:focus-within {
      border-color: #0d9488;
    }

    .input-icon {
      padding: 8px 12px;
      color: #9ca3af;
    }

    .barcode-input {
      flex: 1;
      border: none;
      background: none;
      font-size: 1.125rem;
      font-family: 'Courier New', monospace;
      letter-spacing: 2px;
      padding: 12px 0;
    }

    .barcode-input:focus {
      outline: none;
    }

    .barcode-input.invalid {
      color: #dc2626;
    }

    .btn-search {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      background: #0d9488;
      border: none;
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .btn-search:hover:not(:disabled) {
      background: #0f766e;
    }

    .btn-search:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .validation-error {
      color: #dc2626;
      font-size: 0.8rem;
      margin: 0;
    }

    .hint {
      color: #6b7280;
      font-size: 0.8rem;
      margin: 0;
      text-align: center;
    }

    /* Camera Scanner */
    .camera-scanner {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .camera-placeholder, .camera-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 40px 20px;
      background: #f9fafb;
      border-radius: 12px;
      text-align: center;
    }

    .camera-placeholder svg, .camera-error svg {
      color: #9ca3af;
    }

    .camera-error svg {
      color: #f59e0b;
    }

    .camera-error h4 {
      margin: 0;
      color: #1a1a2e;
    }

    .camera-error p {
      margin: 0;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .video-container {
      position: relative;
      aspect-ratio: 4/3;
      background: #000;
      border-radius: 12px;
      overflow: hidden;
    }

    .video-container video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .scan-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .scan-region {
      position: relative;
      width: 70%;
      height: 40%;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
    }

    .corner {
      position: absolute;
      width: 24px;
      height: 24px;
      border: 3px solid #0d9488;
    }

    .corner.top-left { top: -2px; left: -2px; border-right: none; border-bottom: none; border-radius: 8px 0 0 0; }
    .corner.top-right { top: -2px; right: -2px; border-left: none; border-bottom: none; border-radius: 0 8px 0 0; }
    .corner.bottom-left { bottom: -2px; left: -2px; border-right: none; border-top: none; border-radius: 0 0 0 8px; }
    .corner.bottom-right { bottom: -2px; right: -2px; border-left: none; border-top: none; border-radius: 0 0 8px 0; }

    .scan-line {
      position: absolute;
      left: 10%;
      right: 10%;
      height: 2px;
      background: linear-gradient(90deg, transparent, #0d9488, transparent);
      animation: scan 2s ease-in-out infinite;
    }

    @keyframes scan {
      0%, 100% { top: 10%; }
      50% { top: 90%; }
    }

    .camera-hint {
      text-align: center;
      color: #6b7280;
      font-size: 0.8rem;
      margin: 0;
    }

    /* Search Results */
    .search-result {
      margin-top: 20px;
      padding: 16px;
      border-radius: 12px;
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
      from { transform: translateY(10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .search-result.found {
      background: #f0fdf4;
      border: 1px solid #86efac;
    }

    .search-result.not-found {
      background: #fef2f2;
      border: 1px solid #fecaca;
    }

    .result-found, .result-not-found {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .result-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .result-icon.success {
      background: #dcfce7;
      color: #16a34a;
    }

    .result-icon.error {
      background: #fee2e2;
      color: #dc2626;
    }

    .result-content {
      flex: 1;
    }

    .result-content h4 {
      margin: 0 0 4px;
      font-size: 1rem;
      color: #1a1a2e;
    }

    .product-details {
      display: flex;
      gap: 12px;
      margin: 0 0 4px;
    }

    .sku {
      font-family: monospace;
      font-size: 0.8rem;
      color: #6b7280;
      background: #e5e7eb;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .price {
      font-weight: 600;
      color: #0d9488;
    }

    .barcode-display {
      font-size: 0.8rem;
      color: #6b7280;
      margin: 0;
    }

    .result-not-found .result-content p {
      margin: 0;
      font-size: 0.875rem;
      color: #6b7280;
    }

    /* Buttons */
    .btn {
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .btn-primary {
      background: #0d9488;
      color: #fff;
      border: none;
    }

    .btn-primary:hover {
      background: #0f766e;
    }

    .btn-secondary {
      background: #fff;
      color: #1a1a2e;
      border: 1px solid #e5e7eb;
    }

    .btn-secondary:hover {
      background: #f9fafb;
    }

    /* Recent Scans */
    .recent-scans {
      margin-top: 24px;
    }

    .recent-scans h4 {
      margin: 0 0 12px;
      font-size: 0.875rem;
      font-weight: 600;
      color: #6b7280;
    }

    .scans-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .scan-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .scan-item:hover {
      background: #f3f4f6;
      border-color: #0d9488;
    }

    .scan-barcode {
      font-family: monospace;
      font-size: 0.9rem;
      letter-spacing: 1px;
    }

    .scan-time {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    /* Spinner */
    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .camera-placeholder .spinner {
      border-color: rgba(13, 148, 136, 0.3);
      border-top-color: #0d9488;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Dark mode support */
    :host-context(.dark) .scanner-modal {
      background: #1e293b;
    }

    :host-context(.dark) .scanner-header {
      border-color: #334155;
    }

    :host-context(.dark) .scanner-header h3 {
      color: #f8fafc;
    }

    :host-context(.dark) .scanner-tabs {
      border-color: #334155;
    }

    :host-context(.dark) .tab {
      color: #94a3b8;
    }

    :host-context(.dark) .tab:hover {
      background: #334155;
      color: #f8fafc;
    }

    :host-context(.dark) .input-group {
      background: #0f172a;
      border-color: #334155;
    }

    :host-context(.dark) .barcode-input {
      color: #f8fafc;
    }

    :host-context(.dark) .camera-placeholder {
      background: #0f172a;
    }
  `]
})
export class BarcodeScannerComponent implements OnDestroy, AfterViewInit {
  @ViewChild('barcodeInput') barcodeInput!: ElementRef<HTMLInputElement>;
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  private readonly barcodeService = inject(BarcodeService);
  private readonly destroy$ = new Subject<void>();

  // Outputs
  closed = output<void>();
  productSelected = output<Product>();

  // State
  mode = signal<'manual' | 'camera'>('manual');
  manualBarcode = '';
  searching = signal(false);
  searchResult = signal<BarcodeSearchResult | null>(null);
  recentScans = signal<{ barcode: string; timestamp: Date }[]>([]);
  cameraActive = signal(false);
  cameraError = signal<string | null>(null);

  private mediaStream: MediaStream | null = null;

  ngAfterViewInit(): void {
    // Focus input on manual mode
    setTimeout(() => {
      if (this.barcodeInput) {
        this.barcodeInput.nativeElement.focus();
      }
    }, 100);

    // Load recent scans from localStorage
    this.loadRecentScans();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopCamera();
  }

  close(): void {
    this.stopCamera();
    this.closed.emit();
  }

  setMode(mode: 'manual' | 'camera'): void {
    this.mode.set(mode);
    this.searchResult.set(null);

    if (mode === 'camera') {
      this.startCamera();
    } else {
      this.stopCamera();
      setTimeout(() => {
        if (this.barcodeInput) {
          this.barcodeInput.nativeElement.focus();
        }
      }, 100);
    }
  }

  onBarcodeChange(value: string): void {
    // Clear previous result when typing
    this.searchResult.set(null);
  }

  isValidBarcode(): boolean {
    if (!this.manualBarcode) return false;
    const cleaned = this.manualBarcode.replace(/[\s-]/g, '');
    // Allow partial input while typing
    return /^\d+$/.test(cleaned) && cleaned.length >= 8 && cleaned.length <= 14;
  }

  searchBarcode(): void {
    const barcode = this.manualBarcode.replace(/[\s-]/g, '');
    if (!barcode) return;

    this.searching.set(true);
    this.barcodeService.searchByBarcode(barcode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.searchResult.set(result);
          this.searching.set(false);
          this.addToRecentScans(barcode);
        },
        error: () => {
          this.searchResult.set({ found: false, barcode });
          this.searching.set(false);
        }
      });
  }

  rescan(barcode: string): void {
    this.manualBarcode = barcode;
    this.searchBarcode();
  }

  selectProduct(product: Product): void {
    this.productSelected.emit(product);
    this.close();
  }

  clearResult(): void {
    this.searchResult.set(null);
    this.manualBarcode = '';
    setTimeout(() => {
      if (this.barcodeInput) {
        this.barcodeInput.nativeElement.focus();
      }
    }, 100);
  }

  private async startCamera(): Promise<void> {
    try {
      this.cameraError.set(null);
      this.cameraActive.set(false);

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      if (this.videoElement) {
        this.videoElement.nativeElement.srcObject = this.mediaStream;
        this.cameraActive.set(true);
        // Note: Actual barcode detection would require QuaggaJS or similar library
        // This is a placeholder for the camera interface
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      if (error.name === 'NotAllowedError') {
        this.cameraError.set('Camera access denied. Please allow camera access in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        this.cameraError.set('No camera found on this device.');
      } else {
        this.cameraError.set('Unable to access camera. Please try again.');
      }
    }
  }

  retryCamera(): void {
    this.startCamera();
  }

  private stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.cameraActive.set(false);
  }

  private loadRecentScans(): void {
    try {
      const saved = localStorage.getItem('recentBarcodeScans');
      if (saved) {
        const scans = JSON.parse(saved).map((s: any) => ({
          ...s,
          timestamp: new Date(s.timestamp)
        }));
        this.recentScans.set(scans.slice(0, 5));
      }
    } catch (e) {
      console.error('Error loading recent scans:', e);
    }
  }

  private addToRecentScans(barcode: string): void {
    const current = this.recentScans();
    const filtered = current.filter(s => s.barcode !== barcode);
    const updated = [{ barcode, timestamp: new Date() }, ...filtered].slice(0, 5);
    this.recentScans.set(updated);
    localStorage.setItem('recentBarcodeScans', JSON.stringify(updated));
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    return date.toLocaleDateString();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('bs-BA', {
      style: 'currency',
      currency: 'BAM'
    }).format(amount);
  }
}
