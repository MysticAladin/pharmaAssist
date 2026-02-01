import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { PlanningService } from '../../core/services/planning.service';
import { AuthService } from '../../core/services/auth.service';
import {
  AnnualPlanSummary,
  AnnualPlanDetail,
  QuarterlyPlanSummary,
  QuarterlyPlanDetail,
  MonthlyPlanSummary,
  MonthlyPlanDetail,
  PlanningHierarchyOverview,
  CreateAnnualPlanRequest
} from '../../core/models/planning.model';
import { UIStateService } from '../../core/state/ui-state.service';

@Component({
  selector: 'app-planning-hierarchy',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="container-fluid py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="mb-0">
          <i class="bi bi-calendar3-range me-2"></i>
          Planiranje - Hijerarhija
        </h2>
        <div class="btn-group">
          <button class="btn btn-primary" (click)="showCreateAnnualPlanModal()">
            <i class="bi bi-plus-lg me-1"></i>
            Novi godišnji plan
          </button>
        </div>
      </div>

      <!-- Overview Cards -->
      @if (overview()) {
        <div class="row mb-4">
          <div class="col-lg-3 col-md-6 mb-3">
            <div class="card h-100 border-primary">
              <div class="card-header bg-primary text-white">
                <i class="bi bi-calendar-check me-2"></i>
                Godišnji plan
              </div>
              <div class="card-body">
                @if (overview()?.currentAnnualPlan) {
                  <h5>{{ overview()!.currentAnnualPlan!.title }}</h5>
                  <p class="mb-1">
                    <span class="badge" [class]="getStatusClass(overview()!.currentAnnualPlan!.statusName)">
                      {{ overview()!.currentAnnualPlan!.statusName }}
                    </span>
                  </p>
                  <small class="text-muted">
                    Prihod: {{ (overview()!.currentAnnualPlan!.revenueTarget || 0) | number:'1.0-0' }} KM
                  </small>
                } @else {
                  <p class="text-muted mb-0">Nema aktivnog plana za {{ currentYear }}</p>
                  <button class="btn btn-sm btn-outline-primary mt-2" (click)="showCreateAnnualPlanModal()">
                    Kreiraj
                  </button>
                }
              </div>
            </div>
          </div>

          <div class="col-lg-3 col-md-6 mb-3">
            <div class="card h-100 border-info">
              <div class="card-header bg-info text-white">
                <i class="bi bi-calendar3 me-2"></i>
                Kvartalni plan (Q{{ currentQuarter }})
              </div>
              <div class="card-body">
                @if (overview()?.currentQuarterlyPlan) {
                  <h5>{{ overview()!.currentQuarterlyPlan!.title }}</h5>
                  <p class="mb-1">
                    <span class="badge" [class]="getStatusClass(overview()!.currentQuarterlyPlan!.statusName)">
                      {{ overview()!.currentQuarterlyPlan!.statusName }}
                    </span>
                  </p>
                  <small class="text-muted">
                    Posjete: {{ overview()!.currentQuarterlyPlan!.visitsTarget || 0 }}
                  </small>
                } @else {
                  <p class="text-muted mb-0">Nema plana za Q{{ currentQuarter }}</p>
                }
              </div>
            </div>
          </div>

          <div class="col-lg-3 col-md-6 mb-3">
            <div class="card h-100 border-success">
              <div class="card-header bg-success text-white">
                <i class="bi bi-calendar-month me-2"></i>
                Mjesečni plan
              </div>
              <div class="card-body">
                @if (overview()?.currentMonthlyPlan) {
                  <h5>{{ overview()!.currentMonthlyPlan!.title }}</h5>
                  <p class="mb-1">
                    <span class="badge" [class]="getStatusClass(overview()!.currentMonthlyPlan!.statusName)">
                      {{ overview()!.currentMonthlyPlan!.statusName }}
                    </span>
                  </p>
                  <small class="text-muted">
                    Posjete: {{ overview()!.currentMonthlyPlan!.actualVisits || 0 }}/{{ overview()!.currentMonthlyPlan!.visitsTarget || 0 }}
                  </small>
                } @else {
                  <p class="text-muted mb-0">Nema plana za ovaj mjesec</p>
                }
              </div>
            </div>
          </div>

          <div class="col-lg-3 col-md-6 mb-3">
            <div class="card h-100 border-warning">
              <div class="card-header bg-warning text-dark">
                <i class="bi bi-calendar-week me-2"></i>
                Sedmični plan
              </div>
              <div class="card-body">
                @if (overview()?.currentWeeklyPlan) {
                  <h5>Sedmica {{ overview()!.currentWeeklyPlan!.planWeek | date:'d.M.' }}</h5>
                  <p class="mb-1">
                    <span class="badge" [class]="getStatusClass(overview()!.currentWeeklyPlan!.status)">
                      {{ overview()!.currentWeeklyPlan!.status }}
                    </span>
                  </p>
                  <small class="text-muted">
                    Posjete: {{ overview()!.currentWeeklyPlan!.executedVisitsCount }}/{{ overview()!.currentWeeklyPlan!.plannedVisitsCount }}
                  </small>
                } @else {
                  <p class="text-muted mb-0">Nema plana za ovu sedmicu</p>
                  <a routerLink="/visits/planner" class="btn btn-sm btn-outline-warning mt-2">
                    Planiraj
                  </a>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Progress Section -->
        @if (overview()?.progress) {
          <div class="card mb-4">
            <div class="card-header">
              <i class="bi bi-graph-up me-2"></i>
              Napredak - {{ currentYear }}
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Prihod</label>
                  <div class="progress" style="height: 25px;">
                    <div class="progress-bar bg-primary"
                         [style.width.%]="Math.min(overview()!.progress.annualRevenueProgress, 100)">
                      {{ overview()!.progress.annualRevenueProgress | number:'1.1-1' }}%
                    </div>
                  </div>
                  <small class="text-muted">
                    {{ overview()!.progress.annualRevenueActual | number:'1.0-0' }} /
                    {{ overview()!.progress.annualRevenueTarget | number:'1.0-0' }} KM
                  </small>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Posjete</label>
                  <div class="progress" style="height: 25px;">
                    <div class="progress-bar bg-success"
                         [style.width.%]="Math.min(overview()!.progress.annualVisitsProgress, 100)">
                      {{ overview()!.progress.annualVisitsProgress | number:'1.1-1' }}%
                    </div>
                  </div>
                  <small class="text-muted">
                    {{ overview()!.progress.annualVisitsActual }} / {{ overview()!.progress.annualVisitsTarget }}
                  </small>
                </div>
              </div>
              <div class="row mt-2">
                <div class="col-md-4">
                  <span class="badge bg-primary">Kvartala: {{ overview()!.progress.quarterlyPlansCompleted }}/4</span>
                </div>
                <div class="col-md-4">
                  <span class="badge bg-info">Mjeseci: {{ overview()!.progress.monthlyPlansCompleted }}/12</span>
                </div>
                <div class="col-md-4">
                  <span class="badge bg-success">Sedmica: {{ overview()!.progress.weeklyPlansCompleted }}</span>
                </div>
              </div>
            </div>
          </div>
        }
      }

      <!-- Annual Plans List -->
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <span>
            <i class="bi bi-list-ul me-2"></i>
            Godišnji planovi
          </span>
        </div>
        <div class="card-body p-0">
          @if (loading()) {
            <div class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Učitavanje...</span>
              </div>
            </div>
          } @else if (annualPlans().length === 0) {
            <div class="text-center py-4 text-muted">
              <i class="bi bi-inbox display-4"></i>
              <p class="mt-2">Nema godišnjih planova</p>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Godina</th>
                    <th>Naziv</th>
                    <th>Status</th>
                    <th>Cilj prihoda</th>
                    <th>Cilj posjeta</th>
                    <th>Kvartala</th>
                    <th>Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  @for (plan of annualPlans(); track plan.id) {
                    <tr [class.table-info]="selectedAnnualPlan()?.id === plan.id"
                        (click)="selectAnnualPlan(plan)"
                        style="cursor: pointer;">
                      <td><strong>{{ plan.year }}</strong></td>
                      <td>{{ plan.title }}</td>
                      <td>
                        <span class="badge" [class]="getStatusClass(plan.statusName)">
                          {{ plan.statusName }}
                        </span>
                      </td>
                      <td>{{ (plan.revenueTarget || 0) | number:'1.0-0' }} KM</td>
                      <td>{{ plan.visitsTarget || 0 }}</td>
                      <td>{{ plan.quarterlyPlansCount }}</td>
                      <td>
                        <div class="btn-group btn-group-sm">
                          <button class="btn btn-outline-primary"
                                  (click)="viewAnnualPlan(plan.id); $event.stopPropagation();"
                                  title="Detalji">
                            <i class="bi bi-eye"></i>
                          </button>
                          @if (plan.statusName === 'Draft' || plan.statusName === 'Rejected') {
                            <button class="btn btn-outline-success"
                                    (click)="submitAnnualPlan(plan.id); $event.stopPropagation();"
                                    title="Pošalji na odobrenje">
                              <i class="bi bi-send"></i>
                            </button>
                          }
                          @if (plan.statusName === 'Approved' && plan.quarterlyPlansCount < 4) {
                            <button class="btn btn-outline-info"
                                    (click)="generateQuarterlyPlans(plan.id); $event.stopPropagation();"
                                    title="Generiši kvartalne planove">
                              <i class="bi bi-magic"></i>
                            </button>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>

      <!-- Selected Annual Plan Details -->
      @if (selectedAnnualPlanDetail()) {
        <div class="card mt-4">
          <div class="card-header bg-primary text-white">
            <i class="bi bi-diagram-3 me-2"></i>
            {{ selectedAnnualPlanDetail()!.title }} - Kvartalni planovi
          </div>
          <div class="card-body">
            @if (selectedAnnualPlanDetail()!.quarterlyPlans.length === 0) {
              <div class="text-center py-3 text-muted">
                <p>Nema kvartalnih planova</p>
                @if (selectedAnnualPlanDetail()!.statusName === 'Approved') {
                  <button class="btn btn-info" (click)="generateQuarterlyPlans(selectedAnnualPlanDetail()!.id)">
                    <i class="bi bi-magic me-1"></i>
                    Generiši kvartalne planove
                  </button>
                }
              </div>
            } @else {
              <div class="row">
                @for (quarter of selectedAnnualPlanDetail()!.quarterlyPlans; track quarter.id) {
                  <div class="col-md-6 col-lg-3 mb-3">
                    <div class="card h-100" [class.border-primary]="quarter.quarter === currentQuarter">
                      <div class="card-header"
                           [class.bg-primary]="quarter.quarter === currentQuarter"
                           [class.text-white]="quarter.quarter === currentQuarter">
                        Q{{ quarter.quarter }}
                        <span class="badge float-end" [class]="getStatusClass(quarter.statusName)">
                          {{ quarter.statusName }}
                        </span>
                      </div>
                      <div class="card-body">
                        <p class="mb-1"><strong>{{ quarter.title }}</strong></p>
                        <p class="mb-1 small">
                          <i class="bi bi-currency-dollar text-success"></i>
                          {{ (quarter.revenueTarget || 0) | number:'1.0-0' }} KM
                        </p>
                        <p class="mb-1 small">
                          <i class="bi bi-geo-alt text-primary"></i>
                          {{ quarter.visitsTarget || 0 }} posjeta
                        </p>
                        <p class="mb-2 small text-muted">
                          {{ quarter.monthlyPlansCount }}/3 mjeseci
                        </p>
                        <div class="btn-group btn-group-sm w-100">
                          <button class="btn btn-outline-primary" (click)="viewQuarterlyPlan(quarter.id)">
                            <i class="bi bi-eye"></i>
                          </button>
                          @if (quarter.statusName === 'Approved' && quarter.monthlyPlansCount < 3) {
                            <button class="btn btn-outline-info" (click)="generateMonthlyPlans(quarter.id)">
                              <i class="bi bi-magic"></i>
                            </button>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>

    <!-- Create Annual Plan Modal -->
    @if (showCreateModal()) {
      <div class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-plus-circle me-2"></i>
                Novi godišnji plan
              </h5>
              <button type="button" class="btn-close" (click)="closeCreateModal()"></button>
            </div>
            <div class="modal-body">
              <form (ngSubmit)="createAnnualPlan()">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Godina *</label>
                    <select class="form-select" [(ngModel)]="newPlan.year" name="year" required>
                      <option [value]="currentYear">{{ currentYear }}</option>
                      <option [value]="currentYear + 1">{{ currentYear + 1 }}</option>
                    </select>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Naziv *</label>
                    <input type="text" class="form-control" [(ngModel)]="newPlan.title" name="title"
                           placeholder="Godišnji plan 2025" required>
                  </div>
                </div>
                <div class="row">
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Cilj prihoda (KM)</label>
                    <input type="number" class="form-control" [(ngModel)]="newPlan.revenueTarget" name="revenueTarget">
                  </div>
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Cilj posjeta</label>
                    <input type="number" class="form-control" [(ngModel)]="newPlan.visitsTarget" name="visitsTarget">
                  </div>
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Cilj novih kupaca</label>
                    <input type="number" class="form-control" [(ngModel)]="newPlan.newCustomersTarget" name="newCustomersTarget">
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Opis teritorije</label>
                  <textarea class="form-control" [(ngModel)]="newPlan.territoryDescription" name="territoryDescription" rows="2"></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">Dodijeljeni kantoni</label>
                  <input type="text" class="form-control" [(ngModel)]="newPlan.assignedCantons" name="assignedCantons"
                         placeholder="Sarajevski, Tuzlanski, Zeničko-dobojski">
                </div>
                <div class="mb-3">
                  <label class="form-label">Strateški prioriteti</label>
                  <textarea class="form-control" [(ngModel)]="newPlan.strategicPriorities" name="strategicPriorities" rows="2"></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">Fokus proizvodi (ID-ovi odvojeni zarezom)</label>
                  <input type="text" class="form-control" [(ngModel)]="newPlan.focusProducts" name="focusProducts">
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeCreateModal()">Odustani</button>
              <button type="button" class="btn btn-primary" (click)="createAnnualPlan()" [disabled]="!newPlan.title">
                <i class="bi bi-check-lg me-1"></i>
                Kreiraj
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .card {
      transition: box-shadow 0.2s;
    }
    .card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .progress {
      background-color: #e9ecef;
    }
    .table tbody tr:hover {
      background-color: rgba(13, 110, 253, 0.05);
    }
  `]
})
export class PlanningHierarchyComponent implements OnInit {
  private readonly planningService = inject(PlanningService);
  private readonly authService = inject(AuthService);
  private readonly ui = inject(UIStateService);

  readonly Math = Math;

  loading = signal(false);
  overview = signal<PlanningHierarchyOverview | null>(null);
  annualPlans = signal<AnnualPlanSummary[]>([]);
  selectedAnnualPlan = signal<AnnualPlanSummary | null>(null);
  selectedAnnualPlanDetail = signal<AnnualPlanDetail | null>(null);
  showCreateModal = signal(false);

  newPlan: CreateAnnualPlanRequest = {
    year: new Date().getFullYear(),
    title: ''
  };

  readonly currentYear = new Date().getFullYear();
  readonly currentQuarter = Math.floor((new Date().getMonth()) / 3) + 1;

  private repId = 0;

  ngOnInit(): void {
    // For now, we'll get repId from the user context
    // In a real app, this would come from the current user's sales rep profile
    this.repId = 1; // TODO: Get from auth service
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    // Load overview
    this.planningService.getOverview(this.repId).subscribe({
      next: (overview) => {
        this.overview.set(overview);
      },
      error: (err) => {
        console.error('Error loading overview:', err);
      }
    });

    // Load annual plans
    this.planningService.getAnnualPlans(this.repId).subscribe({
      next: (plans) => {
        this.annualPlans.set(plans);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading annual plans:', err);
        this.loading.set(false);
      }
    });
  }

  selectAnnualPlan(plan: AnnualPlanSummary): void {
    this.selectedAnnualPlan.set(plan);
    this.planningService.getAnnualPlan(plan.id).subscribe({
      next: (detail) => {
        this.selectedAnnualPlanDetail.set(detail);
      },
      error: (err) => {
        console.error('Error loading annual plan detail:', err);
        this.ui.showError('Greška pri učitavanju detalja plana');
      }
    });
  }

  viewAnnualPlan(id: number): void {
    this.planningService.getAnnualPlan(id).subscribe({
      next: (detail) => {
        this.selectedAnnualPlanDetail.set(detail);
      },
      error: (err) => {
        console.error('Error loading annual plan:', err);
        this.ui.showError('Greška pri učitavanju plana');
      }
    });
  }

  viewQuarterlyPlan(id: number): void {
    // TODO: Navigate to quarterly plan detail or show modal
    console.log('View quarterly plan:', id);
  }

  submitAnnualPlan(id: number): void {
    this.planningService.submitAnnualPlan(id).subscribe({
      next: () => {
        this.ui.showSuccess('Plan poslan na odobrenje');
        this.loadData();
      },
      error: (err) => {
        console.error('Error submitting plan:', err);
        this.ui.showError('Greška pri slanju plana');
      }
    });
  }

  generateQuarterlyPlans(annualPlanId: number): void {
    this.planningService.generateQuarterlyPlans(annualPlanId).subscribe({
      next: (plans) => {
        this.ui.showSuccess(`Generisano ${plans.length} kvartalnih planova`);
        this.loadData();
        if (this.selectedAnnualPlan()?.id === annualPlanId) {
          this.viewAnnualPlan(annualPlanId);
        }
      },
      error: (err) => {
        console.error('Error generating quarterly plans:', err);
        this.ui.showError('Greška pri generisanju planova');
      }
    });
  }

  generateMonthlyPlans(quarterlyPlanId: number): void {
    this.planningService.generateMonthlyPlans(quarterlyPlanId).subscribe({
      next: (plans) => {
        this.ui.showSuccess(`Generisano ${plans.length} mjesečnih planova`);
        this.loadData();
      },
      error: (err) => {
        console.error('Error generating monthly plans:', err);
        this.ui.showError('Greška pri generisanju planova');
      }
    });
  }

  showCreateAnnualPlanModal(): void {
    this.newPlan = {
      year: this.currentYear,
      title: `Godišnji plan ${this.currentYear}`
    };
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  createAnnualPlan(): void {
    if (!this.newPlan.title) return;

    this.planningService.createAnnualPlan(this.repId, this.newPlan).subscribe({
      next: (plan) => {
        this.ui.showSuccess('Godišnji plan kreiran');
        this.closeCreateModal();
        this.loadData();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error creating annual plan:', err);
        this.ui.showError(err.error?.error || 'Greška pri kreiranju plana');
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Draft': return 'bg-secondary';
      case 'Submitted': return 'bg-warning text-dark';
      case 'Approved': return 'bg-success';
      case 'Rejected': return 'bg-danger';
      case 'Active': return 'bg-primary';
      case 'Completed': return 'bg-info';
      case 'Archived': return 'bg-dark';
      default: return 'bg-secondary';
    }
  }
}
