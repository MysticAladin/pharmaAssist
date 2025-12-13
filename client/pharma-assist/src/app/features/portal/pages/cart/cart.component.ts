import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CartService } from '../../services/cart.service';
import { CartItem, PriceType } from '../../models/portal.model';
import { KmCurrencyPipe } from '../../../../core/pipes/km-currency.pipe';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule, KmCurrencyPipe],
  template: `
    <div class="cart-page">
      <h1>{{ 'portal.cart.title' | translate }}</h1>

      @if (isEmpty()) {
        <div class="empty-cart">
          <span class="empty-icon">🛒</span>
          <h2>{{ 'portal.cart.empty' | translate }}</h2>
          <p>{{ 'portal.cart.emptyMessage' | translate }}</p>
          <a routerLink="/portal/catalog" class="btn btn-primary">
            {{ 'portal.cart.continueShopping' | translate }}
          </a>
        </div>
      } @else {
        <div class="cart-content">
          <!-- Cart Items -->
          <div class="cart-items">
            <div class="cart-header">
              <span class="col-product">{{ 'portal.cart.product' | translate }}</span>
              <span class="col-price">{{ 'portal.cart.price' | translate }}</span>
              <span class="col-quantity">{{ 'portal.cart.quantity' | translate }}</span>
              <span class="col-subtotal">{{ 'portal.cart.subtotal' | translate }}</span>
              <span class="col-actions"></span>
            </div>

            @for (item of cartItems(); track item.productId) {
              <div class="cart-item">
                <div class="col-product">
                  <div class="product-image">
                    @if (item.imageUrl) {
                      <img [src]="item.imageUrl" [alt]="item.productName" />
                    } @else {
                      <div class="image-placeholder">💊</div>
                    }
                  </div>
                  <div class="product-info">
                    <a [routerLink]="['/portal/product', item.productId]" class="product-name">
                      {{ item.productName }}
                      <span class="price-type-badge" [class.essential]="item.priceType === 'essential'" [class.commercial]="item.priceType === 'commercial'">
                        {{ item.priceType === 'essential' ? 'E' : 'C' }}
                      </span>
                    </a>
                    <p class="product-code">{{ item.productCode }}</p>
                    <p class="product-manufacturer">{{ item.manufacturer }}</p>
                  </div>
                </div>

                <div class="col-price">
                  {{ item.unitPrice | kmCurrency }}
                </div>

                <div class="col-quantity">
                  <div class="quantity-control">
                    <button (click)="decrementQuantity(item.productId)" [disabled]="item.quantity <= 1">-</button>
                    <input
                      type="number"
                      [value]="item.quantity"
                      (change)="updateQuantity(item.productId, $event)"
                      [min]="1"
                      [max]="item.maxQuantity"
                    />
                    <button (click)="incrementQuantity(item.productId)" [disabled]="item.quantity >= item.maxQuantity">+</button>
                  </div>
                  @if (item.quantity >= item.maxQuantity) {
                    <p class="max-qty-warning">{{ 'portal.cart.maxQuantity' | translate }}</p>
                  }
                </div>

                <div class="col-subtotal">
                  {{ item.subtotal | kmCurrency }}
                </div>

                <div class="col-actions">
                  <button class="remove-btn" (click)="removeItem(item.productId)" [title]="'common.remove' | translate">
                    🗑️
                  </button>
                </div>
              </div>
            }

            <div class="cart-actions">
              <button class="btn btn-secondary" (click)="clearCart()">
                {{ 'portal.cart.clearCart' | translate }}
              </button>
              <a routerLink="/portal/catalog" class="btn btn-secondary">
                {{ 'portal.cart.continueShopping' | translate }}
              </a>
            </div>
          </div>

          <!-- Order Summary -->
          <div class="order-summary">
            <h3>{{ 'portal.cart.orderSummary' | translate }}</h3>

            <div class="summary-row">
              <span>{{ 'portal.cart.subtotal' | translate }} ({{ itemCount() }} {{ 'portal.cart.items' | translate }})</span>
              <span>{{ subtotal() | kmCurrency }}</span>
            </div>

            @if (hasMixedPriceTypes()) {
              <div class="price-breakdown">
                <div class="breakdown-row commercial">
                  <span>{{ 'portal.checkout.commercialList' | translate }}</span>
                  <span>{{ commercialTotal() | kmCurrency }}</span>
                </div>
                <div class="breakdown-row essential">
                  <span>{{ 'portal.checkout.essentialList' | translate }}</span>
                  <span>{{ essentialTotal() | kmCurrency }}</span>
                </div>
                <p class="split-hint">{{ 'portal.cart.splitInvoiceHint' | translate }}</p>
              </div>
            }

            <div class="summary-row">
              <span>{{ 'portal.cart.tax' | translate }} (17% PDV)</span>
              <span>{{ tax() | kmCurrency }}</span>
            </div>

            @if (discount() > 0) {
              <div class="summary-row discount">
                <span>{{ 'portal.cart.discount' | translate }}</span>
                <span>-{{ discount() | kmCurrency }}</span>
              </div>
            }

            <div class="summary-row total">
              <span>{{ 'portal.cart.total' | translate }}</span>
              <span>{{ total() | kmCurrency }}</span>
            </div>

            <!-- Discount Code -->
            <div class="discount-code">
              <input
                type="text"
                [(ngModel)]="discountCode"
                [placeholder]="'portal.cart.discountCode' | translate"
              />
              <button class="btn btn-secondary" (click)="applyDiscount()">
                {{ 'portal.cart.apply' | translate }}
              </button>
            </div>

            <button class="btn btn-primary btn-lg btn-block" (click)="proceedToCheckout()">
              {{ 'portal.cart.checkout' | translate }}
            </button>

            <div class="payment-icons">
              <span>💳</span>
              <span>🏦</span>
              <span title="Invoice">📄</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .cart-page {
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      font-size: 1.75rem;
      margin-bottom: 2rem;
    }

    /* Empty Cart */
    .empty-cart {
      text-align: center;
      padding: 4rem 2rem;
      background: var(--surface-card, white);
      border-radius: 12px;
    }

    .empty-icon {
      font-size: 4rem;
      display: block;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-cart h2 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .empty-cart p {
      color: var(--text-secondary, #666);
      margin-bottom: 1.5rem;
    }

    /* Cart Content */
    .cart-content {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 2rem;
      align-items: start;
    }

    .cart-items {
      background: var(--surface-card, white);
      border-radius: 12px;
      overflow: hidden;
    }

    .cart-header {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 50px;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: var(--surface-ground);
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-secondary, #666);
    }

    .cart-item {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 50px;
      gap: 1rem;
      padding: 1.5rem;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
    }

    .cart-item:last-of-type {
      border-bottom: none;
    }

    .col-product {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .product-image {
      width: 80px;
      height: 80px;
      background: var(--surface-ground);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .product-image img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .image-placeholder {
      font-size: 2rem;
      opacity: 0.5;
    }

    .product-name {
      font-weight: 600;
      color: var(--text-color, #333);
      text-decoration: none;
      display: block;
      margin-bottom: 0.25rem;
    }

    .product-name:hover {
      color: var(--primary-color);
    }

    .product-code,
    .product-manufacturer {
      font-size: 0.75rem;
      color: var(--text-secondary, #666);
    }

    .col-price,
    .col-subtotal {
      font-weight: 600;
    }

    .col-subtotal {
      color: var(--primary-color);
    }

    .quantity-control {
      display: flex;
      align-items: center;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
      width: fit-content;
    }

    .quantity-control button {
      width: 36px;
      height: 36px;
      border: none;
      background: var(--surface-ground);
      cursor: pointer;
      font-size: 1.25rem;
    }

    .quantity-control button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .quantity-control input {
      width: 50px;
      height: 36px;
      border: none;
      text-align: center;
      font-weight: 500;
    }

    .quantity-control input::-webkit-inner-spin-button {
      -webkit-appearance: none;
    }

    .max-qty-warning {
      font-size: 0.75rem;
      color: var(--color-warning);
      margin-top: 0.25rem;
    }

    .remove-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      opacity: 0.5;
      transition: opacity 0.2s;
    }

    .remove-btn:hover {
      opacity: 1;
    }

    .cart-actions {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    /* Order Summary */
    .order-summary {
      background: var(--surface-card, white);
      border-radius: 12px;
      padding: 1.5rem;
      position: sticky;
      top: 180px;
    }

    .order-summary h3 {
      font-size: 1.125rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      font-size: 0.875rem;
    }

    .summary-row.discount {
      color: var(--color-success);
    }

    .summary-row.total {
      font-size: 1.25rem;
      font-weight: 700;
      padding-top: 1rem;
      margin-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .discount-code {
      display: flex;
      gap: 0.5rem;
      margin: 1.5rem 0;
    }

    .discount-code input {
      flex: 1;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
    }

    .payment-icons {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-top: 1rem;
      font-size: 1.5rem;
      opacity: 0.5;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 500;
      text-decoration: none;
      border: none;
      cursor: pointer;
    }

    .btn-primary {
      background: var(--primary-color);
      color: white;
    }

    .btn-secondary {
      background: var(--surface-ground);
      color: var(--text-color, #333);
    }

    .btn-lg {
      padding: 1rem 2rem;
      font-size: 1rem;
    }

    .btn-block {
      width: 100%;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .cart-content {
        grid-template-columns: 1fr;
      }

      .order-summary {
        position: static;
      }
    }

    /* Price Type Badge */
    .price-type-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      font-size: 0.625rem;
      font-weight: 700;
      margin-left: 0.5rem;
      vertical-align: middle;
    }

    .price-type-badge.commercial {
      background: var(--status-processing-bg);
      color: var(--brand-primary-darker);
    }

    .price-type-badge.essential {
      background: var(--color-success-bg);
      color: #15803d;
    }

    /* Price Breakdown */
    .price-breakdown {
      margin: 0.75rem 0;
      padding: 0.75rem;
      background: var(--surface-ground);
      border-radius: 8px;
    }

    .breakdown-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      padding: 0.25rem 0;
    }

    .breakdown-row.commercial span:first-child::before {
      content: '';
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--brand-primary);
      margin-right: 0.5rem;
    }

    .breakdown-row.essential span:first-child::before {
      content: '';
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22c55e;
      margin-right: 0.5rem;
    }

    .split-hint {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-top: 0.5rem;
      font-style: italic;
    }

    @media (max-width: 768px) {
      .cart-header {
        display: none;
      }

      .cart-item {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .col-product {
        flex-direction: column;
        align-items: flex-start;
      }

      .col-price::before { content: 'Price: '; color: var(--text-secondary); }
      .col-subtotal::before { content: 'Subtotal: '; color: var(--text-secondary); }
    }
  `]
})
export class CartComponent {
  private cartService = inject(CartService);
  private router = inject(Router);

  discountCode = '';

  cartItems = computed(() => this.cartService.cart().items);
  isEmpty = computed(() => this.cartService.isEmpty());
  itemCount = computed(() => this.cartService.itemCount());
  subtotal = computed(() => this.cartService.cart().subtotal);
  tax = computed(() => this.cartService.cart().tax);
  discount = computed(() => this.cartService.cart().discount);
  total = computed(() => this.cartService.cart().total);

  // Split invoice computed values
  hasMixedPriceTypes = computed(() => this.cartService.hasMixedPriceTypes());
  commercialTotal = computed(() => this.cartService.cart().commercialTotal);
  essentialTotal = computed(() => this.cartService.cart().essentialTotal);

  incrementQuantity(productId: string) {
    this.cartService.incrementQuantity(productId);
  }

  decrementQuantity(productId: string) {
    this.cartService.decrementQuantity(productId);
  }

  updateQuantity(productId: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const quantity = parseInt(input.value, 10);
    if (!isNaN(quantity) && quantity > 0) {
      this.cartService.updateQuantity(productId, quantity);
    }
  }

  removeItem(productId: string) {
    this.cartService.removeItem(productId);
  }

  clearCart() {
    if (confirm('Are you sure you want to clear your cart?')) {
      this.cartService.clearCart();
    }
  }

  applyDiscount() {
    if (this.discountCode.trim()) {
      this.cartService.applyDiscount(this.discountCode).then(result => {
        if (!result.success) {
          alert(result.message);
        }
      });
    }
  }

  proceedToCheckout() {
    this.router.navigate(['/portal/checkout']);
  }
}
