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

  onStartDateChange(value: string): void {
    const parsed = this.tryParseIsoDateOnly(value);
    if (!parsed) return;
    this.startDate = this.startOfDay(parsed);
  }

  onEndDateChange(value: string): void {
    const parsed = this.tryParseIsoDateOnly(value);
    if (!parsed) return;
    this.endDate = this.endOfDay(parsed);
  }

  get startDateIso(): string {
    return this.toIsoDateOnly(this.startDate);
  }

  get endDateIso(): string {
    return this.toIsoDateOnly(this.endDate);
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

  private toIsoDateOnly(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private tryParseIsoDateOnly(value: string): Date | null {
    const trimmed = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
    const d = new Date(trimmed + 'T00:00:00');
    return Number.isNaN(d.getTime()) ? null : d;
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  }

  private endOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  }
}
