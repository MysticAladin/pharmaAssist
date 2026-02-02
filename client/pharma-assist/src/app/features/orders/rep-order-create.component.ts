import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { RepOrderService } from '../../core/services/rep-order.service';
import { RepProductService } from '../../core/services/rep-product.service';
import { RepCustomerService } from '../../core/services/rep-customer.service';
import { OrderTemplateService } from '../../core/services/order-template.service';
import { NotificationService } from '../../core/services/notification.service';
import { OfflineStorageService, PendingOrder, PendingOrderItem } from '../../core/services/offline-storage.service';
import { OrderSyncService } from '../../core/services/order-sync.service';
import {
  RepProduct,
  CreateRepOrder,
  CreateRepOrderItem,
  RepCustomer,
  RepCustomerCredit
} from '../../core/models/rep-order.model';
import { OrderTemplate, CreateOrderTemplateRequest } from '../../shared/models/order-template.model';
import {
  PromotionDto,
  PromotionCalculationResult,
  AppliedPromotion
} from '../../shared/models/promotion.model';
import { OfflineStatusComponent } from '../../shared/components/offline-status/offline-status.component';

interface CartItem {
  product: RepProduct;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
}

@Component({
  selector: 'app-rep-order-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, OfflineStatusComponent],
  template: `
    <div class="order-create">
      <div class="order-create__header">
        <button class="btn" (click)="back()">
          ← {{ 'common.back' | translate }}
        </button>
        <h1 class="order-create__title">
          {{ 'orders.createRepOrder' | translate }}
        </h1>
        <app-offline-status></app-offline-status>
      </div>

      <div class="order-create__layout">
        <!-- Customer Selection / Info -->
        <div class="card order-create__customer">
          <div class="card-header">
            <h3>{{ 'orders.customer' | translate }}</h3>
          </div>
          <div class="card-content">
            @if (customer()) {
              <div class="customer-info">
                <div class="customer-info__name">{{ customer()!.name }}</div>
                <div class="customer-info__code">{{ customer()!.customerCode }}</div>
                <div class="customer-info__tier tier-badge tier-badge--{{ customer()!.tierName.toLowerCase() }}">
                  {{ customer()!.tierName }}
                </div>
                @if (customerCredit()) {
                  <div class="credit-info" [class.credit-info--warning]="customerCredit()!.creditWarningMessage">
                    <div class="credit-info__row">
                      <span>{{ 'orders.creditAvailable' | translate }}:</span>
                      <strong>{{ customerCredit()!.creditAvailable | currency:'KM ' }}</strong>
                    </div>
                    <div class="credit-info__row">
                      <span>{{ 'orders.creditUsed' | translate }}:</span>
                      <span>{{ customerCredit()!.creditUsed | currency:'KM ' }} / {{ customerCredit()!.creditLimit | currency:'KM ' }}</span>
                    </div>
                    @if (customerCredit()!.creditWarningMessage) {
                      <div class="credit-warning">⚠️ {{ customerCredit()!.creditWarningMessage }}</div>
                    }
                  </div>
                }
              </div>
            } @else {
              <div class="muted">{{ 'orders.selectCustomer' | translate }}</div>
            }
          </div>
        </div>

        <!-- Product Search -->
        <div class="card order-create__products">
          <div class="card-header">
            <h3>{{ 'orders.products' | translate }}</h3>
            <div class="header-actions">
              @if (templates().length > 0) {
                <button class="btn btn-sm btn-outline" (click)="showTemplateSelector = !showTemplateSelector">
                  📋 {{ 'orders.loadTemplate' | translate }}
                </button>
              }
              <input
                type="text"
                class="input search-input"
                [placeholder]="'orders.searchProducts' | translate"
                [(ngModel)]="searchQuery"
                (input)="onSearchInput()"
              >
            </div>
          </div>

          <!-- Template Selector -->
          @if (showTemplateSelector && templates().length > 0) {
            <div class="template-selector">
              <div class="template-selector__header">
                <span>{{ 'orders.selectTemplate' | translate }}</span>
                <button class="btn-close" (click)="showTemplateSelector = false">×</button>
              </div>
              <div class="template-selector__list">
                @for (template of templates(); track template.id) {
                  <div class="template-option" (click)="loadFromTemplate(template)">
                    <div class="template-option__name">{{ template.templateName }}</div>
                    <div class="template-option__info">
                      {{ template.itemCount }} {{ 'orders.items' | translate }} • {{ template.estimatedTotal | currency:'KM ' }}
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <div class="card-content">
            @if (loadingProducts()) {
              <div class="muted">{{ 'common.loading' | translate }}</div>
            } @else if (products().length === 0) {
              <div class="muted">{{ 'orders.noProductsFound' | translate }}</div>
            } @else {
              <div class="product-list">
                @for (product of products(); track product.id) {
                  <div class="product-item" [class.product-item--low-stock]="product.stockWarning">
                    <div class="product-item__info">
                      <div class="product-item__name">{{ product.name }}</div>
                      <div class="product-item__sku">{{ product.sku }}</div>
                      <div class="product-item__price">{{ product.unitPrice | currency:'KM ' }}</div>
                      <div class="product-item__stock" [class.low]="product.stockWarning">
                        {{ 'orders.stock' | translate }}: {{ product.stockQuantity }}
                      </div>
                    </div>
                    <div class="product-item__actions">
                      <input
                        type="number"
                        class="qty-input"
                        min="1"
                        [max]="product.stockQuantity"
                        [(ngModel)]="productQuantities[product.id]"
                        placeholder="1"
                      >
                      <button
                        class="btn btn-sm btn-primary"
                        [disabled]="!product.isAvailable || product.stockQuantity <= 0"
                        (click)="addToCart(product)"
                      >
                        {{ 'orders.add' | translate }}
                      </button>
                    </div>
                  </div>
                }
              </div>

              <!-- Pagination -->
              @if (totalPages() > 1) {
                <div class="pagination">
                  <button class="btn btn-sm" [disabled]="currentPage() <= 1" (click)="loadProducts(currentPage() - 1)">
                    ←
                  </button>
                  <span>{{ currentPage() }} / {{ totalPages() }}</span>
                  <button class="btn btn-sm" [disabled]="currentPage() >= totalPages()" (click)="loadProducts(currentPage() + 1)">
                    →
                  </button>
                </div>
              }
            }
          </div>
        </div>

        <!-- Cart -->
        <div class="card order-create__cart">
          <div class="card-header">
            <h3>{{ 'orders.cart' | translate }} ({{ cart().length }})</h3>
            @if (cart().length > 0) {
              <div class="header-actions">
                <button class="btn btn-sm btn-outline" (click)="showSaveTemplate = true" title="{{ 'orders.saveAsTemplate' | translate }}">
                  💾 {{ 'orders.saveTemplate' | translate }}
                </button>
                <button class="btn btn-sm btn-outline" (click)="clearCart()">
                  {{ 'orders.clearCart' | translate }}
                </button>
              </div>
            }
          </div>
          <div class="card-content">
            @if (cart().length === 0) {
              <div class="muted cart-empty">
                {{ 'orders.cartEmpty' | translate }}
              </div>
            } @else {
              <div class="cart-items">
                @for (item of cart(); track item.product.id) {
                  <div class="cart-item">
                    <div class="cart-item__info">
                      <div class="cart-item__name">{{ item.product.name }}</div>
                      <div class="cart-item__price">{{ item.unitPrice | currency:'KM ' }}</div>
                    </div>
                    <div class="cart-item__quantity">
                      <button class="qty-btn" (click)="updateQuantity(item, item.quantity - 1)">−</button>
                      <input
                        type="number"
                        class="qty-display"
                        [(ngModel)]="item.quantity"
                        (change)="updateQuantity(item, item.quantity)"
                        min="1"
                      >
                      <button class="qty-btn" (click)="updateQuantity(item, item.quantity + 1)">+</button>
                    </div>
                    <div class="cart-item__total">
                      {{ item.lineTotal | currency:'KM ' }}
                    </div>
                    <button class="cart-item__remove" (click)="removeFromCart(item)">×</button>
                  </div>
                }
              </div>

              <div class="cart-summary">
                <!-- Promo Code Input -->
                <div class="promo-section">
                  <div class="promo-input-row">
                    <input
                      type="text"
                      class="input promo-input"
                      [(ngModel)]="promoCode"
                      [placeholder]="'orders.enterPromoCode' | translate"
                      [disabled]="validatingPromo()"
                    >
                    <button
                      class="btn btn-sm"
                      [disabled]="!promoCode.trim() || validatingPromo()"
                      (click)="applyPromoCode()"
                    >
                      @if (validatingPromo()) {
                        ...
                      } @else {
                        {{ 'orders.apply' | translate }}
                      }
                    </button>
                  </div>
                  @if (promoError()) {
                    <div class="promo-error">{{ promoError() }}</div>
                  }
                </div>

                <!-- Applied Promotions -->
                @if (appliedPromotions().length > 0) {
                  <div class="applied-promos">
                    @for (promo of appliedPromotions(); track promo.promotionId) {
                      <div class="applied-promo">
                        <span class="promo-badge">🏷️ {{ promo.name }}</span>
                        <span class="promo-discount">-{{ promo.discountAmount | currency:'KM ' }}</span>
                      </div>
                    }
                  </div>
                }

                <div class="cart-summary__row">
                  <span>{{ 'orders.subtotal' | translate }}:</span>
                  <span>{{ cartTotal() | currency:'KM ' }}</span>
                </div>
                @if (totalDiscount() > 0) {
                  <div class="cart-summary__row cart-summary__discount">
                    <span>{{ 'orders.discount' | translate }}:</span>
                    <span class="discount-value">-{{ totalDiscount() | currency:'KM ' }}</span>
                  </div>
                }
                <div class="cart-summary__row cart-summary__total">
                  <span>{{ 'orders.total' | translate }}:</span>
                  <strong>{{ finalTotal() | currency:'KM ' }}</strong>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Order Notes & Submit -->
        <div class="card order-create__submit">
          <div class="card-content">
            <label class="label">{{ 'orders.notes' | translate }}</label>
            <textarea
              class="input"
              rows="3"
              [(ngModel)]="orderNotes"
              [placeholder]="'orders.notesPlaceholder' | translate"
            ></textarea>

            @if (visitId) {
              <div class="visit-info">
                ✓ {{ 'orders.linkedToVisit' | translate }}
              </div>
            }

            @if (error()) {
              <div class="error">{{ error() }}</div>
            }

            <div class="actions">
              <button
                class="btn btn-primary btn-lg"
                [disabled]="!canSubmit() || submitting()"
                (click)="submitOrder()"
              >
                @if (submitting()) {
                  {{ 'common.processing' | translate }}...
                } @else {
                  {{ 'orders.placeOrder' | translate }} ({{ finalTotal() | currency:'KM ' }})
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Template Modal -->
      @if (showSaveTemplate) {
        <div class="modal-overlay" (click)="showSaveTemplate = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal__header">
              <h2>{{ 'orders.saveAsTemplate' | translate }}</h2>
              <button class="modal__close" (click)="showSaveTemplate = false">×</button>
            </div>
            <div class="modal__body">
              <div class="form-group">
                <label class="label">{{ 'orders.templateName' | translate }} *</label>
                <input
                  type="text"
                  class="input"
                  [(ngModel)]="templateName"
                  [placeholder]="'orders.templateNamePlaceholder' | translate"
                >
              </div>
              <div class="form-group">
                <label class="label">{{ 'orders.templateDescription' | translate }}</label>
                <textarea
                  class="input"
                  rows="2"
                  [(ngModel)]="templateDescription"
                  [placeholder]="'orders.templateDescriptionPlaceholder' | translate"
                ></textarea>
              </div>
              <div class="template-preview">
                <span>{{ cart().length }} {{ 'orders.items' | translate }}</span>
                <span>{{ cartTotal() | currency:'KM ' }}</span>
              </div>
            </div>
            <div class="modal__footer">
              <button class="btn" (click)="showSaveTemplate = false">{{ 'common.cancel' | translate }}</button>
              <button
                class="btn btn-primary"
                [disabled]="!templateName.trim() || savingTemplate()"
                (click)="saveAsTemplate()"
              >
                @if (savingTemplate()) {
                  {{ 'common.saving' | translate }}...
                } @else {
                  {{ 'common.save' | translate }}
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .order-create { padding: 16px; max-width: 1400px; margin: 0 auto; }
    .order-create__header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
    .order-create__title { margin: 0; font-size: 20px; font-weight: 700; }

    .order-create__layout {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
    }

    @media (max-width: 1024px) {
      .order-create__layout { grid-template-columns: 1fr 1fr; }
      .order-create__submit { grid-column: 1 / -1; }
    }

    @media (max-width: 768px) {
      .order-create__layout { grid-template-columns: 1fr; }
    }

    .card { background: var(--bg-secondary); border-radius: 12px; border: 1px solid var(--border-light); }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-light);
    }
    .card-header h3 { margin: 0; font-size: 14px; font-weight: 600; }
    .card-content { padding: 16px; }

    .customer-info { display: grid; gap: 8px; }
    .customer-info__name { font-size: 16px; font-weight: 600; }
    .customer-info__code { font-size: 12px; opacity: 0.7; }

    .tier-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .tier-badge--a { background: rgba(34, 197, 94, 0.15); color: #16a34a; }
    .tier-badge--b { background: rgba(59, 130, 246, 0.15); color: #2563eb; }
    .tier-badge--c { background: rgba(107, 114, 128, 0.15); color: #6b7280; }

    .credit-info { margin-top: 12px; padding: 10px; background: var(--bg-primary); border-radius: 8px; }
    .credit-info--warning { border: 1px solid var(--warning); }
    .credit-info__row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
    .credit-warning { margin-top: 8px; padding: 8px; background: rgba(234, 179, 8, 0.1); border-radius: 6px; font-size: 12px; color: #ca8a04; }

    .search-input { padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-light); background: var(--bg-primary); font-size: 13px; width: 180px; }

    .product-list { display: grid; gap: 8px; max-height: 400px; overflow-y: auto; }
    .product-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      background: var(--bg-primary);
      border-radius: 8px;
      gap: 12px;
    }
    .product-item--low-stock { border: 1px solid rgba(234, 179, 8, 0.4); }
    .product-item__info { flex: 1; min-width: 0; }
    .product-item__name { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .product-item__sku { font-size: 11px; opacity: 0.6; }
    .product-item__price { font-size: 13px; font-weight: 600; color: var(--primary); margin-top: 4px; }
    .product-item__stock { font-size: 11px; opacity: 0.7; }
    .product-item__stock.low { color: var(--warning); }
    .product-item__actions { display: flex; gap: 8px; align-items: center; }

    .qty-input { width: 60px; padding: 6px 8px; border-radius: 6px; border: 1px solid var(--border-light); text-align: center; font-size: 13px; }

    .pagination { display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-light); }

    .cart-empty { text-align: center; padding: 40px 20px; }
    .cart-items { display: grid; gap: 8px; }
    .cart-item {
      display: grid;
      grid-template-columns: 1fr auto auto auto;
      gap: 12px;
      align-items: center;
      padding: 10px;
      background: var(--bg-primary);
      border-radius: 8px;
    }
    .cart-item__name { font-size: 13px; font-weight: 500; }
    .cart-item__price { font-size: 11px; opacity: 0.7; }
    .cart-item__quantity { display: flex; align-items: center; gap: 4px; }
    .qty-btn { width: 28px; height: 28px; border: 1px solid var(--border-light); border-radius: 6px; background: var(--bg-secondary); cursor: pointer; font-size: 16px; }
    .qty-btn:hover { background: var(--bg-hover); }
    .qty-display { width: 50px; text-align: center; padding: 4px; border: 1px solid var(--border-light); border-radius: 6px; font-size: 13px; }
    .cart-item__total { font-size: 14px; font-weight: 600; min-width: 80px; text-align: right; }
    .cart-item__remove { width: 24px; height: 24px; border: none; background: rgba(239, 68, 68, 0.1); color: var(--error); border-radius: 50%; cursor: pointer; font-size: 16px; }
    .cart-item__remove:hover { background: rgba(239, 68, 68, 0.2); }

    .cart-summary { margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border-light); }
    .cart-summary__row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .cart-summary__total { font-size: 16px; padding-top: 8px; border-top: 1px solid var(--border-light); }

    .visit-info { padding: 10px; background: rgba(34, 197, 94, 0.1); border-radius: 8px; color: #16a34a; font-size: 13px; font-weight: 500; margin-top: 12px; }

    .label { display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px; }
    .input { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-light); background: var(--bg-primary); font-size: 13px; resize: vertical; }

    .error { margin-top: 12px; padding: 10px; background: rgba(239, 68, 68, 0.1); border-radius: 8px; color: var(--error); font-size: 13px; }

    .actions { margin-top: 16px; }
    .btn-lg { padding: 14px 24px; font-size: 15px; width: 100%; }

    .muted { font-size: 13px; opacity: 0.6; }

    /* Template Selector */
    .header-actions { display: flex; gap: 8px; align-items: center; }

    .template-selector { border-bottom: 1px solid var(--border-light); padding: 12px 16px; background: var(--bg-primary); }
    .template-selector__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 12px; font-weight: 600; }
    .template-selector__list { display: grid; gap: 8px; max-height: 200px; overflow-y: auto; }
    .template-option { padding: 10px; background: var(--bg-secondary); border-radius: 8px; cursor: pointer; border: 1px solid transparent; }
    .template-option:hover { border-color: var(--primary); background: rgba(var(--primary-rgb), 0.05); }
    .template-option__name { font-size: 13px; font-weight: 500; }
    .template-option__info { font-size: 11px; opacity: 0.7; margin-top: 4px; }
    .btn-close { background: none; border: none; font-size: 18px; cursor: pointer; opacity: 0.6; }
    .btn-close:hover { opacity: 1; }

    /* Promo Section */
    .promo-section { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border-light); }
    .promo-input-row { display: flex; gap: 8px; }
    .promo-input { flex: 1; font-size: 13px; }
    .promo-error { color: var(--danger); font-size: 12px; margin-top: 6px; }
    .applied-promos { margin-bottom: 12px; }
    .applied-promo { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: rgba(var(--success-rgb), 0.1); border-radius: 6px; margin-bottom: 6px; font-size: 12px; }
    .promo-badge { color: var(--success); font-weight: 500; }
    .promo-discount { color: var(--success); font-weight: 600; }
    .cart-summary__discount { color: var(--success); }
    .discount-value { font-weight: 600; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: var(--bg-secondary); border-radius: 12px; max-width: 400px; width: 90%; }
    .modal__header { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid var(--border-light); }
    .modal__header h2 { margin: 0; font-size: 16px; }
    .modal__close { background: none; border: none; font-size: 20px; cursor: pointer; }
    .modal__body { padding: 16px; }
    .modal__footer { display: flex; justify-content: flex-end; gap: 8px; padding: 16px; border-top: 1px solid var(--border-light); }
    .form-group { margin-bottom: 12px; }
    .template-preview { display: flex; justify-content: space-between; padding: 10px; background: var(--bg-primary); border-radius: 8px; font-size: 13px; margin-top: 12px; }
  `]
})
export class RepOrderCreateComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly repOrderService = inject(RepOrderService);
  private readonly repProductService = inject(RepProductService);
  private readonly repCustomerService = inject(RepCustomerService);
  private readonly orderTemplateService = inject(OrderTemplateService);
  private readonly notification = inject(NotificationService);
  private readonly offlineStorage = inject(OfflineStorageService);
  private readonly syncService = inject(OrderSyncService);
  private readonly translate = inject(TranslateService);

  // Route params
  customerId = 0;
  visitId: number | null = null;

  // Customer data
  customer = signal<RepCustomer | null>(null);
  customerCredit = signal<RepCustomerCredit | null>(null);

  // Products
  products = signal<RepProduct[]>([]);
  loadingProducts = signal(false);
  searchQuery = '';
  currentPage = signal(1);
  totalPages = signal(1);
  productQuantities: Record<number, number> = {};

  // Cart
  cart = signal<CartItem[]>([]);
  cartTotal = computed(() =>
    this.cart().reduce((sum, item) => sum + item.lineTotal, 0)
  );

  // Order
  orderNotes = '';
  submitting = signal(false);
  error = signal<string | null>(null);

  // Templates
  templates = signal<OrderTemplate[]>([]);
  showTemplateSelector = false;
  showSaveTemplate = false;
  templateName = '';
  templateDescription = '';
  savingTemplate = signal(false);

  // Promotions
  promoCode = '';
  validatingPromo = signal(false);
  promoError = signal<string | null>(null);
  appliedPromotions = signal<AppliedPromotion[]>([]);
  promotionResult = signal<PromotionCalculationResult | null>(null);

  // Computed
  totalDiscount = computed(() =>
    this.promotionResult()?.discountTotal ?? 0
  );

  finalTotal = computed(() => {
    const subtotal = this.cartTotal();
    const discount = this.totalDiscount();
    return subtotal - discount;
  });

  canSubmit = computed(() =>
    this.customer() !== null &&
    this.cart().length > 0 &&
    (!this.customerCredit()?.creditWarningMessage || this.customerCredit()?.canPlaceOrders)
  );

  ngOnInit(): void {
    // Get route params
    const customerIdParam = this.route.snapshot.queryParamMap.get('customerId');
    const visitIdParam = this.route.snapshot.queryParamMap.get('visitId');

    if (customerIdParam) {
      this.customerId = parseInt(customerIdParam, 10);
      this.loadCustomer();
      this.loadTemplates();
    }

    if (visitIdParam) {
      this.visitId = parseInt(visitIdParam, 10);
    }

    // Load products
    this.loadProducts(1);
  }

  back(): void {
    if (this.visitId) {
      this.router.navigate(['/visits', this.visitId]);
    } else {
      this.router.navigate(['/visits']);
    }
  }

  private loadCustomer(): void {
    this.repCustomerService.getCustomerDetails(this.customerId).subscribe({
      next: (customer) => this.customer.set(customer),
      error: () => this.customer.set(null)
    });

    this.repCustomerService.getCustomerCredit(this.customerId).subscribe({
      next: (credit) => this.customerCredit.set(credit),
      error: () => this.customerCredit.set(null)
    });
  }

  loadProducts(page: number = 1): void {
    this.loadingProducts.set(true);
    this.repProductService.getCatalog({
      search: this.searchQuery || undefined,
      page,
      pageSize: 20,
      inStockOnly: true
    }).subscribe({
      next: (result) => {
        this.products.set(result.items);
        this.currentPage.set(result.page);
        this.totalPages.set(result.totalPages);
        this.loadingProducts.set(false);
      },
      error: () => {
        this.products.set([]);
        this.loadingProducts.set(false);
      }
    });
  }

  onSearchInput(): void {
    // Debounced search (simple version)
    clearTimeout((this as any).searchTimeout);
    (this as any).searchTimeout = setTimeout(() => {
      this.loadProducts(1);
    }, 300);
  }

  addToCart(product: RepProduct): void {
    const quantity = this.productQuantities[product.id] || 1;

    const existingItem = this.cart().find(item => item.product.id === product.id);

    if (existingItem) {
      this.updateQuantity(existingItem, existingItem.quantity + quantity);
    } else {
      const newItem: CartItem = {
        product,
        quantity,
        unitPrice: product.unitPrice,
        discount: 0,
        lineTotal: product.unitPrice * quantity
      };
      this.cart.update(items => [...items, newItem]);
    }

    // Reset quantity input
    this.productQuantities[product.id] = 1;

    this.notification.success(`${product.name} added to cart`);
  }

  updateQuantity(item: CartItem, newQuantity: number): void {
    if (newQuantity <= 0) {
      this.removeFromCart(item);
      return;
    }

    if (newQuantity > item.product.stockQuantity) {
      newQuantity = item.product.stockQuantity;
    }

    this.cart.update(items =>
      items.map(i =>
        i.product.id === item.product.id
          ? { ...i, quantity: newQuantity, lineTotal: i.unitPrice * newQuantity }
          : i
      )
    );
  }

  removeFromCart(item: CartItem): void {
    this.cart.update(items => items.filter(i => i.product.id !== item.product.id));
  }

  clearCart(): void {
    this.cart.set([]);
    this.promoCode = '';
    this.promotionResult.set(null);
    this.appliedPromotions.set([]);
    this.promoError.set(null);
  }

  submitOrder(): void {
    if (!this.canSubmit()) return;

    this.submitting.set(true);
    this.error.set(null);

    // Check if we're online
    if (this.offlineStorage.isOnline()) {
      this.submitOrderOnline();
    } else {
      this.submitOrderOffline();
    }
  }

  private submitOrderOnline(): void {
    const order: CreateRepOrder = {
      customerId: this.customerId,
      visitId: this.visitId ?? undefined,
      items: this.cart().map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount
      })),
      notes: this.orderNotes || undefined
    };

    this.repOrderService.createOrder(order).subscribe({
      next: (result) => {
        this.submitting.set(false);
        this.notification.success(
          this.translate.instant('orders.orderCreated'),
          `Order #${result.orderNumber}`
        );

        // Navigate to order confirmation page
        this.router.navigate(['/orders/rep/confirmation', result.orderId]);
      },
      error: (err) => {
        this.submitting.set(false);
        // If we went offline during the request, save offline
        if (!this.offlineStorage.isOnline()) {
          this.submitOrderOffline();
        } else {
          this.error.set(err.error?.message || 'Failed to create order');
        }
      }
    });
  }

  private submitOrderOffline(): void {
    const customer = this.customer();
    if (!customer) {
      this.submitting.set(false);
      this.error.set('Customer information not available');
      return;
    }

    const pendingItems: PendingOrderItem[] = this.cart().map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      sku: item.product.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      lineTotal: item.lineTotal
    }));

    const pendingOrder: Omit<PendingOrder, 'id' | 'createdAt' | 'syncStatus' | 'syncAttempts'> = {
      customerId: this.customerId,
      customerName: customer.name,
      items: pendingItems,
      subtotal: this.cartTotal(),
      discount: this.totalDiscount(),
      total: this.finalTotal(),
      notes: this.orderNotes || undefined,
      promoCode: this.promoCode.trim() || undefined,
      appliedPromotions: this.appliedPromotions().map(p => p.name),
    };

    this.offlineStorage.savePendingOrder(pendingOrder).subscribe({
      next: (saved) => {
        this.submitting.set(false);
        this.notification.info(
          this.translate.instant('orders.savedOffline'),
          this.translate.instant('orders.willSyncWhenOnline')
        );

        // Navigate back
        if (this.visitId) {
          this.router.navigate(['/visits', this.visitId]);
        } else {
          this.router.navigate(['/orders']);
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set('Failed to save order offline');
      }
    });
  }

  // Template methods
  private loadTemplates(): void {
    if (this.customerId) {
      this.orderTemplateService.getTemplatesForCustomer(this.customerId).subscribe({
        next: (templates) => this.templates.set(templates.filter(t => !t.isAutoGenerated)),
        error: () => this.templates.set([])
      });
    }
  }

  loadFromTemplate(template: OrderTemplate): void {
    // Clear current cart and load items from template
    // Use template items directly since they have product info

    const cartItems: CartItem[] = template.items
      .filter(ti => ti.isAvailable)
      .map(ti => ({
        product: {
          id: ti.productId,
          name: ti.productName,
          sku: ti.productSku || '',
          unitPrice: ti.unitPrice,
          stockQuantity: ti.currentStock ?? 100,
          stockWarning: (ti.currentStock ?? 100) < ti.quantity,
          isAvailable: ti.isAvailable,
          requiresPrescription: false
        } as RepProduct,
        quantity: Math.min(ti.quantity, ti.currentStock ?? ti.quantity),
        unitPrice: ti.unitPrice,
        discount: 0,
        lineTotal: ti.unitPrice * Math.min(ti.quantity, ti.currentStock ?? ti.quantity)
      }));

    this.cart.set(cartItems);
    this.showTemplateSelector = false;

    const skipped = template.items.length - cartItems.length;
    if (skipped > 0) {
      this.notification.warning(`${skipped} item(s) skipped (unavailable)`);
    } else {
      this.notification.success(`Loaded ${cartItems.length} items from template`);
    }
  }

  saveAsTemplate(): void {
    if (!this.templateName.trim() || this.cart().length === 0) return;

    this.savingTemplate.set(true);

    const request: CreateOrderTemplateRequest = {
      customerId: this.customerId,
      templateName: this.templateName.trim(),
      description: this.templateDescription.trim() || undefined,
      items: this.cart().map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    };

    this.orderTemplateService.createTemplate(request).subscribe({
      next: (template) => {
        this.savingTemplate.set(false);
        this.showSaveTemplate = false;
        this.templateName = '';
        this.templateDescription = '';
        this.templates.update(templates => [...templates, template]);
        this.notification.success('Template saved successfully');
      },
      error: (err) => {
        this.savingTemplate.set(false);
        this.notification.error(err.error?.message || 'Failed to save template');
      }
    });
  }

  // Promotion methods
  applyPromoCode(): void {
    if (!this.promoCode.trim() || !this.customer()) return;

    this.validatingPromo.set(true);
    this.promoError.set(null);

    // First validate the code
    this.repOrderService.validatePromoCode({
      promoCode: this.promoCode.trim(),
      customerId: this.customerId,
      orderTotal: this.cartTotal()
    }).subscribe({
      next: (result) => {
        if (result.isValid) {
          // Calculate promotions with the code
          this.calculatePromotions();
        } else {
          this.validatingPromo.set(false);
          this.promoError.set(result.errorMessage || 'Invalid promo code');
        }
      },
      error: (err) => {
        this.validatingPromo.set(false);
        this.promoError.set(err.error?.message || 'Failed to validate promo code');
      }
    });
  }

  private calculatePromotions(): void {
    if (this.cart().length === 0 || !this.customer()) {
      this.promotionResult.set(null);
      this.appliedPromotions.set([]);
      this.validatingPromo.set(false);
      return;
    }

    const request = {
      customerId: this.customerId,
      promoCode: this.promoCode.trim() || undefined,
      items: this.cart().map(item => ({
        productId: item.product.id,
        categoryId: undefined, // Could be populated if we had category info on product
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    };

    this.repOrderService.calculatePromotions(request).subscribe({
      next: (result) => {
        this.validatingPromo.set(false);
        if (result.success) {
          this.promotionResult.set(result);
          this.appliedPromotions.set(result.appliedPromotions);
          if (result.appliedPromotions.length > 0) {
            this.promoError.set(null);
            this.notification.success('Promo code applied!');
          } else if (this.promoCode.trim()) {
            this.promoError.set('Promo code does not apply to your cart items');
          }
        } else {
          this.promoError.set(result.message || 'Could not apply promotion');
        }
      },
      error: (err) => {
        this.validatingPromo.set(false);
        this.promoError.set(err.error?.message || 'Failed to calculate promotions');
      }
    });
  }

  private recalculatePromotions(): void {
    // Recalculate when cart changes
    if (this.cart().length > 0 && this.customer()) {
      this.calculatePromotions();
    } else {
      this.promotionResult.set(null);
      this.appliedPromotions.set([]);
    }
  }
}
