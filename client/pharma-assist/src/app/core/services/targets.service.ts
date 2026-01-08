import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

// Enums (aligned to server)

// Metric used for measuring target achievement (Domain.Entities.SalesTargetMetric)
export enum TargetType {
  Revenue = 1,
  Quantity = 2,
  Orders = 3,
  NewCustomers = 4,
  Visits = 5
}

// UI convenience only (server uses Year + Month/Quarter)
export enum TargetPeriod {
  Monthly = 1,
  Quarterly = 2,
  Yearly = 3
}

// Type of budget (Domain.Entities.BudgetType)
export enum BudgetCategory {
  Marketing = 1,
  Promotions = 2,
  Samples = 3,
  Travel = 4,
  Training = 5,
  Events = 6,
  Other = 99
}

// Budget approval status (Domain.Entities.BudgetStatus)
export enum BudgetStatus {
  Draft = 1,
  Submitted = 2,
  Approved = 3,
  Rejected = 4,
  Closed = 5
}

export enum ExpenseCategory {
  Advertising = 1,
  Discount = 2,
  Sample = 3,
  Travel = 4,
  Accommodation = 5,
  Meals = 6,
  Materials = 7,
  EventFees = 8,
  Consulting = 9,
  Other = 99
}

// Interfaces (UI-facing; mapped from server DTOs)
export interface SalesTarget {
  id: number;
  name: string;
  description?: string;
  // Reused by UI as “metric”
  targetType: TargetType;
  period: TargetPeriod;
  targetValue: number;
  currentValue: number;
  achievementPercentage: number;

  // Server period fields (kept for editing/mapping)
  year: number;
  month?: number | null;
  quarter?: number | null;

  assignedToUserId?: string | null;
  assignedToUserName?: string | null;
  customerId?: number | null;
  customerName?: string | null;
  productId?: number | null;
  productName?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;

  // Derived for display + existing UI
  startDate: string;
  endDate: string;

  isActive: boolean;
  createdAt: string;
}

// UI form model (kept as-is, but mapped to server CreateSalesTargetDto)
export interface CreateSalesTargetRequest {
  name: string;
  description?: string;
  targetType: TargetType;
  period: TargetPeriod;
  targetValue: number;
  assignedToUserId?: string;
  customerId?: number;
  productId?: number;
  categoryId?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export interface Budget {
  id: number;
  name: string;
  description?: string;
  category: BudgetCategory; // reused by UI as BudgetType

  totalAmount: number;
  spentAmount: number;
  remainingAmount: number;
  utilizationPercentage: number;

  // Server period fields (kept for editing/mapping)
  year: number;
  month?: number | null;
  quarter?: number | null;

  period: TargetPeriod;
  startDate: string;
  endDate: string;

  status: BudgetStatus;
  assignedToUserId?: string | null;
  assignedToUserName?: string | null;

  createdAt: string;
}

// UI form model (kept as-is, but mapped to server CreateBudgetDto)
export interface CreateBudgetRequest {
  name: string;
  description?: string;
  category: BudgetCategory;
  totalAmount: number;
  period: TargetPeriod;
  startDate: string;
  endDate: string;
  // UI-only (server does not store this)
  alertThreshold?: number;
  assignedToUserId?: string;
}

export interface BudgetExpense {
  id: number;
  budgetId: number;
  description: string;
  amount: number;
  expenseDate: string;
  notes?: string;
  createdAt: string;
}

export interface CreateExpenseRequest {
  description: string;
  amount: number;
  expenseDate: string;
  notes?: string;
}

// --- Server DTOs (minimal subset) ---
type SalesTargetDto = {
  id: number;
  name: string;
  description?: string;
  targetType: number;
  userId?: string | null;
  userName?: string | null;
  customerId?: number | null;
  customerName?: string | null;
  productId?: number | null;
  productName?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  year: number;
  month?: number | null;
  quarter?: number | null;
  metric: number;
  targetValue: number;
  currentValue: number;
  achievementPercentage: number;
  isActive: boolean;
  createdAt: string;
};

type BudgetDto = {
  id: number;
  name: string;
  description?: string;
  budgetType: number;
  userId?: string | null;
  userName?: string | null;
  year: number;
  month?: number | null;
  quarter?: number | null;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  utilizationPercentage: number;
  status: number;
  createdAt: string;
};

type BudgetExpenseDto = {
  id: number;
  budgetId: number;
  description: string;
  amount: number;
  expenseDate: string;
  notes?: string;
  createdAt: string;
};

@Injectable({
  providedIn: 'root'
})
export class TargetsService {
  private readonly http = inject(HttpClient);
  private readonly targetsUrl = `${environment.apiUrl}/targets`;
  private readonly budgetsUrl = `${environment.apiUrl}/budgets`;

  private toIsoDate(value: unknown): string {
    if (!value) return '';
    if (typeof value === 'string') {
      // Already ISO date (yyyy-MM-dd) or ISO datetime
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
      return '';
    }
    const d = value instanceof Date ? value : new Date(value as any);
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }

  private getPeriodFromFields(month?: number | null, quarter?: number | null): TargetPeriod {
    if (month != null) return TargetPeriod.Monthly;
    if (quarter != null) return TargetPeriod.Quarterly;
    return TargetPeriod.Yearly;
  }

  private getStartEndFromFields(year: number, month?: number | null, quarter?: number | null): { start: string; end: string } {
    if (month != null) {
      const start = new Date(Date.UTC(year, month - 1, 1));
      const end = new Date(Date.UTC(year, month, 0));
      return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
    }
    if (quarter != null) {
      const startMonth = (quarter - 1) * 3;
      const start = new Date(Date.UTC(year, startMonth, 1));
      const end = new Date(Date.UTC(year, startMonth + 3, 0));
      return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
    }
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year, 12, 0));
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
  }

  private getYearMonthQuarterFromForm(period: TargetPeriod, startDate: unknown): { year: number; month?: number | null; quarter?: number | null } {
    const startIso = this.toIsoDate(startDate);
    const start = startIso ? new Date(`${startIso}T00:00:00Z`) : new Date();
    const year = start.getUTCFullYear();
    const month = start.getUTCMonth() + 1;

    if (period === TargetPeriod.Monthly) return { year, month, quarter: null };
    if (period === TargetPeriod.Quarterly) return { year, month: null, quarter: Math.floor((month - 1) / 3) + 1 };
    return { year, month: null, quarter: null };
  }

  private mapSalesTargetDto(dto: SalesTargetDto): SalesTarget {
    const period = this.getPeriodFromFields(dto.month, dto.quarter);
    const { start, end } = this.getStartEndFromFields(dto.year, dto.month, dto.quarter);
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      targetType: dto.metric as TargetType,
      period,
      targetValue: dto.targetValue,
      currentValue: dto.currentValue,
      achievementPercentage: dto.achievementPercentage,
      year: dto.year,
      month: dto.month ?? null,
      quarter: dto.quarter ?? null,
      assignedToUserId: dto.userId ?? null,
      assignedToUserName: dto.userName ?? null,
      customerId: dto.customerId ?? null,
      customerName: dto.customerName ?? null,
      productId: dto.productId ?? null,
      productName: dto.productName ?? null,
      categoryId: dto.categoryId ?? null,
      categoryName: dto.categoryName ?? null,
      startDate: start,
      endDate: end,
      isActive: dto.isActive,
      createdAt: dto.createdAt
    };
  }

  private mapBudgetDto(dto: BudgetDto): Budget {
    const period = this.getPeriodFromFields(dto.month, dto.quarter);
    const { start, end } = this.getStartEndFromFields(dto.year, dto.month, dto.quarter);
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      category: dto.budgetType as BudgetCategory,
      totalAmount: dto.allocatedAmount,
      spentAmount: dto.spentAmount,
      remainingAmount: dto.remainingAmount,
      utilizationPercentage: dto.utilizationPercentage,
      year: dto.year,
      month: dto.month ?? null,
      quarter: dto.quarter ?? null,
      period,
      startDate: start,
      endDate: end,
      status: dto.status as BudgetStatus,
      assignedToUserId: dto.userId ?? null,
      assignedToUserName: dto.userName ?? null,
      createdAt: dto.createdAt
    };
  }

  // === Sales Targets ===

  getTargets(activeOnly: boolean = false): Observable<SalesTarget[]> {
    const params = new HttpParams().set('activeOnly', activeOnly ? 'true' : 'false');
    return this.http
      .get<SalesTargetDto[]>(this.targetsUrl, { params })
      .pipe(map(items => items.map(dto => this.mapSalesTargetDto(dto))));
  }

  getTarget(id: number): Observable<SalesTarget> {
    return this.http
      .get<SalesTargetDto>(`${this.targetsUrl}/${id}`)
      .pipe(map(dto => this.mapSalesTargetDto(dto)));
  }

  createTarget(request: CreateSalesTargetRequest): Observable<SalesTarget> {
    const { year, month, quarter } = this.getYearMonthQuarterFromForm(request.period, request.startDate);

    // Map UI model -> server CreateSalesTargetDto
    const dto = {
      name: request.name,
      description: request.description,
      // Keep scope minimal: create as SalesRep target when userId is provided, otherwise Company
      targetType: request.assignedToUserId ? 1 : 7,
      userId: request.assignedToUserId || null,
      customerId: request.customerId ?? null,
      productId: request.productId ?? null,
      categoryId: request.categoryId ?? null,
      manufacturerId: null,
      cantonId: null,
      year,
      month,
      quarter,
      metric: request.targetType,
      targetValue: request.targetValue,
      isActive: request.isActive ?? true
    };

    return this.http
      .post<SalesTargetDto>(this.targetsUrl, dto)
      .pipe(map(res => this.mapSalesTargetDto(res)));
  }

  updateTarget(id: number, request: CreateSalesTargetRequest): Observable<SalesTarget> {
    const { year, month, quarter } = this.getYearMonthQuarterFromForm(request.period, request.startDate);

    const dto = {
      name: request.name,
      description: request.description,
      targetType: request.assignedToUserId ? 1 : 7,
      userId: request.assignedToUserId || null,
      customerId: request.customerId ?? null,
      productId: request.productId ?? null,
      categoryId: request.categoryId ?? null,
      manufacturerId: null,
      cantonId: null,
      year,
      month,
      quarter,
      metric: request.targetType,
      targetValue: request.targetValue,
      isActive: request.isActive ?? true
    };

    return this.http
      .put<SalesTargetDto>(`${this.targetsUrl}/${id}`, dto)
      .pipe(map(res => this.mapSalesTargetDto(res)));
  }

  deleteTarget(id: number): Observable<void> {
    return this.http.delete<void>(`${this.targetsUrl}/${id}`);
  }

  // === Budgets ===

  getBudgets(): Observable<Budget[]> {
    return this.http
      .get<BudgetDto[]>(this.budgetsUrl)
      .pipe(map(items => items.map(dto => this.mapBudgetDto(dto))));
  }

  getBudget(id: number): Observable<Budget> {
    return this.http
      .get<BudgetDto>(`${this.budgetsUrl}/${id}`)
      .pipe(map(dto => this.mapBudgetDto(dto)));
  }

  createBudget(request: CreateBudgetRequest): Observable<Budget> {
    const { year, month, quarter } = this.getYearMonthQuarterFromForm(request.period, request.startDate);

    const dto = {
      name: request.name,
      description: request.description,
      budgetType: request.category,
      categoryId: null,
      manufacturerId: null,
      userId: request.assignedToUserId || null,
      year,
      month,
      quarter,
      allocatedAmount: request.totalAmount
    };

    return this.http
      .post<BudgetDto>(this.budgetsUrl, dto)
      .pipe(map(res => this.mapBudgetDto(res)));
  }

  updateBudget(id: number, request: CreateBudgetRequest): Observable<Budget> {
    const { year, month, quarter } = this.getYearMonthQuarterFromForm(request.period, request.startDate);

    const dto = {
      name: request.name,
      description: request.description,
      budgetType: request.category,
      categoryId: null,
      manufacturerId: null,
      userId: request.assignedToUserId || null,
      year,
      month,
      quarter,
      allocatedAmount: request.totalAmount
    };

    return this.http
      .put<BudgetDto>(`${this.budgetsUrl}/${id}`, dto)
      .pipe(map(res => this.mapBudgetDto(res)));
  }

  deleteBudget(id: number): Observable<void> {
    return this.http.delete<void>(`${this.budgetsUrl}/${id}`);
  }

  // === Expenses ===

  getExpenses(budgetId: number): Observable<BudgetExpense[]> {
    return this.http
      .get<BudgetExpenseDto[]>(`${this.budgetsUrl}/${budgetId}/expenses`)
      .pipe(
        map(items =>
          items.map(e => ({
            id: e.id,
            budgetId: e.budgetId,
            description: e.description,
            amount: e.amount,
            expenseDate: e.expenseDate,
            notes: e.notes,
            createdAt: e.createdAt
          }))
        )
      );
  }

  addExpense(budgetId: number, request: CreateExpenseRequest): Observable<BudgetExpense> {
    const dto = {
      description: request.description,
      amount: request.amount,
      expenseDate: request.expenseDate,
      referenceNumber: null,
      expenseCategory: ExpenseCategory.Other,
      notes: request.notes,
      orderId: null,
      promotionId: null
    };

    return this.http
      .post<BudgetExpenseDto>(`${this.budgetsUrl}/${budgetId}/expenses`, dto)
      .pipe(
        map(e => ({
          id: e.id,
          budgetId: e.budgetId,
          description: e.description,
          amount: e.amount,
          expenseDate: e.expenseDate,
          notes: e.notes,
          createdAt: e.createdAt
        }))
      );
  }

  deleteExpense(expenseId: number): Observable<void> {
    return this.http.delete<void>(`${this.budgetsUrl}/expenses/${expenseId}`);
  }

  // === Helpers ===

  getTargetTypeName(type: TargetType): string {
    const names: Record<TargetType, string> = {
      [TargetType.Revenue]: 'targets.types.revenue',
      [TargetType.Quantity]: 'targets.types.quantity',
      [TargetType.Orders]: 'targets.types.orders',
      [TargetType.Visits]: 'targets.types.visits',
      [TargetType.NewCustomers]: 'targets.types.newCustomers'
    };
    return names[type] || 'common.unknown';
  }

  getPeriodName(period: TargetPeriod): string {
    const names: Record<TargetPeriod, string> = {
      [TargetPeriod.Monthly]: 'targets.periods.monthly',
      [TargetPeriod.Quarterly]: 'targets.periods.quarterly',
      [TargetPeriod.Yearly]: 'targets.periods.yearly'
    };
    return names[period] || 'common.unknown';
  }

  getBudgetCategoryName(category: BudgetCategory): string {
    const names: Record<BudgetCategory, string> = {
      [BudgetCategory.Marketing]: 'budgets.categories.marketing',
      [BudgetCategory.Travel]: 'budgets.categories.travel',
      [BudgetCategory.Training]: 'budgets.categories.training',
      [BudgetCategory.Promotions]: 'budgets.categories.promotions',
      [BudgetCategory.Samples]: 'budgets.categories.samples',
      [BudgetCategory.Events]: 'budgets.categories.events',
      [BudgetCategory.Other]: 'budgets.categories.other'
    };
    return names[category] || 'common.unknown';
  }

  getBudgetStatusName(status: BudgetStatus): string {
    const names: Record<BudgetStatus, string> = {
      [BudgetStatus.Draft]: 'budgets.statuses.draft',
      [BudgetStatus.Submitted]: 'budgets.statuses.submitted',
      [BudgetStatus.Approved]: 'budgets.statuses.approved',
      [BudgetStatus.Rejected]: 'budgets.statuses.rejected',
      [BudgetStatus.Closed]: 'budgets.statuses.closed'
    };
    return names[status] || 'common.unknown';
  }

  getBudgetStatusVariant(status: BudgetStatus): 'info' | 'success' | 'warning' | 'danger' {
    const variants: Record<BudgetStatus, 'info' | 'success' | 'warning' | 'danger'> = {
      [BudgetStatus.Draft]: 'info',
      [BudgetStatus.Submitted]: 'warning',
      [BudgetStatus.Approved]: 'success',
      [BudgetStatus.Rejected]: 'danger',
      [BudgetStatus.Closed]: 'info'
    };
    return variants[status] || 'info';
  }
}
