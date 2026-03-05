import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MaterialDistributionService } from '../../../core/services/material-distribution.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  RepInventory,
  RestockInventoryRequest
} from '../../../core/models/material.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-rep-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, ConfirmDialogComponent, EmptyStateComponent, StatusBadgeComponent],
  templateUrl: './rep-inventory.component.html'
})
export class RepInventoryComponent {
  private readonly materialService = inject(MaterialDistributionService);
  private readonly notification = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);

  repId = signal(0);
  inventory = signal<RepInventory[]>([]);
  loading = signal(true);

  showRestockDialog = signal(false);
  restockTarget = signal<RepInventory | null>(null);
  restockQuantity = signal(0);
  restocking = signal(false);

  showDeleteDialog = signal(false);
  deleteTarget = signal<RepInventory | null>(null);
  deleting = signal(false);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('repId'));
    if (id) {
      this.repId.set(id);
      this.loadInventory(id);
    }
  }

  loadInventory(repId: number): void {
    this.loading.set(true);
    this.materialService.getRepInventory(repId).subscribe({
      next: (response) => {
        this.inventory.set(response.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('MATERIALS.INVENTORY_LOAD_ERROR'));
        this.loading.set(false);
      }
    });
  }

  openRestock(item: RepInventory): void {
    this.restockTarget.set(item);
    this.restockQuantity.set(0);
    this.showRestockDialog.set(true);
  }

  restock(): void {
    const target = this.restockTarget();
    if (!target || this.restockQuantity() <= 0) return;
    this.restocking.set(true);
    const request: RestockInventoryRequest = { quantity: this.restockQuantity() };
    this.materialService.restockInventory(target.id, request).subscribe({
      next: () => {
        this.notification.success(this.translate.instant('MATERIALS.RESTOCK_SUCCESS'));
        this.restocking.set(false);
        this.showRestockDialog.set(false);
        this.loadInventory(this.repId());
      },
      error: () => {
        this.notification.error(this.translate.instant('MATERIALS.RESTOCK_ERROR'));
        this.restocking.set(false);
      }
    });
  }

  confirmDelete(item: RepInventory): void {
    this.deleteTarget.set(item);
    this.showDeleteDialog.set(true);
  }

  deleteItem(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.deleting.set(true);
    this.materialService.deleteInventoryItem(target.id).subscribe({
      next: () => {
        this.notification.success(this.translate.instant('MATERIALS.INVENTORY_DELETE_SUCCESS'));
        this.deleting.set(false);
        this.showDeleteDialog.set(false);
        this.loadInventory(this.repId());
      },
      error: () => {
        this.notification.error(this.translate.instant('MATERIALS.INVENTORY_DELETE_ERROR'));
        this.deleting.set(false);
      }
    });
  }
}
