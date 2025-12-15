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
  template: `
    <div class="report-builder">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <a routerLink="/reports" class="back-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </a>
          <div>
            <h1>{{ 'reports.builder.title' | translate }}</h1>
            <p class="subtitle">{{ 'reports.builder.subtitle' | translate }}</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" (click)="resetConfig()">
            <i class="icon-refresh"></i>
            {{ 'common.reset' | translate }}
          </button>
          <button class="btn btn-outline" (click)="saveReport()" [disabled]="!config().name">
            <i class="icon-save"></i>
            {{ 'common.save' | translate }}
          </button>
          <button class="btn btn-primary" (click)="runReport()" [disabled]="loading()">
            @if (loading()) {
              <span class="spinner-sm"></span>
            } @else {
              <i class="icon-play"></i>
            }
            {{ 'reports.builder.runReport' | translate }}
          </button>
        </div>
      </header>

      <div class="builder-layout">
        <!-- Configuration Panel -->
        <aside class="config-panel">
          <!-- Report Name -->
          <div class="config-section">
            <h3>{{ 'reports.builder.reportInfo' | translate }}</h3>
            <div class="form-group">
              <label>{{ 'reports.builder.reportName' | translate }}</label>
              <input type="text" class="form-control" [(ngModel)]="configName" placeholder="My Custom Report">
            </div>
            <div class="form-group">
              <label>{{ 'reports.builder.description' | translate }}</label>
              <textarea class="form-control" [(ngModel)]="configDescription" rows="2"></textarea>
            </div>
          </div>

          <!-- Data Source -->
          <div class="config-section">
            <h3>{{ 'reports.builder.dataSource' | translate }}</h3>
            <div class="data-source-grid">
              @for (ds of dataSources; track ds.value) {
                <button
                  class="data-source-btn"
                  [class.active]="selectedDataSource() === ds.value"
                  (click)="selectDataSource(ds.value)">
                  <i [class]="ds.icon"></i>
                  <span>{{ ds.labelKey | translate }}</span>
                </button>
              }
            </div>
          </div>

          <!-- Columns -->
          <div class="config-section">
            <h3>{{ 'reports.builder.columns' | translate }}</h3>
            <div class="column-list">
              @for (field of availableFields(); track field.field) {
                <label class="column-item">
                  <input type="checkbox" [checked]="isColumnSelected(field.field)" (change)="toggleColumn(field)">
                  <span class="column-name">{{ field.label }}</span>
                  <span class="column-type">{{ getColumnTypeLabel(field.type) }}</span>
                </label>
              }
              @if (availableFields().length === 0) {
                <p class="no-fields">{{ 'reports.builder.selectDataSource' | translate }}</p>
              }
            </div>
          </div>

          <!-- Date Range -->
          <div class="config-section">
            <h3>{{ 'reports.builder.dateRange' | translate }}</h3>
            <div class="form-row">
              <div class="form-group">
                <label>{{ 'common.from' | translate }}</label>
                <input type="date" class="form-control" [(ngModel)]="startDateStr">
              </div>
              <div class="form-group">
                <label>{{ 'common.to' | translate }}</label>
                <input type="date" class="form-control" [(ngModel)]="endDateStr">
              </div>
            </div>
          </div>

          <!-- Filters -->
          <div class="config-section">
            <h3>
              {{ 'reports.builder.filters' | translate }}
              <button class="btn btn-sm btn-icon" (click)="addFilter()">
                <i class="icon-plus"></i>
              </button>
            </h3>
            @for (filter of filters(); track $index) {
              <div class="filter-row">
                <select class="form-select" [(ngModel)]="filter.field">
                  @for (field of availableFields(); track field.field) {
                    <option [value]="field.field">{{ field.label }}</option>
                  }
                </select>
                <select class="form-select" [(ngModel)]="filter.operator">
                  <option [value]="FilterOperator.Equals">Equals</option>
                  <option [value]="FilterOperator.Contains">Contains</option>
                  <option [value]="FilterOperator.GreaterThan">></option>
                  <option [value]="FilterOperator.LessThan"><</option>
                </select>
                <input type="text" class="form-control" [(ngModel)]="filter.value" placeholder="Value">
                <button class="btn btn-icon btn-danger" (click)="removeFilter($index)">
                  <i class="icon-x"></i>
                </button>
              </div>
            }
          </div>

          <!-- Export Options -->
          <div class="config-section">
            <h3>{{ 'reports.builder.export' | translate }}</h3>
            <div class="export-buttons">
              <button class="btn btn-outline" (click)="exportReport(ReportFormat.Csv)" [disabled]="!result() || loading()">
                <i class="icon-file-text"></i>
                CSV
              </button>
              <button class="btn btn-outline" (click)="exportReport(ReportFormat.Excel)" [disabled]="!result() || loading()">
                <i class="icon-file-spreadsheet"></i>
                Excel
              </button>
            </div>
          </div>
        </aside>

        <!-- Results Panel -->
        <main class="results-panel">
          @if (!result() && !loading()) {
            <div class="empty-state">
              <div class="empty-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="9" y1="21" x2="9" y2="9"/>
                </svg>
              </div>
              <h2>{{ 'reports.builder.emptyTitle' | translate }}</h2>
              <p>{{ 'reports.builder.emptyDescription' | translate }}</p>
            </div>
          }

          @if (loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>{{ 'reports.builder.generating' | translate }}</p>
            </div>
          }

          @if (result() && !loading()) {
            <!-- Results Summary -->
            <div class="results-header">
              <div class="results-info">
                <strong>{{ result()!.totalCount | number }}</strong> {{ 'reports.builder.records' | translate }}
                <span class="separator">•</span>
                {{ 'reports.builder.page' | translate }} {{ result()!.page }} {{ 'common.of' | translate }} {{ result()!.totalPages }}
              </div>
              <div class="pagination">
                <button class="btn btn-sm" [disabled]="currentPage() <= 1" (click)="previousPage()">
                  <i class="icon-chevron-left"></i>
                </button>
                <span>{{ currentPage() }}</span>
                <button class="btn btn-sm" [disabled]="currentPage() >= result()!.totalPages" (click)="nextPage()">
                  <i class="icon-chevron-right"></i>
                </button>
              </div>
            </div>

            <!-- Data Table -->
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    @for (col of selectedColumns(); track col.field) {
                      <th (click)="sortBy(col.field)" class="sortable">
                        {{ col.label || col.field }}
                        @if (currentSort()?.field === col.field) {
                          <i [class]="currentSort()?.descending ? 'icon-arrow-down' : 'icon-arrow-up'"></i>
                        }
                      </th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (row of result()!.data; track $index) {
                    <tr>
                      @for (col of selectedColumns(); track col.field) {
                        <td [class]="getColumnClass(col.type)">
                          {{ formatValue(row[col.field], col.type) }}
                        </td>
                      }
                    </tr>
                  }
                </tbody>
                @if (result()!.totals) {
                  <tfoot>
                    <tr class="totals-row">
                      @for (col of selectedColumns(); track col.field; let i = $index) {
                        <td [class]="getColumnClass(col.type)">
                          @if (i === 0) {
                            <strong>{{ 'common.total' | translate }}</strong>
                          } @else if (result()!.totals![col.field] !== undefined) {
                            <strong>{{ formatValue(result()!.totals![col.field], col.type) }}</strong>
                          }
                        </td>
                      }
                    </tr>
                  </tfoot>
                }
              </table>
            </div>
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host{--c1:#1a1a2e;--c2:#6b7280;--c3:#e5e7eb;--c4:#f3f4f6;--c5:#0aaaaa;--c6:#dc2626}
    .report-builder{height:100%;display:flex;flex-direction:column;background:var(--c4)}
    .page-header{display:flex;justify-content:space-between;align-items:center;padding:1rem 1.5rem;background:#fff;border-bottom:1px solid var(--c3)}
    .header-left{display:flex;align-items:center;gap:1rem}
    .back-btn{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--c2);transition:all .2s}
    .back-btn:hover{background:var(--c4);color:var(--c1)}
    .page-header h1{font-size:1.25rem;font-weight:600;color:var(--c1);margin:0}
    .subtitle{font-size:.875rem;color:var(--c2);margin:0}
    .header-actions{display:flex;gap:.5rem}

    .builder-layout{display:grid;grid-template-columns:320px 1fr;flex:1;overflow:hidden}

    .config-panel{background:#fff;border-right:1px solid var(--c3);overflow-y:auto;padding:1rem}
    .config-section{margin-bottom:1.5rem;padding-bottom:1.5rem;border-bottom:1px solid var(--c3)}
    .config-section:last-child{border-bottom:none}
    .config-section h3{font-size:.875rem;font-weight:600;color:var(--c1);margin:0 0 1rem;display:flex;align-items:center;justify-content:space-between}

    .form-group{margin-bottom:.75rem}
    .form-group label{display:block;font-size:.75rem;font-weight:500;color:var(--c2);margin-bottom:.25rem}
    .form-control{width:100%;padding:.5rem .75rem;border:1px solid var(--c3);border-radius:6px;font-size:.875rem}
    .form-select{width:100%;padding:.5rem .75rem;border:1px solid var(--c3);border-radius:6px;font-size:.875rem;background:#fff}
    .form-row{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}

    .data-source-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:.5rem}
    .data-source-btn{padding:.75rem .5rem;border:1px solid var(--c3);border-radius:8px;background:#fff;display:flex;flex-direction:column;align-items:center;gap:.25rem;cursor:pointer;transition:all .2s;font-size:.75rem;color:var(--c2)}
    .data-source-btn:hover{border-color:var(--c5);color:var(--c5)}
    .data-source-btn.active{border-color:var(--c5);background:rgba(13,148,136,.05);color:var(--c5)}
    .data-source-btn i{font-size:1.25rem}

    .column-list{max-height:250px;overflow-y:auto}
    .column-item{display:flex;align-items:center;gap:.5rem;padding:.5rem;border-radius:4px;cursor:pointer}
    .column-item:hover{background:var(--c4)}
    .column-item input{accent-color:var(--c5)}
    .column-name{flex:1;font-size:.875rem;color:var(--c1)}
    .column-type{font-size:.7rem;color:var(--c2);background:var(--c4);padding:.125rem .375rem;border-radius:4px}
    .no-fields{text-align:center;color:var(--c2);font-size:.875rem;padding:1rem}

    .filter-row{display:grid;grid-template-columns:1fr 80px 1fr auto;gap:.25rem;margin-bottom:.5rem}
    .filter-row .form-select,.filter-row .form-control{padding:.375rem .5rem;font-size:.8rem}

    .export-buttons{display:flex;gap:.5rem}
    .export-buttons .btn{flex:1}

    .results-panel{overflow:auto;padding:1.5rem;display:flex;flex-direction:column}

    .empty-state,.loading-state{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
    .empty-icon{width:100px;height:100px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;margin-bottom:1.5rem;color:var(--c3)}
    .empty-state h2{font-size:1.25rem;font-weight:600;color:var(--c1);margin:0 0 .5rem}
    .empty-state p{color:var(--c2);max-width:400px}
    .spinner{width:40px;height:40px;border:3px solid var(--c3);border-top-color:var(--c5);border-radius:50%;animation:spin 1s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .loading-state p{margin-top:1rem;color:var(--c2)}

    .results-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem}
    .results-info{font-size:.875rem;color:var(--c2)}
    .results-info strong{color:var(--c1)}
    .separator{margin:0 .5rem}
    .pagination{display:flex;align-items:center;gap:.5rem}
    .pagination span{font-size:.875rem;color:var(--c1);min-width:2rem;text-align:center}

    .table-container{flex:1;background:#fff;border-radius:8px;border:1px solid var(--c3);overflow:auto}
    .data-table{width:100%;border-collapse:collapse;font-size:.875rem}
    .data-table th{position:sticky;top:0;background:#fff;text-align:left;padding:.75rem 1rem;font-weight:500;color:var(--c1);border-bottom:2px solid var(--c3);white-space:nowrap}
    .data-table th.sortable{cursor:pointer}
    .data-table th.sortable:hover{color:var(--c5)}
    .data-table td{padding:.625rem 1rem;border-bottom:1px solid var(--c3);color:var(--c1)}
    .data-table tbody tr:hover{background:var(--c4)}
    .data-table td.currency,.data-table td.number{text-align:right;font-variant-numeric:tabular-nums}
    .data-table td.percentage{text-align:right}
    .totals-row{background:var(--c4)}
    .totals-row td{font-weight:600;border-top:2px solid var(--c3)}

    .btn{padding:.5rem 1rem;border:none;border-radius:6px;font-size:.875rem;cursor:pointer;display:inline-flex;align-items:center;gap:.5rem;transition:all .2s}
    .btn-primary{background:var(--c5);color:#fff}
    .btn-primary:hover:not(:disabled){background:#088888}
    .btn-primary:disabled{opacity:.6;cursor:not-allowed}
    .btn-outline{background:#fff;border:1px solid var(--c3);color:var(--c1)}
    .btn-outline:hover:not(:disabled){border-color:var(--c5);color:var(--c5)}
    .btn-outline:disabled{opacity:.5;cursor:not-allowed}
    .btn-sm{padding:.25rem .5rem;font-size:.8rem}
    .btn-icon{width:28px;height:28px;padding:0;justify-content:center}
    .btn-danger{color:var(--c6)}
    .spinner-sm{width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin 1s linear infinite}

    @media(max-width:1024px){.builder-layout{grid-template-columns:280px 1fr}}
    @media(max-width:768px){.builder-layout{grid-template-columns:1fr}.config-panel{border-right:none;border-bottom:1px solid var(--c3);max-height:50vh}}
  `]
})
export class ReportBuilderComponent implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly notification = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Expose enums to template
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
