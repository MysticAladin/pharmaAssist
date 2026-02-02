import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { VisitService } from '../../core/services/visit.service';
import { SalesRepService } from '../../core/services/sales-rep.service';
import { AuthStateService } from '../../core/state/auth-state.service';
import { EuropeanDatePipe } from '../../core/pipes/european-date.pipe';
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
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule, EuropeanDatePipe],
  templateUrl: './visit-history-component/visit-history.component.html',
  styleUrls: ['./visit-history-component/visit-history.component.scss']
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

  formatDateForDisplay(dateStr: string | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  onFromDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const match = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3];
      this.filterFromDate = `${year}-${month}-${day}`;
      this.applyFilters();
    }
  }

  onFromDatePickerChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filterFromDate = input.value;
    this.applyFilters();
  }

  onToDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const match = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3];
      this.filterToDate = `${year}-${month}-${day}`;
      this.applyFilters();
    }
  }

  onToDatePickerChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filterToDate = input.value;
    this.applyFilters();
  }
}
