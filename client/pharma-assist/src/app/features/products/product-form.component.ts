import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { ManufacturerService } from '../../core/services/manufacturer.service';
import { Product, CreateProductRequest, UpdateProductRequest } from '../../core/models/product.model';
import { CategorySummary } from '../../core/models/category.model';
import { ManufacturerSummary } from '../../core/models/manufacturer.model';

interface ProductForm {
  name: string;
  nameLocal: string;
  genericName: string;
  description: string;
  descriptionLocal: string;
  sku: string;
  barcode: string;
  atcCode: string;
  categoryId: number | null;
  manufacturerId: number | null;
  unitPrice: number;
  costPrice: number;
  taxRate: number;
  requiresPrescription: boolean;
  isControlled: boolean;
  dosageForm: string;
  strength: string;
  packageSize: string;
  reorderLevel: number;
  reorderQuantity: number;
  imageUrl: string;
  isActive: boolean;
  isFeatured: boolean;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div class="product-form-page">
      <!-- Header -->
      <div class="page-header">
        <div class="breadcrumb">
          <a routerLink="/products">{{ 'products.title' | translate }}</a>
          <span class="separator">/</span>
          <span>{{ isEditMode() ? ('products.form.editProduct' | translate) : ('products.form.addProduct' | translate) }}</span>
        </div>
        <div class="header-main">
          <h1 class="page-title">{{ isEditMode() ? ('products.form.editProduct' | translate) : ('products.form.addProduct' | translate) }}</h1>
          <div class="header-actions">
            <button type="button" class="btn-secondary" routerLink="/products">
              {{ 'common.cancel' | translate }}
            </button>
            <button type="button" class="btn-primary" (click)="save()" [disabled]="saving()">
              @if (saving()) {
                <span class="spinner"></span>
              }
              {{ 'common.save' | translate }}
            </button>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>{{ 'common.loading' | translate }}</p>
        </div>
      } @else {
        <form class="form-container" (ngSubmit)="save()">
          <!-- Basic Information -->
          <section class="form-section">
            <h2 class="section-title">{{ 'products.form.basicInfo' | translate }}</h2>
            <div class="form-grid">
              <div class="form-group">
                <label for="name">{{ 'products.form.name' | translate }} *</label>
                <input type="text" id="name" [(ngModel)]="form.name" name="name" required
                       [placeholder]="'products.form.namePlaceholder' | translate">
              </div>
              <div class="form-group">
                <label for="nameLocal">{{ 'products.form.nameLocal' | translate }} *</label>
                <input type="text" id="nameLocal" [(ngModel)]="form.nameLocal" name="nameLocal" required
                       [placeholder]="'products.form.nameLocalPlaceholder' | translate">
              </div>
              <div class="form-group">
                <label for="genericName">{{ 'products.form.genericName' | translate }}</label>
                <input type="text" id="genericName" [(ngModel)]="form.genericName" name="genericName"
                       [placeholder]="'products.form.genericNamePlaceholder' | translate">
              </div>
              <div class="form-group">
                <label for="sku">{{ 'products.form.sku' | translate }} *</label>
                <input type="text" id="sku" [(ngModel)]="form.sku" name="sku" required
                       [placeholder]="'products.form.skuPlaceholder' | translate">
              </div>
              <div class="form-group">
                <label for="barcode">{{ 'products.form.barcode' | translate }}</label>
                <input type="text" id="barcode" [(ngModel)]="form.barcode" name="barcode"
                       placeholder="1234567890123">
              </div>
              <div class="form-group">
                <label for="atcCode">{{ 'products.form.atcCode' | translate }}</label>
                <input type="text" id="atcCode" [(ngModel)]="form.atcCode" name="atcCode"
                       placeholder="A01AA01">
              </div>
              <div class="form-group full-width">
                <label for="description">{{ 'products.form.description' | translate }}</label>
                <textarea id="description" [(ngModel)]="form.description" name="description" rows="3"
                          [placeholder]="'products.form.descriptionPlaceholder' | translate"></textarea>
              </div>
              <div class="form-group full-width">
                <label for="descriptionLocal">{{ 'products.form.descriptionLocal' | translate }}</label>
                <textarea id="descriptionLocal" [(ngModel)]="form.descriptionLocal" name="descriptionLocal" rows="3"
                          [placeholder]="'products.form.descriptionLocalPlaceholder' | translate"></textarea>
              </div>
            </div>
          </section>

          <!-- Classification -->
          <section class="form-section">
            <h2 class="section-title">{{ 'products.form.classification' | translate }}</h2>
            <div class="form-grid">
              <div class="form-group">
                <label for="categoryId">{{ 'products.form.category' | translate }} *</label>
                <select id="categoryId" [(ngModel)]="form.categoryId" name="categoryId" required>
                  <option [ngValue]="null">{{ 'products.form.selectCategory' | translate }}</option>
                  @for (category of categories(); track category.id) {
                    <option [ngValue]="category.id">{{ category.name }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label for="manufacturerId">{{ 'products.form.manufacturer' | translate }} *</label>
                <select id="manufacturerId" [(ngModel)]="form.manufacturerId" name="manufacturerId" required>
                  <option [ngValue]="null">{{ 'products.form.selectManufacturer' | translate }}</option>
                  @for (mfr of manufacturers(); track mfr.id) {
                    <option [ngValue]="mfr.id">{{ mfr.name }}</option>
                  }
                </select>
              </div>
            </div>
          </section>

          <!-- Pharmaceutical Details -->
          <section class="form-section">
            <h2 class="section-title">{{ 'products.form.pharmaDetails' | translate }}</h2>
            <div class="form-grid">
              <div class="form-group">
                <label for="dosageForm">{{ 'products.form.dosageForm' | translate }}</label>
                <select id="dosageForm" [(ngModel)]="form.dosageForm" name="dosageForm">
                  <option value="">{{ 'products.form.selectDosageForm' | translate }}</option>
                  <option value="Tablet">{{ 'products.dosageForms.tablet' | translate }}</option>
                  <option value="Capsule">{{ 'products.dosageForms.capsule' | translate }}</option>
                  <option value="Syrup">{{ 'products.dosageForms.syrup' | translate }}</option>
                  <option value="Injection">{{ 'products.dosageForms.injection' | translate }}</option>
                  <option value="Cream">{{ 'products.dosageForms.cream' | translate }}</option>
                  <option value="Ointment">{{ 'products.dosageForms.ointment' | translate }}</option>
                  <option value="Drops">{{ 'products.dosageForms.drops' | translate }}</option>
                  <option value="Inhaler">{{ 'products.dosageForms.inhaler' | translate }}</option>
                  <option value="Powder">{{ 'products.dosageForms.powder' | translate }}</option>
                  <option value="Suppository">{{ 'products.dosageForms.suppository' | translate }}</option>
                </select>
              </div>
              <div class="form-group">
                <label for="strength">{{ 'products.form.strength' | translate }}</label>
                <input type="text" id="strength" [(ngModel)]="form.strength" name="strength"
                       placeholder="500mg">
              </div>
              <div class="form-group">
                <label for="packageSize">{{ 'products.form.packageSize' | translate }}</label>
                <input type="text" id="packageSize" [(ngModel)]="form.packageSize" name="packageSize"
                       placeholder="30 tablets">
              </div>
              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="form.requiresPrescription" name="requiresPrescription">
                  <span>{{ 'products.form.requiresPrescription' | translate }}</span>
                </label>
              </div>
              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="form.isControlled" name="isControlled">
                  <span>{{ 'products.form.isControlled' | translate }}</span>
                </label>
              </div>
            </div>
          </section>

          <!-- Pricing -->
          <section class="form-section">
            <h2 class="section-title">{{ 'products.form.pricing' | translate }}</h2>
            <div class="form-grid">
              <div class="form-group">
                <label for="unitPrice">{{ 'products.form.unitPrice' | translate }} (KM) *</label>
                <input type="number" id="unitPrice" [(ngModel)]="form.unitPrice" name="unitPrice" required
                       step="0.01" min="0" placeholder="0.00">
              </div>
              <div class="form-group">
                <label for="costPrice">{{ 'products.form.costPrice' | translate }} (KM)</label>
                <input type="number" id="costPrice" [(ngModel)]="form.costPrice" name="costPrice"
                       step="0.01" min="0" placeholder="0.00">
              </div>
              <div class="form-group">
                <label for="taxRate">{{ 'products.form.taxRate' | translate }} (%)</label>
                <input type="number" id="taxRate" [(ngModel)]="form.taxRate" name="taxRate"
                       step="0.01" min="0" max="100" placeholder="17">
              </div>
              @if (form.unitPrice && form.costPrice) {
                <div class="form-group">
                  <label>{{ 'products.form.margin' | translate }}</label>
                  <div class="calculated-value">{{ calculateMargin() | number:'1.2-2' }}%</div>
                </div>
              }
            </div>
          </section>

          <!-- Inventory -->
          <section class="form-section">
            <h2 class="section-title">{{ 'products.form.inventory' | translate }}</h2>
            <div class="form-grid">
              <div class="form-group">
                <label for="reorderLevel">{{ 'products.form.reorderLevel' | translate }} *</label>
                <input type="number" id="reorderLevel" [(ngModel)]="form.reorderLevel" name="reorderLevel" required
                       min="0" placeholder="10">
              </div>
              <div class="form-group">
                <label for="reorderQuantity">{{ 'products.form.reorderQuantity' | translate }} *</label>
                <input type="number" id="reorderQuantity" [(ngModel)]="form.reorderQuantity" name="reorderQuantity" required
                       min="0" placeholder="50">
              </div>
            </div>
          </section>

          <!-- Image & Status -->
          <section class="form-section">
            <h2 class="section-title">{{ 'products.form.imageStatus' | translate }}</h2>
            <div class="form-grid">
              <div class="form-group full-width">
                <label for="imageUrl">{{ 'products.form.imageUrl' | translate }}</label>
                <input type="url" id="imageUrl" [(ngModel)]="form.imageUrl" name="imageUrl"
                       placeholder="https://example.com/image.jpg">
                @if (form.imageUrl) {
                  <div class="image-preview">
                    <img [src]="form.imageUrl" alt="Product preview" (error)="onImageError($event)">
                  </div>
                }
              </div>
              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="form.isActive" name="isActive">
                  <span>{{ 'products.form.isActive' | translate }}</span>
                </label>
              </div>
              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="form.isFeatured" name="isFeatured">
                  <span>{{ 'products.form.isFeatured' | translate }}</span>
                </label>
              </div>
            </div>
          </section>

          <!-- Form Actions (Mobile) -->
          <div class="form-actions-mobile">
            <button type="button" class="btn-secondary" routerLink="/products">
              {{ 'common.cancel' | translate }}
            </button>
            <button type="submit" class="btn-primary" [disabled]="saving()">
              @if (saving()) {
                <span class="spinner"></span>
              }
              {{ 'common.save' | translate }}
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    :host{--c1:#1a1a2e;--c2:#6b7280;--c3:#e5e7eb;--c4:#f3f4f6;--c5:#0aaaaa;--c6:#059669;--c7:#dc2626}
    .product-form-page{padding:1.5rem;max-width:900px;margin:0 auto}
    .page-header{margin-bottom:1.5rem}
    .breadcrumb{font-size:.875rem;color:var(--c2);margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem}
    .breadcrumb a{color:var(--c5);text-decoration:none}
    .breadcrumb a:hover{text-decoration:underline}
    .separator{color:var(--c3)}
    .header-main{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem}
    .page-title{font-size:1.5rem;font-weight:600;color:var(--c1);margin:0}
    .header-actions{display:flex;gap:.75rem}
    .btn-primary,.btn-secondary{display:flex;align-items:center;justify-content:center;gap:.5rem;padding:.625rem 1.25rem;border-radius:8px;font-size:.875rem;font-weight:500;cursor:pointer;transition:all .2s}
    .btn-primary{background:var(--c5);color:#fff;border:none;min-width:100px}
    .btn-primary:hover:not(:disabled){background:var(--c6)}
    .btn-primary:disabled{opacity:.6;cursor:not-allowed}
    .btn-secondary{background:#ffffff;color:var(--c1);border:1px solid var(--c3)}
    .btn-secondary:hover{background:var(--c4);border-color:var(--c5);color:var(--c5)}
    .spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .loading-container{display:flex;justify-content:center;padding:4rem}
    .form-container{display:flex;flex-direction:column;gap:1.5rem}
    .form-section{background:#fff;border-radius:12px;padding:1.5rem;border:1px solid var(--c3)}
    .section-title{font-size:1rem;font-weight:600;color:var(--c1);margin:0 0 1.25rem;padding-bottom:.75rem;border-bottom:1px solid var(--c4)}
    .form-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem}
    @media(max-width:640px){.form-grid{grid-template-columns:1fr}}
    .form-group{display:flex;flex-direction:column;gap:.375rem}
    .form-group.full-width{grid-column:span 2}
    @media(max-width:640px){.form-group.full-width{grid-column:span 1}}
    .form-group label{font-size:.8rem;font-weight:500;color:var(--c2)}
    .form-group input,.form-group select,.form-group textarea{padding:.625rem .75rem;border:1px solid var(--c3);border-radius:8px;font-size:.875rem;transition:border-color .2s,box-shadow .2s}
    .form-group input:focus,.form-group select:focus,.form-group textarea:focus{outline:none;border-color:var(--c5);box-shadow:0 0 0 3px rgba(13,148,136,.1)}
    .form-group textarea{resize:vertical;min-height:80px}
    .form-group select{cursor:pointer;background:#fff}
    .checkbox-group{flex-direction:row;align-items:center}
    .checkbox-label{display:flex;align-items:center;gap:.5rem;cursor:pointer;font-size:.875rem;color:var(--c1)}
    .checkbox-label input[type="checkbox"]{width:18px;height:18px;accent-color:var(--c5);cursor:pointer}
    .calculated-value{padding:.625rem .75rem;background:var(--c4);border-radius:8px;font-size:.875rem;font-weight:600;color:var(--c6)}
    .image-preview{margin-top:.75rem;max-width:200px}
    .image-preview img{width:100%;border-radius:8px;border:1px solid var(--c3)}
    .form-actions-mobile{display:none;gap:.75rem;padding-top:1rem}
    @media(max-width:640px){.header-actions{display:none}.form-actions-mobile{display:flex}.form-actions-mobile button{flex:1}.product-form-page{padding:1rem}}
  `]
})
export class ProductFormComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly manufacturerService = inject(ManufacturerService);
  private readonly translate = inject(TranslateService);

  loading = signal(true);
  saving = signal(false);
  productId = signal<number | null>(null);

  categories = signal<CategorySummary[]>([]);
  manufacturers = signal<ManufacturerSummary[]>([]);

  isEditMode = computed(() => this.productId() !== null);

  form: ProductForm = {
    name: '',
    nameLocal: '',
    genericName: '',
    description: '',
    descriptionLocal: '',
    sku: '',
    barcode: '',
    atcCode: '',
    categoryId: null,
    manufacturerId: null,
    unitPrice: 0,
    costPrice: 0,
    taxRate: 17,
    requiresPrescription: false,
    isControlled: false,
    dosageForm: '',
    strength: '',
    packageSize: '',
    reorderLevel: 10,
    reorderQuantity: 50,
    imageUrl: '',
    isActive: true,
    isFeatured: false
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.productId.set(parseInt(id, 10));
    }
    this.loadData();
  }

  private loadData(): void {
    // Load categories and manufacturers in parallel
    this.categoryService.getActive().subscribe({
      next: (res) => {
        if (res.success) {
          this.categories.set(res.data);
        }
      },
      error: () => {
        // Mock data for development
        this.categories.set([
          { id: 1, name: 'Pain Relief', nameLocal: 'Lijekovi za bol', productCount: 45, isActive: true },
          { id: 2, name: 'Antibiotics', nameLocal: 'Antibiotici', productCount: 32, isActive: true },
          { id: 3, name: 'Vitamins', nameLocal: 'Vitamini', productCount: 58, isActive: true },
          { id: 4, name: 'Cardiovascular', nameLocal: 'Kardiovaskularni', productCount: 27, isActive: true },
          { id: 5, name: 'Dermatology', nameLocal: 'Dermatologija', productCount: 19, isActive: true }
        ]);
      }
    });

    this.manufacturerService.getActive().subscribe({
      next: (res) => {
        if (res.success) {
          this.manufacturers.set(res.data);
        }
      },
      error: () => {
        // Mock data for development
        this.manufacturers.set([
          { id: 1, name: 'Bosnalijek', country: 'Bosnia', productCount: 85, isActive: true },
          { id: 2, name: 'Hemofarm', country: 'Serbia', productCount: 62, isActive: true },
          { id: 3, name: 'Alkaloid', country: 'North Macedonia', productCount: 48, isActive: true },
          { id: 4, name: 'Pliva', country: 'Croatia', productCount: 35, isActive: true },
          { id: 5, name: 'Galenika', country: 'Serbia', productCount: 41, isActive: true }
        ]);
      }
    });

    if (this.isEditMode()) {
      this.loadProduct();
    } else {
      this.loading.set(false);
    }
  }

  private loadProduct(): void {
    this.productService.getById(this.productId()!).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.populateForm(res.data);
        }
        this.loading.set(false);
      },
      error: () => {
        // Mock for development
        this.loading.set(false);
      }
    });
  }

  private populateForm(product: Product): void {
    this.form = {
      name: product.name,
      nameLocal: product.nameLocal,
      genericName: product.genericName || '',
      description: product.description || '',
      descriptionLocal: product.descriptionLocal || '',
      sku: product.sku,
      barcode: product.barcode || '',
      atcCode: product.atcCode || '',
      categoryId: product.categoryId,
      manufacturerId: product.manufacturerId,
      unitPrice: product.unitPrice,
      costPrice: product.costPrice || 0,
      taxRate: product.taxRate,
      requiresPrescription: product.requiresPrescription,
      isControlled: product.isControlled,
      dosageForm: product.dosageForm || '',
      strength: product.strength || '',
      packageSize: product.packageSize || '',
      reorderLevel: product.reorderLevel,
      reorderQuantity: product.reorderQuantity,
      imageUrl: product.imageUrl || '',
      isActive: product.isActive,
      isFeatured: product.isFeatured
    };
  }

  calculateMargin(): number {
    if (!this.form.costPrice || !this.form.unitPrice || this.form.costPrice === 0) {
      return 0;
    }
    return ((this.form.unitPrice - this.form.costPrice) / this.form.costPrice) * 100;
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  save(): void {
    if (!this.validateForm()) {
      return;
    }

    this.saving.set(true);

    const request = this.buildRequest();

    if (this.isEditMode()) {
      const updateRequest: UpdateProductRequest = { ...request, isActive: this.form.isActive };
      this.productService.update(this.productId()!, updateRequest).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/products', this.productId()]);
        },
        error: () => {
          this.saving.set(false);
          // Handle error
        }
      });
    } else {
      this.productService.create(request).subscribe({
        next: (res) => {
          this.saving.set(false);
          if (res.success && res.data) {
            this.router.navigate(['/products', res.data.id]);
          } else {
            this.router.navigate(['/products']);
          }
        },
        error: () => {
          this.saving.set(false);
          // Handle error
        }
      });
    }
  }

  private validateForm(): boolean {
    if (!this.form.name || !this.form.nameLocal || !this.form.sku) {
      return false;
    }
    if (!this.form.categoryId || !this.form.manufacturerId) {
      return false;
    }
    if (this.form.unitPrice <= 0) {
      return false;
    }
    return true;
  }

  private buildRequest(): CreateProductRequest {
    return {
      name: this.form.name,
      nameLocal: this.form.nameLocal,
      genericName: this.form.genericName || undefined,
      description: this.form.description || undefined,
      descriptionLocal: this.form.descriptionLocal || undefined,
      sku: this.form.sku,
      barcode: this.form.barcode || undefined,
      atcCode: this.form.atcCode || undefined,
      categoryId: this.form.categoryId!,
      manufacturerId: this.form.manufacturerId!,
      unitPrice: this.form.unitPrice,
      costPrice: this.form.costPrice || undefined,
      taxRate: this.form.taxRate,
      requiresPrescription: this.form.requiresPrescription,
      isControlled: this.form.isControlled,
      dosageForm: this.form.dosageForm || undefined,
      strength: this.form.strength || undefined,
      packageSize: this.form.packageSize || undefined,
      reorderLevel: this.form.reorderLevel,
      reorderQuantity: this.form.reorderQuantity,
      imageUrl: this.form.imageUrl || undefined,
      isFeatured: this.form.isFeatured
    };
  }
}
