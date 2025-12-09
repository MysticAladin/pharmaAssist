import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { TenderService } from '../../core/services/tender.service';
import {
  TenderDto,
  tenderStatusLabels,
  tenderStatusColors,
  tenderPriorityLabels,
  tenderPriorityColors
} from '../../core/models/tender.model';

import { EmptyStateComponent } from '../../shared/components/empty-state';
import { PaginationComponent, PageEvent } from '../../shared/components/pagination';

@Component({
  selector: 'app-my-tenders',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    DatePipe,
    CurrencyPipe,
    EmptyStateComponent,
    PaginationComponent
  ],
  template: `
    <div class="my-tenders-page">
      <div class="page-header">
        <h1 class="page-title">{{ 'TENDERS.MY_TENDERS.TITLE' | translate }}</h1>
        <p class="page-subtitle">{{ 'TENDERS.MY_TENDERS.SUBTITLE' | translate }}</p>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <div class="loading-spinner"></div>
        </div>
      } @else if (tenders().length === 0) {
        <app-empty-state
          icon="file-text"
          [title]="'TENDERS.MY_TENDERS.EMPTY_TITLE' | translate"
          [description]="'TENDERS.MY_TENDERS.EMPTY_DESC' | translate">
        </app-empty-state>
      } @else {
        <div class="tenders-grid">
          @for (tender of tenders(); track tender.id) {
            <a class="tender-card" [routerLink]="['/tenders', tender.id]">
              <div class="card-header">
                <span class="tender-number">{{ tender.tenderNumber }}</span>
                <span class="status-badge" [class]="tenderStatusColors[tender.status]">
                  {{ tenderStatusLabels[tender.status] | translate }}
                </span>
              </div>
              <h3 class="tender-title">{{ tender.title }}</h3>
              <p class="customer-name">{{ tender.customerName }}</p>
              <div class="card-footer">
                <div class="deadline" [class.urgent]="isDeadlineSoon(tender)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {{ tender.submissionDeadline | date:'shortDate' }}
                </div>
                <div class="value">
                  {{ tender.estimatedValue | currency:tender.currency:'symbol':'1.0-0' }}
                </div>
              </div>
            </a>
          }
        </div>

        <app-pagination
          [page]="currentPage"
          [size]="pageSize"
          [totalItems]="totalItems()"
          (pageChange)="onPageChange($event)">
        </app-pagination>
      }
    </div>
  `,
  styles: [`
    .my-tenders-page {
      padding: 1.5rem;
    }

    .page-header {
      margin-bottom: 1.5rem;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
    }

    .page-subtitle {
      color: var(--text-secondary);
      margin: 0.25rem 0 0;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 4rem;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border-color);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .tenders-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .tender-card {
      display: block;
      padding: 1rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      text-decoration: none;
      color: inherit;
      transition: all 0.15s;
    }

    .tender-card:hover {
      border-color: var(--primary);
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .tender-number {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .status-badge {
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-size: 0.625rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .tender-title {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 0.25rem;
      color: var(--text-primary);
    }

    .customer-name {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: 0 0 1rem;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-color);
    }

    .deadline {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .deadline.urgent {
      color: #d97706;
    }

    .value {
      font-weight: 600;
      color: var(--text-primary);
    }
  `]
})
export class MyTendersComponent implements OnInit {
  private readonly tenderService = inject(TenderService);

  readonly tenders = signal<TenderDto[]>([]);
  readonly totalItems = signal(0);
  readonly loading = this.tenderService.loading;

  currentPage = 1;
  pageSize = 12;

  readonly tenderStatusLabels = tenderStatusLabels;
  readonly tenderStatusColors = tenderStatusColors;
  readonly tenderPriorityLabels = tenderPriorityLabels;
  readonly tenderPriorityColors = tenderPriorityColors;

  ngOnInit(): void {
    this.loadTenders();
  }

  loadTenders(): void {
    this.tenderService.getMyTenders(this.currentPage, this.pageSize).subscribe({
      next: (result) => {
        this.tenders.set(result.items);
        this.totalItems.set(result.totalCount);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.page;
    this.loadTenders();
  }

  isDeadlineSoon(tender: TenderDto): boolean {
    if (!tender.isOpen) return false;
    const now = new Date();
    const deadline = new Date(tender.submissionDeadline);
    const diff = deadline.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 && days <= 7;
  }
}
