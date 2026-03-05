import { Component, inject, signal, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { PriceListService } from '../../../core/services/price-list.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PriceList, PriceListType, PRICE_LIST_TYPE_LABELS, PriceListFilters } from '../../../core/models/price-list.model';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { PaginationComponent, PageEvent } from '../../../shared/components/pagination/pagination.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-price-list-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    FormsModule,
    DataTableComponent,
    PaginationComponent,
    StatusBadgeComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './price-list-list.component.html'
})
export class PriceListListComponent implements AfterViewInit {
  private readonly priceListService = inject(PriceListService);
  private readonly notification = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  @ViewChild('typeTpl') typeTpl!: TemplateRef<unknown>;
  @ViewChild('dateTpl') dateTpl!: TemplateRef<unknown>;
  @ViewChild('activeTpl') activeTpl!: TemplateRef<unknown>;
  @ViewChild('actionsTpl') actionsTpl!: TemplateRef<unknown>;

  priceLists = signal<PriceList[]>([]);
  columns = signal<TableColumn[]>([]);
  loading = signal(false);
  page = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);

  filters = signal<PriceListFilters>({ page: 1, pageSize: 10 });

  // Delete dialog
  showDeleteDialog = signal(false);
  deleteLoading = signal(false);
  selectedPriceList = signal<PriceList | null>(null);

  priceListTypes = Object.entries(PRICE_LIST_TYPE_LABELS).map(([key, label]) => ({
    value: Number(key) as PriceListType,
    label
  }));

  ngAfterViewInit(): void {
    this.columns.set([
      { key: 'name', label: this.translate.instant('priceLists.name'), sortable: true },
      { key: 'type', label: this.translate.instant('priceLists.type'), sortable: true, template: this.typeTpl },
      { key: 'effectiveFrom', label: this.translate.instant('priceLists.effectiveDate'), sortable: true, template: this.dateTpl },
      { key: 'isActive', label: this.translate.instant('priceLists.status'), template: this.activeTpl },
      { key: 'itemCount', label: this.translate.instant('priceLists.itemCount'), sortable: true, align: 'right' },
      { key: 'actions', label: this.translate.instant('common.actions'), template: this.actionsTpl, align: 'center' }
    ]);
    this.loadPriceLists();
  }

  loadPriceLists(): void {
    this.loading.set(true);
    const f: PriceListFilters = {
      ...this.filters(),
      page: this.page(),
      pageSize: this.pageSize()
    };
    this.priceListService.getPriceLists(f).subscribe({
      next: (response) => {
        this.priceLists.set(response.data);
        this.totalItems.set(response.totalCount);
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('priceLists.loadError'));
        this.loading.set(false);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.page);
    this.pageSize.set(event.pageSize);
    this.loadPriceLists();
  }

  onSearch(value: string): void {
    this.filters.update(f => ({ ...f, search: value || undefined }));
    this.page.set(1);
    this.loadPriceLists();
  }

  onTypeFilter(value: string): void {
    this.filters.update(f => ({ ...f, type: value ? Number(value) as PriceListType : undefined }));
    this.page.set(1);
    this.loadPriceLists();
  }

  onActiveFilter(value: string): void {
    this.filters.update(f => ({ ...f, activeOnly: value ? value === 'true' : undefined }));
    this.page.set(1);
    this.loadPriceLists();
  }

  onRowClick(row: PriceList): void {
    this.router.navigate(['/price-lists', row.id]);
  }

  openDeleteDialog(priceList: PriceList): void {
    this.selectedPriceList.set(priceList);
    this.showDeleteDialog.set(true);
  }

  confirmDelete(): void {
    const pl = this.selectedPriceList();
    if (!pl) return;

    this.deleteLoading.set(true);
    this.priceListService.deletePriceList(pl.id).subscribe({
      next: () => {
        this.notification.success(this.translate.instant('priceLists.deleteSuccess'));
        this.showDeleteDialog.set(false);
        this.deleteLoading.set(false);
        this.loadPriceLists();
      },
      error: () => {
        this.notification.error(this.translate.instant('priceLists.deleteError'));
        this.deleteLoading.set(false);
      }
    });
  }

  getTypeLabel(type: PriceListType): string {
    return PRICE_LIST_TYPE_LABELS[type] || 'Unknown';
  }
}
