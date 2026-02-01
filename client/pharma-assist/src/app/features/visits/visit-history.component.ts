import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { VisitService } from '../../core/services/visit.service';
import { SalesRepService } from '../../core/services/sales-rep.service';
import { AuthStateService } from '../../core/state/auth-state.service';
import {
  VisitHistoryFilter,
  VisitHistoryItem,
  VisitOutcome,
  VisitType
} from '../../core/models/visit.model';
import { CustomerAssignment } from '../../core/models/sales-rep.model';

@Component({
  selector: 'app-visit-history',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule],
  template: `
    <div class="history">
      <div class="history__header">
        <h1 class="history__title">{{ 'visitHistory.title' | translate }}</h1>
        <button class="btn" routerLink="/visits">{{ 'common.back' | translate }}</button>
      </div>

      <!-- Filters -->
      <div class="card filters">
        <div class="card-content">
          <div class="filters__row">
            <div class="filter-group">
              <label class="label">{{ 'visitHistory.fromDate' | translate }}</label>
              <input type="date" class="input" [(ngModel)]="filterFromDate" (change)="applyFilters()" />
            </div>
            <div class="filter-group">
              <label class="label">{{ 'visitHistory.toDate' | translate }}</label>
              <input type="date" class="input" [(ngModel)]="filterToDate" (change)="applyFilters()" />
            </div>
            <div class="filter-group">
              <label class="label">{{ 'visitHistory.customer' | translate }}</label>
              <select class="input" [(ngModel)]="filterCustomerId" (change)="applyFilters()">
                <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                @for (c of customers(); track c.customerId) {
                  <option [ngValue]="c.customerId">{{ c.customerName }}</option>
                }
              </select>
            </div>
            <div class="filter-group">
              <label class="label">{{ 'visitHistory.outcome' | translate }}</label>
              <select class="input" [(ngModel)]="filterOutcome" (change)="applyFilters()">
                <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                <option [ngValue]="VisitOutcome.Positive">{{ 'visits.outcomePositive' | translate }}</option>
                <option [ngValue]="VisitOutcome.Neutral">{{ 'visits.outcomeNeutral' | translate }}</option>
                <option [ngValue]="VisitOutcome.Negative">{{ 'visits.outcomeNegative' | translate }}</option>
              </select>
            </div>
          </div>
          <div class="filters__row">
            <div class="filter-group filter-group--wide">
              <label class="label">{{ 'visitHistory.search' | translate }}</label>
              <input type="text" class="input" [(ngModel)]="filterSearch"
                     [placeholder]="'visitHistory.searchPlaceholder' | translate"
                     (keyup.enter)="applyFilters()" />
            </div>
            <div class="filter-actions">
              <button class="btn btn-primary" (click)="applyFilters()">{{ 'common.search' | translate }}</button>
              <button class="btn" (click)="clearFilters()">{{ 'common.clearFilters' | translate }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Results -->
      <div class="card">
        <div class="card-header">
          <span>{{ 'visitHistory.results' | translate }}: {{ totalCount() }}</span>
        </div>
        <div class="card-content">
          @if (loading()) {
            <div class="muted">{{ 'common.loading' | translate }}</div>
          } @else if (items().length === 0) {
            <div class="muted">{{ 'visitHistory.noResults' | translate }}</div>
          } @else {
            <div class="list">
              @for (item of items(); track item.id) {
                <div class="list__row" (click)="openVisit(item.id)">
                  <div class="list__main">
                    <div class="list__title">{{ item.customerName }}</div>
                    <div class="list__meta">
                      {{ formatDate(item.checkInTime) }}
                      @if (item.customerCity) { · {{ item.customerCity }} }
                      @if (item.durationMinutes != null) { · {{ formatDuration(item.durationMinutes) }} }
                    </div>
                    @if (item.summary) {
                      <div class="list__summary">{{ item.summary | slice:0:100 }}{{ item.summary.length > 100 ? '...' : '' }}</div>
                    }
                  </div>
                  <div class="list__badges">
                    <span class="badge" [class]="getOutcomeBadgeClass(item.outcome)">
                      {{ getOutcomeLabel(item.outcome) }}
                    </span>
                    <span class="badge" [class]="getLocationBadgeClass(item)">
                      {{ item.locationVerified ? '✓' : '?' }}
                    </span>
                  </div>
                </div>
              }
            </div>

            <!-- Pagination -->
            @if (totalPages() > 1) {
              <div class="pagination">
                <button class="btn" [disabled]="currentPage() <= 1" (click)="goToPage(currentPage() - 1)">
                  {{ 'common.previous' | translate }}
                </button>
                <span class="pagination__info">{{ currentPage() }} / {{ totalPages() }}</span>
                <button class="btn" [disabled]="currentPage() >= totalPages()" (click)="goToPage(currentPage() + 1)">
                  {{ 'common.next' | translate }}
                </button>
              </div>
            }
          }
        </div>
      </div>

      @if (error()) {
        <div class="error">{{ error() }}</div>
      }
    </div>
  `,
  styles: [`
    .history { display: grid; gap: 16px; max-width: 900px; }
    .history__header { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .history__title { margin: 0; font-size: 20px; font-weight: 700; }

    .filters__row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
    .filters__row:last-child { margin-bottom: 0; }
    .filter-group { display: grid; gap: 4px; min-width: 140px; flex: 1; }
    .filter-group--wide { flex: 2; min-width: 200px; }
    .filter-actions { display: flex; gap: 8px; align-items: flex-end; }
    .label { font-size: 12px; font-weight: 600; }
    .input { padding: 10px 12px; border: 1px solid var(--border-light); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary); font-size: 13px; }

    .list { display: grid; gap: 8px; }
    .list__row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 14px; border: 1px solid var(--border-light); border-radius: 10px; cursor: pointer; transition: background 0.15s; }
    .list__row:hover { background: var(--bg-secondary); }
    .list__main { min-width: 0; flex: 1; }
    .list__title { font-weight: 700; font-size: 14px; }
    .list__meta { font-size: 12px; opacity: 0.7; margin-top: 2px; }
    .list__summary { font-size: 12px; opacity: 0.8; margin-top: 6px; }
    .list__badges { display: flex; gap: 6px; flex-shrink: 0; }

    .badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; }
    .badge--positive { background: rgba(34, 197, 94, 0.15); color: #16a34a; }
    .badge--neutral { background: rgba(234, 179, 8, 0.15); color: #ca8a04; }
    .badge--negative { background: rgba(239, 68, 68, 0.15); color: #dc2626; }
    .badge--none { background: rgba(107, 114, 128, 0.15); color: #6b7280; }
    .badge--verified { background: rgba(34, 197, 94, 0.15); color: #16a34a; }
    .badge--unverified { background: rgba(234, 179, 8, 0.15); color: #ca8a04; }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-light); }
    .pagination__info { font-size: 13px; font-weight: 600; }

    .muted { font-size: 13px; opacity: 0.75; }
    .error { padding: 10px 12px; border: 1px solid var(--error); border-radius: 10px; color: var(--error); }
  `]
})
export class VisitHistoryComponent implements OnInit {
  private readonly visitService = inject(VisitService);
  private readonly salesRepService = inject(SalesRepService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  loading = signal(false);
  error = signal<string | null>(null);
  items = signal<VisitHistoryItem[]>([]);
  totalCount = signal(0);
  currentPage = signal(1);
  totalPages = signal(1);
  customers = signal<CustomerAssignment[]>([]);

  VisitOutcome = VisitOutcome;

  // Filter form values
  filterFromDate: string | null = null;
  filterToDate: string | null = null;
  filterCustomerId: number | null = null;
  filterOutcome: VisitOutcome | null = null;
  filterSearch = '';

  private pageSize = 20;

  ngOnInit(): void {
    // Set default date range to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.filterToDate = this.formatDateForInput(today);
    this.filterFromDate = this.formatDateForInput(thirtyDaysAgo);

    this.loadCustomers();
    this.loadHistory();
  }

  private loadCustomers(): void {
    const user = this.authState.getUser();
    if (!user?.id) return;

    this.salesRepService.getByUserId(user.id).subscribe({
      next: (rep) => {
        this.salesRepService.getCustomerAssignments(rep.id).subscribe({
          next: (items) => this.customers.set(items)
        });
      }
    });
  }

  private loadHistory(): void {
    this.loading.set(true);
    this.error.set(null);

    const filter: VisitHistoryFilter = {
      fromDate: this.filterFromDate,
      toDate: this.filterToDate,
      customerId: this.filterCustomerId,
      outcome: this.filterOutcome,
      searchTerm: this.filterSearch || null,
      page: this.currentPage(),
      pageSize: this.pageSize
    };

    this.visitService.getHistory(filter).subscribe({
      next: (result) => {
        this.items.set(result.items);
        this.totalCount.set(result.totalCount);
        this.totalPages.set(result.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to load visit history');
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadHistory();
  }

  clearFilters(): void {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.filterFromDate = this.formatDateForInput(thirtyDaysAgo);
    this.filterToDate = this.formatDateForInput(today);
    this.filterCustomerId = null;
    this.filterOutcome = null;
    this.filterSearch = '';
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadHistory();
  }

  openVisit(id: number): void {
    this.router.navigate(['/visits', id]);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  getOutcomeBadgeClass(outcome: VisitOutcome | null | undefined): string {
    switch (outcome) {
      case VisitOutcome.Positive: return 'badge--positive';
      case VisitOutcome.Neutral: return 'badge--neutral';
      case VisitOutcome.Negative: return 'badge--negative';
      default: return 'badge--none';
    }
  }

  getOutcomeLabel(outcome: VisitOutcome | null | undefined): string {
    switch (outcome) {
      case VisitOutcome.Positive: return '👍';
      case VisitOutcome.Neutral: return '😐';
      case VisitOutcome.Negative: return '👎';
      default: return '-';
    }
  }

  getLocationBadgeClass(item: VisitHistoryItem): string {
    return item.locationVerified ? 'badge--verified' : 'badge--unverified';
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
