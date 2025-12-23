import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

interface InventoryItem {
  name: string;
  sku: string;
  category: string;
  stock: number;
  value: number;
  status: 'ok' | 'low' | 'critical';
}

@Component({
  selector: 'app-inventory-report',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, FormsModule],
  templateUrl: './inventory-report-component/inventory-report.component.html',
  styleUrls: ['./inventory-report-component/inventory-report.component.scss']
})
export class InventoryReportComponent implements OnInit {
  totalItems = signal(1245);
  totalValue = signal(456780.50);
  stockIn = signal(342);
  stockOut = signal(215);

  statusCounts = signal({ ok: 1102, low: 98, critical: 45 });

  categoryBreakdown = signal([
    { name: 'Pain Relief', count: 245, value: 89450, percentage: 100, color: '#0aaaaa' },
    { name: 'Antibiotics', count: 189, value: 76230, percentage: 85, color: '#3b82f6' },
    { name: 'Vitamins', count: 312, value: 54120, percentage: 60, color: '#8b5cf6' },
    { name: 'Cardiovascular', count: 156, value: 98540, percentage: 70, color: '#f59e0b' },
    { name: 'Dermatology', count: 98, value: 32450, percentage: 36, color: '#ec4899' }
  ]);

  manufacturerBreakdown = signal([
    { name: 'Bosnalijek', count: 312, value: 124500, percentage: 100, color: '#0aaaaa' },
    { name: 'Hemofarm', count: 245, value: 98760, percentage: 79, color: '#3b82f6' },
    { name: 'Alkaloid', count: 189, value: 76430, percentage: 61, color: '#8b5cf6' },
    { name: 'Pliva', count: 156, value: 65890, percentage: 53, color: '#f59e0b' },
    { name: 'Galenika', count: 134, value: 54230, percentage: 44, color: '#ec4899' }
  ]);

  lowStockItems = signal<InventoryItem[]>([
    { name: 'Amoxicillin 500mg', sku: 'AMX-500', category: 'Antibiotics', stock: 12, value: 156.00, status: 'critical' },
    { name: 'Metformin 850mg', sku: 'MTF-850', category: 'Diabetes', stock: 28, value: 89.50, status: 'low' },
    { name: 'Lisinopril 10mg', sku: 'LSP-010', category: 'Cardiovascular', stock: 8, value: 234.00, status: 'critical' },
    { name: 'Omeprazole 20mg', sku: 'OMP-020', category: 'Gastrointestinal', stock: 35, value: 178.50, status: 'low' },
    { name: 'Amlodipine 5mg', sku: 'AML-005', category: 'Cardiovascular', stock: 15, value: 145.00, status: 'critical' }
  ]);

  ngOnInit(): void {}
}
