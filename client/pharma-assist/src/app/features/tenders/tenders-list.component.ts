import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { TenderService } from '../../core/services/tender.service';
import {
  TenderDto,
  TenderFilterDto,
  TenderStatus,
  TenderType,
  TenderPriority,
  tenderStatusLabels,
  tenderStatusColors,
  tenderTypeLabels,
  tenderPriorityLabels,
  tenderPriorityColors
} from '../../core/models/tender.model';
import { IPagedResult } from '../../core/models/common.model';

import { SearchInputComponent } from '../../shared/components/search-input';
import { EmptyStateComponent } from '../../shared/components/empty-state';
import { PaginationComponent, PageEvent } from '../../shared/components/pagination';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog';

@Component({
  selector: 'app-tenders-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslateModule,
    DatePipe,
    CurrencyPipe,
    SearchInputComponent,
    EmptyStateComponent,
    PaginationComponent,
    ConfirmDialogComponent
  ],
  template: `
    <div class="tenders-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">{{ 'TENDERS.TITLE' | translate }}</h1>
          <p class="page-subtitle">{{ 'TENDERS.SUBTITLE' | translate }}</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" [routerLink]="['/tenders/new']">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            {{ 'TENDERS.NEW_TENDER' | translate }}
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon draft">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats()?.draftTenders ?? 0 }}</span>
            <span class="stat-label">{{ 'TENDERS.STATS.DRAFT' | translate }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon open">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats()?.openTenders ?? 0 }}</span>
            <span class="stat-label">{{ 'TENDERS.STATS.OPEN' | translate }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon awarded">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="8" r="7"/>
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats()?.awardedTenders ?? 0 }}</span>
            <span class="stat-label">{{ 'TENDERS.STATS.AWARDED' | translate }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon total">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1v22"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats()?.totalValue | currency:'BAM ':'symbol':'1.0-0' }}</span>
            <span class="stat-label">{{ 'TENDERS.STATS.TOTAL_VALUE' | translate }}</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-row">
          <app-search-input
            [placeholder]="'TENDERS.SEARCH_PLACEHOLDER' | translate"
            [debounceTime]="300"
            (search)="onSearch($event)">
          </app-search-input>

          <div class="filter-group">
            <select class="form-select" [(ngModel)]="selectedStatus" (ngModelChange)="loadTenders()">
              <option [ngValue]="null">{{ 'TENDERS.FILTER.ALL_STATUSES' | translate }}</option>
              @for (status of statuses; track status) {
                <option [value]="status">{{ tenderStatusLabels[status] | translate }}</option>
              }
            </select>

            <select class="form-select" [(ngModel)]="selectedType" (ngModelChange)="loadTenders()">
              <option [ngValue]="null">{{ 'TENDERS.FILTER.ALL_TYPES' | translate }}</option>
              @for (type of types; track type) {
                <option [value]="type">{{ tenderTypeLabels[type] | translate }}</option>
              }
            </select>

            <select class="form-select" [(ngModel)]="selectedPriority" (ngModelChange)="loadTenders()">
              <option [ngValue]="null">{{ 'TENDERS.FILTER.ALL_PRIORITIES' | translate }}</option>
              @for (priority of priorities; track priority) {
                <option [value]="priority">{{ tenderPriorityLabels[priority] | translate }}</option>
              }
            </select>
          </div>
        </div>
      </div>

      <!-- Tenders Table -->
      @if (loading()) {
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>{{ 'COMMON.LOADING' | translate }}</p>
        </div>
      } @else if (tenders().length === 0) {
        <app-empty-state
          icon="file-text"
          [title]="'TENDERS.EMPTY.TITLE' | translate"
          [description]="'TENDERS.EMPTY.DESCRIPTION' | translate"
          [actionLabel]="'TENDERS.NEW_TENDER' | translate"
          (action)="router.navigate(['/tenders/new'])">
        </app-empty-state>
      } @else {
        <div class="tenders-table-container">
          <table class="tenders-table">
            <thead>
              <tr>
                <th class="sortable" (click)="sortBy('tenderNumber')">
                  {{ 'TENDERS.TABLE.NUMBER' | translate }}
                  @if (sortField === 'tenderNumber') {
                    <span class="sort-icon">{{ sortDescending ? '↓' : '↑' }}</span>
                  }
                </th>
                <th class="sortable" (click)="sortBy('title')">
                  {{ 'TENDERS.TABLE.TITLE' | translate }}
                  @if (sortField === 'title') {
                    <span class="sort-icon">{{ sortDescending ? '↓' : '↑' }}</span>
                  }
                </th>
                <th>{{ 'TENDERS.TABLE.CUSTOMER' | translate }}</th>
                <th>{{ 'TENDERS.TABLE.TYPE' | translate }}</th>
                <th>{{ 'TENDERS.TABLE.STATUS' | translate }}</th>
                <th>{{ 'TENDERS.TABLE.PRIORITY' | translate }}</th>
                <th class="sortable" (click)="sortBy('submissionDeadline')">
                  {{ 'TENDERS.TABLE.DEADLINE' | translate }}
                  @if (sortField === 'submissionDeadline') {
                    <span class="sort-icon">{{ sortDescending ? '↓' : '↑' }}</span>
                  }
                </th>
                <th class="sortable text-right" (click)="sortBy('estimatedValue')">
                  {{ 'TENDERS.TABLE.VALUE' | translate }}
                  @if (sortField === 'estimatedValue') {
                    <span class="sort-icon">{{ sortDescending ? '↓' : '↑' }}</span>
                  }
                </th>
                <th class="text-center">{{ 'TENDERS.TABLE.BIDS' | translate }}</th>
                <th>{{ 'TENDERS.TABLE.ACTIONS' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (tender of tenders(); track tender.id) {
                <tr [class.urgent]="tender.priority === 'Critical' || tender.priority === 'High'">
                  <td class="tender-number">
                    <a [routerLink]="['/tenders', tender.id]">{{ tender.tenderNumber }}</a>
                  </td>
                  <td class="tender-title">
                    <div class="title-cell">
                      <span class="title">{{ tender.title }}</span>
                      @if (tender.isOpen) {
                        <span class="badge badge-success">{{ 'TENDERS.OPEN_FOR_BIDS' | translate }}</span>
                      }
                    </div>
                  </td>
                  <td>{{ tender.customerName }}</td>
                  <td>
                    <span class="type-badge">{{ tenderTypeLabels[tender.type] | translate }}</span>
                  </td>
                  <td>
                    <span class="status-badge" [class]="tenderStatusColors[tender.status]">
                      {{ tenderStatusLabels[tender.status] | translate }}
                    </span>
                  </td>
                  <td>
                    <span class="priority-indicator" [class]="tenderPriorityColors[tender.priority]">
                      {{ tenderPriorityLabels[tender.priority] | translate }}
                    </span>
                  </td>
                  <td [class.deadline-warning]="isDeadlineSoon(tender)" [class.deadline-passed]="isDeadlinePassed(tender)">
                    {{ tender.submissionDeadline | date:'shortDate' }}
                    @if (isDeadlineSoon(tender)) {
                      <span class="deadline-badge">{{ getDaysRemaining(tender) }}d</span>
                    }
                  </td>
                  <td class="text-right">
                    {{ tender.estimatedValue | currency:tender.currency:'symbol':'1.0-0' }}
                  </td>
                  <td class="text-center">
                    <span class="bid-count" [class.has-bids]="tender.bidCount > 0">
                      {{ tender.bidCount }}
                    </span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button class="btn-icon" title="{{ 'COMMON.VIEW' | translate }}"
                              [routerLink]="['/tenders', tender.id]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      @if (tender.status === 'Draft') {
                        <button class="btn-icon" title="{{ 'COMMON.EDIT' | translate }}"
                                [routerLink]="['/tenders', tender.id, 'edit']">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button class="btn-icon btn-danger" title="{{ 'COMMON.DELETE' | translate }}"
                                (click)="confirmDelete(tender)">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      }
                      @if (tender.isOpen) {
                        <button class="btn-icon btn-primary" title="{{ 'TENDERS.CREATE_BID' | translate }}"
                                [routerLink]="['/tenders', tender.id, 'bid']">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="12" y1="18" x2="12" y2="12"/>
                            <line x1="9" y1="15" x2="15" y2="15"/>
                          </svg>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <app-pagination
          [page]="currentPage"
          [size]="pageSize"
          [totalItems]="totalItems()"
          (pageChange)="onPageChange($event)">
        </app-pagination>
      }

      <!-- Delete Confirmation Dialog -->
      <app-confirm-dialog
        [open]="showDeleteDialog()"
        [title]="'TENDERS.DELETE.TITLE' | translate"
        [message]="'TENDERS.DELETE.MESSAGE' | translate"
        [confirmLabel]="'COMMON.DELETE' | translate"
        [cancelLabel]="'COMMON.CANCEL' | translate"
        type="danger"
        (confirm)="deleteTender()"
        (cancel)="showDeleteDialog.set(false)">
      </app-confirm-dialog>
    </div>
  `,
  styles: [`
    .tenders-page {
      padding: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .page-subtitle {
      color: var(--text-secondary);
      margin: 0.25rem 0 0;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.15s;
    }

    .btn-primary {
      background: var(--primary);
      color: white;
    }

    .btn-primary:hover {
      background: var(--primary-dark);
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--bg-primary);
      border-radius: 0.5rem;
      border: 1px solid var(--border-color);
    }

    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 0.5rem;
    }

    .stat-icon.draft { background: var(--surface-tertiary); color: var(--text-secondary); }
    .stat-icon.open { background: var(--color-success-bg); color: var(--color-success-dark); }
    .stat-icon.awarded { background: #f3e8ff; color: #9333ea; }
    .stat-icon.total { background: var(--status-processing-bg); color: var(--brand-primary-dark); }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .filters-section {
      background: var(--bg-primary);
      border-radius: 0.5rem;
      border: 1px solid var(--border-color);
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .filters-row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .filter-group {
      display: flex;
      gap: 0.5rem;
    }

    .form-select {
      padding: 0.5rem 2rem 0.5rem 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 0.375rem;
      background: var(--bg-primary);
      font-size: 0.875rem;
    }

    .tenders-table-container {
      background: var(--bg-primary);
      border-radius: 0.5rem;
      border: 1px solid var(--border-color);
      overflow-x: auto;
    }

    .tenders-table {
      width: 100%;
      border-collapse: collapse;
    }

    .tenders-table th {
      padding: 0.75rem 1rem;
      text-align: left;
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--text-secondary);
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
    }

    .tenders-table th.sortable {
      cursor: pointer;
      user-select: none;
    }

    .tenders-table th.sortable:hover {
      color: var(--text-primary);
    }

    .sort-icon {
      margin-left: 0.25rem;
    }

    .tenders-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-color);
      font-size: 0.875rem;
    }

    .tenders-table tr:hover {
      background: var(--bg-secondary);
    }

    .tenders-table tr.urgent {
      background: var(--color-error-bg);
    }

    .tender-number a {
      color: var(--primary);
      font-weight: 500;
      text-decoration: none;
    }

    .tender-number a:hover {
      text-decoration: underline;
    }

    .title-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .title {
      max-width: 250px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .badge {
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.625rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .badge-success {
      background: var(--color-success-bg);
      color: var(--color-success-dark);
    }

    .type-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      background: var(--bg-secondary);
    }

    .status-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .priority-indicator {
      font-weight: 500;
    }

    .deadline-warning {
      color: var(--status-pending-text);
    }

    .deadline-passed {
      color: var(--color-error-dark);
    }

    .deadline-badge {
      margin-left: 0.25rem;
      padding: 0.125rem 0.25rem;
      background: var(--status-pending-bg);
      color: var(--status-pending-text);
      border-radius: 0.25rem;
      font-size: 0.625rem;
      font-weight: 600;
    }

    .text-right {
      text-align: right;
    }

    .text-center {
      text-align: center;
    }

    .bid-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
      height: 24px;
      padding: 0 0.25rem;
      background: var(--bg-secondary);
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .bid-count.has-bids {
      background: var(--primary);
      color: white;
    }

    .action-buttons {
      display: flex;
      gap: 0.25rem;
    }

    .btn-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      border-radius: 0.25rem;
      cursor: pointer;
      color: var(--text-secondary);
      transition: all 0.15s;
    }

    .btn-icon:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }

    .btn-icon.btn-danger:hover {
      background: var(--color-error-bg);
      color: var(--color-error-dark);
    }

    .btn-icon.btn-primary:hover {
      background: var(--primary);
      color: white;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      color: var(--text-secondary);
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border-color);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class TendersListComponent implements OnInit {
  protected readonly router = inject(Router);
  private readonly tenderService = inject(TenderService);
  private readonly translate = inject(TranslateService);

  // State
  readonly tenders = signal<TenderDto[]>([]);
  readonly totalItems = signal(0);
  readonly stats = signal(this.tenderService.stats());
  readonly loading = this.tenderService.loading;
  readonly showDeleteDialog = signal(false);

  // Filters
  searchTerm = '';
  selectedStatus: TenderStatus | null = null;
  selectedType: TenderType | null = null;
  selectedPriority: TenderPriority | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 20;

  // Sorting
  sortField = 'submissionDeadline';
  sortDescending = false;

  // Delete
  private tenderToDelete: TenderDto | null = null;

  // Constants
  readonly statuses: TenderStatus[] = ['Draft', 'Published', 'Open', 'UnderEvaluation', 'Awarded', 'Cancelled', 'Expired', 'Completed'];
  readonly types: TenderType[] = ['OpenTender', 'RestrictedTender', 'NegotiatedProcurement', 'FrameworkAgreement', 'QuoteRequest'];
  readonly priorities: TenderPriority[] = ['Low', 'Medium', 'High', 'Critical'];
  readonly tenderStatusLabels = tenderStatusLabels;
  readonly tenderStatusColors = tenderStatusColors;
  readonly tenderTypeLabels = tenderTypeLabels;
  readonly tenderPriorityLabels = tenderPriorityLabels;
  readonly tenderPriorityColors = tenderPriorityColors;

  ngOnInit(): void {
    this.loadTenders();
    this.loadStats();
  }

  loadTenders(): void {
    const filter: TenderFilterDto = {
      searchTerm: this.searchTerm || undefined,
      status: this.selectedStatus || undefined,
      type: this.selectedType || undefined,
      priority: this.selectedPriority || undefined,
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
      sortBy: this.sortField,
      sortDescending: this.sortDescending
    };

    this.tenderService.getTenders(filter).subscribe({
      next: (result) => {
        this.tenders.set(result.items);
        this.totalItems.set(result.totalCount);
      },
      error: (err) => {
        console.error('Failed to load tenders', err);
      }
    });
  }

  loadStats(): void {
    this.tenderService.getStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
      }
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
    this.loadTenders();
  }

  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDescending = !this.sortDescending;
    } else {
      this.sortField = field;
      this.sortDescending = false;
    }
    this.loadTenders();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.page;
    this.pageSize = event.pageSize;
    this.loadTenders();
  }

  isDeadlineSoon(tender: TenderDto): boolean {
    if (!tender.isOpen) return false;
    const days = this.getDaysRemaining(tender);
    return days > 0 && days <= 7;
  }

  isDeadlinePassed(tender: TenderDto): boolean {
    return new Date(tender.submissionDeadline) < new Date();
  }

  getDaysRemaining(tender: TenderDto): number {
    const now = new Date();
    const deadline = new Date(tender.submissionDeadline);
    const diff = deadline.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  confirmDelete(tender: TenderDto): void {
    this.tenderToDelete = tender;
    this.showDeleteDialog.set(true);
  }

  deleteTender(): void {
    if (!this.tenderToDelete) return;

    this.tenderService.deleteTender(this.tenderToDelete.id).subscribe({
      next: () => {
        this.showDeleteDialog.set(false);
        this.tenderToDelete = null;
        this.loadTenders();
        this.loadStats();
      },
      error: (err) => {
        console.error('Failed to delete tender', err);
      }
    });
  }
}
