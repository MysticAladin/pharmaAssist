import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ReportService } from '../../core/services/report.service';
import { CustomerSalesReport } from '../../core/models/report.model';
import { CustomerService } from '../../core/services/customer.service';
import type { CustomerSummary } from '../../core/models/customer.model';

@Component({
  selector: 'app-customer-report',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule, CurrencyPipe, DecimalPipe],
  templateUrl: './customer-report-component/customer-report.component.html',
  styleUrls: ['./customer-report-component/customer-report.component.scss']
})
export class CustomerReportComponent implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly customerService = inject(CustomerService);

  loading = signal(false);
  customers = signal<CustomerSummary[]>([]);
  report = signal<CustomerSalesReport | null>(null);

  selectedCustomerId: number | null = null;
  includeChildBranches = true;

  startDate: Date = new Date();
  endDate: Date = new Date();

  ngOnInit(): void {
    this.endDate = this.endOfDay(new Date());
    const start = new Date();
    start.setDate(start.getDate() - 30);
    this.startDate = this.startOfDay(start);

    this.loadCustomers();
  }

  private loadCustomers(): void {
    this.customerService.getSummaries().subscribe({
      next: (res) => {
        this.customers.set(res.data ?? []);
      },
      error: () => {
        this.customers.set([]);
      }
    });
  }

  get selectedCustomer(): CustomerSummary | null {
    const id = this.selectedCustomerId;
    if (!id) return null;
    return this.customers().find(c => c.id === id) ?? null;
  }

  get canIncludeBranches(): boolean {
    return this.selectedCustomer?.isHeadquarters === true;
  }

  onCustomerChange(): void {
    if (!this.canIncludeBranches) {
      this.includeChildBranches = false;
    }
    this.report.set(null);
  }

  onStartDateTextChange(value: string): void {
    const parsed = this.tryParseEuDate(value);
    if (!parsed) return;
    this.startDate = this.startOfDay(parsed);
  }

  onEndDateTextChange(value: string): void {
    const parsed = this.tryParseEuDate(value);
    if (!parsed) return;
    this.endDate = this.endOfDay(parsed);
  }

  get startDateText(): string {
    return this.toEuDateOnly(this.startDate);
  }

  get endDateText(): string {
    return this.toEuDateOnly(this.endDate);
  }

  generateReport(): void {
    if (!this.selectedCustomerId) {
      this.report.set(null);
      return;
    }

    this.loading.set(true);
    this.reportService.getCustomerSalesReport({
      startDate: this.startDate,
      endDate: this.endDate,
      customerId: this.selectedCustomerId,
      includeChildBranches: this.canIncludeBranches ? this.includeChildBranches : false
    }).subscribe({
      next: (data) => {
        this.report.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load customer sales report', err);
        this.report.set(null);
        this.loading.set(false);
      }
    });
  }

  private toEuDateOnly(date: Date): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }

  private tryParseEuDate(value: string): Date | null {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Accept both '.' and '/' as separators
    const normalized = trimmed.replace(/\//g, '.');
    const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(normalized);
    if (!match) return null;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null;

    const candidate = new Date(year, month - 1, day);
    if (
      candidate.getFullYear() !== year ||
      candidate.getMonth() !== month - 1 ||
      candidate.getDate() !== day
    ) {
      return null;
    }

    return candidate;
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  }

  private endOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  }
}
