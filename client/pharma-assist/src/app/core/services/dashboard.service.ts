import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, catchError, of } from 'rxjs';
import { OrderService, OrderStats } from './order.service';
import { InventoryService } from './inventory.service';
import { PrescriptionService, PrescriptionStats } from './prescription.service';
import { StockLevel } from '../models/inventory.model';
import { OrderSummary, OrderStatus } from '../models/order.model';

export interface DashboardStats {
  orders: {
    todayCount: number;
    todayRevenue: number;
    pendingCount: number;
    changePercent: number;
  };
  inventory: {
    totalProducts: number;
    lowStockCount: number;
    expiringCount: number;
    changePercent: number;
  };
  prescriptions: {
    pendingCount: number;
    urgentCount: number;
  };
}

export interface DashboardAlert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  title: string;
  description: string;
  link?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentOrders: OrderSummary[];
  alerts: DashboardAlert[];
  lowStockItems: StockLevel[];
  expiringItems: StockLevel[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly orderService = inject(OrderService);
  private readonly inventoryService = inject(InventoryService);
  private readonly prescriptionService = inject(PrescriptionService);

  /**
   * Get all dashboard data in one call
   */
  getDashboardData(): Observable<DashboardData> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return forkJoin({
      orderStats: this.orderService.getOrderStats(today).pipe(catchError(() => of(this.getEmptyOrderStats()))),
      recentOrders: this.orderService.getOrders(1, 5).pipe(
        map(response => response.items || []),
        catchError(() => of([] as OrderSummary[]))
      ),
      lowStock: this.inventoryService.getLowStockProducts().pipe(
        map(response => response.data || []),
        catchError(() => of([] as StockLevel[]))
      ),
      expiring: this.inventoryService.getExpiringProducts(30).pipe(
        map(response => response.data || []),
        catchError(() => of([] as StockLevel[]))
      ),
      prescriptionStats: this.prescriptionService.getStats().pipe(catchError(() => of(this.getEmptyPrescriptionStats())))
    }).pipe(
      map(data => this.transformToDashboardData(data))
    );
  }

  /**
   * Get order statistics only
   */
  getOrderStats(): Observable<OrderStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.orderService.getOrderStats(today);
  }

  /**
   * Get low stock items
   */
  getLowStockItems(): Observable<StockLevel[]> {
    return this.inventoryService.getLowStockProducts().pipe(
      map(response => response.data || []),
      catchError(() => of([]))
    );
  }

  /**
   * Get expiring items
   */
  getExpiringItems(days: number = 30): Observable<StockLevel[]> {
    return this.inventoryService.getExpiringProducts(days).pipe(
      map(response => response.data || []),
      catchError(() => of([]))
    );
  }

  /**
   * Get prescription stats
   */
  getPrescriptionStats(): Observable<PrescriptionStats> {
    return this.prescriptionService.getStats().pipe(
      catchError(() => of(this.getEmptyPrescriptionStats()))
    );
  }

  /**
   * Get recent orders
   */
  getRecentOrders(count: number = 5): Observable<OrderSummary[]> {
    return this.orderService.getOrders(1, count).pipe(
      map(response => response.items || []),
      catchError(() => of([]))
    );
  }

  private transformToDashboardData(data: {
    orderStats: OrderStats;
    recentOrders: OrderSummary[];
    lowStock: StockLevel[];
    expiring: StockLevel[];
    prescriptionStats: PrescriptionStats;
  }): DashboardData {
    // Generate alerts from low stock and expiring items
    const alerts: DashboardAlert[] = [];

    // Add low stock alerts
    data.lowStock.slice(0, 3).forEach((item, index) => {
      alerts.push({
        id: `low-stock-${index}`,
        type: item.totalQuantity <= (item.reorderLevel || 0) / 2 ? 'danger' : 'warning',
        title: item.productName || 'Unknown Product',
        description: `Only ${item.totalQuantity} units in stock`,
        link: '/inventory'
      });
    });

    // Add expiring alerts from batch info
    data.expiring.slice(0, 2).forEach((item, index) => {
      const expiringBatch = item.batches?.find(b => b.isExpiringSoon);
      const daysUntilExpiry = expiringBatch?.daysUntilExpiry || 30;
      alerts.push({
        id: `expiring-${index}`,
        type: daysUntilExpiry <= 7 ? 'danger' : 'warning',
        title: item.productName || 'Unknown Product',
        description: `Expires in ${daysUntilExpiry} days (Batch: ${expiringBatch?.batchNumber || 'N/A'})`,
        link: '/reports/expiring'
      });
    });

    // Add urgent prescription alerts
    if (data.prescriptionStats.urgentCount > 0) {
      alerts.unshift({
        id: 'urgent-prescriptions',
        type: 'danger',
        title: 'Urgent Prescriptions',
        description: `${data.prescriptionStats.urgentCount} prescription(s) require immediate attention`,
        link: '/prescriptions'
      });
    }

    return {
      stats: {
        orders: {
          todayCount: data.orderStats.totalOrders,
          todayRevenue: data.orderStats.totalRevenue,
          pendingCount: data.orderStats.pendingOrders,
          changePercent: 12 // TODO: Calculate from historical data
        },
        inventory: {
          totalProducts: 0, // Would need separate API call
          lowStockCount: data.lowStock.length,
          expiringCount: data.expiring.length,
          changePercent: -2 // TODO: Calculate from historical data
        },
        prescriptions: {
          pendingCount: data.prescriptionStats.pending + data.prescriptionStats.underReview,
          urgentCount: data.prescriptionStats.urgentCount
        }
      },
      recentOrders: data.recentOrders,
      alerts,
      lowStockItems: data.lowStock,
      expiringItems: data.expiring
    };
  }

  private getEmptyOrderStats(): OrderStats {
    return {
      totalOrders: 0,
      pendingOrders: 0,
      processingOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      ordersWithPrescription: 0
    };
  }

  private getEmptyPrescriptionStats(): PrescriptionStats {
    return {
      pending: 0,
      underReview: 0,
      approved: 0,
      rejected: 0,
      dispensed: 0,
      urgentCount: 0,
      controlledCount: 0
    };
  }
}
