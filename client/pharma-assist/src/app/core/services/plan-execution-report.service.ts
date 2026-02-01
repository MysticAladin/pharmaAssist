import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DailyActivityReport,
  WeeklyActivityReport,
  MonthlyActivityReport,
  PlanExecutionReport,
  TeamExecutionSummary
} from '../models/plan-execution-report.model';

@Injectable({
  providedIn: 'root'
})
export class PlanExecutionReportService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/reports/plan-execution`;

  /**
   * Get daily activity report for a sales rep
   */
  getDailyActivityReport(repId: number, date?: Date): Observable<DailyActivityReport> {
    let params = new HttpParams();
    if (date) {
      params = params.set('date', date.toISOString());
    }
    return this.http.get<DailyActivityReport>(`${this.apiUrl}/daily/${repId}`, { params });
  }

  /**
   * Get daily activity reports for a date range
   */
  getDailyActivityReportsRange(repId: number, startDate: Date, endDate: Date): Observable<DailyActivityReport[]> {
    const params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());
    return this.http.get<DailyActivityReport[]>(`${this.apiUrl}/daily/${repId}/range`, { params });
  }

  /**
   * Get weekly activity report for a sales rep
   */
  getWeeklyActivityReport(repId: number, weekStart?: Date): Observable<WeeklyActivityReport> {
    let params = new HttpParams();
    if (weekStart) {
      params = params.set('weekStart', weekStart.toISOString());
    }
    return this.http.get<WeeklyActivityReport>(`${this.apiUrl}/weekly/${repId}`, { params });
  }

  /**
   * Get monthly activity report with comprehensive analysis
   */
  getMonthlyActivityReport(
    repId: number,
    year?: number,
    month?: number,
    options?: {
      includeProducts?: boolean;
      includeCustomers?: boolean;
      includeTerritories?: boolean;
    }
  ): Observable<MonthlyActivityReport> {
    let params = new HttpParams();
    if (year) params = params.set('year', year.toString());
    if (month) params = params.set('month', month.toString());
    if (options?.includeProducts !== undefined) {
      params = params.set('includeProducts', options.includeProducts.toString());
    }
    if (options?.includeCustomers !== undefined) {
      params = params.set('includeCustomers', options.includeCustomers.toString());
    }
    if (options?.includeTerritories !== undefined) {
      params = params.set('includeTerritories', options.includeTerritories.toString());
    }
    return this.http.get<MonthlyActivityReport>(`${this.apiUrl}/monthly/${repId}`, { params });
  }

  /**
   * Get plan execution report comparing planned vs actual across hierarchy
   */
  getPlanExecutionReport(repId: number, startDate?: Date, endDate?: Date): Observable<PlanExecutionReport> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate.toISOString());
    if (endDate) params = params.set('endDate', endDate.toISOString());
    return this.http.get<PlanExecutionReport>(`${this.apiUrl}/execution/${repId}`, { params });
  }

  /**
   * Get team execution summary for a manager
   */
  getTeamExecutionSummary(startDate?: Date, endDate?: Date): Observable<TeamExecutionSummary> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate.toISOString());
    if (endDate) params = params.set('endDate', endDate.toISOString());
    return this.http.get<TeamExecutionSummary>(`${this.apiUrl}/team`, { params });
  }

  /**
   * Get team daily activity for a manager
   */
  getTeamDailyActivity(date?: Date): Observable<DailyActivityReport[]> {
    let params = new HttpParams();
    if (date) {
      params = params.set('date', date.toISOString());
    }
    return this.http.get<DailyActivityReport[]>(`${this.apiUrl}/team/daily`, { params });
  }
}
