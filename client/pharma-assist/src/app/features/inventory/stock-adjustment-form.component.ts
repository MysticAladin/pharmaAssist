import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InventoryService } from '../../core/services/inventory.service';
import { ProductService } from '../../core/services/product.service';
import { NotificationService } from '../../core/services/notification.service';
import { AdjustmentType, CreateStockAdjustmentRequest, getAdjustmentTypeLabel } from '../../core/models/inventory.model';
import { ProductSummary, ProductBatch } from '../../core/models/product.model';

@Component({
  selector: 'app-stock-adjustment-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule
  ],
  template: `
    <div class="adjustment-form-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="breadcrumb">
            <a routerLink="/inventory">{{ 'inventory.title' | translate }}</a>
            <i class="icon-chevron-right"></i>
            <a routerLink="/inventory/adjustments">{{ 'inventory.adjustments' | translate }}</a>
            <i class="icon-chevron-right"></i>
            <span>{{ 'inventory.newAdjustment' | translate }}</span>
          </div>
          <h1>{{ 'inventory.newAdjustment' | translate }}</h1>
        </div>
      </header>

      <div class="form-container">
        <form [formGroup]="adjustmentForm" (ngSubmit)="onSubmit()">
          <!-- Product Selection -->
          <section class="form-section">
            <h2>{{ 'inventory.productSelection' | translate }}</h2>

            <div class="form-group">
              <label for="productSearch">{{ 'inventory.searchProduct' | translate }}</label>
              <div class="search-container">
                <input
                  type="text"
                  id="productSearch"
                  class="form-control"
                  [(ngModel)]="productSearchTerm"
                  [ngModelOptions]="{ standalone: true }"
                  (input)="searchProducts()"
                  [placeholder]="'inventory.searchProductPlaceholder' | translate">

                @if (searchingProducts()) {
                  <div class="search-loading">
                    <span class="spinner-small"></span>
                  </div>
                }
              </div>

              @if (productResults().length > 0 && !selectedProduct()) {
                <ul class="search-results">
                  @for (product of productResults(); track product.id) {
                    <li (click)="selectProduct(product)">
                      <span class="product-name">{{ product.name }}</span>
                      <span class="product-sku">{{ product.sku }}</span>
                      <span class="product-stock">{{ 'inventory.stock' | translate }}: {{ product.stockQuantity }}</span>
                    </li>
                  }
                </ul>
              }
            </div>

            @if (selectedProduct()) {
              <div class="selected-product">
                <div class="product-details">
                  <div class="product-main">
                    <h3>{{ selectedProduct()!.name }}</h3>
                    <code class="sku">{{ selectedProduct()!.sku }}</code>
                  </div>
                  <div class="product-stats">
                    <div class="stat">
                      <span class="stat-label">{{ 'inventory.currentStock' | translate }}</span>
                      <span class="stat-value">{{ selectedProduct()!.stockQuantity }}</span>
                    </div>
                    <div class="stat">
                      <span class="stat-label">{{ 'inventory.category' | translate }}</span>
                      <span class="stat-value">{{ selectedProduct()!.categoryName || '-' }}</span>
                    </div>
                  </div>
                  <button type="button" class="btn btn-text" (click)="clearProduct()">
                    <i class="icon-x"></i>
                    {{ 'common.change' | translate }}
                  </button>
                </div>

                <!-- Batch Selection (Optional) -->
                @if (availableBatches().length > 0) {
                  <div class="form-group">
                    <label for="batch">{{ 'inventory.selectBatch' | translate }} ({{ 'common.optional' | translate }})</label>
                    <select id="batch" formControlName="batchId" class="form-control">
                      <option [value]="null">{{ 'inventory.noBatch' | translate }}</option>
                      @for (batch of availableBatches(); track batch.id) {
                        <option [value]="batch.id">
                          {{ batch.batchNumber }} -
                          {{ 'inventory.expires' | translate }}: {{ batch.expiryDate | date:'mediumDate' }} -
                          {{ 'inventory.qty' | translate }}: {{ batch.remainingQuantity }}
                        </option>
                      }
                    </select>
                  </div>
                }
              </div>
            }
          </section>

          <!-- Adjustment Details -->
          @if (selectedProduct()) {
            <section class="form-section">
              <h2>{{ 'inventory.adjustmentDetails' | translate }}</h2>

              <div class="form-row">
                <div class="form-group">
                  <label for="adjustmentType">{{ 'inventory.adjustmentType' | translate }} *</label>
                  <select
                    id="adjustmentType"
                    formControlName="adjustmentType"
                    class="form-control"
                    [class.is-invalid]="isFieldInvalid('adjustmentType')">
                    <option value="">{{ 'inventory.selectType' | translate }}</option>
                    @for (type of adjustmentTypes; track type) {
                      <option [value]="type">{{ getTypeLabel(type) | translate }}</option>
                    }
                  </select>
                  @if (isFieldInvalid('adjustmentType')) {
                    <span class="error-text">{{ 'validation.required' | translate }}</span>
                  }
                </div>

                <div class="form-group">
                  <label for="quantity">{{ 'inventory.quantity' | translate }} *</label>
                  <input
                    type="number"
                    id="quantity"
                    formControlName="quantity"
                    class="form-control"
                    [class.is-invalid]="isFieldInvalid('quantity')"
                    min="1"
                    [placeholder]="'inventory.enterQuantity' | translate">
                  @if (isFieldInvalid('quantity')) {
                    <span class="error-text">{{ 'validation.minValue' | translate:{ min: 1 } }}</span>
                  }
                </div>
              </div>

              <div class="form-group">
                <label for="reason">{{ 'inventory.reason' | translate }} *</label>
                <input
                  type="text"
                  id="reason"
                  formControlName="reason"
                  class="form-control"
                  [class.is-invalid]="isFieldInvalid('reason')"
                  [placeholder]="'inventory.reasonPlaceholder' | translate">
                @if (isFieldInvalid('reason')) {
                  <span class="error-text">{{ 'validation.required' | translate }}</span>
                }
              </div>

              <div class="form-group">
                <label for="notes">{{ 'inventory.notes' | translate }}</label>
                <textarea
                  id="notes"
                  formControlName="notes"
                  class="form-control"
                  rows="3"
                  [placeholder]="'inventory.notesPlaceholder' | translate">
                </textarea>
              </div>

              <!-- Preview -->
              <div class="adjustment-preview">
                <h3>{{ 'inventory.adjustmentPreview' | translate }}</h3>
                <div class="preview-content">
                  <div class="preview-item">
                    <span class="preview-label">{{ 'inventory.currentStock' | translate }}</span>
                    <span class="preview-value">{{ selectedProduct()!.stockQuantity }}</span>
                  </div>
                  <div class="preview-item operation">
                    <span class="preview-label">{{ 'inventory.adjustment' | translate }}</span>
                    <span class="preview-value" [class.positive]="isAddition()" [class.negative]="!isAddition()">
                      {{ isAddition() ? '+' : '-' }}{{ adjustmentForm.get('quantity')?.value || 0 }}
                    </span>
                  </div>
                  <div class="preview-item result">
                    <span class="preview-label">{{ 'inventory.newStock' | translate }}</span>
                    <span class="preview-value" [class.warning]="calculatedNewStock() < 0">
                      {{ calculatedNewStock() }}
                    </span>
                  </div>
                </div>
                @if (calculatedNewStock() < 0) {
                  <p class="warning-text">
                    <i class="icon-alert-triangle"></i>
                    {{ 'inventory.negativeStockWarning' | translate }}
                  </p>
                }
              </div>
            </section>

            <!-- Actions -->
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" routerLink="/inventory">
                {{ 'common.cancel' | translate }}
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="adjustmentForm.invalid || submitting()">
                @if (submitting()) {
                  <span class="spinner-small light"></span>
                }
                {{ 'inventory.saveAdjustment' | translate }}
              </button>
            </div>
          }
        </form>
      </div>
    </div>
  `,
  styles: [`
    .adjustment-form-page {
      padding: 1.5rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 1.5rem;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
    }

    .breadcrumb a {
      color: var(--primary);
      text-decoration: none;
    }

    .breadcrumb a:hover {
      text-decoration: underline;
    }

    .page-header h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .form-container {
      background: var(--surface);
      border-radius: 8px;
      padding: 1.5rem;
    }

    .form-section {
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .form-section:last-of-type {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }

    .form-section h2 {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .form-control {
      width: 100%;
      padding: 0.625rem 0.875rem;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      font-size: 1rem;
      color: var(--text-primary);
      background: var(--surface);
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
    }

    .form-control.is-invalid {
      border-color: var(--color-danger);
    }

    .error-text {
      display: block;
      color: var(--color-danger);
      font-size: 0.8125rem;
      margin-top: 0.25rem;
    }

    textarea.form-control {
      resize: vertical;
      min-height: 80px;
    }

    /* Search Container */
    .search-container {
      position: relative;
    }

    .search-loading {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
    }

    .search-results {
      list-style: none;
      padding: 0;
      margin: 0.5rem 0 0;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      max-height: 200px;
      overflow-y: auto;
    }

    .search-results li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      cursor: pointer;
      border-bottom: 1px solid var(--border-color);
    }

    .search-results li:last-child {
      border-bottom: none;
    }

    .search-results li:hover {
      background: var(--surface-hover);
    }

    .search-results .product-name {
      font-weight: 500;
      color: var(--text-primary);
    }

    .search-results .product-sku {
      font-size: 0.8125rem;
      color: var(--text-secondary);
    }

    .search-results .product-stock {
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    /* Selected Product */
    .selected-product {
      background: var(--surface-hover);
      border-radius: 8px;
      padding: 1rem;
      margin-top: 1rem;
    }

    .product-details {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .product-main {
      flex: 1;
    }

    .product-main h3 {
      margin: 0 0 0.25rem;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .sku {
      background: var(--surface);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8125rem;
    }

    .product-stats {
      display: flex;
      gap: 1.5rem;
    }

    .stat {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .stat-value {
      font-weight: 600;
      color: var(--text-primary);
    }

    .btn-text {
      background: transparent;
      border: none;
      color: var(--primary);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
    }

    .btn-text:hover {
      text-decoration: underline;
    }

    /* Adjustment Preview */
    .adjustment-preview {
      background: var(--surface-hover);
      border-radius: 8px;
      padding: 1rem;
      margin-top: 1.5rem;
    }

    .adjustment-preview h3 {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
      margin: 0 0 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .preview-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .preview-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.5rem 1rem;
    }

    .preview-item.operation {
      font-size: 1.25rem;
    }

    .preview-item.result {
      background: var(--surface);
      border-radius: 6px;
      padding: 0.75rem 1.25rem;
    }

    .preview-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .preview-value {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .preview-value.positive {
      color: var(--color-success);
    }

    .preview-value.negative {
      color: var(--color-danger);
    }

    .preview-value.warning {
      color: var(--color-warning);
    }

    .warning-text {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0.75rem 0 0;
      color: var(--color-warning);
      font-size: 0.875rem;
    }

    /* Form Actions */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      text-decoration: none;
    }

    .btn-primary {
      background: var(--primary);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--primary-dark);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: var(--surface-hover);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
    }

    .btn-secondary:hover {
      background: var(--border-color);
    }

    /* Inline spinner styles */
    .spinner-small {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid var(--border-color);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .spinner-small.light {
      border-color: rgba(255, 255, 255, 0.3);
      border-top-color: white;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .adjustment-form-page {
        padding: 1rem;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .product-details {
        flex-direction: column;
        align-items: flex-start;
      }

      .preview-content {
        flex-direction: column;
        align-items: flex-start;
      }

      .form-actions {
        flex-direction: column-reverse;
      }

      .form-actions .btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class StockAdjustmentFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly inventoryService = inject(InventoryService);
  private readonly productService = inject(ProductService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);

  // State
  selectedProduct = signal<ProductSummary | null>(null);
  availableBatches = signal<ProductBatch[]>([]);
  productResults = signal<ProductSummary[]>([]);
  searchingProducts = signal(false);
  submitting = signal(false);

  productSearchTerm = '';
  private searchTimeout?: ReturnType<typeof setTimeout>;

  adjustmentTypes: AdjustmentType[] = ['addition', 'removal', 'correction', 'damaged', 'expired', 'returned'];

  adjustmentForm: FormGroup = this.fb.group({
    productId: [null, Validators.required],
    batchId: [null],
    adjustmentType: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    reason: ['', Validators.required],
    notes: ['']
  });

  calculatedNewStock = computed(() => {
    const product = this.selectedProduct();
    if (!product) return 0;

    const quantity = this.adjustmentForm.get('quantity')?.value || 0;
    const type = this.adjustmentForm.get('adjustmentType')?.value;

    if (this.isAdditionType(type)) {
      return product.stockQuantity + quantity;
    } else {
      return product.stockQuantity - quantity;
    }
  });

  ngOnInit(): void {
    // Check for pre-selected product from query params
    const productId = this.route.snapshot.queryParams['productId'];
    if (productId) {
      this.loadProduct(+productId);
    }
  }

  loadProduct(productId: number): void {
    this.productService.getById(productId).subscribe({
      next: (response) => {
        if (response.data) {
          const product = response.data;
          this.selectProduct({
            id: product.id,
            name: product.name,
            nameLocal: product.nameLocal,
            sku: product.sku,
            categoryName: product.categoryName,
            manufacturerName: product.manufacturerName,
            unitPrice: product.unitPrice,
            stockQuantity: product.stockQuantity,
            requiresPrescription: product.requiresPrescription,
            isActive: product.isActive,
            imageUrl: product.imageUrl
          });
        }
      },
      error: () => {
        this.notificationService.error(
          this.translateService.instant('inventory.productLoadError')
        );
      }
    });
  }

  searchProducts(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    if (!this.productSearchTerm || this.productSearchTerm.length < 2) {
      this.productResults.set([]);
      return;
    }

    this.searchTimeout = setTimeout(() => {
      this.searchingProducts.set(true);
      this.productService.search(this.productSearchTerm).subscribe({
        next: (response) => {
          if (response.data) {
            this.productResults.set(response.data);
          }
          this.searchingProducts.set(false);
        },
        error: () => {
          this.searchingProducts.set(false);
        }
      });
    }, 300);
  }

  selectProduct(product: ProductSummary): void {
    this.selectedProduct.set(product);
    this.adjustmentForm.patchValue({ productId: product.id });
    this.productResults.set([]);
    this.productSearchTerm = '';

    // Load batches for this product (mock for now)
    // In real implementation, this would call an API
    this.availableBatches.set([]);
  }

  clearProduct(): void {
    this.selectedProduct.set(null);
    this.adjustmentForm.patchValue({ productId: null, batchId: null });
    this.availableBatches.set([]);
  }

  getTypeLabel(type: AdjustmentType): string {
    const labels: Record<AdjustmentType, string> = {
      addition: 'inventory.type.addition',
      removal: 'inventory.type.removal',
      correction: 'inventory.type.correction',
      damaged: 'inventory.type.damaged',
      expired: 'inventory.type.expired',
      returned: 'inventory.type.returned'
    };
    return labels[type];
  }

  isAddition(): boolean {
    const type = this.adjustmentForm.get('adjustmentType')?.value;
    return this.isAdditionType(type);
  }

  private isAdditionType(type: AdjustmentType): boolean {
    return ['addition', 'returned', 'correction'].includes(type);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.adjustmentForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  onSubmit(): void {
    if (this.adjustmentForm.invalid || !this.selectedProduct()) {
      Object.keys(this.adjustmentForm.controls).forEach(key => {
        this.adjustmentForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.submitting.set(true);

    const request: CreateStockAdjustmentRequest = {
      productId: this.adjustmentForm.value.productId,
      batchId: this.adjustmentForm.value.batchId || undefined,
      adjustmentType: this.adjustmentForm.value.adjustmentType,
      quantity: this.adjustmentForm.value.quantity,
      reason: this.adjustmentForm.value.reason,
      notes: this.adjustmentForm.value.notes || undefined
    };

    this.inventoryService.createAdjustment(request).subscribe({
      next: () => {
        this.notificationService.success(
          this.translateService.instant('inventory.adjustmentSuccess')
        );
        this.router.navigate(['/inventory']);
      },
      error: () => {
        this.notificationService.error(
          this.translateService.instant('inventory.adjustmentError')
        );
        this.submitting.set(false);
      }
    });
  }
}
