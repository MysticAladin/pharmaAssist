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
  templateUrl: './product-form-component/product-form.component.html',
  styleUrls: ['./product-form-component/product-form.component.scss']
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
