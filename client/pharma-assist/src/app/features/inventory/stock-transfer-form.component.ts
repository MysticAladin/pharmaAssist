import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InventoryService } from '../../core/services/inventory.service';
import { ProductService } from '../../core/services/product.service';
import { NotificationService } from '../../core/services/notification.service';
import { CreateStockTransferRequest, Location } from '../../core/models/inventory.model';
import { ProductSummary } from '../../core/models/product.model';

interface TransferItem {
  product: ProductSummary;
  quantity: number;
}

@Component({
  selector: 'app-stock-transfer-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule
  ],
  template: `
    <div class="transfer-form-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="breadcrumb">
            <a routerLink="/inventory">{{ 'inventory.title' | translate }}</a>
            <i class="icon-chevron-right"></i>
            <a routerLink="/inventory/transfers">{{ 'inventory.transfers' | translate }}</a>
            <i class="icon-chevron-right"></i>
            <span>{{ 'inventory.newTransfer' | translate }}</span>
          </div>
          <h1>{{ 'inventory.newTransfer' | translate }}</h1>
        </div>
      </header>

      <div class="form-container">
        <form [formGroup]="transferForm" (ngSubmit)="onSubmit()">
          <!-- Location Selection -->
          <section class="form-section">
            <h2>{{ 'inventory.locations' | translate }}</h2>

            <div class="form-row">
              <div class="form-group">
                <label for="sourceLocation">{{ 'inventory.sourceLocation' | translate }} *</label>
                <select
                  id="sourceLocation"
                  formControlName="sourceLocationId"
                  class="form-control"
                  [class.is-invalid]="isFieldInvalid('sourceLocationId')">
                  <option value="">{{ 'inventory.selectLocation' | translate }}</option>
                  @for (location of locations(); track location.id) {
                    <option
                      [value]="location.id"
                      [disabled]="location.id === transferForm.get('destinationLocationId')?.value">
                      {{ location.name }} ({{ location.code }})
                    </option>
                  }
                </select>
                @if (isFieldInvalid('sourceLocationId')) {
                  <span class="error-text">{{ 'validation.required' | translate }}</span>
                }
              </div>

              <div class="form-group location-arrow">
                <i class="icon-arrow-right"></i>
              </div>

              <div class="form-group">
                <label for="destLocation">{{ 'inventory.destinationLocation' | translate }} *</label>
                <select
                  id="destLocation"
                  formControlName="destinationLocationId"
                  class="form-control"
                  [class.is-invalid]="isFieldInvalid('destinationLocationId')">
                  <option value="">{{ 'inventory.selectLocation' | translate }}</option>
                  @for (location of locations(); track location.id) {
                    <option
                      [value]="location.id"
                      [disabled]="location.id === transferForm.get('sourceLocationId')?.value">
                      {{ location.name }} ({{ location.code }})
                    </option>
                  }
                </select>
                @if (isFieldInvalid('destinationLocationId')) {
                  <span class="error-text">{{ 'validation.required' | translate }}</span>
                }
              </div>
            </div>
          </section>

          <!-- Add Products -->
          <section class="form-section">
            <h2>{{ 'inventory.productsToTransfer' | translate }}</h2>

            <div class="add-product-row">
              <div class="search-container">
                <input
                  type="text"
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

                @if (productResults().length > 0) {
                  <ul class="search-results">
                    @for (product of productResults(); track product.id) {
                      <li (click)="addProduct(product)">
                        <span class="product-name">{{ product.name }}</span>
                        <span class="product-sku">{{ product.sku }}</span>
                        <span class="product-stock">{{ 'inventory.stock' | translate }}: {{ product.stockQuantity }}</span>
                      </li>
                    }
                  </ul>
                }
              </div>
            </div>

            <!-- Selected Products -->
            @if (selectedItems().length > 0) {
              <div class="items-list">
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>{{ 'inventory.product' | translate }}</th>
                      <th>{{ 'inventory.sku' | translate }}</th>
                      <th class="text-right">{{ 'inventory.available' | translate }}</th>
                      <th class="text-right">{{ 'inventory.quantity' | translate }}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of selectedItems(); track item.product.id; let i = $index) {
                      <tr>
                        <td>{{ item.product.name }}</td>
                        <td><code class="sku">{{ item.product.sku }}</code></td>
                        <td class="text-right">{{ item.product.stockQuantity }}</td>
                        <td class="text-right">
                          <input
                            type="number"
                            class="quantity-input"
                            [value]="item.quantity"
                            (change)="updateQuantity(i, $event)"
                            min="1"
                            [max]="item.product.stockQuantity">
                        </td>
                        <td>
                          <button
                            type="button"
                            class="btn btn-icon danger"
                            (click)="removeProduct(i)">
                            <i class="icon-trash-2"></i>
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="3" class="text-right">
                        <strong>{{ 'inventory.totalItems' | translate }}:</strong>
                      </td>
                      <td class="text-right">
                        <strong>{{ totalQuantity() }}</strong>
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            } @else {
              <div class="no-items">
                <i class="icon-package"></i>
                <p>{{ 'inventory.noItemsAdded' | translate }}</p>
              </div>
            }
          </section>

          <!-- Notes -->
          <section class="form-section">
            <div class="form-group">
              <label for="notes">{{ 'inventory.notes' | translate }}</label>
              <textarea
                id="notes"
                formControlName="notes"
                class="form-control"
                rows="3"
                [placeholder]="'inventory.transferNotesPlaceholder' | translate">
              </textarea>
            </div>
          </section>

          <!-- Actions -->
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" routerLink="/inventory/transfers">
              {{ 'common.cancel' | translate }}
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="transferForm.invalid || selectedItems().length === 0 || submitting()">
              @if (submitting()) {
                <span class="spinner-small light"></span>
              }
              {{ 'inventory.createTransfer' | translate }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .transfer-form-page {
      padding: 1.5rem;
      max-width: 900px;
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
      font-size: 1.5rem;
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
      grid-template-columns: 1fr auto 1fr;
      gap: 1rem;
      align-items: start;
    }

    .location-arrow {
      display: flex;
      align-items: center;
      justify-content: center;
      align-self: start;
      /* Align arrow with the selects (below the labels) */
      padding-top: 2rem;
      font-size: 1.5rem;
      color: var(--text-muted);
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

    /* Search */
    .add-product-row {
      margin-bottom: 1rem;
    }

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
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      list-style: none;
      padding: 0;
      margin: 0.25rem 0 0;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background: var(--surface);
      max-height: 200px;
      overflow-y: auto;
      z-index: 10;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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

    /* Items Table */
    .items-list {
      background: var(--surface-hover);
      border-radius: 8px;
      overflow: hidden;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
    }

    .items-table th,
    .items-table td {
      padding: 0.75rem 1rem;
      text-align: left;
    }

    .items-table th {
      font-weight: 600;
      color: var(--text-secondary);
      font-size: 0.8125rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border-color);
    }

    .items-table td {
      border-bottom: 1px solid var(--border-color);
    }

    .items-table tbody tr:last-child td {
      border-bottom: none;
    }

    .items-table tfoot td {
      background: var(--surface);
      font-weight: 500;
    }

    .text-right {
      text-align: right !important;
    }

    .sku {
      background: var(--surface);
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      font-size: 0.75rem;
    }

    .quantity-input {
      width: 80px;
      padding: 0.375rem 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      text-align: right;
    }

    .no-items {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      color: var(--text-muted);
    }

    .no-items i {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .no-items p {
      margin: 0;
    }

    /* Actions */
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

    .btn-icon {
      padding: 0.375rem;
      background: transparent;
      border: none;
      cursor: pointer;
    }

    .btn-icon.danger {
      color: var(--color-danger);
    }

    .btn-icon.danger:hover {
      background: var(--color-danger-bg);
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
      .form-row {
        grid-template-columns: 1fr;
      }

      .location-arrow {
        transform: rotate(90deg);
        padding: 0.5rem;
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
export class StockTransferFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly inventoryService = inject(InventoryService);
  private readonly productService = inject(ProductService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);

  // State
  locations = signal<Location[]>([]);
  selectedItems = signal<TransferItem[]>([]);
  productResults = signal<ProductSummary[]>([]);
  searchingProducts = signal(false);
  submitting = signal(false);

  productSearchTerm = '';
  private searchTimeout?: ReturnType<typeof setTimeout>;

  transferForm: FormGroup = this.fb.group({
    sourceLocationId: ['', Validators.required],
    destinationLocationId: ['', Validators.required],
    notes: ['']
  });

  totalQuantity = computed(() =>
    this.selectedItems().reduce((sum, item) => sum + item.quantity, 0)
  );

  ngOnInit(): void {
    this.loadLocations();
  }

  loadLocations(): void {
    this.inventoryService.getActiveLocations().subscribe({
      next: (response) => {
        if (response.data) {
          this.locations.set(response.data);
        }
      },
      error: () => {
        this.notificationService.error(
          this.translateService.instant('inventory.locationLoadError')
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
            // Filter out already selected products
            const selectedIds = this.selectedItems().map(i => i.product.id);
            const filtered = response.data.filter(p => !selectedIds.includes(p.id));
            this.productResults.set(filtered);
          }
          this.searchingProducts.set(false);
        },
        error: () => {
          this.searchingProducts.set(false);
        }
      });
    }, 300);
  }

  addProduct(product: ProductSummary): void {
    const current = this.selectedItems();
    this.selectedItems.set([...current, { product, quantity: 1 }]);
    this.productResults.set([]);
    this.productSearchTerm = '';
  }

  removeProduct(index: number): void {
    const current = this.selectedItems();
    current.splice(index, 1);
    this.selectedItems.set([...current]);
  }

  updateQuantity(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const quantity = Math.max(1, Math.min(parseInt(input.value) || 1, this.selectedItems()[index].product.stockQuantity));

    const current = this.selectedItems();
    current[index].quantity = quantity;
    this.selectedItems.set([...current]);
    input.value = quantity.toString();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.transferForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  onSubmit(): void {
    if (this.transferForm.invalid || this.selectedItems().length === 0) {
      Object.keys(this.transferForm.controls).forEach(key => {
        this.transferForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.submitting.set(true);

    const request: CreateStockTransferRequest = {
      sourceLocationId: +this.transferForm.value.sourceLocationId,
      destinationLocationId: +this.transferForm.value.destinationLocationId,
      items: this.selectedItems().map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      })),
      notes: this.transferForm.value.notes || undefined
    };

    this.inventoryService.createTransfer(request).subscribe({
      next: () => {
        this.notificationService.success(
          this.translateService.instant('inventory.transferCreated')
        );
        this.router.navigate(['/inventory/transfers']);
      },
      error: () => {
        this.notificationService.error(
          this.translateService.instant('inventory.transferCreateError')
        );
        this.submitting.set(false);
      }
    });
  }
}
