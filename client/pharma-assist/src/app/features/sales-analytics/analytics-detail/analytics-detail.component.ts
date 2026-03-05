import { Component, inject, signal, computed, OnInit, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { SalesAnalyticsService } from '../../../core/services/sales-analytics.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  SalesAnalyticsFilter,
  SalesByInstitution,
  SalesByInstitutionType,
  SalesByRegion,
  SalesByProduct,
  SalesByBrand,
  SalesByRep,
  SalesTrend
} from '../../../core/models/wholesaler.model';
import { ApiResponse } from '../../../core/models/product.model';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-analytics-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    DataTableComponent
  ],
  templateUrl: './analytics-detail.component.html'
})
export class AnalyticsDetailComponent implements OnInit, AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly analyticsService = inject(SalesAnalyticsService);
  private readonly notification = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  @ViewChild('amountTpl') amountTpl!: TemplateRef<unknown>;
  @ViewChild('percentTpl') percentTpl!: TemplateRef<unknown>;
  @ViewChild('numberTpl') numberTpl!: TemplateRef<unknown>;

  viewType = signal<string>('');
  loading = signal(false);
  data = signal<unknown[]>([]);
  columns = signal<TableColumn[]>([]);
  filter = signal<SalesAnalyticsFilter>({});

  viewTitle = computed(() => {
    const view = this.viewType();
    return this.translate.instant(`salesAnalytics.by${view.charAt(0).toUpperCase() + view.slice(1)}Title`);
  });

  ngOnInit(): void {
    const view = this.route.snapshot.data['view'] as string;
    this.viewType.set(view);
  }

  ngAfterViewInit(): void {
    this.setupColumns();
    this.loadData();
  }

  setupColumns(): void {
    const view = this.viewType();
    switch (view) {
      case 'institution':
        this.columns.set([
          { key: 'institutionName', label: this.translate.instant('salesAnalytics.institution'), sortable: true },
          { key: 'institutionType', label: this.translate.instant('salesAnalytics.type'), sortable: true },
          { key: 'totalAmount', label: this.translate.instant('salesAnalytics.amount'), sortable: true, template: this.amountTpl, align: 'right' },
          { key: 'totalQuantity', label: this.translate.instant('salesAnalytics.quantity'), sortable: true, template: this.numberTpl, align: 'right' },
          { key: 'percentOfTotal', label: this.translate.instant('salesAnalytics.percentOfTotal'), sortable: true, template: this.percentTpl, align: 'right' }
        ]);
        break;
      case 'region':
        this.columns.set([
          { key: 'cantonName', label: this.translate.instant('salesAnalytics.region'), sortable: true },
          { key: 'totalAmount', label: this.translate.instant('salesAnalytics.amount'), sortable: true, template: this.amountTpl, align: 'right' },
          { key: 'totalQuantity', label: this.translate.instant('salesAnalytics.quantity'), sortable: true, template: this.numberTpl, align: 'right' },
          { key: 'customerCount', label: this.translate.instant('salesAnalytics.customers'), sortable: true, template: this.numberTpl, align: 'right' },
          { key: 'percentOfTotal', label: this.translate.instant('salesAnalytics.percentOfTotal'), sortable: true, template: this.percentTpl, align: 'right' }
        ]);
        break;
      case 'product':
        this.columns.set([
          { key: 'productName', label: this.translate.instant('salesAnalytics.product'), sortable: true },
          { key: 'productBarcode', label: this.translate.instant('salesAnalytics.barcode'), sortable: true },
          { key: 'totalAmount', label: this.translate.instant('salesAnalytics.amount'), sortable: true, template: this.amountTpl, align: 'right' },
          { key: 'totalQuantity', label: this.translate.instant('salesAnalytics.quantity'), sortable: true, template: this.numberTpl, align: 'right' },
          { key: 'customerCount', label: this.translate.instant('salesAnalytics.customers'), sortable: true, template: this.numberTpl, align: 'right' }
        ]);
        break;
      case 'brand':
        this.columns.set([
          { key: 'brandName', label: this.translate.instant('salesAnalytics.brand'), sortable: true },
          { key: 'totalAmount', label: this.translate.instant('salesAnalytics.amount'), sortable: true, template: this.amountTpl, align: 'right' },
          { key: 'totalQuantity', label: this.translate.instant('salesAnalytics.quantity'), sortable: true, template: this.numberTpl, align: 'right' },
          { key: 'productCount', label: this.translate.instant('salesAnalytics.products'), sortable: true, template: this.numberTpl, align: 'right' },
          { key: 'percentOfTotal', label: this.translate.instant('salesAnalytics.percentOfTotal'), sortable: true, template: this.percentTpl, align: 'right' }
        ]);
        break;
      case 'rep':
        this.columns.set([
          { key: 'repName', label: this.translate.instant('salesAnalytics.rep'), sortable: true },
          { key: 'totalAmount', label: this.translate.instant('salesAnalytics.amount'), sortable: true, template: this.amountTpl, align: 'right' },
          { key: 'totalQuantity', label: this.translate.instant('salesAnalytics.quantity'), sortable: true, template: this.numberTpl, align: 'right' },
          { key: 'customerCount', label: this.translate.instant('salesAnalytics.customers'), sortable: true, template: this.numberTpl, align: 'right' },
          { key: 'productCount', label: this.translate.instant('salesAnalytics.products'), sortable: true, template: this.numberTpl, align: 'right' }
        ]);
        break;
      case 'trends':
        this.columns.set([
          { key: 'period', label: this.translate.instant('salesAnalytics.period'), sortable: true },
          { key: 'totalAmount', label: this.translate.instant('salesAnalytics.amount'), sortable: true, template: this.amountTpl, align: 'right' },
          { key: 'totalQuantity', label: this.translate.instant('salesAnalytics.quantity'), sortable: true, template: this.numberTpl, align: 'right' },
          { key: 'recordCount', label: this.translate.instant('salesAnalytics.invoices'), sortable: true, template: this.numberTpl, align: 'right' }
        ]);
        break;
    }
  }

  loadData(): void {
    this.loading.set(true);
    const view = this.viewType();
    const f = this.filter();

    let obs: Observable<ApiResponse<unknown[]>>;
    switch (view) {
      case 'institution':
        obs = this.analyticsService.getSalesByInstitution(f);
        break;
      case 'region':
        obs = this.analyticsService.getSalesByRegion(f);
        break;
      case 'product':
        obs = this.analyticsService.getSalesByProduct(f);
        break;
      case 'brand':
        obs = this.analyticsService.getSalesByBrand(f);
        break;
      case 'rep':
        obs = this.analyticsService.getSalesByRep(f);
        break;
      case 'trends':
        obs = this.analyticsService.getSalesTrend(f);
        break;
      default:
        this.loading.set(false);
        return;
    }

    obs.subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.data.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('salesAnalytics.loadError'));
        this.loading.set(false);
      }
    });
  }

  onDateFromChange(value: string): void {
    this.filter.update(f => ({ ...f, dateFrom: value || undefined }));
    this.loadData();
  }

  onDateToChange(value: string): void {
    this.filter.update(f => ({ ...f, dateTo: value || undefined }));
    this.loadData();
  }
}
