import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface RepDashboardSummary {
  repId: number;
  repName: string;
  periodStart: Date;
  periodEnd: Date;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalVisits: number;
  plannedVisits: number;
  completedVisits: number;
  visitCompletionRate: number;
  assignedCustomers: number;
  customersVisited: number;
  revenueGrowthPercent: number;
  pendingOfflineOrders: number;
}

export interface RepDashboardWidgets {
  todayOrders: number;
  todayRevenue: number;
  todayVisits: number;
  weekOrders: number;
  weekRevenue: number;
  monthOrders: number;
  monthRevenue: number;
  plannedVisitsToday: number;
  overdueVisits: number;
}

export interface RecentOrder {
  orderId: number;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: string;
  orderDate: Date;
  itemCount: number;
}

export interface TodaySchedule {
  date: Date;
  plannedVisits: ScheduledVisit[];
  executedVisits: ExecutedVisitSummary[];
  totalPlanned: number;
  totalCompleted: number;
}

export interface ScheduledVisit {
  visitId: number;
  customerId: number;
  customerName: string;
  customerAddress: string;
  scheduledTime?: string;
  visitType: string;
  status: string;
  notes?: string;
}

export interface ExecutedVisitSummary {
  visitId: number;
  customerId: number;
  customerName: string;
  checkInTime: Date;
  checkOutTime?: Date;
  duration?: number;
  orderTaken: boolean;
}

export interface TopCustomer {
  customerId: number;
  customerName: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  lastOrderDate: Date;
}

export interface SalesTrends {
  fromDate: Date;
  toDate: Date;
  dataPoints: TrendDataPoint[];
}

export interface TrendDataPoint {
  date: Date;
  orders: number;
  revenue: number;
  visits: number;
}

export interface RepTargetProgress {
  year: number;
  month: number;
  daysElapsed: number;
  totalDays: number;
  targets: TargetItem[];
}

export interface TargetItem {
  targetId: number;
  name: string;
  type: string;
  targetValue: number;
  currentValue: number;
  achievementPercent: number;
  isAchieved: boolean;
  status: 'OnTrack' | 'AtRisk' | 'Behind';
}

@Injectable({
  providedIn: 'root'
})
export class RepDashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/sales-rep/dashboard`;

  getDashboardSummary(fromDate?: Date, toDate?: Date): Observable<RepDashboardSummary> {
    let params = new HttpParams();
    if (fromDate) {
      params = params.set('fromDate', fromDate.toISOString());
    }
    if (toDate) {
      params = params.set('toDate', toDate.toISOString());
    }
    return this.http.get<RepDashboardSummary>(this.baseUrl, { params });
  }

  getWidgets(): Observable<RepDashboardWidgets> {
    return this.http.get<RepDashboardWidgets>(`${this.baseUrl}/widgets`);
  }

  getRecentOrders(count = 10): Observable<RecentOrder[]> {
    const params = new HttpParams().set('count', count.toString());
    return this.http.get<RecentOrder[]>(`${this.baseUrl}/recent-orders`, { params });
  }

  getTodaySchedule(): Observable<TodaySchedule> {
    return this.http.get<TodaySchedule>(`${this.baseUrl}/today-schedule`);
  }

  getTopCustomers(count = 5, daysBack = 30): Observable<TopCustomer[]> {
    const params = new HttpParams()
      .set('count', count.toString())
      .set('daysBack', daysBack.toString());
    return this.http.get<TopCustomer[]>(`${this.baseUrl}/top-customers`, { params });
  }

  getSalesTrends(daysBack = 30): Observable<SalesTrends> {
    const params = new HttpParams().set('daysBack', daysBack.toString());
    return this.http.get<SalesTrends>(`${this.baseUrl}/trends`, { params });
  }

  getTargetProgress(): Observable<RepTargetProgress> {
    return this.http.get<RepTargetProgress>(`${environment.apiUrl}/targets/rep/my-targets`);
  }

  getMyTargets(year?: number, month?: number): Observable<RepTargetProgress> {
    let params = new HttpParams();
    if (year) params = params.set('year', year.toString());
    if (month) params = params.set('month', month.toString());
    return this.http.get<RepTargetProgress>(`${environment.apiUrl}/targets/rep/my-targets`, { params });
  }
}
