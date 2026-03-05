import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TerritoryService } from '../../../core/services/territory.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  Territory, TerritoryAssignment, TerritoryPerformance,
  CreateTerritoryAssignmentRequest, AssignmentType,
  TERRITORY_TYPE_LABELS, ASSIGNMENT_TYPE_LABELS
} from '../../../core/models/territory.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-territory-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, ConfirmDialogComponent, StatusBadgeComponent],
  templateUrl: './territory-detail.component.html'
})
export class TerritoryDetailComponent {
  private readonly territoryService = inject(TerritoryService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  territory = signal<Territory | null>(null);
  performance = signal<TerritoryPerformance | null>(null);
  loading = signal(false);
  activeTab = signal<'overview' | 'assignments' | 'performance'>('overview');
  typeLabels = TERRITORY_TYPE_LABELS;
  assignmentTypeLabels = ASSIGNMENT_TYPE_LABELS;

  // Assignment form
  showAssignForm = signal(false);
  assignForm = signal<CreateTerritoryAssignmentRequest>({
    repId: 0,
    startDate: new Date().toISOString().substring(0, 10),
    isPrimary: true,
    assignmentType: AssignmentType.Exclusive
  });

  // Delete dialog
  showDeleteDialog = signal(false);
  assignmentToRemove = signal<TerritoryAssignment | null>(null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTerritory(Number(id));
    }
  }

  private loadTerritory(id: number): void {
    this.loading.set(true);
    this.territoryService.getTerritoryById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.territory.set(response.data);
          this.loadPerformance(id);
        }
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('territories.loadError'));
        this.loading.set(false);
      }
    });
  }

  private loadPerformance(id: number): void {
    this.territoryService.getTerritoryPerformance(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.performance.set(response.data);
        }
      }
    });
  }

  setTab(tab: 'overview' | 'assignments' | 'performance'): void {
    this.activeTab.set(tab);
  }

  editTerritory(): void {
    const t = this.territory();
    if (t) this.router.navigate(['/territories', t.id, 'edit']);
  }

  assignRep(): void {
    const t = this.territory();
    const f = this.assignForm();
    if (!t || !f.repId) return;

    this.territoryService.assignRep(t.id, f).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(this.translate.instant('territories.assignSuccess'));
          this.showAssignForm.set(false);
          this.loadTerritory(t.id);
        } else {
          this.notification.error(response.message || this.translate.instant('territories.assignError'));
        }
      },
      error: () => this.notification.error(this.translate.instant('territories.assignError'))
    });
  }

  confirmRemoveAssignment(assignment: TerritoryAssignment): void {
    this.assignmentToRemove.set(assignment);
    this.showDeleteDialog.set(true);
  }

  removeAssignment(): void {
    const t = this.territory();
    const a = this.assignmentToRemove();
    if (!t || !a) return;

    this.territoryService.removeAssignment(t.id, a.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(this.translate.instant('territories.unassignSuccess'));
          this.loadTerritory(t.id);
        }
        this.showDeleteDialog.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('territories.unassignError'));
        this.showDeleteDialog.set(false);
      }
    });
  }
}
