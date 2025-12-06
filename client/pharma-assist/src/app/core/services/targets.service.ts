import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResponse } from '../models/product.model';

// Enums
export enum TargetType {
  Revenue = 0,
  Quantity = 1,
  Visits = 2,
  NewCustomers = 3
}

export enum TargetPeriod {
  Weekly = 0,
  Monthly = 1,
  Quarterly = 2,
  Yearly = 3
}

export enum BudgetCategory {
  Sales = 0,
  Marketing = 1,
  Operations = 2,
  Travel = 3,
  Entertainment = 4,
  Training = 5,
  Equipment = 6,
  Other = 7
}

export enum BudgetStatus {
  Draft = 0,
  Active = 1,
  Closed = 2,
  Exceeded = 3
}

// Interfaces
export interface SalesTarget {
  id: number;
  name: string;
  description?: string;
  targetType: TargetType;
  period: TargetPeriod;
  targetValue: number;
  currentValue: number;
  achievementPercentage: number;
  assignedToUserId?: string;
  assignedToUserName?: string;
  customerId?: number;
  customerName?: string;
  productId?: number;
  productName?: string;
  categoryId?: number;
  categoryName?: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

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
  startDate: Date;
  endDate: Date;
  isActive?: boolean;
}

export interface TargetPerformance {
  target: SalesTarget;
  currentValue: number;
  achievementPercentage: number;
  remainingValue: number;
  daysRemaining: number;
  dailyTargetRequired: number;
  trend: 'up' | 'down' | 'stable';
  projectedAchievement: number;
}

export interface Budget {
  id: number;
  name: string;
  description?: string;
  category: BudgetCategory;
  totalAmount: number;
  spentAmount: number;
  remainingAmount: number;
  utilizationPercentage: number;
  period: TargetPeriod;
  startDate: Date;
  endDate: Date;
  status: BudgetStatus;
  alertThreshold: number;
  assignedToUserId?: string;
  assignedToUserName?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateBudgetRequest {
  name: string;
  description?: string;
  category: BudgetCategory;
  totalAmount: number;
  period: TargetPeriod;
  startDate: Date;
  endDate: Date;
  alertThreshold?: number;
  assignedToUserId?: string;
}

export interface BudgetExpense {
  id: number;
  budgetId: number;
  description: string;
  amount: number;
  expenseDate: Date;
  receiptUrl?: string;
  notes?: string;
  recordedBy?: string;
  recordedByName?: string;
  createdAt: Date;
}

export interface CreateExpenseRequest {
  description: string;
  amount: number;
  expenseDate: Date;
  receiptUrl?: string;
  notes?: string;
}

export interface BudgetUtilization {
  budget: Budget;
  expenses: BudgetExpense[];
  totalSpent: number;
  remainingBudget: number;
  utilizationPercentage: number;
  isOverBudget: boolean;
  daysRemaining: number;
  dailyBudgetRemaining: number;
}

@Injectable({
  providedIn: 'root'
})
export class TargetsService {
  private readonly http = inject(HttpClient);
  private readonly targetsUrl = `${environment.apiUrl}/targets`;
  private readonly budgetsUrl = `${environment.apiUrl}/budgets`;

  // === Sales Targets ===

  getTargets(activeOnly: boolean = false): Observable<ApiResponse<SalesTarget[]>> {
    const params = new HttpParams().set('activeOnly', activeOnly.toString());
    return this.http.get<ApiResponse<SalesTarget[]>>(this.targetsUrl, { params });
  }

  getTarget(id: number): Observable<ApiResponse<SalesTarget>> {
    return this.http.get<ApiResponse<SalesTarget>>(`${this.targetsUrl}/${id}`);
  }

  createTarget(request: CreateSalesTargetRequest): Observable<ApiResponse<SalesTarget>> {
    return this.http.post<ApiResponse<SalesTarget>>(this.targetsUrl, request);
  }

  updateTarget(id: number, request: CreateSalesTargetRequest): Observable<ApiResponse<SalesTarget>> {
    return this.http.put<ApiResponse<SalesTarget>>(`${this.targetsUrl}/${id}`, request);
  }

  deleteTarget(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.targetsUrl}/${id}`);
  }

  getTargetPerformance(id: number): Observable<ApiResponse<TargetPerformance>> {
    return this.http.get<ApiResponse<TargetPerformance>>(`${this.targetsUrl}/${id}/performance`);
  }

  getMyTargets(): Observable<ApiResponse<SalesTarget[]>> {
    return this.http.get<ApiResponse<SalesTarget[]>>(`${this.targetsUrl}/my`);
  }

  // === Budgets ===

  getBudgets(activeOnly: boolean = false): Observable<ApiResponse<Budget[]>> {
    const params = new HttpParams().set('activeOnly', activeOnly.toString());
    return this.http.get<ApiResponse<Budget[]>>(this.budgetsUrl, { params });
  }

  getBudget(id: number): Observable<ApiResponse<Budget>> {
    return this.http.get<ApiResponse<Budget>>(`${this.budgetsUrl}/${id}`);
  }

  createBudget(request: CreateBudgetRequest): Observable<ApiResponse<Budget>> {
    return this.http.post<ApiResponse<Budget>>(this.budgetsUrl, request);
  }

  updateBudget(id: number, request: CreateBudgetRequest): Observable<ApiResponse<Budget>> {
    return this.http.put<ApiResponse<Budget>>(`${this.budgetsUrl}/${id}`, request);
  }

  deleteBudget(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.budgetsUrl}/${id}`);
  }

  getBudgetUtilization(id: number): Observable<ApiResponse<BudgetUtilization>> {
    return this.http.get<ApiResponse<BudgetUtilization>>(`${this.budgetsUrl}/${id}/utilization`);
  }

  // === Expenses ===

  getExpenses(budgetId: number): Observable<ApiResponse<BudgetExpense[]>> {
    return this.http.get<ApiResponse<BudgetExpense[]>>(`${this.budgetsUrl}/${budgetId}/expenses`);
  }

  addExpense(budgetId: number, request: CreateExpenseRequest): Observable<ApiResponse<BudgetExpense>> {
    return this.http.post<ApiResponse<BudgetExpense>>(`${this.budgetsUrl}/${budgetId}/expenses`, request);
  }

  updateExpense(budgetId: number, expenseId: number, request: CreateExpenseRequest): Observable<ApiResponse<BudgetExpense>> {
    return this.http.put<ApiResponse<BudgetExpense>>(`${this.budgetsUrl}/${budgetId}/expenses/${expenseId}`, request);
  }

  deleteExpense(budgetId: number, expenseId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.budgetsUrl}/${budgetId}/expenses/${expenseId}`);
  }

  // === Helpers ===

  getTargetTypeName(type: TargetType): string {
    const names: Record<TargetType, string> = {
      [TargetType.Revenue]: 'targets.types.revenue',
      [TargetType.Quantity]: 'targets.types.quantity',
      [TargetType.Visits]: 'targets.types.visits',
      [TargetType.NewCustomers]: 'targets.types.newCustomers'
    };
    return names[type] || 'common.unknown';
  }

  getPeriodName(period: TargetPeriod): string {
    const names: Record<TargetPeriod, string> = {
      [TargetPeriod.Weekly]: 'targets.periods.weekly',
      [TargetPeriod.Monthly]: 'targets.periods.monthly',
      [TargetPeriod.Quarterly]: 'targets.periods.quarterly',
      [TargetPeriod.Yearly]: 'targets.periods.yearly'
    };
    return names[period] || 'common.unknown';
  }

  getBudgetCategoryName(category: BudgetCategory): string {
    const names: Record<BudgetCategory, string> = {
      [BudgetCategory.Sales]: 'budgets.categories.sales',
      [BudgetCategory.Marketing]: 'budgets.categories.marketing',
      [BudgetCategory.Operations]: 'budgets.categories.operations',
      [BudgetCategory.Travel]: 'budgets.categories.travel',
      [BudgetCategory.Entertainment]: 'budgets.categories.entertainment',
      [BudgetCategory.Training]: 'budgets.categories.training',
      [BudgetCategory.Equipment]: 'budgets.categories.equipment',
      [BudgetCategory.Other]: 'budgets.categories.other'
    };
    return names[category] || 'common.unknown';
  }

  getBudgetStatusName(status: BudgetStatus): string {
    const names: Record<BudgetStatus, string> = {
      [BudgetStatus.Draft]: 'budgets.statuses.draft',
      [BudgetStatus.Active]: 'budgets.statuses.active',
      [BudgetStatus.Closed]: 'budgets.statuses.closed',
      [BudgetStatus.Exceeded]: 'budgets.statuses.exceeded'
    };
    return names[status] || 'common.unknown';
  }

  getBudgetStatusVariant(status: BudgetStatus): 'info' | 'success' | 'warning' | 'danger' {
    const variants: Record<BudgetStatus, 'info' | 'success' | 'warning' | 'danger'> = {
      [BudgetStatus.Draft]: 'info',
      [BudgetStatus.Active]: 'success',
      [BudgetStatus.Closed]: 'warning',
      [BudgetStatus.Exceeded]: 'danger'
    };
    return variants[status] || 'info';
  }
}
