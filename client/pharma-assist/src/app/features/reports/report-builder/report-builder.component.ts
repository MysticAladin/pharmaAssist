import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ReportService } from '../../../core/services/report.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  ReportBuilderDataSource,
  ReportBuilderConfig,
  ReportBuilderExecuteRequest,
  ReportBuilderResult,
  AvailableField,
  ReportColumnConfig,
  ReportFilterConfig,
  ReportSortConfig,
  FilterOperator,
  ReportColumnType,
  ReportFormat
} from '../../../core/models/report.model';

@Component({
  selector: 'app-report-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './report-builder-component/report-builder.component.html',
  styleUrls: ['./report-builder-component/report-builder.component.scss']
})
export class ReportBuilderComponent implements OnInit {
  private reportService = inject(ReportService);
  private notification = inject(NotificationService);
  private translate = inject(TranslateService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Expose enums for template
  readonly FilterOperator = FilterOperator;
  readonly ReportFormat = ReportFormat;

  // Data sources
  readonly dataSources = [
    { value: ReportBuilderDataSource.Orders, labelKey: 'reports.builder.dataSources.orders', icon: 'icon-shopping-cart' },
    { value: ReportBuilderDataSource.Products, labelKey: 'reports.builder.dataSources.products', icon: 'icon-package' },
    { value: ReportBuilderDataSource.Customers, labelKey: 'reports.builder.dataSources.customers', icon: 'icon-users' },
    { value: ReportBuilderDataSource.OrderItems, labelKey: 'reports.builder.dataSources.orderItems', icon: 'icon-list' },
    { value: ReportBuilderDataSource.SalesAnalytics, labelKey: 'reports.builder.dataSources.salesAnalytics', icon: 'icon-trending-up' }
  ];

  // State
  loading = signal(false);
  selectedDataSource = signal<ReportBuilderDataSource | null>(null);
  availableFields = signal<AvailableField[]>([]);
  selectedColumns = signal<ReportColumnConfig[]>([]);
  filters = signal<ReportFilterConfig[]>([]);
  result = signal<ReportBuilderResult | null>(null);
  currentPage = signal(1);
  currentSort = signal<ReportSortConfig | null>(null);

  // Form fields
  configName = '';
  configDescription = '';
  startDateStr = '';
  endDateStr = '';

  // Computed config
  config = computed<ReportBuilderConfig>(() => ({
    name: this.configName,
    description: this.configDescription,
    dataSource: this.selectedDataSource() || ReportBuilderDataSource.Orders,
    columns: this.selectedColumns(),
    filters: this.filters(),
    sortBy: this.currentSort() ? [this.currentSort()!] : [],
    groupBy: [],
    isShared: false
  }));

  ngOnInit(): void {
    // Set default dates (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    this.startDateStr = start.toISOString().split('T')[0];
    this.endDateStr = end.toISOString().split('T')[0];

    // Check for saved report ID in route
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSavedReport(parseInt(id));
    }
  }

  selectDataSource(ds: ReportBuilderDataSource): void {
    if (this.selectedDataSource() === ds) return;

    this.selectedDataSource.set(ds);
    this.selectedColumns.set([]);
    this.result.set(null);

    this.reportService.getDataSourceFields(ds).subscribe({
      next: (response) => {
        this.availableFields.set(response.fields);
        // Select first 5 columns by default
        const defaultColumns = response.fields.slice(0, 5).map((f, i) => ({
          field: f.field,
          label: f.label,
          type: f.type,
          visible: true,
          order: i
        }));
        this.selectedColumns.set(defaultColumns);
      },
      error: () => {
        this.notification.error(this.translate.instant('reports.builder.loadFieldsError'));
      }
    });
  }

  isColumnSelected(field: string): boolean {
    return this.selectedColumns().some(c => c.field === field);
  }

  toggleColumn(field: AvailableField): void {
    const current = this.selectedColumns();
    const exists = current.find(c => c.field === field.field);

    if (exists) {
      this.selectedColumns.set(current.filter(c => c.field !== field.field));
    } else {
      this.selectedColumns.set([...current, {
        field: field.field,
        label: field.label,
        type: field.type,
        visible: true,
        order: current.length
      }]);
    }
  }

  addFilter(): void {
    const fields = this.availableFields();
    if (fields.length === 0) return;

    this.filters.set([...this.filters(), {
      field: fields[0].field,
      operator: FilterOperator.Equals,
      value: ''
    }]);
  }

  removeFilter(index: number): void {
    this.filters.set(this.filters().filter((_, i) => i !== index));
  }

  sortBy(field: string): void {
    const current = this.currentSort();
    if (current?.field === field) {
      this.currentSort.set({ field, descending: !current.descending });
    } else {
      this.currentSort.set({ field, descending: false });
    }
    this.runReport();
  }

  runReport(): void {
    if (!this.selectedDataSource()) {
      this.notification.warning(this.translate.instant('reports.builder.selectDataSource'));
      return;
    }

    this.loading.set(true);

    const request: ReportBuilderExecuteRequest = {
      config: this.config(),
      startDate: this.startDateStr ? new Date(this.startDateStr) : undefined,
      endDate: this.endDateStr ? new Date(this.endDateStr) : undefined,
      page: this.currentPage(),
      pageSize: 50,
      exportFormat: ReportFormat.Csv
    };

    this.reportService.executeReportBuilder(request).subscribe({
      next: (result) => {
        this.result.set(result);
        this.loading.set(false);
        if (!result.success) {
          this.notification.error(result.message || 'Error generating report');
        }
      },
      error: () => {
        this.loading.set(false);
        this.notification.error(this.translate.instant('reports.builder.runError'));
      }
    });
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.runReport();
    }
  }

  nextPage(): void {
    if (this.result() && this.currentPage() < this.result()!.totalPages) {
      this.currentPage.set(this.currentPage() + 1);
      this.runReport();
    }
  }

  exportReport(format: ReportFormat): void {
    if (!this.selectedDataSource()) return;

    const request: ReportBuilderExecuteRequest = {
      config: this.config(),
      startDate: this.startDateStr ? new Date(this.startDateStr) : undefined,
      endDate: this.endDateStr ? new Date(this.endDateStr) : undefined,
      page: 1,
      pageSize: 10000,
      exportFormat: format
    };

    this.reportService.exportReportBuilder(request).subscribe({
      next: (blob) => {
        const ext = format === ReportFormat.Excel ? 'xlsx' : 'csv';
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.configName || 'report'}-${new Date().toISOString().split('T')[0]}.${ext}`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.notification.success(this.translate.instant('reports.builder.exportSuccess'));
      },
      error: () => {
        this.notification.error(this.translate.instant('reports.builder.exportError'));
      }
    });
  }

  saveReport(): void {
    if (!this.configName) {
      this.notification.warning(this.translate.instant('reports.builder.nameRequired'));
      return;
    }

    this.reportService.saveReport(this.config()).subscribe({
      next: (saved) => {
        this.notification.success(this.translate.instant('reports.builder.saved'));
        this.router.navigate(['/reports/builder', saved.id]);
      },
      error: () => {
        this.notification.error(this.translate.instant('reports.builder.saveError'));
      }
    });
  }

  loadSavedReport(id: number): void {
    this.reportService.getSavedReportById(id).subscribe({
      next: (report) => {
        this.configName = report.name;
        this.configDescription = report.description || '';
        this.selectDataSource(report.dataSource);
        setTimeout(() => {
          this.selectedColumns.set(report.configuration.columns);
          this.filters.set(report.configuration.filters);
        }, 500);
      }
    });
  }

  resetConfig(): void {
    this.configName = '';
    this.configDescription = '';
    this.selectedDataSource.set(null);
    this.availableFields.set([]);
    this.selectedColumns.set([]);
    this.filters.set([]);
    this.result.set(null);
    this.currentSort.set(null);
    this.currentPage.set(1);
  }

  getColumnTypeLabel(type: ReportColumnType): string {
    return this.reportService.getColumnTypeName(type);
  }

  getColumnClass(type: ReportColumnType): string {
    switch (type) {
      case ReportColumnType.Currency:
      case ReportColumnType.Number:
        return 'number';
      case ReportColumnType.Percentage:
        return 'percentage';
      default:
        return '';
    }
  }

  formatValue(value: unknown, type: ReportColumnType): string {
    if (value === null || value === undefined) return '-';

    switch (type) {
      case ReportColumnType.Currency:
        return new Intl.NumberFormat('de-BA', { style: 'currency', currency: 'BAM' }).format(Number(value));
      case ReportColumnType.Number:
        return new Intl.NumberFormat('de-BA').format(Number(value));
      case ReportColumnType.Percentage:
        return `${Number(value).toFixed(1)}%`;
      case ReportColumnType.Date:
        return new Date(String(value)).toLocaleDateString();
      case ReportColumnType.DateTime:
        return new Date(String(value)).toLocaleString();
      case ReportColumnType.Boolean:
        return value ? '✓' : '✗';
      default:
        return String(value);
    }
  }
}
