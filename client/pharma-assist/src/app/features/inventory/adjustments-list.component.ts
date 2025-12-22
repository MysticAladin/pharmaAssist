import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InventoryService } from '../../core/services/inventory.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  StockAdjustment,
  AdjustmentFilters,
  AdjustmentType,
  getAdjustmentTypeColor,
  getAdjustmentTypeLabel
} from '../../core/models/inventory.model';
import { PagedResponse } from '../../core/models/product.model';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { BadgeVariant } from '../../shared/components/status-badge';
import { EuropeanDatePipe } from '../../core/pipes';

@Component({
  selector: 'app-adjustments-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslateModule,
    PaginationComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    EuropeanDatePipe
  ],
  templateUrl: './adjustments-list-component/adjustments-list.component.html',
  styleUrls: ['./adjustments-list-component/adjustments-list.component.scss']
})
export class AdjustmentsListComponent implements OnInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);

  // State
  adjustments = signal<StockAdjustment[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  pageSize = signal(20);
  totalItems = signal(0);

  // Filters
  selectedType: AdjustmentType | null = null;
  startDate = '';
  endDate = '';
  productId: number | null = null;

  adjustmentTypes: AdjustmentType[] = ['addition', 'removal', 'correction', 'damaged', 'expired', 'returned'];

  ngOnInit(): void {
    // Check for pre-selected product from query params
    const productIdParam = this.route.snapshot.queryParams['productId'];
    if (productIdParam) {
      this.productId = +productIdParam;
    }

    this.loadAdjustments();
  }

  loadAdjustments(): void {
    this.loading.set(true);

    const filters: AdjustmentFilters = {
      productId: this.productId || undefined,
      adjustmentType: this.selectedType || undefined,
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined,
      page: this.currentPage(),
      pageSize: this.pageSize()
    };

    this.inventoryService.getAdjustments(filters).subscribe({
      next: (response: PagedResponse<StockAdjustment>) => {
        this.adjustments.set(response.data);
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

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadAdjustments();
  }

  clearFilters(): void {
    this.selectedType = null;
    this.startDate = '';
    this.endDate = '';
    this.productId = null;
    this.applyFilters();
  }

  hasFilters(): boolean {
    return !!(this.selectedType || this.startDate || this.endDate || this.productId);
  }

  onPageChange(event: { page: number }): void {
    this.currentPage.set(event.page);
    this.loadAdjustments();
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

  getTypeColor(type: AdjustmentType): BadgeVariant {
    return getAdjustmentTypeColor(type);
  }

  isAdditionType(type: AdjustmentType): boolean {
    return ['addition', 'returned'].includes(type);
  }
}
