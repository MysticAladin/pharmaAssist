import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TargetsService,
  SalesTarget,
  Budget,
  BudgetExpense,
  CreateSalesTargetRequest,
  CreateBudgetRequest,
  CreateExpenseRequest,
  TargetType,
  TargetPeriod,
  BudgetCategory,
  BudgetStatus
} from '../../../core/services/targets.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-targets',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    StatusBadgeComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="targets-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <h1 class="page-title">{{ 'targets.title' | translate }}</h1>
          <p class="page-subtitle">{{ 'targets.subtitle' | translate }}</p>
        </div>
      </header>

      <!-- Tabs -->
      <div class="pa-tabs">
        <button
          class="pa-tab"
          [class.active]="activeTab() === 'targets'"
          (click)="setActiveTab('targets')">
          <i class="icon-target"></i>
          {{ 'targets.salesTargets' | translate }}
        </button>
        <button
          class="pa-tab"
          [class.active]="activeTab() === 'budgets'"
          (click)="setActiveTab('budgets')">
          <i class="icon-dollar-sign"></i>
          {{ 'budgets.title' | translate }}
        </button>
        <button
          class="pa-tab"
          [class.active]="activeTab() === 'performance'"
          (click)="setActiveTab('performance')">
          <i class="icon-bar-chart-2"></i>
          {{ 'targets.performance' | translate }}
        </button>
      </div>

      <!-- Sales Targets Tab -->
      @if (activeTab() === 'targets') {
        <section class="content-section">
          <div class="section-header">
            <h2>{{ 'targets.salesTargets' | translate }}</h2>
            <button class="btn btn-primary" (click)="openTargetModal()">
              <i class="icon-plus"></i>
              {{ 'targets.addTarget' | translate }}
            </button>
          </div>

          @if (loadingTargets()) {
            <div class="loading-container">
              <div class="spinner"></div>
              <span>{{ 'common.loading' | translate }}</span>
            </div>
          } @else if (targets().length === 0) {
            <app-empty-state
              icon="target"
              [title]="'targets.noTargets' | translate"
              [description]="'targets.noTargetsDescription' | translate">
            </app-empty-state>
          } @else {
            <div class="targets-grid">
              @for (target of targets(); track target.id) {
                <div class="target-card" [class.achieved]="target.achievementPercentage >= 100">
                  <div class="target-header">
                    <div class="target-type-badge">
                      {{ targetsService.getTargetTypeName(target.targetType) | translate }}
                    </div>
                    <app-status-badge
                      [variant]="target.isActive ? 'success' : 'warning'"
                      [label]="(target.isActive ? 'common.active' : 'common.inactive') | translate">
                    </app-status-badge>
                  </div>
                  <h3 class="target-name">{{ target.name }}</h3>
                  <div class="target-period">
                    <i class="icon-calendar"></i>
                    {{ targetsService.getPeriodName(target.period) | translate }}
                  </div>

                  <!-- Progress -->
                  <div class="target-progress">
                    <div class="progress-header">
                      <span>{{ 'targets.progress' | translate }}</span>
                      <span class="progress-value">{{ target.achievementPercentage | number:'1.0-1' }}%</span>
                    </div>
                    <div class="progress-bar">
                      <div
                        class="progress-fill"
                        [class.success]="target.achievementPercentage >= 100"
                        [class.warning]="target.achievementPercentage >= 75 && target.achievementPercentage < 100"
                        [class.danger]="target.achievementPercentage < 75"
                        [style.width.%]="Math.min(target.achievementPercentage, 100)">
                      </div>
                    </div>
                    <div class="progress-details">
                      <span>{{ target.currentValue | number:'1.0-0' }}</span>
                      <span>/</span>
                      <span>{{ target.targetValue | number:'1.0-0' }}</span>
                    </div>
                  </div>

                  <!-- Dates -->
                  <div class="target-dates">
                    <span>{{ target.startDate | date:'shortDate' }}</span>
                    <span>-</span>
                    <span>{{ target.endDate | date:'shortDate' }}</span>
                  </div>

                  <!-- Actions -->
                  <div class="target-actions">
                    <button class="btn btn-sm" (click)="editTarget(target)">
                      <i class="icon-edit"></i>
                      {{ 'common.edit' | translate }}
                    </button>
                    <button class="btn btn-sm danger" (click)="deleteTarget(target)">
                      <i class="icon-trash-2"></i>
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </section>
      }

      <!-- Budgets Tab -->
      @if (activeTab() === 'budgets') {
        <section class="content-section">
          <div class="section-header">
            <h2>{{ 'budgets.title' | translate }}</h2>
            <button class="btn btn-primary" (click)="openBudgetModal()">
              <i class="icon-plus"></i>
              {{ 'budgets.addBudget' | translate }}
            </button>
          </div>

          @if (loadingBudgets()) {
            <div class="loading-container">
              <div class="spinner"></div>
              <span>{{ 'common.loading' | translate }}</span>
            </div>
          } @else if (budgets().length === 0) {
            <app-empty-state
              icon="dollar-sign"
              [title]="'budgets.noBudgets' | translate"
              [description]="'budgets.noBudgetsDescription' | translate">
            </app-empty-state>
          } @else {
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>{{ 'budgets.name' | translate }}</th>
                    <th>{{ 'budgets.category' | translate }}</th>
                    <th>{{ 'budgets.period' | translate }}</th>
                    <th class="text-right">{{ 'budgets.totalAmount' | translate }}</th>
                    <th class="text-right">{{ 'budgets.spent' | translate }}</th>
                    <th>{{ 'budgets.utilization' | translate }}</th>
                    <th class="text-center">{{ 'common.status' | translate }}</th>
                    <th class="text-center">{{ 'common.actions' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (budget of budgets(); track budget.id) {
                    <tr [class.exceeded]="budget.utilizationPercentage > 100">
                      <td>
                        <div class="budget-info">
                          <span class="budget-name">{{ budget.name }}</span>
                          @if (budget.description) {
                            <span class="budget-desc">{{ budget.description }}</span>
                          }
                        </div>
                      </td>
                      <td>{{ targetsService.getBudgetCategoryName(budget.category) | translate }}</td>
                      <td>{{ targetsService.getPeriodName(budget.period) | translate }}</td>
                      <td class="text-right font-mono">{{ budget.totalAmount | currency:'BAM':'symbol':'1.2-2' }}</td>
                      <td class="text-right font-mono">{{ budget.spentAmount | currency:'BAM':'symbol':'1.2-2' }}</td>
                      <td>
                        <div class="utilization-bar">
                          <div class="bar-bg">
                            <div
                              class="bar-fill"
                              [class.success]="budget.utilizationPercentage <= 75"
                              [class.warning]="budget.utilizationPercentage > 75 && budget.utilizationPercentage <= 100"
                              [class.danger]="budget.utilizationPercentage > 100"
                              [style.width.%]="Math.min(budget.utilizationPercentage, 100)">
                            </div>
                          </div>
                          <span class="bar-label">{{ budget.utilizationPercentage | number:'1.0-1' }}%</span>
                        </div>
                      </td>
                      <td class="text-center">
                        <app-status-badge
                          [variant]="targetsService.getBudgetStatusVariant(budget.status)"
                          [label]="targetsService.getBudgetStatusName(budget.status) | translate">
                        </app-status-badge>
                      </td>
                      <td class="text-center">
                        <div class="action-buttons">
                          <button class="btn btn-icon btn-sm" (click)="viewBudgetExpenses(budget)" [title]="'budgets.viewExpenses' | translate">
                            <i class="icon-list"></i>
                          </button>
                          <button class="btn btn-icon btn-sm" (click)="editBudget(budget)" [title]="'common.edit' | translate">
                            <i class="icon-edit"></i>
                          </button>
                          <button class="btn btn-icon btn-sm danger" (click)="deleteBudget(budget)" [title]="'common.delete' | translate">
                            <i class="icon-trash-2"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>
      }

      <!-- Performance Tab -->
      @if (activeTab() === 'performance') {
        <section class="content-section">
          <div class="section-header">
            <h2>{{ 'targets.performance' | translate }}</h2>
          </div>

          <div class="performance-summary">
            <!-- Summary Cards -->
            <div class="summary-cards">
              <div class="summary-card">
                <div class="summary-icon targets-icon">
                  <i class="icon-target"></i>
                </div>
                <div class="summary-content">
                  <span class="summary-value">{{ targets().length }}</span>
                  <span class="summary-label">{{ 'targets.totalTargets' | translate }}</span>
                </div>
              </div>

              <div class="summary-card">
                <div class="summary-icon achieved-icon">
                  <i class="icon-check-circle"></i>
                </div>
                <div class="summary-content">
                  <span class="summary-value">{{ getAchievedTargetsCount() }}</span>
                  <span class="summary-label">{{ 'targets.achieved' | translate }}</span>
                </div>
              </div>

              <div class="summary-card">
                <div class="summary-icon budget-icon">
                  <i class="icon-dollar-sign"></i>
                </div>
                <div class="summary-content">
                  <span class="summary-value">{{ getTotalBudget() | currency:'BAM':'symbol':'1.0-0' }}</span>
                  <span class="summary-label">{{ 'budgets.totalBudget' | translate }}</span>
                </div>
              </div>

              <div class="summary-card">
                <div class="summary-icon spent-icon">
                  <i class="icon-trending-up"></i>
                </div>
                <div class="summary-content">
                  <span class="summary-value">{{ getTotalSpent() | currency:'BAM':'symbol':'1.0-0' }}</span>
                  <span class="summary-label">{{ 'budgets.totalSpent' | translate }}</span>
                </div>
              </div>
            </div>

            <!-- Top Performers -->
            <div class="performance-section">
              <h3>{{ 'targets.topPerformers' | translate }}</h3>
              @if (targets().length > 0) {
                <div class="performers-list">
                  @for (target of getTopTargets(); track target.id) {
                    <div class="performer-item">
                      <div class="performer-info">
                        <span class="performer-name">{{ target.name }}</span>
                        <span class="performer-type">{{ targetsService.getTargetTypeName(target.targetType) | translate }}</span>
                      </div>
                      <div class="performer-progress">
                        <div class="mini-progress-bar">
                          <div
                            class="mini-progress-fill"
                            [class.success]="target.achievementPercentage >= 100"
                            [style.width.%]="Math.min(target.achievementPercentage, 100)">
                          </div>
                        </div>
                        <span class="performer-value">{{ target.achievementPercentage | number:'1.0-1' }}%</span>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <p class="text-muted">{{ 'targets.noTargetsYet' | translate }}</p>
              }
            </div>
          </div>
        </section>
      }

      <!-- Target Modal -->
      @if (showTargetModal()) {
        <div class="modal-backdrop" (click)="closeTargetModal()"></div>
        <div class="modal">
          <div class="modal-header">
            <h2>{{ (editingTarget() ? 'targets.editTarget' : 'targets.addTarget') | translate }}</h2>
            <button class="btn btn-icon" (click)="closeTargetModal()">
              <i class="icon-x"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>{{ 'targets.name' | translate }} *</label>
              <input type="text" class="form-control" [(ngModel)]="targetForm.name" required>
            </div>
            <div class="form-group">
              <label>{{ 'targets.description' | translate }}</label>
              <textarea class="form-control" [(ngModel)]="targetForm.description" rows="2"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ 'targets.type' | translate }} *</label>
                <select class="form-select" [(ngModel)]="targetForm.targetType">
                  <option [value]="TargetType.Revenue">{{ 'targets.types.revenue' | translate }}</option>
                  <option [value]="TargetType.Quantity">{{ 'targets.types.quantity' | translate }}</option>
                  <option [value]="TargetType.Visits">{{ 'targets.types.visits' | translate }}</option>
                  <option [value]="TargetType.NewCustomers">{{ 'targets.types.newCustomers' | translate }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>{{ 'targets.period' | translate }} *</label>
                <select class="form-select" [(ngModel)]="targetForm.period">
                  <option [value]="TargetPeriod.Weekly">{{ 'targets.periods.weekly' | translate }}</option>
                  <option [value]="TargetPeriod.Monthly">{{ 'targets.periods.monthly' | translate }}</option>
                  <option [value]="TargetPeriod.Quarterly">{{ 'targets.periods.quarterly' | translate }}</option>
                  <option [value]="TargetPeriod.Yearly">{{ 'targets.periods.yearly' | translate }}</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>{{ 'targets.targetValue' | translate }} *</label>
              <input type="number" class="form-control" [(ngModel)]="targetForm.targetValue" min="0" step="0.01">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ 'targets.startDate' | translate }} *</label>
                <input type="date" class="form-control" [(ngModel)]="targetForm.startDate" required>
              </div>
              <div class="form-group">
                <label>{{ 'targets.endDate' | translate }} *</label>
                <input type="date" class="form-control" [(ngModel)]="targetForm.endDate" required>
              </div>
            </div>
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="targetForm.isActive">
                {{ 'targets.isActive' | translate }}
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn" (click)="closeTargetModal()">{{ 'common.cancel' | translate }}</button>
            <button class="btn btn-primary" (click)="saveTarget()" [disabled]="savingTarget()">
              @if (savingTarget()) {
                <span class="spinner-sm"></span>
              }
              {{ 'common.save' | translate }}
            </button>
          </div>
        </div>
      }

      <!-- Budget Modal -->
      @if (showBudgetModal()) {
        <div class="modal-backdrop" (click)="closeBudgetModal()"></div>
        <div class="modal">
          <div class="modal-header">
            <h2>{{ (editingBudget() ? 'budgets.editBudget' : 'budgets.addBudget') | translate }}</h2>
            <button class="btn btn-icon" (click)="closeBudgetModal()">
              <i class="icon-x"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>{{ 'budgets.name' | translate }} *</label>
              <input type="text" class="form-control" [(ngModel)]="budgetForm.name" required>
            </div>
            <div class="form-group">
              <label>{{ 'budgets.description' | translate }}</label>
              <textarea class="form-control" [(ngModel)]="budgetForm.description" rows="2"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ 'budgets.category' | translate }} *</label>
                <select class="form-select" [(ngModel)]="budgetForm.category">
                  <option [value]="BudgetCategory.Sales">{{ 'budgets.categories.sales' | translate }}</option>
                  <option [value]="BudgetCategory.Marketing">{{ 'budgets.categories.marketing' | translate }}</option>
                  <option [value]="BudgetCategory.Operations">{{ 'budgets.categories.operations' | translate }}</option>
                  <option [value]="BudgetCategory.Travel">{{ 'budgets.categories.travel' | translate }}</option>
                  <option [value]="BudgetCategory.Entertainment">{{ 'budgets.categories.entertainment' | translate }}</option>
                  <option [value]="BudgetCategory.Training">{{ 'budgets.categories.training' | translate }}</option>
                  <option [value]="BudgetCategory.Equipment">{{ 'budgets.categories.equipment' | translate }}</option>
                  <option [value]="BudgetCategory.Other">{{ 'budgets.categories.other' | translate }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>{{ 'budgets.period' | translate }} *</label>
                <select class="form-select" [(ngModel)]="budgetForm.period">
                  <option [value]="TargetPeriod.Weekly">{{ 'targets.periods.weekly' | translate }}</option>
                  <option [value]="TargetPeriod.Monthly">{{ 'targets.periods.monthly' | translate }}</option>
                  <option [value]="TargetPeriod.Quarterly">{{ 'targets.periods.quarterly' | translate }}</option>
                  <option [value]="TargetPeriod.Yearly">{{ 'targets.periods.yearly' | translate }}</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ 'budgets.totalAmount' | translate }} *</label>
                <input type="number" class="form-control" [(ngModel)]="budgetForm.totalAmount" min="0" step="0.01">
              </div>
              <div class="form-group">
                <label>{{ 'budgets.alertThreshold' | translate }} (%)</label>
                <input type="number" class="form-control" [(ngModel)]="budgetForm.alertThreshold" min="0" max="100" step="1">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ 'budgets.startDate' | translate }} *</label>
                <input type="date" class="form-control" [(ngModel)]="budgetForm.startDate" required>
              </div>
              <div class="form-group">
                <label>{{ 'budgets.endDate' | translate }} *</label>
                <input type="date" class="form-control" [(ngModel)]="budgetForm.endDate" required>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn" (click)="closeBudgetModal()">{{ 'common.cancel' | translate }}</button>
            <button class="btn btn-primary" (click)="saveBudget()" [disabled]="savingBudget()">
              @if (savingBudget()) {
                <span class="spinner-sm"></span>
              }
              {{ 'common.save' | translate }}
            </button>
          </div>
        </div>
      }

      <!-- Expenses Modal -->
      @if (showExpensesModal()) {
        <div class="modal-backdrop" (click)="closeExpensesModal()"></div>
        <div class="modal modal-lg">
          <div class="modal-header">
            <h2>{{ 'budgets.expenses' | translate }} - {{ selectedBudget()?.name }}</h2>
            <button class="btn btn-icon" (click)="closeExpensesModal()">
              <i class="icon-x"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="expenses-header">
              <button class="btn btn-primary btn-sm" (click)="addExpense()">
                <i class="icon-plus"></i>
                {{ 'budgets.addExpense' | translate }}
              </button>
            </div>

            @if (loadingExpenses()) {
              <div class="loading-container">
                <div class="spinner"></div>
              </div>
            } @else if (expenses().length === 0) {
              <div class="empty-expenses">
                <i class="icon-file-text"></i>
                <p>{{ 'budgets.noExpenses' | translate }}</p>
              </div>
            } @else {
              <table class="data-table expenses-table">
                <thead>
                  <tr>
                    <th>{{ 'budgets.date' | translate }}</th>
                    <th>{{ 'budgets.description' | translate }}</th>
                    <th class="text-right">{{ 'budgets.amount' | translate }}</th>
                    <th class="text-center">{{ 'common.actions' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (expense of expenses(); track expense.id) {
                    <tr>
                      <td>{{ expense.expenseDate | date:'shortDate' }}</td>
                      <td>{{ expense.description }}</td>
                      <td class="text-right font-mono">{{ expense.amount | currency:'BAM':'symbol':'1.2-2' }}</td>
                      <td class="text-center">
                        <button class="btn btn-icon btn-sm danger" (click)="deleteExpense(expense)">
                          <i class="icon-trash-2"></i>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
          <div class="modal-footer">
            <button class="btn" (click)="closeExpensesModal()">{{ 'common.close' | translate }}</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .targets-page {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .header-content {
      flex: 1;
      min-width: 0;
    }

    .page-title {
      font-size: var(--font-size-2xl);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.25rem 0;
    }

    .page-subtitle {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin: 0;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
      }
    }

    .content-section {
      background: var(--bg-primary);
      border-radius: 0.75rem;
      border: 1px solid var(--border-color);
      padding: 1.5rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .section-header h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
    }

    /* Targets Grid */
    .targets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1rem;
    }

    .target-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 0.75rem;
      padding: 1.25rem;
      transition: all 0.2s;
    }

    .target-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .target-card.achieved {
      border-color: var(--success-color);
      background: linear-gradient(135deg, rgba(var(--color-success-rgb), 0.05), transparent);
    }

    .target-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .target-type-badge {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--primary-color);
      background: rgba(var(--primary-rgb), 0.1);
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
    }

    .target-name {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 0.5rem;
    }

    .target-period {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 1rem;
    }

    .target-progress {
      margin-bottom: 1rem;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .progress-value {
      font-weight: 600;
    }

    .progress-bar {
      height: 0.5rem;
      background: var(--bg-primary);
      border-radius: 0.25rem;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 0.25rem;
      transition: width 0.3s;
    }

    .progress-fill.success { background: var(--success-color); }
    .progress-fill.warning { background: var(--warning-color); }
    .progress-fill.danger { background: var(--danger-color); }

    .progress-details {
      display: flex;
      gap: 0.25rem;
      justify-content: center;
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .target-dates {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 1rem;
    }

    .target-actions {
      display: flex;
      gap: 0.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    /* Table styles */
    .table-container {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th,
    .data-table td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    .data-table th {
      font-weight: 600;
      color: var(--text-secondary);
      font-size: 0.875rem;
      background: var(--bg-secondary);
    }

    .data-table tr.exceeded {
      background: rgba(var(--color-error-rgb), 0.05);
    }

    .budget-info {
      display: flex;
      flex-direction: column;
    }

    .budget-name {
      font-weight: 500;
    }

    .budget-desc {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-family: monospace; }

    .utilization-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .bar-bg {
      flex: 1;
      height: 0.5rem;
      background: var(--bg-primary);
      border-radius: 0.25rem;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      border-radius: 0.25rem;
    }

    .bar-fill.success { background: var(--success-color); }
    .bar-fill.warning { background: var(--warning-color); }
    .bar-fill.danger { background: var(--danger-color); }

    .bar-label {
      font-size: 0.875rem;
      font-weight: 500;
      min-width: 3rem;
    }

    .action-buttons {
      display: flex;
      gap: 0.25rem;
      justify-content: center;
    }

    /* Performance Summary */
    .performance-summary {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .summary-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 0.75rem;
      padding: 1.25rem;
    }

    .summary-icon {
      width: 3rem;
      height: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.75rem;
      font-size: 1.25rem;
    }

    .targets-icon { background: var(--status-processing-bg); color: var(--color-info-text); }
    .achieved-icon { background: var(--color-success-bg); color: var(--color-success-text); }
    .budget-icon { background: var(--status-pending-bg); color: var(--color-warning-text); }
    .spent-icon { background: #f3e8ff; color: #7c3aed; }

    .summary-content {
      display: flex;
      flex-direction: column;
    }

    .summary-value {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .summary-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .performance-section {
      background: var(--bg-secondary);
      border-radius: 0.75rem;
      padding: 1.5rem;
    }

    .performance-section h3 {
      margin: 0 0 1rem;
      font-size: 1rem;
      font-weight: 600;
    }

    .performers-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .performer-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: var(--bg-primary);
      border-radius: 0.5rem;
    }

    .performer-info {
      display: flex;
      flex-direction: column;
    }

    .performer-name {
      font-weight: 500;
    }

    .performer-type {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .performer-progress {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .mini-progress-bar {
      width: 100px;
      height: 0.375rem;
      background: var(--border-color);
      border-radius: 0.25rem;
      overflow: hidden;
    }

    .mini-progress-fill {
      height: 100%;
      background: var(--primary-color);
      border-radius: 0.25rem;
    }

    .mini-progress-fill.success {
      background: var(--success-color);
    }

    .performer-value {
      font-weight: 600;
      min-width: 3.5rem;
      text-align: right;
    }

    /* Modal styles */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
    }

    .modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--bg-primary);
      border-radius: 1rem;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      z-index: 1001;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    }

    .modal.modal-lg {
      max-width: 800px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .modal-header h2 {
      font-size: 1.25rem;
      margin: 0;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.25rem 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .form-control,
    .form-select {
      width: 100%;
      padding: 0.625rem 0.875rem;
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      font-size: 0.9375rem;
      background: var(--bg-primary);
      color: var(--text-primary);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    @media (max-width: 640px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }

    .checkbox-group {
      display: flex;
      gap: 1.5rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .expenses-header {
      margin-bottom: 1rem;
    }

    .empty-expenses {
      text-align: center;
      padding: 2rem;
      color: var(--text-secondary);
    }

    .empty-expenses i {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .expenses-table {
      margin-top: 1rem;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      font-weight: 500;
      cursor: pointer;
      background: var(--bg-primary);
      color: var(--text-primary);
      transition: all 0.2s;
    }

    .btn:hover {
      background: var(--bg-secondary);
    }

    .btn-primary {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: white;
    }

    .btn-primary:hover {
      background: var(--primary-hover);
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
    }

    .btn-icon {
      padding: 0.5rem;
      border: none;
      background: transparent;
    }

    .btn-icon.danger:hover {
      color: var(--danger-color);
    }

    .btn.danger {
      color: var(--danger-color);
      border-color: var(--danger-color);
    }

    .btn.danger:hover {
      background: var(--danger-color);
      color: white;
    }

    /* Loading */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 1rem;
      color: var(--text-secondary);
    }

    .spinner {
      width: 2rem;
      height: 2rem;
      border: 3px solid var(--border-color);
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .spinner-sm {
      width: 1rem;
      height: 1rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .text-muted { color: var(--text-secondary); }
  `]
})
export class TargetsComponent implements OnInit {
  readonly targetsService = inject(TargetsService);
  private readonly notification = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly translate = inject(TranslateService);

  // Expose enums and Math to template
  readonly TargetType = TargetType;
  readonly TargetPeriod = TargetPeriod;
  readonly BudgetCategory = BudgetCategory;
  readonly BudgetStatus = BudgetStatus;
  readonly Math = Math;

  // State
  activeTab = signal<'targets' | 'budgets' | 'performance'>('targets');
  loadingTargets = signal(false);
  loadingBudgets = signal(false);
  loadingExpenses = signal(false);
  targets = signal<SalesTarget[]>([]);
  budgets = signal<Budget[]>([]);
  expenses = signal<BudgetExpense[]>([]);

  // Target modal
  showTargetModal = signal(false);
  editingTarget = signal<SalesTarget | null>(null);
  savingTarget = signal(false);
  targetForm: CreateSalesTargetRequest = this.getEmptyTargetForm();

  // Budget modal
  showBudgetModal = signal(false);
  editingBudget = signal<Budget | null>(null);
  savingBudget = signal(false);
  budgetForm: CreateBudgetRequest = this.getEmptyBudgetForm();

  // Expenses modal
  showExpensesModal = signal(false);
  selectedBudget = signal<Budget | null>(null);

  ngOnInit() {
    this.loadTargets();
    this.loadBudgets();
  }

  setActiveTab(tab: 'targets' | 'budgets' | 'performance') {
    this.activeTab.set(tab);
  }

  // === Targets ===

  loadTargets() {
    this.loadingTargets.set(true);
    this.targetsService.getTargets().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.targets.set(res.data);
        }
        this.loadingTargets.set(false);
      },
      error: () => {
        this.loadingTargets.set(false);
        this.notification.error(this.translate.instant('targets.loadError'));
      }
    });
  }

  openTargetModal(target?: SalesTarget) {
    if (target) {
      this.editingTarget.set(target);
      this.targetForm = { ...target } as CreateSalesTargetRequest;
    } else {
      this.editingTarget.set(null);
      this.targetForm = this.getEmptyTargetForm();
    }
    this.showTargetModal.set(true);
  }

  closeTargetModal() {
    this.showTargetModal.set(false);
    this.editingTarget.set(null);
  }

  editTarget(target: SalesTarget) {
    this.openTargetModal(target);
  }

  saveTarget() {
    if (!this.targetForm.name || !this.targetForm.targetValue) {
      this.notification.warning(this.translate.instant('common.fillRequired'));
      return;
    }

    this.savingTarget.set(true);
    const editing = this.editingTarget();

    const request$ = editing
      ? this.targetsService.updateTarget(editing.id, this.targetForm)
      : this.targetsService.createTarget(this.targetForm);

    request$.subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success(this.translate.instant(editing ? 'targets.targetUpdated' : 'targets.targetCreated'));
          this.closeTargetModal();
          this.loadTargets();
        }
        this.savingTarget.set(false);
      },
      error: () => {
        this.savingTarget.set(false);
        this.notification.error(this.translate.instant('common.saveError'));
      }
    });
  }

  async deleteTarget(target: SalesTarget) {
    const confirmed = await this.confirmation.confirm({
      title: this.translate.instant('targets.deleteTarget'),
      message: this.translate.instant('targets.deleteTargetConfirm', { name: target.name }),
      confirmText: this.translate.instant('common.delete'),
      cancelText: this.translate.instant('common.cancel'),
      variant: 'danger'
    });

    if (confirmed) {
      this.targetsService.deleteTarget(target.id).subscribe({
        next: () => {
          this.notification.success(this.translate.instant('targets.targetDeleted'));
          this.loadTargets();
        },
        error: () => {
          this.notification.error(this.translate.instant('common.deleteError'));
        }
      });
    }
  }

  // === Budgets ===

  loadBudgets() {
    this.loadingBudgets.set(true);
    this.targetsService.getBudgets().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.budgets.set(res.data);
        }
        this.loadingBudgets.set(false);
      },
      error: () => {
        this.loadingBudgets.set(false);
        this.notification.error(this.translate.instant('budgets.loadError'));
      }
    });
  }

  openBudgetModal(budget?: Budget) {
    if (budget) {
      this.editingBudget.set(budget);
      this.budgetForm = { ...budget } as CreateBudgetRequest;
    } else {
      this.editingBudget.set(null);
      this.budgetForm = this.getEmptyBudgetForm();
    }
    this.showBudgetModal.set(true);
  }

  closeBudgetModal() {
    this.showBudgetModal.set(false);
    this.editingBudget.set(null);
  }

  editBudget(budget: Budget) {
    this.openBudgetModal(budget);
  }

  saveBudget() {
    if (!this.budgetForm.name || !this.budgetForm.totalAmount) {
      this.notification.warning(this.translate.instant('common.fillRequired'));
      return;
    }

    this.savingBudget.set(true);
    const editing = this.editingBudget();

    const request$ = editing
      ? this.targetsService.updateBudget(editing.id, this.budgetForm)
      : this.targetsService.createBudget(this.budgetForm);

    request$.subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success(this.translate.instant(editing ? 'budgets.budgetUpdated' : 'budgets.budgetCreated'));
          this.closeBudgetModal();
          this.loadBudgets();
        }
        this.savingBudget.set(false);
      },
      error: () => {
        this.savingBudget.set(false);
        this.notification.error(this.translate.instant('common.saveError'));
      }
    });
  }

  async deleteBudget(budget: Budget) {
    const confirmed = await this.confirmation.confirm({
      title: this.translate.instant('budgets.deleteBudget'),
      message: this.translate.instant('budgets.deleteBudgetConfirm', { name: budget.name }),
      confirmText: this.translate.instant('common.delete'),
      cancelText: this.translate.instant('common.cancel'),
      variant: 'danger'
    });

    if (confirmed) {
      this.targetsService.deleteBudget(budget.id).subscribe({
        next: () => {
          this.notification.success(this.translate.instant('budgets.budgetDeleted'));
          this.loadBudgets();
        },
        error: () => {
          this.notification.error(this.translate.instant('common.deleteError'));
        }
      });
    }
  }

  // === Expenses ===

  viewBudgetExpenses(budget: Budget) {
    this.selectedBudget.set(budget);
    this.showExpensesModal.set(true);
    this.loadExpenses(budget.id);
  }

  closeExpensesModal() {
    this.showExpensesModal.set(false);
    this.selectedBudget.set(null);
    this.expenses.set([]);
  }

  loadExpenses(budgetId: number) {
    this.loadingExpenses.set(true);
    this.targetsService.getExpenses(budgetId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.expenses.set(res.data);
        }
        this.loadingExpenses.set(false);
      },
      error: () => {
        this.loadingExpenses.set(false);
      }
    });
  }

  addExpense() {
    // For simplicity, using prompt - in production would use a proper modal
    const budget = this.selectedBudget();
    if (!budget) return;

    const description = prompt(this.translate.instant('budgets.enterDescription'));
    if (!description) return;

    const amountStr = prompt(this.translate.instant('budgets.enterAmount'));
    if (!amountStr) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      this.notification.warning(this.translate.instant('budgets.invalidAmount'));
      return;
    }

    const request: CreateExpenseRequest = {
      description,
      amount,
      expenseDate: new Date()
    };

    this.targetsService.addExpense(budget.id, request).subscribe({
      next: () => {
        this.notification.success(this.translate.instant('budgets.expenseAdded'));
        this.loadExpenses(budget.id);
        this.loadBudgets(); // Refresh budget to update spent amount
      },
      error: () => {
        this.notification.error(this.translate.instant('common.saveError'));
      }
    });
  }

  async deleteExpense(expense: BudgetExpense) {
    const budget = this.selectedBudget();
    if (!budget) return;

    const confirmed = await this.confirmation.confirm({
      title: this.translate.instant('budgets.deleteExpense'),
      message: this.translate.instant('budgets.deleteExpenseConfirm'),
      confirmText: this.translate.instant('common.delete'),
      cancelText: this.translate.instant('common.cancel'),
      variant: 'danger'
    });

    if (confirmed) {
      this.targetsService.deleteExpense(budget.id, expense.id).subscribe({
        next: () => {
          this.notification.success(this.translate.instant('budgets.expenseDeleted'));
          this.loadExpenses(budget.id);
          this.loadBudgets();
        },
        error: () => {
          this.notification.error(this.translate.instant('common.deleteError'));
        }
      });
    }
  }

  // === Performance Helpers ===

  getAchievedTargetsCount(): number {
    return this.targets().filter(t => t.achievementPercentage >= 100).length;
  }

  getTotalBudget(): number {
    return this.budgets().reduce((sum, b) => sum + b.totalAmount, 0);
  }

  getTotalSpent(): number {
    return this.budgets().reduce((sum, b) => sum + b.spentAmount, 0);
  }

  getTopTargets(): SalesTarget[] {
    return [...this.targets()]
      .sort((a, b) => b.achievementPercentage - a.achievementPercentage)
      .slice(0, 5);
  }

  // === Form Helpers ===

  private getEmptyTargetForm(): CreateSalesTargetRequest {
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return {
      name: '',
      description: '',
      targetType: TargetType.Revenue,
      period: TargetPeriod.Monthly,
      targetValue: 0,
      startDate: today,
      endDate: endOfMonth,
      isActive: true
    };
  }

  private getEmptyBudgetForm(): CreateBudgetRequest {
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return {
      name: '',
      description: '',
      category: BudgetCategory.Sales,
      period: TargetPeriod.Monthly,
      totalAmount: 0,
      alertThreshold: 80,
      startDate: today,
      endDate: endOfMonth
    };
  }
}
