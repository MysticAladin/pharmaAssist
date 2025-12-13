import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CartService } from '../../services/cart.service';
import { CatalogService } from '../../services/catalog.service';
import { QuickOrderItem, PriceType } from '../../models/portal.model';
import { KmCurrencyPipe } from '../../../../core/pipes/km-currency.pipe';

@Component({
  selector: 'app-quick-order',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule, KmCurrencyPipe],
  template: `
    <div class="quick-order-page">
      <div class="page-header">
        <h1>{{ 'portal.quickOrder.title' | translate }}</h1>
        <p class="subtitle">{{ 'portal.quickOrder.subtitle' | translate }}</p>
      </div>

      <div class="quick-order-content">
        <div class="input-section">
          <div class="input-methods">
            <button [class.active]="inputMethod() === 'manual'" (click)="inputMethod.set('manual')">
              {{ 'portal.quickOrder.manualEntry' | translate }}
            </button>
            <button [class.active]="inputMethod() === 'paste'" (click)="inputMethod.set('paste')">
              {{ 'portal.quickOrder.pasteList' | translate }}
            </button>
            <button [class.active]="inputMethod() === 'upload'" (click)="inputMethod.set('upload')">
              {{ 'portal.quickOrder.uploadFile' | translate }}
            </button>
          </div>

          @switch (inputMethod()) {
            @case ('manual') {
              <div class="manual-entry">
                <div class="entry-row header">
                  <span>{{ 'portal.quickOrder.skuOrName' | translate }}</span>
                  <span>{{ 'portal.quickOrder.quantity' | translate }}</span>
                  <span></span>
                </div>
                @for (item of items(); track $index) {
                  <div class="entry-row">
                    <input
                      type="text"
                      [(ngModel)]="item.sku"
                      [placeholder]="'portal.quickOrder.enterSku' | translate"
                      (blur)="lookupProduct(item)"
                    />
                    <input
                      type="number"
                      [(ngModel)]="item.quantity"
                      min="1"
                    />
                    <button class="remove-btn" (click)="removeItem($index)">✕</button>
                  </div>
                  @if (item.productName) {
                    <div class="product-preview">
                      <span class="name">{{ item.productName }}</span>
                      @if (item.unitPrice) {
                        <span class="price">{{ item.unitPrice | kmCurrency }}</span>
                      }
                    </div>
                  } @else if (item.error) {
                    <div class="error-msg">{{ item.error }}</div>
                  }
                }
                <button class="add-row-btn" (click)="addItem()">
                  + {{ 'portal.quickOrder.addRow' | translate }}
                </button>
              </div>
            }
            @case ('paste') {
              <div class="paste-entry">
                <textarea
                  [(ngModel)]="pasteText"
                  [placeholder]="'portal.quickOrder.pastePlaceholder' | translate"
                  rows="10"
                ></textarea>
                <p class="hint">{{ 'portal.quickOrder.pasteHint' | translate }}</p>
                <button class="btn btn-secondary" (click)="parsePastedText()">
                  {{ 'portal.quickOrder.parseList' | translate }}
                </button>
              </div>
            }
            @case ('upload') {
              <div class="upload-entry">
                <div class="upload-zone"
                     (dragover)="onDragOver($event)"
                     (dragleave)="onDragLeave($event)"
                     (drop)="onDrop($event)"
                     [class.dragover]="isDragging()">
                  <input type="file" id="fileInput" (change)="onFileSelected($event)" accept=".csv,.xlsx,.xls" hidden />
                  <label for="fileInput">
                    <span class="upload-icon">📄</span>
                    <span class="upload-text">{{ 'portal.quickOrder.dropFile' | translate }}</span>
                    <span class="upload-hint">{{ 'portal.quickOrder.supportedFormats' | translate }}</span>
                  </label>
                </div>
                @if (uploadedFileName()) {
                  <div class="uploaded-file">
                    <span>📄 {{ uploadedFileName() }}</span>
                    <button (click)="clearUpload()">✕</button>
                  </div>
                }
              </div>
            }
          }
        </div>

        <div class="preview-section">
          <h3>{{ 'portal.quickOrder.preview' | translate }}</h3>
          @if (validItems().length === 0) {
            <div class="empty-preview">
              <p>{{ 'portal.quickOrder.noItems' | translate }}</p>
            </div>
          } @else {
            <div class="preview-list">
              @for (item of validItems(); track item.productId) {
                <div class="preview-item">
                  <div class="item-info">
                    <span class="name">{{ item.productName }}</span>
                    <span class="sku">{{ item.sku }}</span>
                  </div>
                  <span class="qty">x{{ item.quantity }}</span>
                  <span class="price">{{ (item.unitPrice ?? 0) * item.quantity | kmCurrency }}</span>
                </div>
              }
            </div>
            <div class="preview-total">
              <span>{{ 'portal.cart.total' | translate }}</span>
              <span>{{ previewTotal() | kmCurrency }}</span>
            </div>
            <button class="btn btn-primary btn-lg" (click)="addAllToCart()" [disabled]="validItems().length === 0">
              {{ 'portal.quickOrder.addAllToCart' | translate }}
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .quick-order-page { max-width: 1200px; margin: 0 auto; }
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
    .subtitle { color: var(--text-secondary); }

    .quick-order-content { display: grid; grid-template-columns: 1fr 400px; gap: 2rem; }

    .input-section { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }
    .input-methods { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); }
    .input-methods button { padding: 0.75rem 1.25rem; border-radius: 8px; border: 1px solid var(--border-color); background: transparent; cursor: pointer; font-weight: 500; transition: all 0.2s; }
    .input-methods button.active { background: var(--primary-color); color: white; border-color: var(--primary-color); }

    .manual-entry { }
    .entry-row { display: grid; grid-template-columns: 1fr 100px 40px; gap: 0.75rem; margin-bottom: 0.5rem; align-items: center; }
    .entry-row.header { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 1rem; }
    .entry-row input { padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; }
    .entry-row input[type="number"] { text-align: center; }
    .remove-btn { width: 32px; height: 32px; border-radius: 50%; border: none; background: var(--surface-ground); cursor: pointer; }
    .product-preview { font-size: 0.875rem; padding: 0.5rem 0.75rem; background: #f0fdf4; border-radius: 6px; margin: -0.25rem 0 0.75rem; display: flex; justify-content: space-between; }
    .product-preview .name { color: #166534; }
    .product-preview .price { font-weight: 600; }
    .error-msg { font-size: 0.75rem; color: #dc2626; margin: -0.25rem 0 0.75rem; }
    .add-row-btn { width: 100%; padding: 0.75rem; border: 2px dashed var(--border-color); background: transparent; border-radius: 8px; cursor: pointer; color: var(--text-secondary); margin-top: 0.5rem; }
    .add-row-btn:hover { border-color: var(--primary-color); color: var(--primary-color); }

    .paste-entry textarea { width: 100%; padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; resize: vertical; font-family: monospace; }
    .paste-entry .hint { font-size: 0.75rem; color: var(--text-secondary); margin: 0.5rem 0 1rem; }

    .upload-zone { border: 2px dashed var(--border-color); border-radius: 12px; padding: 3rem 2rem; text-align: center; cursor: pointer; transition: all 0.2s; }
    .upload-zone:hover, .upload-zone.dragover { border-color: var(--primary-color); background: rgba(59, 130, 246, 0.05); }
    .upload-zone label { cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
    .upload-icon { font-size: 3rem; }
    .upload-text { font-weight: 500; }
    .upload-hint { font-size: 0.75rem; color: var(--text-secondary); }
    .uploaded-file { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: var(--surface-ground); border-radius: 8px; margin-top: 1rem; }
    .uploaded-file button { background: none; border: none; cursor: pointer; }

    .preview-section { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; height: fit-content; position: sticky; top: 180px; }
    .preview-section h3 { font-size: 1rem; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-color); }
    .empty-preview { text-align: center; padding: 2rem; color: var(--text-secondary); }
    .preview-list { max-height: 300px; overflow-y: auto; margin-bottom: 1rem; }
    .preview-item { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color); }
    .preview-item:last-child { border-bottom: none; }
    .item-info { flex: 1; }
    .item-info .name { display: block; font-weight: 500; }
    .item-info .sku { font-size: 0.75rem; color: var(--text-secondary); }
    .preview-item .qty { color: var(--text-secondary); }
    .preview-item .price { font-weight: 600; }
    .preview-total { display: flex; justify-content: space-between; padding: 1rem 0; margin-bottom: 1rem; border-top: 2px solid var(--border-color); font-size: 1.25rem; font-weight: 700; }

    .btn { padding: 0.75rem 1.5rem; border-radius: 8px; border: none; cursor: pointer; font-weight: 500; }
    .btn-primary { background: var(--primary-color); color: white; }
    .btn-secondary { background: var(--surface-ground); color: var(--text-color); }
    .btn-lg { width: 100%; padding: 1rem; font-size: 1rem; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }

    @media (max-width: 1024px) { .quick-order-content { grid-template-columns: 1fr; } .preview-section { position: static; } }
  `]
})
export class QuickOrderComponent {
  private cartService = inject(CartService);
  private catalogService = inject(CatalogService);
  private router = inject(Router);

  inputMethod = signal<'manual' | 'paste' | 'upload'>('manual');
  items = signal<QuickOrderItem[]>([{ sku: '', quantity: 1 }, { sku: '', quantity: 1 }, { sku: '', quantity: 1 }]);
  pasteText = '';
  isDragging = signal(false);
  uploadedFileName = signal('');

  validItems = signal<QuickOrderItem[]>([]);
  previewTotal = signal(0);

  addItem() {
    this.items.update(items => [...items, { sku: '', quantity: 1 }]);
  }

  removeItem(index: number) {
    this.items.update(items => items.filter((_, i) => i !== index));
    this.updatePreview();
  }

  lookupProduct(item: QuickOrderItem) {
    if (!item.sku) return;
    // Simulate product lookup
    setTimeout(() => {
      if (item.sku.toUpperCase().startsWith('PAR')) {
        item.productId = '1';
        item.productName = 'Paracetamol 500mg';
        item.unitPrice = 5.50;
        item.inStock = true;
        item.error = undefined;
      } else if (item.sku.toUpperCase().startsWith('IBU')) {
        item.productId = '2';
        item.productName = 'Ibuprofen 400mg';
        item.unitPrice = 8.00;
        item.inStock = true;
        item.error = undefined;
      } else {
        item.error = 'Product not found';
        item.productId = undefined;
        item.productName = undefined;
      }
      this.items.set([...this.items()]);
      this.updatePreview();
    }, 300);
  }

  updatePreview() {
    const valid = this.items().filter(i => i.productId && i.quantity > 0);
    this.validItems.set(valid);
    this.previewTotal.set(valid.reduce((sum, i) => sum + (i.unitPrice ?? 0) * i.quantity, 0));
  }

  parsePastedText() {
    const lines = this.pasteText.split('\n').filter(l => l.trim());
    const newItems: QuickOrderItem[] = lines.map(line => {
      const parts = line.split(/[,\t;]+/).map(p => p.trim());
      return { sku: parts[0] || '', quantity: parseInt(parts[1]) || 1 };
    });
    this.items.set(newItems);
    newItems.forEach(item => this.lookupProduct(item));
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files?.length) this.processFile(files[0]);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.processFile(input.files[0]);
  }

  processFile(file: File) {
    this.uploadedFileName.set(file.name);
    // In real app, parse CSV/Excel file
  }

  clearUpload() {
    this.uploadedFileName.set('');
  }

  addAllToCart() {
    for (const item of this.validItems()) {
      if (item.productId && item.productName) {
        this.cartService.addItem({
          productId: item.productId,
          productName: item.productName,
          productCode: item.sku,
          manufacturer: '',
          unitPrice: item.unitPrice ?? 0,
          quantity: item.quantity,
          maxQuantity: 999,
          subtotal: (item.unitPrice ?? 0) * item.quantity,
          priceType: item.priceType ?? PriceType.Commercial
        });
      }
    }
    this.router.navigate(['/portal/cart']);
  }
}
