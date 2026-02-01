import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { VisitReportService } from '../../core/services/visit-report.service';
import {
  VisitAuditFilter,
  VisitAuditItem,
  VisitAuditResult,
  RepActivitySummary
} from '../../core/models/visit.model';
import { EuropeanDatePipe } from '../../core/pipes';

@Component({
  selector: 'app-visit-audit',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule, EuropeanDatePipe],
  templateUrl: './visit-audit-component/visit-audit.component.html',
  styleUrls: ['./visit-audit-component/visit-audit.component.scss']
})
export class VisitAuditComponent implements OnInit {
  private readonly reportService = inject(VisitReportService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  loading = signal(false);
  error = signal<string | null>(null);
  result = signal<VisitAuditResult | null>(null);
  items = signal<VisitAuditItem[]>([]);
  totalCount = signal(0);
  currentPage = signal(1);
  totalPages = signal(1);
  reps = signal<RepActivitySummary[]>([]);

  // Computed stats
  verifiedCount = computed(() => {
    const items = this.items();
    return items.filter(i => i.locationStatus === 'Valid').length;
  });

  warningCount = computed(() => {
    const items = this.items();
    return items.filter(i => i.locationStatus === 'Warning').length;
  });

  alertCount = computed(() => {
    const items = this.items();
    return items.filter(i => i.locationStatus === 'Alert').length;
  });

  // Filter form values
  filterFromDate: string | null = null;
  filterToDate: string | null = null;
  displayFromDate: string = '';
  displayToDate: string = '';
  filterRepId: number | null = null;
  filterLocationVerified: boolean | null = null;
  filterHasAlert: boolean | null = null;

  private pageSize = 20;

  ngOnInit(): void {
    // Set default date range to last 7 days
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    this.filterFromDate = this.formatDateForInput(sevenDaysAgo);
    this.filterToDate = this.formatDateForInput(today);
    this.displayFromDate = this.formatDisplayDate(sevenDaysAgo);
    this.displayToDate = this.formatDisplayDate(today);

    this.loadReps();
    this.loadData();
  }

  navigateBack(): void {
    this.router.navigate(['/visits/team']);
  }

  // Date input handling (pattern from orders)
  onFromDateInputChange(value: string): void {
    this.displayFromDate = value;
    const parsed = this.parseEuropeanDate(value);
    if (parsed) {
      this.filterFromDate = this.formatDateForInput(parsed);
      this.applyFilters();
    }
  }

  onToDateInputChange(value: string): void {
    this.displayToDate = value;
    const parsed = this.parseEuropeanDate(value);
    if (parsed) {
      this.filterToDate = this.formatDateForInput(parsed);
      this.applyFilters();
    }
  }

  onNativeFromDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      this.filterFromDate = input.value;
      this.displayFromDate = this.formatDisplayDate(new Date(input.value));
      this.applyFilters();
    }
  }

  onNativeToDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      this.filterToDate = input.value;
      this.displayToDate = this.formatDisplayDate(new Date(input.value));
      this.applyFilters();
    }
  }

  private formatDisplayDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  private parseEuropeanDate(value: string): Date | null {
    const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (match) {
      const [, day, month, year] = match;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return null;
  }

  private loadReps(): void {
    // Get reps from team activity (reuse existing endpoint)
    this.reportService.getTeamActivity().subscribe({
      next: (data) => {
        this.reps.set(data.repActivities);
      },
      error: (err) => {
        console.error('Failed to load reps', err);
      }
    });
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    const filter: VisitAuditFilter = {
      fromDate: this.filterFromDate,
      toDate: this.filterToDate,
      repId: this.filterRepId,
      locationVerified: this.filterLocationVerified,
      hasLocationAlert: this.filterHasAlert,
      page: this.currentPage(),
      pageSize: this.pageSize
    };

    this.reportService.getVisitAudit(filter).subscribe({
      next: (data) => {
        this.result.set(data);
        this.items.set(data.items);
        this.totalCount.set(data.totalCount);
        this.totalPages.set(data.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load audit data');
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadData();
  }

  clearFilters(): void {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    this.filterFromDate = this.formatDateForInput(sevenDaysAgo);
    this.filterToDate = this.formatDateForInput(today);
    this.displayFromDate = this.formatDisplayDate(sevenDaysAgo);
    this.displayToDate = this.formatDisplayDate(today);
    this.filterRepId = null;
    this.filterLocationVerified = null;
    this.filterHasAlert = null;
    this.applyFilters();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadData();
  }

  openVisit(visitId: number): void {
    this.router.navigate(['/visits', visitId]);
  }

  openMap(event: Event, item: VisitAuditItem): void {
    event.stopPropagation();
    if (item.visitLatitude && item.visitLongitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${item.visitLatitude},${item.visitLongitude}`;
      window.open(url, '_blank');
    }
  }

  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }

  getLocationBadgeClass(item: VisitAuditItem): string {
    switch (item.locationStatus) {
      case 'Valid': return 'badge--valid';
      case 'Warning': return 'badge--warning';
      case 'Alert': return 'badge--alert';
      default: return 'badge--unknown';
    }
  }

  getLocationLabel(item: VisitAuditItem): string {
    switch (item.locationStatus) {
      case 'Valid': return this.translate.instant('visitAudit.statusValid');
      case 'Warning': return this.translate.instant('visitAudit.statusWarning');
      case 'Alert': return this.translate.instant('visitAudit.statusAlert');
      default: return this.translate.instant('visitAudit.statusUnknown');
    }
  }

  getDistanceClass(item: VisitAuditItem): string {
    if (!item.distanceFromCustomerMeters) return '';
    if (item.distanceFromCustomerMeters < 100) return 'distance--valid';
    if (item.distanceFromCustomerMeters < 500) return 'distance--warning';
    return 'distance--alert';
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
