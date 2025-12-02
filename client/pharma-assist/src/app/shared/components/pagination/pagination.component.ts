import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

export interface PageEvent {
  page: number;
  pageSize: number;
  totalItems: number;
}

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="pagination-container">
      <div class="pagination-info">
        <span class="showing-text">
          {{ 'common.showing' | translate }}
          <strong>{{ startItem() }}</strong> - <strong>{{ endItem() }}</strong>
          {{ 'common.of' | translate }}
          <strong>{{ total() }}</strong>
        </span>
      </div>

      <div class="pagination-controls">
        <div class="page-size-selector">
          <label>{{ 'common.perPage' | translate }}:</label>
          <select [ngModel]="pageSize()" (ngModelChange)="onPageSizeChange($event)">
            @for (size of pageSizeOptions(); track size) {
              <option [value]="size">{{ size }}</option>
            }
          </select>
        </div>

        <div class="page-buttons">
          <button
            class="page-btn"
            [disabled]="currentPage() === 1"
            (click)="goToPage(1)"
            title="First page"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m11 17-5-5 5-5M18 17l-5-5 5-5"/>
            </svg>
          </button>
          <button
            class="page-btn"
            [disabled]="currentPage() === 1"
            (click)="goToPage(currentPage() - 1)"
            title="Previous page"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>

          @for (page of visiblePages(); track page) {
            @if (page === '...') {
              <span class="ellipsis">...</span>
            } @else {
              <button
                class="page-btn page-number"
                [class.active]="page === currentPage()"
                (click)="goToPage(+page)"
              >
                {{ page }}
              </button>
            }
          }

          <button
            class="page-btn"
            [disabled]="currentPage() === totalPages()"
            (click)="goToPage(currentPage() + 1)"
            title="Next page"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
          <button
            class="page-btn"
            [disabled]="currentPage() === totalPages()"
            (click)="goToPage(totalPages())"
            title="Last page"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m6 17 5-5-5-5M13 17l5-5-5-5"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pagination-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      background: var(--surface);
      border-top: 1px solid var(--border);
      flex-wrap: wrap;
      gap: 16px;
    }

    .pagination-info {
      font-size: 14px;
      color: var(--text-secondary);
    }

    .showing-text strong {
      color: var(--text);
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .page-size-selector {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--text-secondary);

      select {
        padding: 6px 28px 6px 12px;
        border: 1px solid var(--border);
        border-radius: 6px;
        background: var(--surface);
        color: var(--text);
        font-size: 14px;
        cursor: pointer;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 8px center;

        &:hover {
          border-color: var(--border-hover, #94a3b8);
        }

        &:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
        }
      }
    }

    .page-buttons {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .page-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 36px;
      height: 36px;
      padding: 0 8px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--surface);
      color: var(--text);
      font-size: 14px;
      cursor: pointer;
      transition: all 0.15s;

      &:hover:not(:disabled) {
        background: var(--surface-hover, #f1f5f9);
        border-color: var(--border-hover, #94a3b8);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &.active {
        background: var(--primary);
        border-color: var(--primary);
        color: white;
      }
    }

    .page-number {
      font-weight: 500;
    }

    .ellipsis {
      padding: 0 8px;
      color: var(--text-muted);
    }

    @media (max-width: 640px) {
      .pagination-container {
        justify-content: center;
      }

      .page-size-selector {
        order: 2;
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class PaginationComponent {
  @Input() set page(value: number) { this.currentPage.set(value); }
  @Input() set size(value: number) { this.pageSize.set(value); }
  @Input() set totalItems(value: number) { this.total.set(value); }
  @Input() set sizeOptions(value: number[]) { this.pageSizeOptions.set(value); }
  @Input() maxVisiblePages = 5;

  @Output() pageChange = new EventEmitter<PageEvent>();

  currentPage = signal(1);
  pageSize = signal(10);
  total = signal(0);
  pageSizeOptions = signal([10, 25, 50, 100]);

  totalPages = computed(() => Math.ceil(this.total() / this.pageSize()) || 1);

  startItem = computed(() => {
    if (this.total() === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  endItem = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.total());
  });

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const max = this.maxVisiblePages;

    if (total <= max) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    const half = Math.floor(max / 2);

    let start = Math.max(1, current - half);
    let end = Math.min(total, start + max - 1);

    if (end - start < max - 1) {
      start = Math.max(1, end - max + 1);
    }

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== total) {
        pages.push(i);
      }
    }

    if (end < total) {
      if (end < total - 1) pages.push('...');
      pages.push(total);
    }

    return pages;
  });

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) {
      return;
    }
    this.currentPage.set(page);
    this.emitPageEvent();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize.set(+newSize);
    this.currentPage.set(1);
    this.emitPageEvent();
  }

  private emitPageEvent(): void {
    this.pageChange.emit({
      page: this.currentPage(),
      pageSize: this.pageSize(),
      totalItems: this.total()
    });
  }
}
