import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PriceListService } from '../../../core/services/price-list.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  PriceListType,
  PRICE_LIST_TYPE_LABELS,
  CreatePriceListRequest,
  UpdatePriceListRequest,
  PriceListDetail
} from '../../../core/models/price-list.model';

@Component({
  selector: 'app-price-list-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    TranslateModule
  ],
  templateUrl: './price-list-form.component.html'
})
export class PriceListFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly priceListService = inject(PriceListService);
  private readonly notification = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  isEditMode = signal(false);
  loading = signal(false);
  saving = signal(false);
  priceListId = signal<number | null>(null);

  // Form fields
  name = signal('');
  type = signal<PriceListType>(PriceListType.Hospital);
  wholesalerName = signal('');
  effectiveFrom = signal('');
  effectiveTo = signal('');
  isActive = signal(true);
  description = signal('');

  priceListTypes = Object.entries(PRICE_LIST_TYPE_LABELS).map(([key, label]) => ({
    value: Number(key) as PriceListType,
    label
  }));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.priceListId.set(Number(id));
      this.loadPriceList(Number(id));
    }
  }

  loadPriceList(id: number): void {
    this.loading.set(true);
    this.priceListService.getPriceListById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const pl = response.data;
          this.name.set(pl.name);
          this.type.set(pl.type);
          this.wholesalerName.set('');
          this.effectiveFrom.set(pl.effectiveFrom ? pl.effectiveFrom.substring(0, 10) : '');
          this.effectiveTo.set(pl.effectiveTo ? pl.effectiveTo.substring(0, 10) : '');
          this.isActive.set(pl.isActive);
          this.description.set(pl.description || '');
        }
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('priceLists.loadError'));
        this.loading.set(false);
      }
    });
  }

  save(): void {
    if (!this.name() || !this.effectiveFrom()) {
      this.notification.warning(this.translate.instant('priceLists.validationError'));
      return;
    }

    this.saving.set(true);
    if (this.isEditMode()) {
      const request: UpdatePriceListRequest = {
        id: this.priceListId()!,
        name: this.name(),
        type: this.type(),
        effectiveFrom: this.effectiveFrom(),
        effectiveTo: this.effectiveTo() || undefined,
        isActive: this.isActive(),
        description: this.description() || undefined
      };
      this.priceListService.updatePriceList(this.priceListId()!, request).subscribe({
        next: (response) => {
          if (response.success) {
            this.notification.success(this.translate.instant('priceLists.updateSuccess'));
            this.router.navigate(['/price-lists', this.priceListId()]);
          }
          this.saving.set(false);
        },
        error: () => {
          this.notification.error(this.translate.instant('priceLists.updateError'));
          this.saving.set(false);
        }
      });
    } else {
      const request: CreatePriceListRequest = {
        name: this.name(),
        type: this.type(),
        effectiveFrom: this.effectiveFrom(),
        effectiveTo: this.effectiveTo() || undefined,
        isActive: this.isActive(),
        description: this.description() || undefined
      };
      this.priceListService.createPriceList(request).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.notification.success(this.translate.instant('priceLists.createSuccess'));
            this.router.navigate(['/price-lists', response.data.id]);
          }
          this.saving.set(false);
        },
        error: () => {
          this.notification.error(this.translate.instant('priceLists.createError'));
          this.saving.set(false);
        }
      });
    }
  }
}
