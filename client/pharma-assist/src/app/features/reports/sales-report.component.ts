import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

interface SalesData {
  period: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
}

interface TopItem {
  name: string;
  value: number;
  percentage: number;
}

@Component({
  selector: 'app-sales-report',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, FormsModule],
  templateUrl: './sales-report-component/sales-report.component.html',
  styleUrls: ['./sales-report-component/sales-report.component.scss']
})
export class SalesReportComponent implements OnInit {
  startDate = '';
  endDate = '';
  selectedRange = '30d';

  totalRevenue = signal(45230.50);
  totalOrders = signal(128);
  avgOrderValue = signal(353.36);

  dailySales = signal([
    { label: 'Mon', value: 5200 },
    { label: 'Tue', value: 4800 },
    { label: 'Wed', value: 6100 },
    { label: 'Thu', value: 5500 },
    { label: 'Fri', value: 7200 },
    { label: 'Sat', value: 8900 },
    { label: 'Sun', value: 3200 }
  ]);

  maxDailySale = signal(8900);

  topProducts = signal<TopItem[]>([
    { name: 'Aspirin 500mg', value: 8450.00, percentage: 100 },
    { name: 'Ibuprofen 400mg', value: 6230.50, percentage: 74 },
    { name: 'Paracetamol 500mg', value: 5120.00, percentage: 61 },
    { name: 'Vitamin C 1000mg', value: 4890.00, percentage: 58 },
    { name: 'Omeprazol 20mg', value: 3560.00, percentage: 42 }
  ]);

  topCustomers = signal<TopItem[]>([
    { name: 'Gradska Apoteka Sarajevo', value: 12500.00, percentage: 100 },
    { name: 'Apoteka Centar Mostar', value: 9800.50, percentage: 78 },
    { name: 'Klinički Centar Tuzla', value: 7450.00, percentage: 60 },
    { name: 'Apoteka Banja Luka', value: 5230.00, percentage: 42 },
    { name: 'Dom Zdravlja Zenica', value: 4120.00, percentage: 33 }
  ]);

  ngOnInit(): void {
    this.setRange('30d');
  }

  setRange(range: string): void {
    this.selectedRange = range;
    const today = new Date();
    let start = new Date();
    switch (range) {
      case '7d': start.setDate(today.getDate() - 7); break;
      case '30d': start.setDate(today.getDate() - 30); break;
      case 'month': start = new Date(today.getFullYear(), today.getMonth(), 1); break;
      case 'year': start = new Date(today.getFullYear(), 0, 1); break;
    }
    this.startDate = start.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
  }

  generateReport(): void {
    // Generate report logic
  }
}
