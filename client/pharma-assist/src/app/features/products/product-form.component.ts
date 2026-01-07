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
import { PricingService, PriceType, ProductPrice, CreateProductPriceRequest } from '../../core/services/pricing.service';
import { CustomerService } from '../../core/services/customer.service';
import { CustomerSummary } from '../../core/models/customer.model';
import { Canton, LocationService } from '../../core/services/location.service';
import { NotificationService } from '../../core/services/notification.service';

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
  private readonly pricingService = inject(PricingService);
  private readonly customerService = inject(CustomerService);
  private readonly locationService = inject(LocationService);
  private readonly translate = inject(TranslateService);
  private readonly notificationService = inject(NotificationService);

  loading = signal(true);
  saving = signal(false);
  productId = signal<number | null>(null);
  earliestExpiryDate = signal<string | null>(null);

  categories = signal<CategorySummary[]>([]);
  manufacturers = signal<ManufacturerSummary[]>([]);

  productPrices = signal<ProductPrice[]>([]);
  loadingPrices = signal(false);
  pricesError = signal<string | null>(null);
  savingPrice = signal(false);
  deletingPriceId = signal<number | null>(null);

  customers = signal<CustomerSummary[]>([]);
  cantons = signal<Canton[]>([]);

  editingPriceId: number | null = null;

  validFromText = '';
  validToText = '';

  readonly PriceType = PriceType;

  priceForm: Omit<CreateProductPriceRequest, 'customerId' | 'cantonId' | 'validTo'> & {
    customerId: number | null;
    cantonId: number | null;
    validTo: string | null;
  } = {
    productId: 0,
    cantonId: null,
    customerId: null,
    priceType: PriceType.Commercial,
    unitPrice: 0,
    validFrom: this.todayAsDateInput(),
    validTo: null,
    priority: 0,
    isActive: true
  };

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
      const parsed = parseInt(id, 10);
      this.productId.set(parsed);
      this.priceForm.productId = parsed;
    }
    this.loadData();
  }

  private loadData(): void {
    // Load categories and manufacturers in parallel
    this.categoryService.getActive().subscribe({
      next: (res) => {
        if (res.success) {
          this.categories.set(res.data);
        } else {
          console.error('Failed to load categories:', res.message);
          this.notificationService.error(
            this.translate.instant('common.error'),
            this.translate.instant('common.loadCategoriesError')
          );
          this.categories.set([]);
        }
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.notificationService.error(
          this.translate.instant('common.error'),
          this.translate.instant('common.endpointUnavailable')
        );
        this.categories.set([]);
      }
    });

    this.manufacturerService.getActive().subscribe({
      next: (res) => {
        if (res.success) {
          this.manufacturers.set(res.data);
        } else {
          console.error('Failed to load manufacturers:', res.message);
          this.notificationService.error(
            this.translate.instant('common.error'),
            this.translate.instant('common.loadManufacturersError')
          );
          this.manufacturers.set([]);
        }
      },
      error: (err) => {
        console.error('Error loading manufacturers:', err);
        this.notificationService.error(
          this.translate.instant('common.error'),
          this.translate.instant('common.endpointUnavailable')
        );
        this.manufacturers.set([]);
      }
    });

    if (this.isEditMode()) {
      this.loadProduct();
      const productId = this.productId();
      if (productId) {
        this.startAddPrice();
        this.loadProductPrices(productId);
        this.loadCustomers();
        this.loadCantons();
      }
    } else {
      this.loading.set(false);
    }
  }

  private loadProductPrices(productId: number): void {
    this.loadingPrices.set(true);
    this.pricesError.set(null);

    this.pricingService.getProductPrices({ productId }).subscribe({
      next: (prices) => {
        this.productPrices.set(prices || []);
        this.loadingPrices.set(false);
      },
      error: (err) => {
        console.error('Error loading product prices:', err);
        this.pricesError.set('Failed to load product prices');
        this.loadingPrices.set(false);
      }
    });
  }

  private loadCustomers(): void {
    this.customerService.getSummaries().subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          this.customers.set(resp.data);
        }
      },
      error: (err) => {
        console.error('Error loading customers:', err);
      }
    });
  }

  private loadCantons(): void {
    this.locationService.getAllCantons().subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          const sorted = [...resp.data].sort((a, b) => a.name.localeCompare(b.name));
          this.cantons.set(sorted);
        }
      },
      error: (err) => {
        console.error('Error loading cantons:', err);
      }
    });
  }

  cantonLabel(canton: Canton): string {
    const lang = (this.translate.currentLang ?? '').toLowerCase();
    if (lang.startsWith('bs')) return canton.nameLocal || canton.name;
    return canton.name;
  }

  onCategoryChange(value: any): void {
    // Ensure categoryId is always a number, not a string
    this.form.categoryId = value === null ? null : Number(value);
  }

  startAddPrice(): void {
    this.editingPriceId = null;
    const today = this.todayAsDateInput();
    this.priceForm = {
      productId: this.productId() ?? this.priceForm.productId,
      cantonId: null,
      customerId: null,
      priceType: PriceType.Commercial,
      unitPrice: 0,
      validFrom: today,
      validTo: null,
      priority: 0,
      isActive: true
    };
    this.validFromText = this.isoToEuDate(today);
    this.validToText = '';
  }

  startEditPrice(price: ProductPrice): void {
    this.editingPriceId = price.id;
    const validFromIso = this.toDateInputValue(price.validFrom) || this.todayAsDateInput();
    const validToIso = this.toDateInputValue(price.validTo) ?? null;
    this.priceForm = {
      productId: price.productId,
      cantonId: price.cantonId ?? null,
      customerId: price.customerId ?? null,
      priceType: price.priceType,
      unitPrice: price.unitPrice,
      validFrom: validFromIso,
      validTo: validToIso,
      priority: price.priority,
      isActive: price.isActive
    };
    this.validFromText = this.isoToEuDate(validFromIso);
    this.validToText = validToIso ? this.isoToEuDate(validToIso) : '';
  }

  cancelEditPrice(): void {
    this.startAddPrice();
  }

  onValidFromTextChange(value: string): void {
    this.validFromText = value;
    const iso = this.euToIsoDate(value);
    this.priceForm.validFrom = iso ?? '';
  }

  onValidToTextChange(value: string): void {
    this.validToText = value;
    const trimmed = (value ?? '').trim();
    if (!trimmed) {
      this.priceForm.validTo = null;
      return;
    }
    const iso = this.euToIsoDate(trimmed);
    this.priceForm.validTo = iso;
  }

  onNativeValidFromChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.value) {
      this.priceForm.validFrom = '';
      this.validFromText = '';
      return;
    }

    this.priceForm.validFrom = input.value;
    this.validFromText = this.isoToEuDate(input.value);
  }

  onNativeValidToChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.value) {
      this.priceForm.validTo = null;
      this.validToText = '';
      return;
    }

    this.priceForm.validTo = input.value;
    this.validToText = this.isoToEuDate(input.value);
  }

  normalizeValidFrom(): void {
    const iso = this.euToIsoDate(this.validFromText);
    if (iso) {
      this.priceForm.validFrom = iso;
      this.validFromText = this.isoToEuDate(iso);
    }
  }

  normalizeValidTo(): void {
    const trimmed = (this.validToText ?? '').trim();
    if (!trimmed) {
      this.priceForm.validTo = null;
      this.validToText = '';
      return;
    }
    const iso = this.euToIsoDate(trimmed);
    if (iso) {
      this.priceForm.validTo = iso;
      this.validToText = this.isoToEuDate(iso);
    }
  }

  savePrice(): void {
    const productId = this.productId();
    if (!productId) return;

    this.normalizeValidFrom();
    this.normalizeValidTo();

    if (!this.priceForm.validFrom) {
      this.pricesError.set('Invalid date format. Use dd.MM.yyyy');
      return;
    }
    if (this.validToText && !this.priceForm.validTo) {
      this.pricesError.set('Invalid date format. Use dd.MM.yyyy');
      return;
    }

    if (!this.priceForm.unitPrice || Number(this.priceForm.unitPrice) <= 0) return;

    this.savingPrice.set(true);
    const request: CreateProductPriceRequest = {
      productId,
      priceType: this.priceForm.priceType,
      unitPrice: Number(this.priceForm.unitPrice),
      validFrom: this.priceForm.validFrom,
      validTo: this.priceForm.validTo || undefined,
      priority: this.priceForm.priority,
      isActive: this.priceForm.isActive,
      customerId: this.priceForm.customerId ?? undefined,
      cantonId: this.priceForm.cantonId ?? undefined
    };

    const done = () => this.savingPrice.set(false);

    if (this.editingPriceId) {
      this.pricingService.updateProductPrice(this.editingPriceId, request).subscribe({
        next: () => {
          done();
          this.loadProductPrices(productId);
          this.startAddPrice();
        },
        error: (err) => {
          console.error('Error updating product price:', err);
          done();
        }
      });
      return;
    }

    this.pricingService.createProductPrice(request).subscribe({
      next: () => {
        done();
        this.loadProductPrices(productId);
        this.startAddPrice();
      },
      error: (err) => {
        console.error('Error creating product price:', err);
        done();
      }
    });
  }

  deletePrice(price: ProductPrice): void {
    if (!price?.id) return;
    const productId = this.productId();
    if (!productId) return;

    this.deletingPriceId.set(price.id);
    this.pricingService.deleteProductPrice(price.id).subscribe({
      next: () => {
        this.deletingPriceId.set(null);
        this.loadProductPrices(productId);
        if (this.editingPriceId === price.id) {
          this.startAddPrice();
        }
      },
      error: (err) => {
        console.error('Error deleting product price:', err);
        this.deletingPriceId.set(null);
      }
    });
  }

  private isoToEuDate(value: string): string {
    if (!value) return '';
    const m = value.match(/^\d{4}-\d{2}-\d{2}$/);
    if (m) {
      const [y, mo, d] = value.split('-');
      return `${d}.${mo}.${y}`;
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    return `${dd}.${mm}.${yyyy}`;
  }

  private euToIsoDate(value: string | null | undefined): string | null {
    const v = (value ?? '').trim();
    if (!v) return null;

    const match = v.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
    if (!match) return null;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null;

    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null;
    }
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }

  getPriceTypeLabel(type: PriceType): string {
    return type === PriceType.Essential ? 'Essential' : 'Commercial';
  }

  private toDateInputValue(value?: string): string | undefined {
    if (!value) return undefined;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toISOString().slice(0, 10);
  }

  private todayAsDateInput(): string {
    return new Date().toISOString().slice(0, 10);
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
    this.earliestExpiryDate.set(product.earliestExpiryDate ?? null);
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
      this.notificationService.error(
        'Validation',
        'Please fill all required fields before saving.'
      );
      return;
    }

    this.saving.set(true);

    const request = this.buildRequest();

    if (this.isEditMode()) {
      const updateRequest: UpdateProductRequest = { ...request, isActive: this.form.isActive };
      this.productService.update(this.productId()!, updateRequest).subscribe({
        next: (res) => {
          this.saving.set(false);
          if (res?.success) {
            this.router.navigate(['/products', this.productId()]);
            return;
          }

          this.notificationService.error(
            this.translate.instant('common.error') || 'Error',
            res?.message || 'Failed to update product'
          );
        },
        error: (err) => {
          this.saving.set(false);
          this.notificationService.error(
            this.translate.instant('common.error') || 'Error',
            this.extractApiErrorMessage(err) || 'Failed to update product'
          );
        }
      });
    } else {
      this.productService.create(request).subscribe({
        next: (res) => {
          this.saving.set(false);
          if (res.success && res.data) {
            this.router.navigate(['/products', res.data.id]);
          } else {
            this.notificationService.error(
              this.translate.instant('common.error') || 'Error',
              res?.message || 'Failed to create product'
            );
          }
        },
        error: (err) => {
          this.saving.set(false);
          this.notificationService.error(
            this.translate.instant('common.error') || 'Error',
            this.extractApiErrorMessage(err) || 'Failed to create product'
          );
        }
      });
    }
  }

  private extractApiErrorMessage(err: unknown): string | null {
    // Angular HttpErrorResponse commonly surfaces server payload under `error`
    const anyErr = err as any;
    const server = anyErr?.error;

    if (typeof server === 'string' && server.trim()) return server;
    if (typeof server?.message === 'string' && server.message.trim()) return server.message;
    if (typeof anyErr?.message === 'string' && anyErr.message.trim()) return anyErr.message;

    // FluentValidation-style errors
    const errors = server?.errors;
    if (errors && typeof errors === 'object') {
      const firstKey = Object.keys(errors)[0];
      const firstVal = firstKey ? errors[firstKey] : null;
      if (Array.isArray(firstVal) && firstVal.length > 0) {
        const msg = String(firstVal[0] ?? '').trim();
        return msg || null;
      }
    }

    return null;
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
