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
import { EuropeanDatePipe } from '../../core/pipes/european-date.pipe';
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
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule, EuropeanDatePipe],
  templateUrl: './visit-planner-component/visit-planner.component.html',
  styleUrls: ['./visit-planner-component/visit-planner.component.scss']
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

  onDateInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Parse dd.MM.yyyy format
    const match = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3];
      this.visitForm.plannedDate = `${year}-${month}-${day}`;
    }
  }
}
