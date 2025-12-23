import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { EuropeanDatePipe } from '../../core/pipes';
import { InventoryService } from '../../core/services/inventory.service';
import { NotificationService } from '../../core/services/notification.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PaginationComponent, PageEvent } from '../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { BadgeVariant } from '../../shared/components/status-badge';

interface ExpiringProduct {
  id: string;
  productName: string;
  productSku: string;
  batchNumber: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  quantity: number;
  location: string;
  manufacturer: string;
  value: number;
  status: 'expired' | 'critical' | 'warning' | 'normal';
}

@Component({
  selector: 'app-expiring-products-report',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    FormsModule,
    EuropeanDatePipe,
    StatusBadgeComponent,
    PaginationComponent,
    EmptyStateComponent
  ],
  templateUrl: './expiring-products-report-component/expiring-products-report.component.html',
  styleUrls: ['./expiring-products-report-component/expiring-products-report.component.scss']
})
export class ExpiringProductsReportComponent implements OnInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);

  products = signal<ExpiringProduct[]>([]);
  loading = signal(true);

  expiryRange = 'all';
  searchTerm = '';
  sortBy = 'daysAsc';

  currentPage = signal(1);
  pageSize = signal(20);

  Math = Math;

  filteredProducts = computed(() => {
    let filtered = [...this.products()];

    if (this.expiryRange !== 'all') {
      if (this.expiryRange === 'expired') {
        filtered = filtered.filter(p => p.daysUntilExpiry < 0);
      } else {
        const days = parseInt(this.expiryRange, 10);
        filtered = filtered.filter(p => p.daysUntilExpiry >= 0 && p.daysUntilExpiry <= days);
      }
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.productName.toLowerCase().includes(term) ||
        p.productSku.toLowerCase().includes(term) ||
        p.batchNumber.toLowerCase().includes(term)
      );
    }

    switch (this.sortBy) {
      case 'daysAsc':
        filtered.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
        break;
      case 'daysDesc':
        filtered.sort((a, b) => b.daysUntilExpiry - a.daysUntilExpiry);
        break;
      case 'valueDesc':
        filtered.sort((a, b) => b.value - a.value);
        break;
      case 'quantityDesc':
        filtered.sort((a, b) => b.quantity - a.quantity);
        break;
    }

    return filtered;
  });

  paginatedProducts = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return this.filteredProducts().slice(start, start + size);
  });

  expiredCount = computed(() => this.products().filter(p => p.status === 'expired').length);
  expiredValue = computed(() => this.products().filter(p => p.status === 'expired').reduce((sum, p) => sum + p.value, 0));

  criticalCount = computed(() => this.products().filter(p => p.status === 'critical').length);
  criticalValue = computed(() => this.products().filter(p => p.status === 'critical').reduce((sum, p) => sum + p.value, 0));

  warningCount = computed(() => this.products().filter(p => p.status === 'warning').length);
  warningValue = computed(() => this.products().filter(p => p.status === 'warning').reduce((sum, p) => sum + p.value, 0));

  totalAtRisk = computed(() => this.expiredCount() + this.criticalCount() + this.warningCount());
  totalRiskValue = computed(() => this.expiredValue() + this.criticalValue() + this.warningValue());

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    setTimeout(() => {
      const mockData: ExpiringProduct[] = this.generateMockData();
      this.products.set(mockData);
      this.loading.set(false);
    }, 800);
  }

  private generateMockData(): ExpiringProduct[] {
    const now = new Date();
    const products: ExpiringProduct[] = [];

    const productNames = [
      'Aspirin 500mg', 'Ibuprofen 400mg', 'Amoxicillin 250mg',
      'Paracetamol 500mg', 'Omeprazole 20mg', 'Metformin 850mg',
      'Atorvastatin 10mg', 'Lisinopril 5mg', 'Amlodipine 5mg',
      'Pantoprazole 40mg', 'Losartan 50mg', 'Diclofenac 50mg'
    ];

    const locations = ['Warehouse A', 'Warehouse B', 'Store 1', 'Store 2'];
    const manufacturers = ['Bosnalijek', 'Hemofarm', 'Pliva', 'Galenika'];

    for (let i = 0; i < 50; i++) {
      const daysUntilExpiry = Math.floor(Math.random() * 200) - 30;
      const expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);

      let status: ExpiringProduct['status'];
      if (daysUntilExpiry < 0) {
        status = 'expired';
      } else if (daysUntilExpiry <= 30) {
        status = 'critical';
      } else if (daysUntilExpiry <= 90) {
        status = 'warning';
      } else {
        status = 'normal';
      }

      products.push({
        id: `EP-${i + 1}`,
        productName: productNames[Math.floor(Math.random() * productNames.length)],
        productSku: `SKU-${1000 + i}`,
        batchNumber: `BATCH-${2024}${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
        expiryDate,
        daysUntilExpiry,
        quantity: Math.floor(Math.random() * 500) + 10,
        location: locations[Math.floor(Math.random() * locations.length)],
        manufacturer: manufacturers[Math.floor(Math.random() * manufacturers.length)],
        value: Math.floor(Math.random() * 5000) + 100,
        status
      });
    }

    return products.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }

  applyFilters(): void {
    this.currentPage.set(1);
  }

  onSearchChange(): void {
    this.currentPage.set(1);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.page);
  }

  getStatusVariant(status: string): BadgeVariant {
    const variants: Record<string, BadgeVariant> = {
      'expired': 'danger',
      'critical': 'warning',
      'warning': 'info',
      'normal': 'success'
    };
    return variants[status] || 'secondary';
  }

  hasExpiredOrCritical(): boolean {
    return this.expiredCount() > 0 || this.criticalCount() > 0;
  }

  exportReport(): void {
    this.notificationService.info(
      this.translateService.instant('reports.expiring.exportStarted')
    );
  }

  createTransfer(product: ExpiringProduct): void {
    this.notificationService.info(
      this.translateService.instant('reports.expiring.transferInitiated', { product: product.productName })
    );
  }

  createAdjustment(product: ExpiringProduct): void {
    this.notificationService.info(
      this.translateService.instant('reports.expiring.adjustmentInitiated', { product: product.productName })
    );
  }

  writeOff(product: ExpiringProduct): void {
    this.notificationService.warning(
      this.translateService.instant('reports.expiring.writeOffConfirm', { product: product.productName })
    );
  }

  writeOffAllExpired(): void {
    this.notificationService.warning(
      this.translateService.instant('reports.expiring.writeOffAllConfirm', { count: this.expiredCount() })
    );
  }

  prioritizeForSale(): void {
    this.notificationService.info(
      this.translateService.instant('reports.expiring.prioritizeSuccess', { count: this.criticalCount() })
    );
  }
}
