import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BrandService } from '../../../core/services/brand.service';
import { ManufacturerService } from '../../../core/services/manufacturer.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CreateBrandRequest, UpdateBrandRequest } from '../../../core/models/brand.model';

interface BrandForm {
  name: string;
  nameLocal: string;
  manufacturerId: number | null;
  description: string;
  descriptionLocal: string;
  logoPath: string;
  therapeuticArea: string;
  isActive: boolean;
}

@Component({
  selector: 'app-brand-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './brand-form.component.html'
})
export class BrandFormComponent {
  private readonly brandService = inject(BrandService);
  private readonly manufacturerService = inject(ManufacturerService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  // State
  loading = signal(false);
  saving = signal(false);
  manufacturers = signal<{ id: number; name: string }[]>([]);
  brandId = signal<number | null>(null);
  isEditMode = computed(() => this.brandId() !== null);

  form: BrandForm = {
    name: '',
    nameLocal: '',
    manufacturerId: null,
    description: '',
    descriptionLocal: '',
    logoPath: '',
    therapeuticArea: '',
    isActive: true
  };

  constructor() {
    this.loadManufacturers();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.brandId.set(Number(id));
      this.loadBrand(Number(id));
    }
  }

  private loadManufacturers(): void {
    this.manufacturerService.getAll().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.manufacturers.set(response.data.map(m => ({ id: m.id, name: m.name })));
        }
      }
    });
  }

  private loadBrand(id: number): void {
    this.loading.set(true);
    this.brandService.getById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const b = response.data;
          this.form = {
            name: b.name,
            nameLocal: b.nameLocal || '',
            manufacturerId: b.manufacturerId,
            description: b.description || '',
            descriptionLocal: b.descriptionLocal || '',
            logoPath: b.logoPath || '',
            therapeuticArea: b.therapeuticArea || '',
            isActive: b.isActive
          };
        }
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('brands.loadError'));
        this.loading.set(false);
        this.router.navigate(['/brands']);
      }
    });
  }

  save(): void {
    if (!this.validateForm()) return;

    this.saving.set(true);

    if (this.isEditMode()) {
      const dto: UpdateBrandRequest = {
        name: this.form.name,
        nameLocal: this.form.nameLocal || undefined,
        manufacturerId: this.form.manufacturerId!,
        description: this.form.description || undefined,
        descriptionLocal: this.form.descriptionLocal || undefined,
        logoPath: this.form.logoPath || undefined,
        therapeuticArea: this.form.therapeuticArea || undefined,
        isActive: this.form.isActive
      };

      this.brandService.update(this.brandId()!, dto).subscribe({
        next: (response) => {
          this.saving.set(false);
          if (response.success) {
            this.notification.success(this.translate.instant('brands.updated'));
            this.router.navigate(['/brands', this.brandId()]);
          } else {
            this.notification.error(response.message || this.translate.instant('brands.saveError'));
          }
        },
        error: () => {
          this.saving.set(false);
          this.notification.error(this.translate.instant('brands.saveError'));
        }
      });
    } else {
      const dto: CreateBrandRequest = {
        name: this.form.name,
        nameLocal: this.form.nameLocal || undefined,
        manufacturerId: this.form.manufacturerId!,
        description: this.form.description || undefined,
        descriptionLocal: this.form.descriptionLocal || undefined,
        logoPath: this.form.logoPath || undefined,
        therapeuticArea: this.form.therapeuticArea || undefined
      };

      this.brandService.create(dto).subscribe({
        next: (response) => {
          this.saving.set(false);
          if (response.success && response.data) {
            this.notification.success(this.translate.instant('brands.created'));
            this.router.navigate(['/brands', response.data.id]);
          } else {
            this.notification.error(response.message || this.translate.instant('brands.saveError'));
          }
        },
        error: () => {
          this.saving.set(false);
          this.notification.error(this.translate.instant('brands.saveError'));
        }
      });
    }
  }

  private validateForm(): boolean {
    if (!this.form.name?.trim()) {
      this.notification.error(this.translate.instant('brands.validation.nameRequired'));
      return false;
    }
    if (!this.form.manufacturerId) {
      this.notification.error(this.translate.instant('brands.validation.manufacturerRequired'));
      return false;
    }
    return true;
  }

  cancel(): void {
    if (this.isEditMode()) {
      this.router.navigate(['/brands', this.brandId()]);
    } else {
      this.router.navigate(['/brands']);
    }
  }
}
