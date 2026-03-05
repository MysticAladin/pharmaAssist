import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TerritoryService } from '../../../core/services/territory.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CreateTerritoryRequest, UpdateTerritoryRequest, TerritoryType, TERRITORY_TYPE_LABELS } from '../../../core/models/territory.model';

@Component({
  selector: 'app-territory-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './territory-form.component.html'
})
export class TerritoryFormComponent {
  private readonly territoryService = inject(TerritoryService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  // State
  loading = signal(false);
  saving = signal(false);
  territoryId = signal<number | null>(null);
  isEditMode = computed(() => this.territoryId() !== null);
  typeLabels = TERRITORY_TYPE_LABELS;

  // Form model
  form = signal({
    name: '',
    nameLocal: '',
    type: TerritoryType.Canton as TerritoryType,
    parentTerritoryId: null as number | null,
    cantonIds: '',
    municipalityIds: '',
    description: '',
    isActive: true
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.territoryId.set(Number(id));
      this.loadTerritory(Number(id));
    }
  }

  private loadTerritory(id: number): void {
    this.loading.set(true);
    this.territoryService.getTerritoryById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const t = response.data;
          this.form.set({
            name: t.name,
            nameLocal: t.nameLocal || '',
            type: t.type,
            parentTerritoryId: t.parentTerritoryId || null,
            cantonIds: t.cantonIds || '',
            municipalityIds: t.municipalityIds || '',
            description: t.description || '',
            isActive: t.isActive
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('territories.loadError'));
        this.loading.set(false);
      }
    });
  }

  save(): void {
    const f = this.form();
    if (!f.name) {
      this.notification.error(this.translate.instant('territories.validation.nameRequired'));
      return;
    }

    this.saving.set(true);

    if (this.isEditMode()) {
      const dto: UpdateTerritoryRequest = {
        name: f.name,
        nameLocal: f.nameLocal || undefined,
        type: f.type,
        parentTerritoryId: f.parentTerritoryId || undefined,
        cantonIds: f.cantonIds || undefined,
        municipalityIds: f.municipalityIds || undefined,
        description: f.description || undefined,
        isActive: f.isActive
      };

      this.territoryService.updateTerritory(this.territoryId()!, dto).subscribe({
        next: (response) => {
          if (response.success) {
            this.notification.success(this.translate.instant('territories.updateSuccess'));
            this.router.navigate(['/territories', this.territoryId()]);
          } else {
            this.notification.error(response.message || this.translate.instant('territories.updateError'));
          }
          this.saving.set(false);
        },
        error: () => {
          this.notification.error(this.translate.instant('territories.updateError'));
          this.saving.set(false);
        }
      });
    } else {
      const dto: CreateTerritoryRequest = {
        name: f.name,
        nameLocal: f.nameLocal || undefined,
        type: f.type,
        parentTerritoryId: f.parentTerritoryId || undefined,
        cantonIds: f.cantonIds || undefined,
        municipalityIds: f.municipalityIds || undefined,
        description: f.description || undefined
      };

      this.territoryService.createTerritory(dto).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.notification.success(this.translate.instant('territories.createSuccess'));
            this.router.navigate(['/territories', response.data.id]);
          } else {
            this.notification.error(response.message || this.translate.instant('territories.createError'));
          }
          this.saving.set(false);
        },
        error: () => {
          this.notification.error(this.translate.instant('territories.createError'));
          this.saving.set(false);
        }
      });
    }
  }
}
