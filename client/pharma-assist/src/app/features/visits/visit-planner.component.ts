import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { VisitPlanService } from '../../core/services/visit-plan.service';
import { SalesRepService } from '../../core/services/sales-rep.service';
import { AuthStateService } from '../../core/state/auth-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import {
  VisitPlanDetail,
  VisitPlanStatus,
  PlannedVisit,
  CreatePlannedVisitRequest
} from '../../core/models/visit.model';
import { CustomerAssignment, SalesRepresentative } from '../../core/models/sales-rep.model';

@Component({
  selector: 'app-visit-planner',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule],
  template: `
    <div class="planner">
      <div class="planner__header">
        <button class="btn" (click)="goBack()">
          <i class="material-icons">arrow_back</i>
          {{ 'common.back' | translate }}
        </button>
        <h1 class="planner__title">{{ 'visitPlanner.title' | translate }}</h1>
        <div class="planner__actions">
          @if (plan() && canEdit()) {
            <button class="btn btn-primary" (click)="submitPlan()" [disabled]="submitting() || plan()!.plannedVisits.length === 0">
              @if (submitting()) {
                <span class="spinner-sm"></span>
              }
              {{ 'visitPlanner.submitForApproval' | translate }}
            </button>
          }
        </div>
      </div>

      <!-- Week Navigation -->
      <div class="week-nav">
        <button class="btn btn-icon" (click)="previousWeek()">
          <i class="material-icons">chevron_left</i>
        </button>
        <span class="week-label">
          {{ weekLabel() }}
        </span>
        <button class="btn btn-icon" (click)="nextWeek()">
          <i class="material-icons">chevron_right</i>
        </button>
        <button class="btn btn-outline" (click)="goToCurrentWeek()">
          {{ 'visitPlanner.thisWeek' | translate }}
        </button>
      </div>

      <!-- Status Banner -->
      @if (plan()) {
        <div class="status-banner" [class]="'status-' + plan()!.status">
          <span class="status-icon">
            @switch (plan()!.status) {
              @case (VisitPlanStatus.Draft) { <i class="material-icons">edit</i> }
              @case (VisitPlanStatus.Submitted) { <i class="material-icons">schedule</i> }
              @case (VisitPlanStatus.Approved) { <i class="material-icons">check_circle</i> }
              @case (VisitPlanStatus.Rejected) { <i class="material-icons">cancel</i> }
              @case (VisitPlanStatus.InProgress) { <i class="material-icons">play_circle</i> }
              @case (VisitPlanStatus.Completed) { <i class="material-icons">done_all</i> }
            }
          </span>
          <span class="status-text">{{ plan()!.statusName }}</span>
          @if (plan()!.rejectionReason) {
            <span class="rejection-reason">{{ plan()!.rejectionReason }}</span>
          }
        </div>
      }

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>{{ 'common.loading' | translate }}</p>
        </div>
      } @else {
        <!-- Calendar Grid -->
        <div class="calendar">
          @for (day of weekDays(); track day.toISOString()) {
            <div class="day-column">
              <div class="day-header">
                <span class="day-name">{{ getDayName(day) }}</span>
                <span class="day-date">{{ formatDayDate(day) }}</span>
              </div>
              <div class="day-visits">
                @for (visit of getVisitsForDay(day); track visit.id) {
                  <div class="visit-card" [class.executed]="visit.hasExecutedVisit">
                    <div class="visit-time">
                      {{ visit.plannedTime || '--:--' }}
                    </div>
                    <div class="visit-info">
                      <span class="visit-customer">{{ visit.customerName }}</span>
                      @if (visit.customerCity) {
                        <span class="visit-city">{{ visit.customerCity }}</span>
                      }
                      @if (visit.visitObjective) {
                        <span class="visit-objective">{{ visit.visitObjective }}</span>
                      }
                    </div>
                    <div class="visit-actions">
                      @if (visit.hasExecutedVisit) {
                        <span class="executed-badge">
                          <i class="material-icons">check</i>
                        </span>
                      } @else if (canEdit()) {
                        <button class="btn btn-icon btn-sm" (click)="editVisit(visit)">
                          <i class="material-icons">edit</i>
                        </button>
                        <button class="btn btn-icon btn-sm danger" (click)="deleteVisit(visit)">
                          <i class="material-icons">delete</i>
                        </button>
                      }
                    </div>
                  </div>
                }
                @if (canEdit()) {
                  <button class="add-visit-btn" (click)="openAddVisitModal(day)">
                    <i class="material-icons">add</i>
                    {{ 'visitPlanner.addVisit' | translate }}
                  </button>
                }
              </div>
            </div>
          }
        </div>

        <!-- Summary -->
        <div class="summary">
          <div class="summary-item">
            <span class="summary-value">{{ plan()?.plannedVisits?.length || 0 }}</span>
            <span class="summary-label">{{ 'visitPlanner.plannedVisits' | translate }}</span>
          </div>
          <div class="summary-item executed">
            <span class="summary-value">{{ executedCount() }}</span>
            <span class="summary-label">{{ 'visitPlanner.executedVisits' | translate }}</span>
          </div>
        </div>
      }

      <!-- Add/Edit Visit Modal -->
      @if (showVisitModal()) {
        <div class="modal-overlay" (click)="closeVisitModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editingVisit() ? ('visitPlanner.editVisit' | translate) : ('visitPlanner.addVisit' | translate) }}</h2>
              <button class="btn btn-icon" (click)="closeVisitModal()">
                <i class="material-icons">close</i>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>{{ 'visitPlanner.customer' | translate }} *</label>
                <select [(ngModel)]="visitForm.customerId" [disabled]="!!editingVisit()">
                  <option [ngValue]="null">{{ 'visitPlanner.selectCustomer' | translate }}</option>
                  @for (customer of assignedCustomers(); track customer.customerId) {
                    <option [ngValue]="customer.customerId">{{ customer.customerName }} - {{ customer.city }}</option>
                  }
                </select>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>{{ 'visitPlanner.date' | translate }} *</label>
                  <input type="date" [(ngModel)]="visitForm.plannedDate" />
                </div>
                <div class="form-group">
                  <label>{{ 'visitPlanner.time' | translate }}</label>
                  <input type="time" [(ngModel)]="visitForm.plannedTime" />
                </div>
              </div>
              <div class="form-group">
                <label>{{ 'visitPlanner.duration' | translate }}</label>
                <select [(ngModel)]="visitForm.estimatedDurationMinutes">
                  <option [ngValue]="15">15 min</option>
                  <option [ngValue]="30">30 min</option>
                  <option [ngValue]="45">45 min</option>
                  <option [ngValue]="60">1 hour</option>
                  <option [ngValue]="90">1.5 hours</option>
                  <option [ngValue]="120">2 hours</option>
                </select>
              </div>
              <div class="form-group">
                <label>{{ 'visitPlanner.objective' | translate }}</label>
                <input type="text" [(ngModel)]="visitForm.visitObjective" [placeholder]="'visitPlanner.objectivePlaceholder' | translate" />
              </div>
              <div class="form-group">
                <label>{{ 'visitPlanner.notes' | translate }}</label>
                <textarea [(ngModel)]="visitForm.notes" rows="3"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeVisitModal()">{{ 'common.cancel' | translate }}</button>
              <button class="btn btn-primary" (click)="saveVisit()" [disabled]="!canSaveVisit() || savingVisit()">
                @if (savingVisit()) {
                  <span class="spinner-sm"></span>
                }
                {{ 'common.save' | translate }}
              </button>
            </div>
          </div>
        </div>
      }

      @if (error()) {
        <div class="error-banner">{{ error() }}</div>
      }
    </div>
  `,
  styles: [`
    .planner {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .planner__header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .planner__title {
      flex: 1;
      font-size: 24px;
      font-weight: 700;
      margin: 0;
    }

    .planner__actions {
      display: flex;
      gap: 12px;
    }

    .week-nav {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      justify-content: center;
    }

    .week-label {
      font-size: 18px;
      font-weight: 600;
      min-width: 200px;
      text-align: center;
    }

    .status-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 24px;
      font-weight: 500;

      &.status-1 { background: #fef3c7; color: #92400e; } // Draft
      &.status-2 { background: #dbeafe; color: #1e40af; } // Submitted
      &.status-3 { background: #d1fae5; color: #065f46; } // Approved
      &.status-4 { background: #fee2e2; color: #991b1b; } // Rejected
      &.status-5 { background: #e0e7ff; color: #3730a3; } // InProgress
      &.status-6 { background: #d1fae5; color: #065f46; } // Completed

      .status-icon i {
        font-size: 20px;
      }

      .rejection-reason {
        margin-left: auto;
        font-style: italic;
        opacity: 0.8;
      }
    }

    .calendar {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .day-column {
      background: var(--surface);
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border);
      min-height: 400px;
    }

    .day-header {
      padding: 12px 16px;
      background: var(--surface-secondary);
      border-bottom: 1px solid var(--border);
      text-align: center;
    }

    .day-name {
      display: block;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
    }

    .day-date {
      display: block;
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 2px;
    }

    .day-visits {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .visit-card {
      background: var(--background);
      border-radius: 8px;
      padding: 10px 12px;
      border-left: 3px solid var(--primary);
      transition: all 0.2s;

      &:hover {
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      &.executed {
        border-left-color: var(--success, #10b981);
        background: rgba(16, 185, 129, 0.05);
      }
    }

    .visit-time {
      font-size: 11px;
      font-weight: 600;
      color: var(--primary);
      margin-bottom: 4px;
    }

    .visit-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .visit-customer {
      font-weight: 600;
      font-size: 13px;
    }

    .visit-city, .visit-objective {
      font-size: 11px;
      color: var(--text-secondary);
    }

    .visit-actions {
      display: flex;
      gap: 4px;
      margin-top: 8px;
      justify-content: flex-end;
    }

    .executed-badge {
      background: var(--success, #10b981);
      color: white;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;

      i { font-size: 14px; }
    }

    .add-visit-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 10px;
      border: 2px dashed var(--border);
      border-radius: 8px;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;

      &:hover {
        border-color: var(--primary);
        color: var(--primary);
        background: rgba(59, 130, 246, 0.05);
      }

      i { font-size: 18px; }
    }

    .summary {
      display: flex;
      gap: 24px;
      justify-content: center;
      padding: 16px;
      background: var(--surface);
      border-radius: 12px;
    }

    .summary-item {
      text-align: center;

      .summary-value {
        display: block;
        font-size: 32px;
        font-weight: 700;
        color: var(--primary);
      }

      .summary-label {
        font-size: 12px;
        color: var(--text-secondary);
      }

      &.executed .summary-value {
        color: var(--success, #10b981);
      }
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      gap: 16px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner-sm {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      display: inline-block;
      margin-right: 8px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-banner {
      padding: 12px 16px;
      background: #fee2e2;
      color: #991b1b;
      border-radius: 8px;
      margin-top: 16px;
    }

    /* Modal styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: var(--surface);
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);

      h2 { margin: 0; font-size: 18px; }
    }

    .modal-body {
      padding: 20px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid var(--border);
    }

    .form-group {
      margin-bottom: 16px;

      label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 6px;
        color: var(--text-secondary);
      }

      input, select, textarea {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 14px;
        background: var(--background);
        color: var(--text-primary);
      }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .btn-sm {
      padding: 4px 8px;

      i { font-size: 16px; }
    }

    @media (max-width: 768px) {
      .calendar {
        grid-template-columns: 1fr;
      }

      .day-column {
        min-height: auto;
      }

      .planner__header {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class VisitPlannerComponent implements OnInit {
  private readonly visitPlanService = inject(VisitPlanService);
  private readonly salesRepService = inject(SalesRepService);
  private readonly authState = inject(AuthStateService);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translateService = inject(TranslateService);
  private readonly router = inject(Router);

  VisitPlanStatus = VisitPlanStatus;

  // State
  loading = signal(true);
  error = signal<string | null>(null);
  submitting = signal(false);

  currentMonday = signal(this.visitPlanService.getMondayOfWeek(new Date()));
  plan = signal<VisitPlanDetail | null>(null);
  rep = signal<SalesRepresentative | null>(null);
  assignedCustomers = signal<CustomerAssignment[]>([]);

  // Modal state
  showVisitModal = signal(false);
  editingVisit = signal<PlannedVisit | null>(null);
  selectedDay = signal<Date | null>(null);
  savingVisit = signal(false);

  visitForm = {
    customerId: null as number | null,
    plannedDate: '',
    plannedTime: '',
    estimatedDurationMinutes: 30,
    visitObjective: '',
    notes: ''
  };

  // Computed
  weekDays = computed(() => this.visitPlanService.getWeekDays(this.currentMonday()));

  weekLabel = computed(() => {
    const monday = this.currentMonday();
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${monday.toLocaleDateString(undefined, options)} - ${friday.toLocaleDateString(undefined, options)}, ${monday.getFullYear()}`;
  });

  executedCount = computed(() => {
    return this.plan()?.plannedVisits.filter(v => v.hasExecutedVisit).length || 0;
  });

  canEdit = computed(() => {
    const p = this.plan();
    return p && (p.status === VisitPlanStatus.Draft || p.status === VisitPlanStatus.Rejected);
  });

  ngOnInit(): void {
    this.loadRep();
  }

  private loadRep(): void {
    const user = this.authState.getUser();
    if (!user?.id) {
      this.error.set('Not authenticated');
      this.loading.set(false);
      return;
    }

    this.salesRepService.getByUserId(user.id).subscribe({
      next: (rep) => {
        this.rep.set(rep);
        this.loadAssignedCustomers(rep.id);
        this.loadWeekPlan();
      },
      error: () => {
        this.error.set('Sales representative profile not found');
        this.loading.set(false);
      }
    });
  }

  private loadAssignedCustomers(repId: number): void {
    this.salesRepService.getCustomerAssignments(repId).subscribe({
      next: (customers) => this.assignedCustomers.set(customers),
      error: () => {} // Silent fail for customers
    });
  }

  loadWeekPlan(): void {
    this.loading.set(true);
    this.error.set(null);

    this.visitPlanService.getOrCreateWeekPlan(this.currentMonday()).subscribe({
      next: (plan) => {
        this.plan.set(plan);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to load plan');
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/visits']);
  }

  previousWeek(): void {
    const prev = new Date(this.currentMonday());
    prev.setDate(prev.getDate() - 7);
    this.currentMonday.set(prev);
    this.loadWeekPlan();
  }

  nextWeek(): void {
    const next = new Date(this.currentMonday());
    next.setDate(next.getDate() + 7);
    this.currentMonday.set(next);
    this.loadWeekPlan();
  }

  goToCurrentWeek(): void {
    this.currentMonday.set(this.visitPlanService.getMondayOfWeek(new Date()));
    this.loadWeekPlan();
  }

  getDayName(date: Date): string {
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  }

  formatDayDate(date: Date): string {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  getVisitsForDay(day: Date): PlannedVisit[] {
    const dayStr = this.visitPlanService.formatDate(day);
    return this.plan()?.plannedVisits
      .filter(v => v.plannedDate.startsWith(dayStr))
      .sort((a, b) => (a.plannedTime || '').localeCompare(b.plannedTime || '')) || [];
  }

  openAddVisitModal(day: Date): void {
    this.selectedDay.set(day);
    this.editingVisit.set(null);
    this.visitForm = {
      customerId: null,
      plannedDate: this.visitPlanService.formatDate(day),
      plannedTime: '09:00',
      estimatedDurationMinutes: 30,
      visitObjective: '',
      notes: ''
    };
    this.showVisitModal.set(true);
  }

  editVisit(visit: PlannedVisit): void {
    this.editingVisit.set(visit);
    this.visitForm = {
      customerId: visit.customerId,
      plannedDate: visit.plannedDate.split('T')[0],
      plannedTime: visit.plannedTime || '',
      estimatedDurationMinutes: visit.estimatedDurationMinutes,
      visitObjective: visit.visitObjective || '',
      notes: visit.notes || ''
    };
    this.showVisitModal.set(true);
  }

  closeVisitModal(): void {
    this.showVisitModal.set(false);
    this.editingVisit.set(null);
  }

  canSaveVisit(): boolean {
    return !!this.visitForm.customerId && !!this.visitForm.plannedDate;
  }

  saveVisit(): void {
    const p = this.plan();
    if (!p || !this.canSaveVisit()) return;

    this.savingVisit.set(true);

    const editing = this.editingVisit();

    if (editing) {
      // Update existing visit
      this.visitPlanService.updatePlannedVisit(p.id, editing.id, {
        plannedDate: this.visitForm.plannedDate,
        plannedTime: this.visitForm.plannedTime || null,
        estimatedDurationMinutes: this.visitForm.estimatedDurationMinutes,
        visitObjective: this.visitForm.visitObjective || null,
        notes: this.visitForm.notes || null
      }).subscribe({
        next: () => {
          this.notificationService.success(this.translateService.instant('visitPlanner.visitUpdated'));
          this.closeVisitModal();
          this.loadWeekPlan();
        },
        error: (err) => {
          this.notificationService.error(err?.error?.message || this.translateService.instant('visitPlanner.updateError'));
        },
        complete: () => this.savingVisit.set(false)
      });
    } else {
      // Create new visit
      const maxSeq = Math.max(...(p.plannedVisits.map(v => v.sequenceNumber) || [0]), 0);
      const dto: CreatePlannedVisitRequest = {
        customerId: this.visitForm.customerId!,
        plannedDate: this.visitForm.plannedDate,
        plannedTime: this.visitForm.plannedTime || null,
        estimatedDurationMinutes: this.visitForm.estimatedDurationMinutes,
        visitObjective: this.visitForm.visitObjective || null,
        notes: this.visitForm.notes || null,
        sequenceNumber: maxSeq + 1
      };

      this.visitPlanService.addPlannedVisit(p.id, dto).subscribe({
        next: () => {
          this.notificationService.success(this.translateService.instant('visitPlanner.visitAdded'));
          this.closeVisitModal();
          this.loadWeekPlan();
        },
        error: (err) => {
          this.notificationService.error(err?.error?.message || this.translateService.instant('visitPlanner.addError'));
        },
        complete: () => this.savingVisit.set(false)
      });
    }
  }

  deleteVisit(visit: PlannedVisit): void {
    const p = this.plan();
    if (!p) return;

    this.confirmationService.confirm({
      title: this.translateService.instant('visitPlanner.deleteVisitTitle'),
      message: this.translateService.instant('visitPlanner.deleteVisitMessage', { customer: visit.customerName }),
      confirmText: this.translateService.instant('common.delete'),
      cancelText: this.translateService.instant('common.cancel'),
      variant: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.visitPlanService.deletePlannedVisit(p.id, visit.id).subscribe({
          next: () => {
            this.notificationService.success(this.translateService.instant('visitPlanner.visitDeleted'));
            this.loadWeekPlan();
          },
          error: (err) => {
            this.notificationService.error(err?.error?.message || this.translateService.instant('visitPlanner.deleteError'));
          }
        });
      }
    });
  }

  submitPlan(): void {
    const p = this.plan();
    if (!p) return;

    this.submitting.set(true);

    this.visitPlanService.submitForApproval(p.id).subscribe({
      next: (updated) => {
        this.plan.set(updated);
        this.notificationService.success(this.translateService.instant('visitPlanner.submitSuccess'));
      },
      error: (err) => {
        this.notificationService.error(err?.error?.message || this.translateService.instant('visitPlanner.submitError'));
      },
      complete: () => this.submitting.set(false)
    });
  }
}
