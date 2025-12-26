import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';
import { CustomerService } from '../../core/services/customer.service';
import { CustomerSummary } from '../../core/models/customer.model';
import { PricingService, PriceType, ProductPrice, CreateProductPriceRequest } from '../../core/services/pricing.service';
import { Canton, LocationService } from '../../core/services/location.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslateModule,
    StatusBadgeComponent,
    LoadingSkeletonComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './product-detail-component/product-detail.component.html',
  styleUrls: ['./product-detail-component/product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  private readonly productService = inject(ProductService);
  readonly pricingService = inject(PricingService);
  private readonly customerService = inject(CustomerService);
  private readonly locationService = inject(LocationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  product = signal<Product | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  showDeleteDialog = signal(false);
  deleting = signal(false);

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

  readonly PriceType = PriceType;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const productId = +id;
      this.priceForm.productId = productId;
      this.loadProduct(productId);
      this.loadProductPrices(productId);
      this.loadCustomers();
      this.loadCantons();
    }
  }

  loadProduct(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.productService.getById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.product.set(response.data);
        } else {
          this.error.set(response.message || 'Product not found');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading product:', err);
        this.error.set('Failed to load product');
        this.loading.set(false);
      }
    });
  }

  loadProductPrices(productId: number): void {
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

  loadCustomers(): void {
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

  loadCantons(): void {
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

  startAddPrice(): void {
    this.editingPriceId = null;
    const today = this.todayAsDateInput();
    this.priceForm = {
      productId: this.product()?.id ?? this.priceForm.productId,
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
    // Ensure text inputs are normalized before validating/saving
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

    if (!this.priceForm.productId || !this.priceForm.validFrom) return;
    if (!this.priceForm.unitPrice || Number(this.priceForm.unitPrice) <= 0) return;

    this.savingPrice.set(true);
    const request: CreateProductPriceRequest = {
      productId: this.priceForm.productId,
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
          this.loadProductPrices(request.productId);
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
        this.loadProductPrices(request.productId);
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

    this.deletingPriceId.set(price.id);
    this.pricingService.deleteProductPrice(price.id).subscribe({
      next: () => {
        this.deletingPriceId.set(null);
        this.loadProductPrices(price.productId);
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

  getPriceTypeLabel(type: PriceType): string {
    return type === PriceType.Essential ? 'Essential' : 'Commercial';
  }

  private toDateInputValue(value?: string): string | undefined {
    if (!value) return undefined;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toISOString().slice(0, 10);
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

    // Validate using UTC to avoid timezone shifts
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

  private todayAsDateInput(): string {
    return new Date().toISOString().slice(0, 10);
  }

  editProduct(): void {
    const id = this.product()?.id;
    if (id) {
      this.router.navigate(['/products', id, 'edit']);
    }
  }

  confirmDelete(): void {
    this.showDeleteDialog.set(true);
  }

  deleteProduct(): void {
    const id = this.product()?.id;
    if (!id) return;

    this.deleting.set(true);
    this.productService.delete(id).subscribe({
      next: () => {
        this.showDeleteDialog.set(false);
        this.deleting.set(false);
        this.router.navigate(['/products']);
      },
      error: (err) => {
        console.error('Error deleting product:', err);
        this.deleting.set(false);
      }
    });
  }

  isLowStock(): boolean {
    const p = this.product();
    return p ? p.stockQuantity <= p.reorderLevel : false;
  }

  calculateMargin(): string {
    const p = this.product();
    if (!p || !p.costPrice || p.costPrice === 0) return '-';
    const margin = ((p.unitPrice - p.costPrice) / p.unitPrice) * 100;
    return `${margin.toFixed(1)}%`;
  }
}

