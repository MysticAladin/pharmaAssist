import { CommonModule } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { KmCurrencyPipe } from '../../../../core/pipes/km-currency.pipe';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { ProductCatalogItem, PriceType } from '../../models/portal.model';
import { CartService } from '../../services/cart.service';
import { CatalogService } from '../../services/catalog.service';
import { PaymentMethod as ApiPaymentMethod, PortalOrdersService } from '../../services/portal-orders.service';

@Component({
  selector: 'app-portal-product-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, KmCurrencyPipe],
  template: `
    <div class="product-search-page">
      <div class="page-header">
        <h1>{{ 'portal.productSearch.title' | translate }}</h1>
        <p class="subtitle">{{ 'portal.productSearch.subtitle' | translate }}</p>
      </div>

      <div class="search-layout">
        <div class="search-card">
          <div class="search-row">
            <input
              type="text"
              class="search-input"
              [placeholder]="'portal.catalog.searchPlaceholder' | translate"
              [(ngModel)]="query"
              (ngModelChange)="onQueryChange($event)"
            />
            @if (query) {
              <button type="button" class="clear-btn" (click)="clear()">✕</button>
            }
          </div>

          @if (!query) {
            <div class="hint">{{ 'portal.productSearch.hints.startTyping' | translate }}</div>
          }

          @if (loading()) {
            <div class="hint">{{ 'common.loading' | translate }}</div>
          } @else if (error()) {
            <div class="error">{{ error() | translate }}</div>
          } @else if (query && results().length === 0) {
            <div class="hint">{{ 'portal.productSearch.hints.noProducts' | translate }}</div>
          } @else if (results().length > 0) {
            <div class="results">
              @for (p of results(); track p.id) {
                <div
                  class="result-row"
                  role="button"
                  tabindex="0"
                  [class.selected]="selectedProduct()?.id === p.id"
                  (click)="selectProduct(p); addToOrderCommercial(p)"
                  (keydown.enter)="selectProduct(p); addToOrderCommercial(p)"
                  (keydown.space)="selectProduct(p); addToOrderCommercial(p)">
                  <div class="left">
                    <div class="name">{{ p.name }}</div>
                    <div class="meta">
                      <span class="code">{{ p.code }}</span>
                      @if (p.manufacturer) {
                        <span class="sep">•</span>
                        <span class="mfr">{{ p.manufacturer }}</span>
                      }
                      @if (p.packSize) {
                        <span class="sep">•</span>
                        <span>{{ p.packSize }}</span>
                      }
                      <span class="sep">•</span>
                      <span>{{ 'portal.product.expiry' | translate }}: {{ formatExpiry(p.earliestExpiryDate) || '—' }}</span>
                    </div>
                  </div>
                  <div class="right">
                    <div class="prices-row">
                      <div class="price commercial">{{ (p.commercialPrice ?? p.customerPrice ?? p.unitPrice) | kmCurrency }}</div>
                      @if (p.hasEssentialPrice && p.essentialPrice) {
                        <div class="price essential">{{ p.essentialPrice | kmCurrency }}</div>
                      }
                    </div>
                    <div class="stock" [class.out]="!p.isAvailable">
                      {{ p.isAvailable ? ('portal.product.inStock' | translate) : ('portal.product.outOfStock' | translate) }}
                    </div>
                    @if (inCartQty(p.id) > 0) {
                      <div class="in-cart">{{ 'portal.productSearch.inOrder' | translate:{ qty: inCartQty(p.id) } }}</div>
                    }
                    <div class="add-buttons">
                      <button
                        type="button"
                        class="btn btn-primary row-add"
                        (click)="addToOrderCommercial(p); $event.stopPropagation()"
                        [disabled]="!p.isAvailable || isSubmitting()"
                        [title]="'portal.product.addCommercial' | translate">
                        + {{ 'portal.product.add' | translate }}
                      </button>
                      @if (p.hasEssentialPrice && p.essentialPrice) {
                        <button
                          type="button"
                          class="btn btn-essential row-add"
                          (click)="addToOrderEssential(p); $event.stopPropagation()"
                          [disabled]="!p.isAvailable || isSubmitting()"
                          [title]="'portal.product.addEssential' | translate">
                          + {{ 'portal.product.essential' | translate }}
                        </button>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <div class="details-card">
          <div class="details-header">
            <h2>{{ 'common.details' | translate }}</h2>
          </div>

          @if (!selectedProduct()) {
            <div class="hint">{{ 'portal.productSearch.hints.selectForDetails' | translate }}</div>
          } @else {
            <div class="details-body">
              <div class="d-name">{{ selectedProduct()!.name }}</div>
              <div class="d-meta">{{ selectedProduct()!.code }} • {{ selectedProduct()!.manufacturer }}</div>

              <div class="d-grid">
                <div class="d-item"><span class="lbl">{{ 'portal.product.packSize' | translate }}</span><span class="val">{{ selectedProduct()!.packSize || '—' }}</span></div>
                <div class="d-item"><span class="lbl">{{ 'portal.product.expiry' | translate }}</span><span class="val">{{ formatExpiry(selectedProduct()!.earliestExpiryDate) || '—' }}</span></div>
                @if (selectedProduct()!.dosageForm) {
                  <div class="d-item"><span class="lbl">{{ 'portal.product.dosageForm' | translate }}</span><span class="val">{{ selectedProduct()!.dosageForm }}</span></div>
                }
                @if (selectedProduct()!.strength) {
                  <div class="d-item"><span class="lbl">{{ 'portal.product.strength' | translate }}</span><span class="val">{{ selectedProduct()!.strength }}</span></div>
                }
              </div>

              <!-- Pricing section -->
              <div class="d-pricing">
                <div class="d-price-item commercial">
                  <span class="price-label">{{ 'portal.product.commercialPrice' | translate }}</span>
                  <span class="price-value">{{ (selectedProduct()!.commercialPrice ?? selectedProduct()!.customerPrice ?? selectedProduct()!.unitPrice) | kmCurrency }}</span>
                </div>
                @if (selectedProduct()!.hasEssentialPrice && selectedProduct()!.essentialPrice) {
                  <div class="d-price-item essential">
                    <span class="price-label">{{ 'portal.product.essentialPrice' | translate }}</span>
                    <span class="price-value">{{ selectedProduct()!.essentialPrice | kmCurrency }}</span>
                  </div>
                }
              </div>

              @if (selectedProduct()!.description) {
                <div class="d-desc">{{ selectedProduct()!.description }}</div>
              }

              <div class="d-actions">
                <button
                  type="button"
                  class="btn btn-primary"
                  (click)="addToOrderCommercial(selectedProduct()!)"
                  [disabled]="!selectedProduct()!.isAvailable || isSubmitting()">
                  {{ 'portal.product.add' | translate }}
                </button>
                @if (selectedProduct()!.hasEssentialPrice && selectedProduct()!.essentialPrice) {
                  <button
                    type="button"
                    class="btn btn-essential"
                    (click)="addToOrderEssential(selectedProduct()!)"
                    [disabled]="!selectedProduct()!.isAvailable || isSubmitting()">
                    + {{ 'portal.product.essential' | translate }}
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </div>

      <div class="order-card">
        <div class="order-header">
          <h2>{{ 'portal.productSearch.orderItems.title' | translate }}</h2>
          <div class="order-actions">
            <button type="button" class="btn btn-secondary" (click)="clearOrder()" [disabled]="cartIsEmpty() || isSubmitting()">{{ 'portal.cart.clearCart' | translate }}</button>
            <button type="button" class="btn btn-primary" (click)="createOrder()" [disabled]="cartIsEmpty() || isSubmitting()">{{ 'portal.productSearch.orderItems.createOrder' | translate }}</button>
          </div>
        </div>

        @if (submitError()) {
          <div class="error">{{ submitError() | translate }}</div>
        }

        @if (cartIsEmpty()) {
          <div class="hint">{{ 'portal.productSearch.orderItems.emptyHint' | translate }}</div>
        } @else {
          <div class="order-list">
            <div class="order-row header">
              <div>{{ 'portal.cart.product' | translate }}</div>
              <div class="qty">{{ 'portal.cart.quantity' | translate }}</div>
              <div class="money">{{ 'portal.cart.unitPrice' | translate }}</div>
              <div class="money">{{ 'portal.cart.subtotal' | translate }}</div>
              <div></div>
            </div>

            @for (item of cartItems(); track item.productId) {
              <div class="order-row">
                <div class="prod">
                  <div class="pname">{{ item.productName }}</div>
                  <div class="pmeta">
                    {{ item.productCode }}
                    <span class="sep">•</span>
                    {{ item.manufacturer }}
                    @if (item.packSize) {
                      <span class="sep">•</span>
                      {{ item.packSize }}
                    }
                    <span class="sep">•</span>
                      {{ 'portal.product.expiry' | translate }}: {{ formatExpiry(item.expiryDate) || '—' }}
                  </div>
                </div>

                <div class="qty">
                  <input
                    type="number"
                    class="qty-input"
                    [min]="1"
                    [max]="item.maxQuantity"
                    [value]="item.quantity"
                    (change)="setQty(item.productId, $any($event.target).value)"
                    [disabled]="isSubmitting()" />
                </div>

                <div class="money">{{ item.unitPrice | kmCurrency }}</div>
                <div class="money">{{ item.subtotal | kmCurrency }}</div>

                <div class="rm">
                  <button type="button" class="remove" (click)="remove(item.productId)" [disabled]="isSubmitting()">✕</button>
                </div>
              </div>
            }
          </div>

          <div class="totals">
            <div class="line"><span>{{ 'portal.cart.subtotal' | translate }}</span><span>{{ cartSubtotal() | kmCurrency }}</span></div>
            <div class="line"><span>{{ 'portal.cart.tax' | translate }}</span><span>{{ cartTax() | kmCurrency }}</span></div>
            <div class="line total"><span>{{ 'portal.cart.total' | translate }}</span><span>{{ cartTotal() | kmCurrency }}</span></div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .product-search-page {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .search-layout {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 1rem;
      align-items: start;
    }

    .page-header h1 {
      margin: 0;
      font-size: 1.5rem;
      color: var(--text-color, #333);
    }

    .subtitle {
      margin: 0.25rem 0 0;
      color: var(--text-secondary, #666);
    }

    .search-card {
      background: var(--surface-card, #fff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 12px;
      padding: 1rem;
    }

    .details-card {
      background: var(--surface-card, #fff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 12px;
      padding: 1rem;
      position: sticky;
      top: 88px;
    }

    .details-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .details-header h2 {
      margin: 0;
      font-size: 1.1rem;
    }

    .details-body {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .d-name {
      font-weight: 800;
      color: var(--text-color, #333);
      font-size: 1.05rem;
      line-height: 1.25;
    }

    .d-meta {
      color: var(--text-secondary, #666);
      font-size: 0.9rem;
    }

    .d-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.5rem;
      padding-top: 0.25rem;
    }

    .d-item {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 10px;
      padding: 0.5rem 0.65rem;
      background: var(--surface-ground, #f8f9fa);
    }

    .d-item .lbl {
      color: var(--text-secondary, #666);
      font-size: 0.85rem;
    }

    .d-item .val {
      color: var(--text-color, #333);
      font-weight: 700;
      font-size: 0.9rem;
      text-align: right;
    }

    .d-desc {
      color: var(--text-secondary, #666);
      font-size: 0.9rem;
      line-height: 1.45;
      padding-top: 0.25rem;
    }

    .d-actions {
      display: flex;
      justify-content: flex-end;
      padding-top: 0.25rem;
    }

    .order-card {
      background: var(--surface-card, #fff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 12px;
      padding: 1rem;
    }

    .order-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }

    .order-header h2 {
      margin: 0;
      font-size: 1.1rem;
    }

    .order-actions {
      display: flex;
      gap: 0.5rem;
    }

    .search-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .search-input {
      flex: 1;
      width: 100%;
      padding: 0.75rem 0.875rem;
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 8px;
      background: var(--surface-ground, #f8f9fa);
      outline: none;
      color: var(--text-color, #333);
    }

    .search-input:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(10, 170, 170, 0.12);
    }

    .clear-btn {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: 1px solid var(--border-color, #e5e7eb);
      background: var(--surface-card, #fff);
      cursor: pointer;
      color: var(--text-secondary, #666);
    }

    .hint {
      margin-top: 0.75rem;
      color: var(--text-secondary, #666);
      font-size: 0.9rem;
    }

    .error {
      margin-top: 0.75rem;
      color: var(--color-error, #b91c1c);
      font-size: 0.9rem;
    }

    .results {
      margin-top: 0.75rem;
      display: flex;
      flex-direction: column;
    }

    .result-row {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem;
      border-radius: 10px;
      border: 1px solid transparent;
      background: transparent;
      cursor: pointer;
      text-align: left;
      color: inherit;
    }

    .result-row:hover {
      background: var(--surface-ground, #f8f9fa);
    }

    .result-row:focus-visible {
      outline: none;
      border-color: var(--border-focus, rgba(10, 170, 170, 0.7));
      box-shadow: 0 0 0 3px var(--primary-50, rgba(10, 170, 170, 0.12));
      background: var(--surface-ground, #f8f9fa);
    }

    .result-row.selected {
      border-color: var(--border-focus, rgba(10, 170, 170, 0.7));
      background: var(--primary-50, rgba(10, 170, 170, 0.08));
    }


    .row-add {
      padding: 0.35rem 0.6rem;
      font-size: 0.85rem;
      line-height: 1.2;
      border-radius: 8px;
    }

    .name {
      font-weight: 600;
      color: var(--text-color, #333);
    }

    .meta {
      margin-top: 0.25rem;
      font-size: 0.85rem;
      color: var(--text-secondary, #666);
      display: flex;
      align-items: center;
      gap: 0.4rem;
      flex-wrap: wrap;
    }

    .right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
      white-space: nowrap;
    }

    .prices-row {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.15rem;
    }

    .price {
      font-weight: 600;
      color: var(--text-color, #333);
    }

    .price.commercial {
      color: var(--text-color, #333);
    }

    .price.essential {
      color: #2563eb;
      font-size: 0.9rem;
    }

    .add-buttons {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .btn-essential {
      background: #2563eb;
      color: white;
      border: none;
      padding: 0.35rem 0.6rem;
      font-size: 0.85rem;
      line-height: 1.2;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
    }

    .btn-essential:hover:not(:disabled) {
      background: #1d4ed8;
    }

    .btn-essential:disabled {
      background: #93c5fd;
      cursor: not-allowed;
    }

    /* Details card pricing */
    .d-pricing {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.5rem;
      padding: 0.75rem;
      background: var(--surface-ground, #f8f9fa);
      border-radius: 10px;
    }

    .d-price-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
    }

    .d-price-item .price-label {
      font-size: 0.85rem;
      color: var(--text-secondary, #666);
    }

    .d-price-item .price-value {
      font-weight: 700;
      font-size: 1rem;
    }

    .d-price-item.commercial .price-value {
      color: var(--text-color, #333);
    }

    .d-price-item.essential .price-value {
      color: #2563eb;
    }

    .d-price-item.essential .price-label {
      color: #2563eb;
    }

    .stock {
      font-size: 0.8rem;
      color: var(--text-secondary, #666);
    }

    .stock.out {
      color: var(--text-secondary, #666);
      opacity: 0.9;
    }

    .in-cart {
      margin-top: 0.25rem;
      font-size: 0.8rem;
      color: var(--text-secondary, #666);
    }

    .order-list {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .order-row {
      display: grid;
      grid-template-columns: 1fr 120px 140px 140px 44px;
      gap: 0.75rem;
      align-items: center;
      padding: 0.5rem 0.25rem;
      border-radius: 10px;
    }

    .order-row.header {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-secondary, #666);
      padding: 0.25rem;
    }

    .prod .pname {
      font-weight: 600;
      color: var(--text-color, #333);
    }

    .prod .pmeta {
      margin-top: 0.15rem;
      font-size: 0.85rem;
      color: var(--text-secondary, #666);
    }

    .qty {
      display: flex;
      justify-content: flex-start;
    }

    .qty-input {
      width: 100%;
      padding: 0.5rem 0.65rem;
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 8px;
      background: var(--surface-ground, #f8f9fa);
    }

    .money {
      text-align: right;
      font-weight: 600;
      color: var(--text-color, #333);
      white-space: nowrap;
    }

    .rm {
      display: flex;
      justify-content: flex-end;
    }

    .remove {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: 1px solid var(--border-color, #e5e7eb);
      background: var(--surface-card, #fff);
      cursor: pointer;
      color: var(--text-secondary, #666);
    }

    .remove:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .totals {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-color, #e5e7eb);
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      max-width: 420px;
      margin-left: auto;
    }

    .totals .line {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      color: var(--text-secondary, #666);
    }

    .totals .total {
      font-weight: 800;
      color: var(--text-color, #333);
      font-size: 1.05rem;
    }

    @media (max-width: 900px) {
      .order-row { grid-template-columns: 1fr 100px 120px 120px 44px; }
    }

    @media (max-width: 720px) {
      .order-row { grid-template-columns: 1fr 90px 110px 0 44px; }
      .order-row .money:nth-child(4) { display: none; }
      .order-row.header div:nth-child(4) { display: none; }
    }

    @media (max-width: 980px) {
      .search-layout {
        grid-template-columns: 1fr;
      }

      .details-card {
        position: static;
      }
    }
  `]
})
export class PortalProductSearchComponent implements OnDestroy {
  private readonly catalogService = inject(CatalogService);
  private readonly cartService = inject(CartService);
  private readonly ordersService = inject(PortalOrdersService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  query = '';

  loading = signal(false);
  error = signal<string | null>(null);
  results = signal<ProductCatalogItem[]>([]);

  selectedProduct = signal<ProductCatalogItem | null>(null);

  isSubmitting = signal(false);
  submitError = signal<string | null>(null);

  cartItems = computed(() => this.cartService.cart().items);
  cartIsEmpty = computed(() => this.cartService.isEmpty());
  cartSubtotal = computed(() => this.cartService.cart().subtotal);
  cartTax = computed(() => this.cartService.cart().tax);
  cartTotal = computed(() => this.cartService.cart().total);

  private readonly query$ = new Subject<string>();

  constructor() {
    this.query$
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((q) => this.runSearch(q));
  }

  onQueryChange(value: string): void {
    this.query = value;
    this.error.set(null);

    const trimmed = (value ?? '').trim();
    if (!trimmed) {
      this.loading.set(false);
      this.results.set([]);
      return;
    }

    this.query$.next(trimmed);
  }

  clear(): void {
    this.query = '';
    this.loading.set(false);
    this.error.set(null);
    this.results.set([]);
    this.selectedProduct.set(null);
  }

  selectProduct(product: ProductCatalogItem): void {
    this.selectedProduct.set(product);
  }

  addToOrder(product: ProductCatalogItem): void {
    this.cartService.addItem(product, 1);
  }

  /**
   * Add product with commercial pricing
   */
  addToOrderCommercial(product: ProductCatalogItem): void {
    this.cartService.addItem(product, 1, undefined, undefined, undefined, PriceType.Commercial);
  }

  /**
   * Add product with essential pricing
   */
  addToOrderEssential(product: ProductCatalogItem): void {
    if (product.hasEssentialPrice && product.essentialPrice) {
      this.cartService.addItem(product, 1, undefined, undefined, undefined, PriceType.Essential);
    }
  }

  inCartQty(productId: string): number {
    return this.cartService.getQuantity(productId);
  }

  remove(productId: string): void {
    this.cartService.removeItem(productId);
  }

  clearOrder(): void {
    this.cartService.clearCart();
    this.submitError.set(null);
  }

  setQty(productId: string, rawValue: string): void {
    const parsed = Number.parseInt(rawValue, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      this.cartService.updateQuantity(productId, parsed);
    }
  }

  async createOrder(): Promise<void> {
    this.submitError.set(null);
    const items = this.cartItems();
    if (items.length === 0) return;

    if (this.isSubmitting()) return;

    const confirmed = await this.confirmationService.confirm({
      title: 'common.confirmCreateOrder',
      message: 'common.confirmCreateOrderMessage',
      variant: 'warning'
    });

    if (!confirmed) return;

    const orderItems = items
      .map(i => ({
        productId: Number.parseInt(i.productId, 10),
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        priceType: i.priceType === PriceType.Essential ? 2 : 1
      }))
      .filter(i => Number.isFinite(i.productId) && i.productId > 0);

    if (orderItems.length !== items.length) {
      this.submitError.set('portal.productSearch.errors.invalidProductIds');
      return;
    }

    this.isSubmitting.set(true);
    this.ordersService.createOrder({ paymentMethod: ApiPaymentMethod.Invoice, items: orderItems }).subscribe({
      next: (resp) => {
        if (resp?.success && resp.data) {
          this.cartService.clearCart();
          // Navigate to created order details
          this.isSubmitting.set(false);
          this.router.navigate(['/portal/orders', resp.data.id]);
          return;
        }

        this.submitError.set(resp?.message || 'portal.productSearch.errors.createOrderFailed');
        this.isSubmitting.set(false);
      },
      error: (err) => {
        console.error('Create order failed', err);
        this.submitError.set('portal.productSearch.errors.createOrderFailed');
        this.isSubmitting.set(false);
      }
    });
  }

  private runSearch(q: string): void {
    const trimmed = (q ?? '').trim();
    if (!trimmed) return;

    this.loading.set(true);
    this.error.set(null);

    this.catalogService.searchProducts(trimmed, 25).subscribe({
      next: (items) => {
        const nextResults = items ?? [];
        this.results.set(nextResults);

        const current = this.selectedProduct();
        if (!current) {
          this.selectedProduct.set(nextResults.length > 0 ? nextResults[0] : null);
        } else {
          const stillThere = nextResults.find(p => p.id === current.id);
          this.selectedProduct.set(stillThere ?? (nextResults.length > 0 ? nextResults[0] : null));
        }

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Portal product search failed', err);
        this.error.set('portal.productSearch.errors.searchFailed');
        this.loading.set(false);
      }
    });
  }

  formatExpiry(value?: string | null): string | null {
    if (!value) return null;
    // Prefer YYYY-MM-DD date part (also works for ISO timestamps like 2026-01-22T00:00:00Z)
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      return `${m[3]}.${m[2]}.${m[1]}`;
    }

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear());
    return `${day}.${month}.${year}`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
