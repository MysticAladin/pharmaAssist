import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthStateService } from '../../core/state/auth-state.service';
import { FeatureFlagService } from '../../core/state/feature-flag.service';
import { FeatureKey } from '../../core/models/feature-flag.model';
import { HasFeatureDirective } from '../../core/directives/feature.directive';
import { TranslateModule } from '@ngx-translate/core';
import { DashboardService, DashboardData, DashboardAlert } from '../../core/services/dashboard.service';
import { OrderSummary, OrderStatus, PaymentStatus } from '../../core/models/order.model';
import { BarcodeScannerComponent } from '../../shared/components/barcode-scanner/barcode-scanner.component';
import { ActivityFeedComponent } from '../../shared/components/activity-feed/activity-feed.component';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HasFeatureDirective, TranslateModule, BarcodeScannerComponent, ActivityFeedComponent],
  templateUrl: './dashboard-component/dashboard.component.html',
  styleUrls: ['./dashboard-component/dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authState = inject(AuthStateService);
  private readonly featureFlags = inject(FeatureFlagService);
  private readonly dashboardService = inject(DashboardService);

  user = this.authState.user;
  advancedAnalyticsKey = FeatureKey.AdvancedAnalytics;

  // Dashboard state
  loading = signal(true);
  dashboardData = signal<DashboardData | null>(null);
  showBarcodeScanner = signal(false);

  // Computed signals for template
  recentOrders = computed(() => this.dashboardData()?.recentOrders ?? []);
  alerts = computed(() => this.dashboardData()?.alerts ?? []);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading.set(true);
    this.dashboardService.getDashboardData().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        // Show mock data on error for development
        this.dashboardData.set(this.getMockData());
      }
    });
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  createNewOrder(): void {
    this.router.navigate(['/orders/new']);
  }

  openBarcodeScanner(): void {
    this.showBarcodeScanner.set(true);
  }

  onBarcodeProductSelected(product: Product): void {
    // Navigate to product detail page
    this.router.navigate(['/products', product.id]);
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('bs-BA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value) + ' KM';
  }

  getStatusClass(status: OrderStatus): string {
    const statusClasses: Record<OrderStatus, string> = {
      [OrderStatus.Pending]: 'pending',
      [OrderStatus.Confirmed]: 'processing',
      [OrderStatus.Processing]: 'processing',
      [OrderStatus.ReadyForShipment]: 'shipped',
      [OrderStatus.Shipped]: 'shipped',
      [OrderStatus.Delivered]: 'completed',
      [OrderStatus.Cancelled]: 'cancelled',
      [OrderStatus.Returned]: 'cancelled'
    };
    return statusClasses[status] || 'pending';
  }

  getStatusLabel(status: OrderStatus): string {
    const statusLabels: Record<OrderStatus, string> = {
      [OrderStatus.Pending]: 'orders.status.pending',
      [OrderStatus.Confirmed]: 'orders.status.confirmed',
      [OrderStatus.Processing]: 'orders.status.processing',
      [OrderStatus.ReadyForShipment]: 'orders.status.readyForShipment',
      [OrderStatus.Shipped]: 'orders.status.shipped',
      [OrderStatus.Delivered]: 'orders.status.delivered',
      [OrderStatus.Cancelled]: 'orders.status.cancelled',
      [OrderStatus.Returned]: 'orders.status.returned'
    };
    return statusLabels[status] || 'orders.status.pending';
  }

  private getMockData(): DashboardData {
    return {
      stats: {
        orders: {
          todayCount: 156,
          todayRevenue: 24560,
          pendingCount: 23,
          changePercent: 12
        },
        inventory: {
          totalProducts: 1234,
          lowStockCount: 12,
          expiringCount: 8,
          changePercent: -2
        },
        prescriptions: {
          pendingCount: 15,
          urgentCount: 3
        }
      },
      recentOrders: [
        {
          id: 1,
          orderNumber: 'ORD-2024-0156',
          customerName: 'Apoteka Centar',
          customerCode: 'APT-001',
          status: OrderStatus.Pending,
          statusName: 'Pending',
          paymentStatus: PaymentStatus.Pending,
          paymentStatusName: 'Pending',
          orderDate: new Date(),
          totalAmount: 1250.00,
          itemCount: 5
        },
        {
          id: 2,
          orderNumber: 'ORD-2024-0155',
          customerName: 'Farmacija Plus',
          customerCode: 'APT-002',
          status: OrderStatus.Processing,
          statusName: 'Processing',
          paymentStatus: PaymentStatus.Pending,
          paymentStatusName: 'Pending',
          orderDate: new Date(),
          totalAmount: 890.50,
          itemCount: 3
        },
        {
          id: 3,
          orderNumber: 'ORD-2024-0154',
          customerName: 'Zdravlje d.o.o.',
          customerCode: 'APT-003',
          status: OrderStatus.Delivered,
          statusName: 'Delivered',
          paymentStatus: PaymentStatus.Paid,
          paymentStatusName: 'Paid',
          orderDate: new Date(),
          totalAmount: 2340.00,
          itemCount: 8
        }
      ],
      alerts: [
        {
          id: 'low-stock-1',
          type: 'warning',
          title: 'Paracetamol 500mg',
          description: 'Only 15 boxes in stock',
          link: '/inventory'
        },
        {
          id: 'expiring-1',
          type: 'danger',
          title: 'Brufen 400mg',
          description: 'Expires in 7 days (Batch: 2024-08)',
          link: '/reports/expiring'
        }
      ],
      lowStockItems: [],
      expiringItems: []
    };
  }
}
