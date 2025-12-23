import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ReportService } from '../../core/services/report.service';
import { ReportFilters, ReportPeriod, FinancialReport } from '../../core/models/report.model';

@Component({
  selector: 'app-financial-report',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule, CurrencyPipe, DecimalPipe],
  templateUrl: './financial-report-component/financial-report.component.html',
  styleUrls: ['./financial-report-component/financial-report.component.scss']
})
export class FinancialReportComponent implements OnInit {
  private readonly reportService = inject(ReportService);

  loading = signal(false);
  report = signal<FinancialReport | null>(null);
  selectedPeriod: ReportPeriod = 'this_month';

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.loading.set(true);
    const filters: ReportFilters = { period: this.selectedPeriod };

    this.reportService.getFinancialReport(filters).subscribe({
      next: (data) => {
        this.report.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  exportReport(): void {
    this.reportService.exportReport('financial', 'csv', { period: this.selectedPeriod });
  }
}
