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
  templateUrl: './product-detail-component/product-detail.component.html',
  styleUrls: ['./product-detail-component/product-detail.component.scss']
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

