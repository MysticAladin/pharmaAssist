import { Component, inject, signal, ViewChild, TemplateRef, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PriceListService } from '../../../core/services/price-list.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PriceListDetail, PriceListItem, PriceListType, PRICE_LIST_TYPE_LABELS } from '../../../core/models/price-list.model';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-price-list-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    DataTableComponent,
    StatusBadgeComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './price-list-detail.component.html'
})
export class PriceListDetailComponent implements OnInit, AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly priceListService = inject(PriceListService);
  private readonly notification = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  @ViewChild('priceTpl') priceTpl!: TemplateRef<unknown>;
  @ViewChild('itemActionsTpl') itemActionsTpl!: TemplateRef<unknown>;

  priceList = signal<PriceListDetail | null>(null);
  loading = signal(false);
  columns = signal<TableColumn[]>([]);

  // Delete item dialog
  showDeleteItemDialog = signal(false);
  deleteItemLoading = signal(false);
  selectedItem = signal<PriceListItem | null>(null);

  // Delete price list dialog
  showDeleteDialog = signal(false);
  deleteLoading = signal(false);

  private id!: number;

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
  }

  ngAfterViewInit(): void {
    this.columns.set([
      { key: 'productName', label: this.translate.instant('priceLists.product'), sortable: true },
      { key: 'productBarcode', label: this.translate.instant('priceLists.barcode'), sortable: true },
      { key: 'price', label: this.translate.instant('priceLists.price'), sortable: true, template: this.priceTpl, align: 'right' },
      { key: 'discountPercentage', label: this.translate.instant('priceLists.discount'), sortable: true, align: 'right' },
      { key: 'actions', label: this.translate.instant('common.actions'), template: this.itemActionsTpl, align: 'center' }
    ]);
    this.loadPriceList();
  }

  loadPriceList(): void {
    this.loading.set(true);
    this.priceListService.getPriceListById(this.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.priceList.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('priceLists.loadError'));
        this.loading.set(false);
      }
    });
  }

  getTypeLabel(type: PriceListType): string {
    return PRICE_LIST_TYPE_LABELS[type] || 'Unknown';
  }

  openDeleteItemDialog(item: PriceListItem): void {
    this.selectedItem.set(item);
    this.showDeleteItemDialog.set(true);
  }

  confirmDeleteItem(): void {
    const item = this.selectedItem();
    if (!item) return;

    this.deleteItemLoading.set(true);
    this.priceListService.deleteItem(this.id, item.id).subscribe({
      next: () => {
        this.notification.success(this.translate.instant('priceLists.itemDeleteSuccess'));
        this.showDeleteItemDialog.set(false);
        this.deleteItemLoading.set(false);
        this.loadPriceList();
      },
      error: () => {
        this.notification.error(this.translate.instant('priceLists.itemDeleteError'));
        this.deleteItemLoading.set(false);
      }
    });
  }

  openDeleteDialog(): void {
    this.showDeleteDialog.set(true);
  }

  confirmDelete(): void {
    this.deleteLoading.set(true);
    this.priceListService.deletePriceList(this.id).subscribe({
      next: () => {
        this.notification.success(this.translate.instant('priceLists.deleteSuccess'));
        this.router.navigate(['/price-lists']);
      },
      error: () => {
        this.notification.error(this.translate.instant('priceLists.deleteError'));
        this.deleteLoading.set(false);
      }
    });
  }
}
