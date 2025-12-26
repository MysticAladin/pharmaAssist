import { CommonModule } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { KmCurrencyPipe } from '../../../../core/pipes/km-currency.pipe';
import { ProductCatalogItem } from '../../models/portal.model';
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
        <h1>Product Search</h1>
        <p class="subtitle">Search by product name or code.</p>
      </div>

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
          <div class="hint">Start typing to see matching products.</div>
        }

        @if (loading()) {
          <div class="hint">{{ 'common.loading' | translate }}</div>
        } @else if (error()) {
          <div class="error">{{ error() }}</div>
        } @else if (query && results().length === 0) {
          <div class="hint">No products found.</div>
        } @else if (results().length > 0) {
          <div class="results">
            @for (p of results(); track p.id) {
              <button
                type="button"
                class="result-row"
                (click)="addToOrder(p)"
                [disabled]="!p.isAvailable || isSubmitting()">
                <div class="left">
                  <div class="name">{{ p.name }}</div>
                  <div class="meta">
                    <span class="code">{{ p.code }}</span>
                    @if (p.manufacturer) {
                      <span class="sep">•</span>
                      <span class="mfr">{{ p.manufacturer }}</span>
                    }
                  </div>
                </div>
                <div class="right">
                  <div class="price">{{ (p.customerPrice ?? p.unitPrice) | kmCurrency }}</div>
                  <div class="stock" [class.out]="!p.isAvailable">
                    {{ p.isAvailable ? (p.stockQuantity + ' ' + ('portal.product.inStock' | translate)) : ('portal.product.outOfStock' | translate) }}
                  </div>
                  @if (inCartQty(p.id) > 0) {
                    <div class="in-cart">In order: {{ inCartQty(p.id) }}</div>
                  }
                </div>
              </button>
            }
          </div>
        }
      </div>

      <div class="order-card">
        <div class="order-header">
          <h2>Order items</h2>
          <div class="order-actions">
            <button type="button" class="btn btn-secondary" (click)="clearOrder()" [disabled]="cartIsEmpty() || isSubmitting()">Clear</button>
            <button type="button" class="btn btn-primary" (click)="createOrder()" [disabled]="cartIsEmpty() || isSubmitting()">Create Order</button>
          </div>
        </div>

        @if (submitError()) {
          <div class="error">{{ submitError() }}</div>
        }

        @if (cartIsEmpty()) {
          <div class="hint">No items yet. Click a product above to add it.</div>
        } @else {
          <div class="order-list">
            <div class="order-row header">
              <div>Product</div>
              <div class="qty">Qty</div>
              <div class="money">Unit</div>
              <div class="money">Subtotal</div>
              <div></div>
            </div>

            @for (item of cartItems(); track item.productId) {
              <div class="order-row">
                <div class="prod">
                  <div class="pname">{{ item.productName }}</div>
                  <div class="pmeta">{{ item.productCode }} • {{ item.manufacturer }}</div>
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
            <div class="line"><span>Subtotal</span><span>{{ cartSubtotal() | kmCurrency }}</span></div>
            <div class="line"><span>Tax</span><span>{{ cartTax() | kmCurrency }}</span></div>
            <div class="line total"><span>Total</span><span>{{ cartTotal() | kmCurrency }}</span></div>
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
      border: none;
      background: transparent;
      cursor: pointer;
      text-align: left;
      color: inherit;
    }

    .result-row:hover {
      background: var(--surface-ground, #f8f9fa);
    }

    .result-row:disabled {
      cursor: not-allowed;
      opacity: 0.65;
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

    .price {
      font-weight: 600;
      color: var(--text-color, #333);
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
  `]
})
export class PortalProductSearchComponent implements OnDestroy {
  private readonly catalogService = inject(CatalogService);
  private readonly cartService = inject(CartService);
  private readonly ordersService = inject(PortalOrdersService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  query = '';

  loading = signal(false);
  error = signal<string | null>(null);
  results = signal<ProductCatalogItem[]>([]);

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
  }

  addToOrder(product: ProductCatalogItem): void {
    this.cartService.addItem(product, 1);
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

  createOrder(): void {
    this.submitError.set(null);
    const items = this.cartItems();
    if (items.length === 0) return;

    const orderItems = items
      .map(i => ({ productId: Number.parseInt(i.productId, 10), quantity: i.quantity }))
      .filter(i => Number.isFinite(i.productId) && i.productId > 0);

    if (orderItems.length !== items.length) {
      this.submitError.set('Some items have invalid product IDs; cannot submit this order.');
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

        this.submitError.set(resp?.message || 'Failed to create order');
        this.isSubmitting.set(false);
      },
      error: (err) => {
        console.error('Create order failed', err);
        this.submitError.set('Failed to create order');
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
        this.results.set(items ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Portal product search failed', err);
        this.error.set('Failed to search products');
        this.loading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
