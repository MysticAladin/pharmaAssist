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
  startDateText = '';
  endDateText = '';
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

  onStartDateTextChange(value: string): void {
    this.startDateText = value;
  }

  onEndDateTextChange(value: string): void {
    this.endDateText = value;
  }

  onStartDateBlur(): void {
    this.normalizeStartDate();
    this.applyFilters();
  }

  onEndDateBlur(): void {
    this.normalizeEndDate();
    this.applyFilters();
  }

  onNativeStartDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.value) {
      this.startDate = '';
      this.startDateText = '';
      this.applyFilters();
      return;
    }

    this.startDate = input.value;
    this.startDateText = this.isoToEuDate(input.value);
    this.applyFilters();
  }

  onNativeEndDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.value) {
      this.endDate = '';
      this.endDateText = '';
      this.applyFilters();
      return;
    }

    this.endDate = input.value;
    this.endDateText = this.isoToEuDate(input.value);
    this.applyFilters();
  }

  private normalizeStartDate(): void {
    const trimmed = (this.startDateText ?? '').trim();
    if (!trimmed) {
      this.startDate = '';
      this.startDateText = '';
      return;
    }
    const iso = this.euToIsoDate(trimmed);
    this.startDate = iso ?? '';
    this.startDateText = iso ? this.isoToEuDate(iso) : this.startDateText;
  }

  private normalizeEndDate(): void {
    const trimmed = (this.endDateText ?? '').trim();
    if (!trimmed) {
      this.endDate = '';
      this.endDateText = '';
      return;
    }
    const iso = this.euToIsoDate(trimmed);
    this.endDate = iso ?? '';
    this.endDateText = iso ? this.isoToEuDate(iso) : this.endDateText;
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
    this.startDateText = '';
    this.endDateText = '';
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

  private isoToEuDate(value: string): string {
    if (!value) return '';
    const m = value.match(/^\d{4}-\d{2}-\d{2}$/);
    if (m) {
      const [y, mo, d] = value.split('-');
      return `${d}.${mo}.${y}`;
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    return `${dd}.${mm}.${yyyy}`;
  }

  private euToIsoDate(value: string | null | undefined): string | null {
    const v = (value ?? '').trim();
    if (!v) return null;

    const match = v.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
    if (!match) return null;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null;

    // Validate using UTC to avoid timezone shifts
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null;
    }
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }
}
