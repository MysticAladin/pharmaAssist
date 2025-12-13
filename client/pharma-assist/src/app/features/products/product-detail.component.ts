import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    StatusBadgeComponent,
    LoadingSkeletonComponent,
    ConfirmDialogComponent
  ],
  template: `
    <div class="product-detail-page">
      <!-- Breadcrumb -->
      <nav class="breadcrumb">
        <a routerLink="/products" class="breadcrumb-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          {{ 'products.title' | translate }}
        </a>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-current">{{ product()?.name || 'Loading...' }}</span>
      </nav>

      @if (loading()) {
        <div class="loading-container">
          <div class="detail-card">
            <app-loading-skeleton type="rect" skeletonHeight="200px"></app-loading-skeleton>
          </div>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="m15 9-6 6M9 9l6 6"/>
          </svg>
          <h2>{{ 'common.error' | translate }}</h2>
          <p>{{ error() }}</p>
          <button class="btn btn-primary" routerLink="/products">
            {{ 'common.back' | translate }}
          </button>
        </div>
      } @else if (product()) {
        <!-- Page Header -->
        <div class="page-header">
          <div class="header-content">
            <div class="product-header">
              @if (product()?.imageUrl) {
                <img [src]="product()?.imageUrl" [alt]="product()?.name" class="product-image" />
              } @else {
                <div class="product-image-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="m21 15-5-5L5 21"/>
                  </svg>
                </div>
              }
              <div class="product-title-section">
                <h1 class="page-title">{{ product()?.name }}</h1>
                <p class="product-sku">SKU: {{ product()?.sku }}</p>
                <div class="product-badges">
                  <app-status-badge
                    [label]="product()?.isActive ? 'products.status.active' : 'products.status.inactive'"
                    [variant]="product()?.isActive ? 'success' : 'neutral'"
                    [shouldTranslate]="true"
                    [dot]="true"
                  ></app-status-badge>
                  @if (product()?.requiresPrescription) {
                    <app-status-badge
                      label="products.prescription.required"
                      variant="warning"
                      [shouldTranslate]="true"
                    ></app-status-badge>
                  }
                  @if (product()?.isControlled) {
                    <app-status-badge
                      label="Controlled"
                      variant="danger"
                    ></app-status-badge>
                  }
                </div>
              </div>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn btn-secondary" (click)="editProduct()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              {{ 'common.edit' | translate }}
            </button>
            <button class="btn btn-danger-outline" (click)="confirmDelete()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              {{ 'common.delete' | translate }}
            </button>
          </div>
        </div>

        <!-- Detail Cards -->
        <div class="detail-grid">
          <!-- Basic Information -->
          <div class="detail-card">
            <h3 class="card-title">Basic Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Name</span>
                <span class="info-value">{{ product()?.name }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Local Name</span>
                <span class="info-value">{{ product()?.nameLocal || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Generic Name</span>
                <span class="info-value">{{ product()?.genericName || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">SKU</span>
                <span class="info-value">{{ product()?.sku }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Barcode</span>
                <span class="info-value">{{ product()?.barcode || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">ATC Code</span>
                <span class="info-value">{{ product()?.atcCode || '-' }}</span>
              </div>
            </div>
          </div>

          <!-- Classification -->
          <div class="detail-card">
            <h3 class="card-title">Classification</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Category</span>
                <span class="info-value">{{ product()?.categoryName || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Manufacturer</span>
                <span class="info-value">{{ product()?.manufacturerName || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Dosage Form</span>
                <span class="info-value">{{ product()?.dosageForm || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Strength</span>
                <span class="info-value">{{ product()?.strength || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Package Size</span>
                <span class="info-value">{{ product()?.packageSize || '-' }}</span>
              </div>
            </div>
          </div>

          <!-- Pricing -->
          <div class="detail-card">
            <h3 class="card-title">Pricing</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Unit Price</span>
                <span class="info-value price">{{ product()?.unitPrice | currency:'BAM ':'symbol':'1.2-2' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Cost Price</span>
                <span class="info-value">{{ product()?.costPrice ? (product()?.costPrice | currency:'BAM ':'symbol':'1.2-2') : '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Tax Rate</span>
                <span class="info-value">{{ product()?.taxRate }}%</span>
              </div>
              <div class="info-item">
                <span class="info-label">Margin</span>
                <span class="info-value">{{ calculateMargin() }}</span>
              </div>
            </div>
          </div>

          <!-- Inventory -->
          <div class="detail-card">
            <h3 class="card-title">Inventory</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Stock Quantity</span>
                <span class="info-value" [class.stock-low]="isLowStock()">
                  {{ product()?.stockQuantity }}
                  @if (isLowStock()) {
                    <span class="low-stock-badge">Low Stock</span>
                  }
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Reorder Level</span>
                <span class="info-value">{{ product()?.reorderLevel }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Reorder Quantity</span>
                <span class="info-value">{{ product()?.reorderQuantity }}</span>
              </div>
            </div>
          </div>

          <!-- Description -->
          @if (product()?.description) {
            <div class="detail-card full-width">
              <h3 class="card-title">Description</h3>
              <p class="description-text">{{ product()?.description }}</p>
              @if (product()?.descriptionLocal) {
                <p class="description-text description-local">{{ product()?.descriptionLocal }}</p>
              }
            </div>
          }
        </div>
      }

      <!-- Delete Confirmation Dialog -->
      <app-confirm-dialog
        [open]="showDeleteDialog()"
        [title]="'products.deleteProduct'"
        [message]="'products.deleteConfirmation'"
        [confirmText]="'common.delete'"
        [cancelText]="'common.cancel'"
        type="danger"
        [isLoading]="deleting()"
        (openChange)="showDeleteDialog.set($event)"
        (confirm)="deleteProduct()"
        (cancel)="showDeleteDialog.set(false)"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    .product-detail-page {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
      font-size: 14px;
    }

    .breadcrumb-link {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--primary);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .breadcrumb-separator {
      color: var(--text-muted);
    }

    .breadcrumb-current {
      color: var(--text-secondary);
    }

    .loading-container, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
    }

    .error-state svg {
      color: var(--text-muted);
      margin-bottom: 16px;
    }

    .error-state h2 {
      margin: 0 0 8px;
      color: var(--text);
    }

    .error-state p {
      margin: 0 0 24px;
      color: var(--text-secondary);
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      gap: 24px;
      flex-wrap: wrap;
    }

    .product-header {
      display: flex;
      gap: 20px;
      align-items: flex-start;
    }

    .product-image {
      width: 100px;
      height: 100px;
      border-radius: 12px;
      object-fit: cover;
    }

    .product-image-placeholder {
      width: 100px;
      height: 100px;
      border-radius: 12px;
      background: var(--surface-alt, #f8fafc);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
    }

    .product-title-section {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .page-title {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: var(--text);
    }

    .product-sku {
      margin: 0;
      font-size: 14px;
      color: var(--text-muted);
      font-family: monospace;
    }

    .product-badges {
      display: flex;
      gap: 8px;
      margin-top: 8px;
      flex-wrap: wrap;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.15s;
    }

    .btn-primary {
      background: var(--primary);
      color: white;

      &:hover {
        background: var(--primary-dark);
      }
    }

    .btn-secondary {
      background: var(--surface);
      color: var(--text);
      border: 1px solid var(--border);

      &:hover {
        background: var(--surface-hover);
      }
    }

    .btn-danger-outline {
      background: transparent;
      color: var(--color-error-dark);
      border: 1px solid #dc2626;

      &:hover {
        background: var(--color-error-bg);
      }
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .detail-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;

      &.full-width {
        grid-column: 1 / -1;
      }
    }

    .card-title {
      margin: 0 0 16px;
      font-size: 16px;
      font-weight: 600;
      color: var(--text);
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-size: 14px;
      color: var(--text);

      &.price {
        font-weight: 600;
        font-size: 16px;
        color: var(--primary);
      }

      &.stock-low {
        color: var(--color-error-dark);
        font-weight: 500;
      }
    }

    .low-stock-badge {
      display: inline-block;
      background: var(--color-error-bg);
      color: var(--color-error-dark);
      font-size: 11px;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 9999px;
      margin-left: 8px;
    }

    .description-text {
      margin: 0;
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .description-local {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--border);
      font-style: italic;
    }

    @media (max-width: 768px) {
      .detail-grid {
        grid-template-columns: 1fr;
      }

      .page-header {
        flex-direction: column;
      }

      .header-actions {
        width: 100%;
      }

      .btn {
        flex: 1;
        justify-content: center;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProductDetailComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  product = signal<Product | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  showDeleteDialog = signal(false);
  deleting = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(+id);
    }
  }

  loadProduct(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.productService.getById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.product.set(response.data);
        } else {
          this.error.set(response.message || 'Product not found');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading product:', err);
        this.error.set('Failed to load product');
        this.loading.set(false);
      }
    });
  }

  editProduct(): void {
    const id = this.product()?.id;
    if (id) {
      this.router.navigate(['/products', id, 'edit']);
    }
  }

  confirmDelete(): void {
    this.showDeleteDialog.set(true);
  }

  deleteProduct(): void {
    const id = this.product()?.id;
    if (!id) return;

    this.deleting.set(true);
    this.productService.delete(id).subscribe({
      next: () => {
        this.showDeleteDialog.set(false);
        this.deleting.set(false);
        this.router.navigate(['/products']);
      },
      error: (err) => {
        console.error('Error deleting product:', err);
        this.deleting.set(false);
      }
    });
  }

  isLowStock(): boolean {
    const p = this.product();
    return p ? p.stockQuantity <= p.reorderLevel : false;
  }

  calculateMargin(): string {
    const p = this.product();
    if (!p || !p.costPrice || p.costPrice === 0) return '-';
    const margin = ((p.unitPrice - p.costPrice) / p.unitPrice) * 100;
    return `${margin.toFixed(1)}%`;
  }
}

