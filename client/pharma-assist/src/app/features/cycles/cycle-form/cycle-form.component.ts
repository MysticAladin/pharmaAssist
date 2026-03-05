import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CycleService } from '../../../core/services/cycle.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CreateCycleRequest, UpdateCycleRequest, CycleStatus } from '../../../core/models/cycle.model';

@Component({
  selector: 'app-cycle-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './cycle-form.component.html'
})
export class CycleFormComponent {
  private readonly cycleService = inject(CycleService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  // State
  loading = signal(false);
  saving = signal(false);
  cycleId = signal<number | null>(null);
  isEditMode = computed(() => this.cycleId() !== null);

  // Form model
  form = signal({
    name: '',
    nameLocal: '',
    startDate: '',
    endDate: '',
    focusBrandIds: '',
    description: '',
    ownerId: null as number | null,
    plannedBudget: 0,
    isActive: true
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.cycleId.set(Number(id));
      this.loadCycle(Number(id));
    }
  }

  private loadCycle(id: number): void {
    this.loading.set(true);
    this.cycleService.getCycleById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const c = response.data;
          this.form.set({
            name: c.name,
            nameLocal: c.nameLocal || '',
            startDate: c.startDate?.substring(0, 10) || '',
            endDate: c.endDate?.substring(0, 10) || '',
            focusBrandIds: c.focusBrandIds || '',
            description: c.description || '',
            ownerId: c.ownerId || null,
            plannedBudget: c.plannedBudget,
            isActive: c.isActive
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('cycles.loadError'));
        this.loading.set(false);
      }
    });
  }

  save(): void {
    const f = this.form();
    if (!f.name || !f.startDate || !f.endDate) {
      this.notification.error(this.translate.instant('cycles.validation.required'));
      return;
    }

    this.saving.set(true);

    if (this.isEditMode()) {
      const dto: UpdateCycleRequest = {
        name: f.name,
        nameLocal: f.nameLocal || undefined,
        startDate: f.startDate,
        endDate: f.endDate,
        focusBrandIds: f.focusBrandIds || undefined,
        description: f.description || undefined,
        ownerId: f.ownerId || undefined,
        plannedBudget: f.plannedBudget,
        isActive: f.isActive
      };

      this.cycleService.updateCycle(this.cycleId()!, dto).subscribe({
        next: (response) => {
          if (response.success) {
            this.notification.success(this.translate.instant('cycles.updated'));
            this.router.navigate(['/cycles', this.cycleId()]);
          } else {
            this.notification.error(response.message || this.translate.instant('cycles.saveError'));
          }
          this.saving.set(false);
        },
        error: () => {
          this.notification.error(this.translate.instant('cycles.saveError'));
          this.saving.set(false);
        }
      });
    } else {
      const dto: CreateCycleRequest = {
        name: f.name,
        nameLocal: f.nameLocal || undefined,
        startDate: f.startDate,
        endDate: f.endDate,
        focusBrandIds: f.focusBrandIds || undefined,
        description: f.description || undefined,
        ownerId: f.ownerId || undefined,
        plannedBudget: f.plannedBudget
      };

      this.cycleService.createCycle(dto).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.notification.success(this.translate.instant('cycles.created'));
            this.router.navigate(['/cycles', response.data.id]);
          } else {
            this.notification.error(response.message || this.translate.instant('cycles.saveError'));
          }
          this.saving.set(false);
        },
        error: () => {
          this.notification.error(this.translate.instant('cycles.saveError'));
          this.saving.set(false);
        }
      });
    }
  }

  cancel(): void {
    if (this.isEditMode()) {
      this.router.navigate(['/cycles', this.cycleId()]);
    } else {
      this.router.navigate(['/cycles']);
    }
  }
}
