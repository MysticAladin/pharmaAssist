import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InventoryService } from '../../core/services/inventory.service';
import { NotificationService } from '../../core/services/notification.service';
import { StockLevel, InventoryFilters, Location } from '../../core/models/inventory.model';
import { PagedResponse } from '../../core/models/product.model';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { SearchInputComponent } from '../../shared/components/search-input/search-input.component';
import { BadgeVariant } from '../../shared/components/status-badge';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslateModule,
    PaginationComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    SearchInputComponent
  ],
  templateUrl: './inventory-list-component/inventory-list.component.html',
  styleUrls: ['./inventory-list-component/inventory-list.component.scss']
})
export class InventoryComponent implements OnInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);
  private readonly router = inject(Router);

  // State
  stockLevels = signal<StockLevel[]>([]);
  locations = signal<Location[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  pageSize = signal(20);
  totalItems = signal(0);

  // Filters
  searchTerm = '';
  selectedLocationId: number | null = null;
  showLowStockOnly = false;
  showExpiringSoonOnly = false;

  // Computed stats
  lowStockCount = computed(() => this.stockLevels().filter(s => s.isLowStock).length);
  expiringSoonCount = computed(() => this.stockLevels().filter(s => this.hasExpiringBatches(s)).length);
  totalProducts = computed(() => this.totalItems());

  ngOnInit(): void {
    this.loadLocations();
    this.loadStockLevels();
  }

  loadLocations(): void {
    this.inventoryService.getActiveLocations().subscribe({
      next: (response) => {
        if (response.data) {
          this.locations.set(response.data);
        }
      },
      error: () => {
        // Locations are optional, continue without them
      }
    });
  }

  loadStockLevels(): void {
    this.loading.set(true);

    const filters: InventoryFilters = {
      search: this.searchTerm || undefined,
      locationId: this.selectedLocationId || undefined,
      lowStockOnly: this.showLowStockOnly || undefined,
      expiringSoonOnly: this.showExpiringSoonOnly || undefined,
      page: this.currentPage(),
      pageSize: this.pageSize()
    };

    this.inventoryService.getStockLevels(filters).subscribe({
      next: (response: PagedResponse<StockLevel>) => {
        this.stockLevels.set(response.data);
        this.totalItems.set(response.totalCount);
        this.loading.set(false);
      },
      error: () => {
        this.notificationService.error(
          this.translateService.instant('inventory.loadError')
        );
        this.loading.set(false);
      }
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.currentPage.set(1);
    this.loadStockLevels();
  }

  onLocationChange(): void {
    this.currentPage.set(1);
    this.loadStockLevels();
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadStockLevels();
  }

  onPageChange(event: { page: number }): void {
    this.currentPage.set(event.page);
    this.loadStockLevels();
  }

  getStockStatus(stock: StockLevel): { variant: BadgeVariant; label: string } {
    if (stock.availableQuantity === 0) {
      return { variant: 'danger', label: 'inventory.outOfStock' };
    }
    if (stock.isLowStock) {
      return { variant: 'warning', label: 'inventory.lowStock' };
    }
    return { variant: 'success', label: 'inventory.inStock' };
  }

  hasExpiringBatches(stock: StockLevel): boolean {
    return stock.batches.some(b => b.isExpiringSoon && !b.isExpired);
  }

  getExpiringBatchCount(stock: StockLevel): number {
    return stock.batches.filter(b => b.isExpiringSoon && !b.isExpired).length;
  }

  viewProductDetails(productId: number): void {
    this.router.navigate(['/products', productId]);
  }

  adjustStock(stock: StockLevel): void {
    this.router.navigate(['/inventory/adjustments/new'], {
      queryParams: { productId: stock.productId }
    });
  }

  viewHistory(productId: number): void {
    this.router.navigate(['/inventory/adjustments'], {
      queryParams: { productId }
    });
  }
}
