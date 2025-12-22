import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';
import { SearchInputComponent } from '../../shared/components/search-input/search-input.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-low-stock',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    TranslateModule,
    SearchInputComponent,
    StatusBadgeComponent,
    EmptyStateComponent
  ],
  templateUrl: './low-stock-component/low-stock.component.html',
  styleUrls: ['./low-stock-component/low-stock.component.scss']
})
export class LowStockComponent implements OnInit {
  private readonly productService = inject(ProductService);

  // State
  loading = signal(true);
  products = signal<Product[]>([]);
  searchTerm = '';
  selectedSeverity = 'all';
  threshold = 10;
  sortColumn = signal('stockQuantity');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Computed values
  filteredProducts = computed(() => {
    let result = this.products();

    // Filter by search
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.nameLocal.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term)
      );
    }

    // Filter by severity
    if (this.selectedSeverity !== 'all') {
      result = result.filter(p => this.getStockLevel(p) === this.selectedSeverity);
    }

    // Sort
    const column = this.sortColumn();
    const direction = this.sortDirection();
    result = [...result].sort((a, b) => {
      const aVal = a[column as keyof Product];
      const bVal = b[column as keyof Product];
      const modifier = direction === 'asc' ? 1 : -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * modifier;
      }
      return ((aVal as number) - (bVal as number)) * modifier;
    });

    return result;
  });

  criticalCount = computed(() =>
    this.products().filter(p => p.stockQuantity === 0 || p.stockQuantity <= p.reorderLevel * 0.5).length
  );

  warningCount = computed(() =>
    this.products().filter(p => p.stockQuantity > p.reorderLevel * 0.5 && p.stockQuantity <= p.reorderLevel).length
  );

  pendingOrdersCount = signal(0); // Would be fetched from orders service
  totalLowStock = computed(() => this.products().length);

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.productService.getLowStock(this.threshold).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.products.set(response.data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading low stock products:', err);
        this.loading.set(false);
      }
    });
  }

  getStockLevel(product: Product): 'critical' | 'warning' {
    if (product.stockQuantity === 0 || product.stockQuantity <= product.reorderLevel * 0.5) {
      return 'critical';
    }
    return 'warning';
  }

  onSearch(term: string): void {
    this.searchTerm = term;
  }

  applyFilters(): void {
    // Triggers computed recalculation
  }

  sortBy(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  calculateReorderValue(): number {
    return this.filteredProducts().reduce((total, product) => {
      const reorderQty = Math.max(0, product.reorderLevel - product.stockQuantity + product.reorderQuantity);
      return total + (reorderQty * (product.costPrice || product.unitPrice));
    }, 0);
  }

  reorderProduct(product: Product): void {
    // Navigate to create purchase order or show reorder dialog
    console.log('Reorder product:', product.id);
  }

  exportReport(): void {
    // Export low stock report
    console.log('Exporting low stock report...');
  }
}
