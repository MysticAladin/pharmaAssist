import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MaterialDistributionService } from '../../../core/services/material-distribution.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  CreateDistributionRequest,
  MaterialType,
  MATERIAL_TYPE_LABELS
} from '../../../core/models/material.model';

@Component({
  selector: 'app-distribution-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './distribution-form.component.html'
})
export class DistributionFormComponent {
  private readonly materialService = inject(MaterialDistributionService);
  private readonly notification = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  saving = signal(false);

  repId = signal<number | null>(null);
  customerId = signal<number | null>(null);
  visitId = signal<number | null>(null);
  productId = signal<number | null>(null);
  materialName = signal('');
  materialType = signal<MaterialType>(MaterialType.Sample);
  quantity = signal(1);
  lotNumber = signal('');
  notes = signal('');

  materialTypes = Object.entries(MATERIAL_TYPE_LABELS).map(([key, label]) => ({
    value: Number(key) as MaterialType,
    label
  }));

  onSave(): void {
    if (!this.repId() || !this.customerId() || !this.materialName()) {
      this.notification.warning(this.translate.instant('MATERIALS.REQUIRED_FIELDS'));
      return;
    }

    this.saving.set(true);
    const request: CreateDistributionRequest = {
      repId: this.repId()!,
      customerId: this.customerId()!,
      visitId: this.visitId() || undefined,
      productId: this.productId() || undefined,
      materialName: this.materialName(),
      materialType: this.materialType(),
      quantity: this.quantity(),
      lotNumber: this.lotNumber() || undefined,
      notes: this.notes() || undefined
    };

    this.materialService.createDistribution(request).subscribe({
      next: () => {
        this.notification.success(this.translate.instant('MATERIALS.CREATE_SUCCESS'));
        this.saving.set(false);
        this.router.navigate(['/materials']);
      },
      error: () => {
        this.notification.error(this.translate.instant('MATERIALS.CREATE_ERROR'));
        this.saving.set(false);
      }
    });
  }
}
