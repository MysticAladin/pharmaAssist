import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PhysicianService } from '../../../core/services/physician.service';
import { CustomerVisitHistory, CrossRepVisit } from '../../../core/models/hospital.model';
import { PaginationComponent, PageEvent } from '../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-customer-visits',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    TranslateModule,
    PaginationComponent,
    EmptyStateComponent,
    StatusBadgeComponent
  ],
  templateUrl: './customer-visits.component.html'
})
export class CustomerVisitsComponent implements OnInit {
  private readonly physicianService = inject(PhysicianService);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  customerId = signal<number>(0);
  loading = signal(true);
  history = signal<CustomerVisitHistory | null>(null);

  // Filters
  fromDate = signal('');
  toDate = signal('');
  currentPage = signal(1);
  pageSize = signal(20);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('customerId');
    if (id) {
      this.customerId.set(+id);
      this.loadVisits();
    }
  }

  loadVisits(): void {
    this.loading.set(true);
    this.physicianService.getCustomerVisitHistory(
      this.customerId(),
      this.currentPage(),
      this.pageSize(),
      this.fromDate() || undefined,
      this.toDate() || undefined
    ).subscribe({
      next: (data) => {
        this.history.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.page);
    this.pageSize.set(event.pageSize);
    this.loadVisits();
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadVisits();
  }

  updateFromDate(value: string): void {
    this.fromDate.set(value);
  }

  updateToDate(value: string): void {
    this.toDate.set(value);
  }

  getOutcomeBadgeVariant(outcome: string | undefined): 'success' | 'warning' | 'danger' | 'neutral' {
    switch (outcome) {
      case 'Positive': return 'success';
      case 'Neutral': return 'warning';
      case 'Negative': return 'danger';
      default: return 'neutral';
    }
  }

  formatDuration(minutes: number | undefined): string {
    if (!minutes) return '-';
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
}
