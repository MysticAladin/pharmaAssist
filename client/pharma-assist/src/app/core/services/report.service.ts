import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ReportFilters,
  ReportPeriod,
  DateRange,
  SalesReport,
  SalesMetrics,
  SalesTrend,
  TopProduct,
  TopCustomer,
  SalesByCategory,
  InventoryReport,
  InventoryMetrics,
  CustomerReport,
  CustomerMetrics,
  FinancialReport,
  FinancialMetrics
} from '../models/report.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/reports`;

  // Cached reports for quick access
  readonly loading = signal(false);

  /**
   * Get date range for a given period
   */
  getDateRange(period: ReportPeriod, customRange?: DateRange): DateRange {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
      case 'today':
        return { start: today, end: now };

      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { start: yesterday, end: today };
      }

      case 'this_week': {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return { start: startOfWeek, end: now };
      }

      case 'last_week': {
        const endOfLastWeek = new Date(today);
        endOfLastWeek.setDate(today.getDate() - today.getDay());
        const startOfLastWeek = new Date(endOfLastWeek);
        startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
        return { start: startOfLastWeek, end: endOfLastWeek };
      }

      case 'this_month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: startOfMonth, end: now };
      }

      case 'last_month': {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        return { start: startOfLastMonth, end: endOfLastMonth };
      }

      case 'this_quarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
        return { start: startOfQuarter, end: now };
      }

      case 'this_year': {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return { start: startOfYear, end: now };
      }

      case 'custom':
        return customRange || { start: today, end: now };

      default:
        return { start: today, end: now };
    }
  }

  /**
   * Get sales report
   */
  getSalesReport(filters: ReportFilters): Observable<SalesReport> {
    // In production: return this.http.get<SalesReport>(`${this.apiUrl}/sales`, { params });
    return of(this.generateMockSalesReport(filters)).pipe(delay(500));
  }

  /**
   * Get inventory report
   */
  getInventoryReport(filters: ReportFilters): Observable<InventoryReport> {
    return of(this.generateMockInventoryReport(filters)).pipe(delay(500));
  }

  /**
   * Get customer report
   */
  getCustomerReport(filters: ReportFilters): Observable<CustomerReport> {
    return of(this.generateMockCustomerReport(filters)).pipe(delay(500));
  }

  /**
   * Get financial report
   */
  getFinancialReport(filters: ReportFilters): Observable<FinancialReport> {
    return of(this.generateMockFinancialReport(filters)).pipe(delay(500));
  }

  /**
   * Export report to CSV or PDF
   */
  exportReport(type: 'sales' | 'inventory' | 'customer' | 'financial', format: 'csv' | 'pdf', filters: ReportFilters): void {
    // In production, would call backend to generate and download report
    console.log(`Exporting ${type} report as ${format}`, filters);
  }

  // Mock data generators
  private generateMockSalesReport(filters: ReportFilters): SalesReport {
    const range = this.getDateRange(filters.period, filters.customRange);
    const days = Math.ceil((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24));

    const trends: SalesTrend[] = [];
    let totalRevenue = 0;
    let totalOrders = 0;
    let totalItems = 0;

    for (let i = 0; i < Math.min(days, 30); i++) {
      const date = new Date(range.start);
      date.setDate(date.getDate() + i);
      const revenue = 5000 + Math.random() * 15000;
      const orders = 10 + Math.floor(Math.random() * 40);
      const items = orders * (1 + Math.floor(Math.random() * 5));

      trends.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.round(revenue * 100) / 100,
        orders,
        items
      });

      totalRevenue += revenue;
      totalOrders += orders;
      totalItems += items;
    }

    return {
      metrics: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        averageOrderValue: Math.round((totalRevenue / totalOrders) * 100) / 100,
        itemsSold: totalItems,
        revenueGrowth: 12.5 + (Math.random() - 0.5) * 10,
        ordersGrowth: 8.3 + (Math.random() - 0.5) * 8
      },
      trends,
      topProducts: [
        { id: 1, name: 'Paracetamol 500mg', sku: 'PARA-500', quantity: 1250, revenue: 6250, percentage: 15.2 },
        { id: 2, name: 'Ibuprofen 400mg', sku: 'IBU-400', quantity: 980, revenue: 5390, percentage: 13.1 },
        { id: 3, name: 'Vitamin C 1000mg', sku: 'VITC-1000', quantity: 850, revenue: 4250, percentage: 10.3 },
        { id: 4, name: 'Aspirin 100mg', sku: 'ASP-100', quantity: 720, revenue: 2880, percentage: 7.0 },
        { id: 5, name: 'Omeprazole 20mg', sku: 'OME-20', quantity: 650, revenue: 5850, percentage: 14.2 }
      ],
      topCustomers: [
        { id: 1, name: 'General Hospital', email: 'orders@hospital.com', orders: 45, totalSpent: 125000, percentage: 18.5 },
        { id: 2, name: 'City Clinic', email: 'pharmacy@clinic.com', orders: 38, totalSpent: 98500, percentage: 14.6 },
        { id: 3, name: 'Health Center', email: 'orders@health.com', orders: 32, totalSpent: 76200, percentage: 11.3 },
        { id: 4, name: 'Community Pharmacy', email: 'buyer@compharm.com', orders: 28, totalSpent: 54800, percentage: 8.1 },
        { id: 5, name: 'Senior Care Home', email: 'medical@senior.com', orders: 25, totalSpent: 48500, percentage: 7.2 }
      ],
      byCategory: [
        { categoryId: 1, categoryName: 'Pain Relief', revenue: 85000, orders: 320, items: 4500, percentage: 22.5 },
        { categoryId: 2, categoryName: 'Antibiotics', revenue: 72000, orders: 180, items: 2100, percentage: 19.0 },
        { categoryId: 3, categoryName: 'Vitamins', revenue: 58000, orders: 450, items: 5200, percentage: 15.3 },
        { categoryId: 4, categoryName: 'Cardiovascular', revenue: 95000, orders: 150, items: 1800, percentage: 25.1 },
        { categoryId: 5, categoryName: 'Digestive', revenue: 68500, orders: 280, items: 3200, percentage: 18.1 }
      ],
      hourlyDistribution: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        orders: hour >= 8 && hour <= 18 ? 5 + Math.floor(Math.random() * 15) : Math.floor(Math.random() * 3)
      }))
    };
  }

  private generateMockInventoryReport(filters: ReportFilters): InventoryReport {
    return {
      metrics: {
        totalProducts: 1250,
        activeProducts: 1180,
        lowStockCount: 45,
        outOfStockCount: 12,
        expiringThisMonth: 28,
        totalValue: 485000
      },
      byCategory: [
        { categoryId: 1, categoryName: 'Pain Relief', productCount: 85, totalStock: 15000, totalValue: 75000, lowStockCount: 5 },
        { categoryId: 2, categoryName: 'Antibiotics', productCount: 120, totalStock: 8500, totalValue: 128000, lowStockCount: 8 },
        { categoryId: 3, categoryName: 'Vitamins', productCount: 200, totalStock: 25000, totalValue: 62000, lowStockCount: 3 },
        { categoryId: 4, categoryName: 'Cardiovascular', productCount: 95, totalStock: 4200, totalValue: 168000, lowStockCount: 12 },
        { categoryId: 5, categoryName: 'Digestive', productCount: 75, totalStock: 9800, totalValue: 52000, lowStockCount: 4 }
      ],
      expiringProducts: [
        { id: 1, name: 'Amoxicillin 500mg', batchNumber: 'AMX-2024-001', expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), quantity: 500, daysUntilExpiry: 15 },
        { id: 2, name: 'Insulin Regular', batchNumber: 'INS-2024-015', expiryDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000), quantity: 50, daysUntilExpiry: 22 },
        { id: 3, name: 'Eye Drops', batchNumber: 'EYE-2024-008', expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), quantity: 200, daysUntilExpiry: 25 },
        { id: 4, name: 'Nasal Spray', batchNumber: 'NAS-2024-012', expiryDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), quantity: 150, daysUntilExpiry: 28 }
      ],
      stockMovements: Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toISOString().split('T')[0],
          inbound: 200 + Math.floor(Math.random() * 300),
          outbound: 150 + Math.floor(Math.random() * 250),
          adjustments: Math.floor((Math.random() - 0.5) * 50)
        };
      })
    };
  }

  private generateMockCustomerReport(filters: ReportFilters): CustomerReport {
    return {
      metrics: {
        totalCustomers: 850,
        activeCustomers: 620,
        newCustomers: 45,
        repeatCustomerRate: 68.5,
        averageLifetimeValue: 8500
      },
      segments: [
        { name: 'Hospitals', count: 25, revenue: 1250000, percentage: 45.2 },
        { name: 'Clinics', count: 85, revenue: 680000, percentage: 24.6 },
        { name: 'Pharmacies', count: 320, revenue: 520000, percentage: 18.8 },
        { name: 'Care Homes', count: 45, revenue: 185000, percentage: 6.7 },
        { name: 'Others', count: 375, revenue: 130000, percentage: 4.7 }
      ],
      growth: Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - i));
        return {
          date: date.toISOString().split('T')[0].slice(0, 7),
          newCustomers: 30 + Math.floor(Math.random() * 20),
          totalCustomers: 700 + i * 12 + Math.floor(Math.random() * 10)
        };
      }),
      topCustomers: [
        { id: 1, name: 'General Hospital', email: 'orders@hospital.com', orders: 145, totalSpent: 425000, percentage: 18.5 },
        { id: 2, name: 'City Medical Center', email: 'pharmacy@citymed.com', orders: 128, totalSpent: 368000, percentage: 16.0 },
        { id: 3, name: 'Regional Health', email: 'supply@regional.com', orders: 98, totalSpent: 285000, percentage: 12.4 },
        { id: 4, name: 'Community Clinic', email: 'orders@community.com', orders: 85, totalSpent: 198000, percentage: 8.6 },
        { id: 5, name: 'Private Hospital', email: 'med@private.com', orders: 72, totalSpent: 165000, percentage: 7.2 }
      ]
    };
  }

  private generateMockFinancialReport(filters: ReportFilters): FinancialReport {
    return {
      metrics: {
        grossRevenue: 2850000,
        netRevenue: 2565000,
        costOfGoodsSold: 1710000,
        grossProfit: 855000,
        grossMargin: 33.3,
        taxCollected: 285000,
        pendingPayments: 185000,
        overduePayments: 42000
      },
      byPaymentMethod: [
        { method: 'Bank Transfer', amount: 1850000, percentage: 64.9, count: 320 },
        { method: 'Invoice (30 days)', amount: 780000, percentage: 27.4, count: 180 },
        { method: 'Invoice (60 days)', amount: 220000, percentage: 7.7, count: 45 }
      ],
      profitTrends: Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - i));
        const revenue = 200000 + Math.random() * 80000;
        const cost = revenue * (0.55 + Math.random() * 0.1);
        return {
          date: date.toISOString().split('T')[0].slice(0, 7),
          revenue: Math.round(revenue),
          cost: Math.round(cost),
          profit: Math.round(revenue - cost),
          margin: Math.round(((revenue - cost) / revenue) * 100 * 10) / 10
        };
      }),
      revenueBreakdown: [
        { category: 'Product Sales', amount: 2650000, percentage: 93.0 },
        { category: 'Delivery Fees', amount: 85000, percentage: 3.0 },
        { category: 'Late Payment Fees', amount: 45000, percentage: 1.6 },
        { category: 'Other', amount: 70000, percentage: 2.4 }
      ]
    };
  }
}
