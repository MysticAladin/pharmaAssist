import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InventoryService } from '../../core/services/inventory.service';
import { NotificationService } from '../../core/services/notification.service';
import { InventoryStock, InventoryFilters, Location } from '../../core/models/inventory.model';
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
  stockLevels = signal<InventoryStock[]>([]);
  locations = signal<Location[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  pageSize = signal(20);
  totalItems = signal(0);

  // Filters
  searchTerm = '';
  selectedLocationId: number | null = null;
  showLowStockOnly = false;

  // Computed stats
  lowStockCount = computed(() => this.stockLevels().filter(s => s.isLowStock).length);
  totalProducts = computed(() => this.totalItems());

  ngOnInit(): void {
    this.loadLocations();
  }

  loadLocations(): void {
    this.inventoryService.getActiveLocations().subscribe({
      next: (response) => {
        if (response.data) {
          const allLocations = response.data;
          this.locations.set(allLocations);

          if (!this.selectedLocationId) {
            const defaultLocation = allLocations.find(l => l.isDefault) ?? allLocations[0];
            this.selectedLocationId = defaultLocation?.id ?? null;
          }

          this.loadStockLevels();
        }
      },
      error: () => {
        // Locations are optional, continue without them
        this.loadStockLevels();
      }
    });
  }

  loadStockLevels(): void {
    this.loading.set(true);

    if (!this.selectedLocationId) {
      // Backend currently returns empty result unless a warehouse is selected.
      this.stockLevels.set([]);
      this.totalItems.set(0);
      this.loading.set(false);
      return;
    }

    const filters: InventoryFilters = {
      search: this.searchTerm || undefined,
      locationId: this.selectedLocationId || undefined,
      lowStockOnly: this.showLowStockOnly || undefined,
      page: this.currentPage(),
      pageSize: this.pageSize()
    };

    this.inventoryService.getStockLevels(filters).subscribe({
      next: (response: PagedResponse<InventoryStock>) => {
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

  getStockStatus(stock: InventoryStock): { variant: BadgeVariant; label: string } {
    if (stock.quantityAvailable === 0) {
      return { variant: 'danger', label: 'inventory.outOfStock' };
    }
    if (stock.isLowStock) {
      return { variant: 'warning', label: 'inventory.lowStock' };
    }
    return { variant: 'success', label: 'inventory.inStock' };
  }

  viewProductDetails(productId: number): void {
    this.router.navigate(['/products', productId]);
  }

  adjustStock(stock: InventoryStock): void {
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
