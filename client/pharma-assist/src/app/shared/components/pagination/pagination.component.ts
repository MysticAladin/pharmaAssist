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
  templateUrl: './pagination-component/pagination.component.html',
  styleUrls: ['./pagination-component/pagination.component.scss']
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
