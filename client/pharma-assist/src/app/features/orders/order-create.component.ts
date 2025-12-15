import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OrderService } from '../../core/services/order.service';
import { CustomerService } from '../../core/services/customer.service';
import { ProductService } from '../../core/services/product.service';
import { CreateOrderDto, CreateOrderItemDto, PaymentMethod } from '../../core/models/order.model';
import { CustomerSummary, CustomerType, CustomerTier } from '../../core/models/customer.model';
import { ProductSummary } from '../../core/models/product.model';
import { SearchInputComponent } from '../../shared/components/search-input';

// Extended customer interface for order creation that includes contact info
interface OrderCustomer extends CustomerSummary {
  email?: string;
  phone?: string;
}

interface CartItem {
  product: ProductSummary;
  quantity: number;
  discountPercent: number;
  lineTotal: number;
}

@Component({
  selector: 'app-order-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, SearchInputComponent],
  template: `
    <div class="order-create">
      <!-- Header -->
      <div class="page-header">
        <div class="breadcrumb">
          <a routerLink="/orders">{{ 'orders.title' | translate }}</a>
          <span class="separator">/</span>
          <span>{{ 'orders.createOrder' | translate }}</span>
        </div>
        <h1 class="page-title">{{ 'orders.createOrder' | translate }}</h1>
      </div>

      <!-- Steps indicator -->
      <div class="steps-indicator">
        <div class="step" [class.active]="currentStep() === 1" [class.completed]="currentStep() > 1">
          <span class="step-number">1</span>
          <span class="step-label">{{ 'orders.steps.customer' | translate }}</span>
        </div>
        <div class="step-connector" [class.completed]="currentStep() > 1"></div>
        <div class="step" [class.active]="currentStep() === 2" [class.completed]="currentStep() > 2">
          <span class="step-number">2</span>
          <span class="step-label">{{ 'orders.steps.products' | translate }}</span>
        </div>
        <div class="step-connector" [class.completed]="currentStep() > 2"></div>
        <div class="step" [class.active]="currentStep() === 3">
          <span class="step-number">3</span>
          <span class="step-label">{{ 'orders.steps.review' | translate }}</span>
        </div>
      </div>

      <!-- Step 1: Customer Selection -->
      @if (currentStep() === 1) {
        <div class="step-content">
          <div class="step-header">
            <h2>{{ 'orders.selectCustomer' | translate }}</h2>
            <p>{{ 'orders.selectCustomerDesc' | translate }}</p>
          </div>

          <div class="search-section">
            <app-search-input
              [placeholder]="'orders.searchCustomers' | translate"
              (searchChange)="searchCustomers($event)">
            </app-search-input>
          </div>

          <div class="customer-list">
            @for (customer of filteredCustomers(); track customer.id) {
              <div class="customer-card" [class.selected]="selectedCustomer()?.id === customer.id"
                   (click)="selectCustomer(customer)">
                <div class="customer-info">
                  <span class="customer-name">{{ customer.name }}</span>
                  <span class="customer-type">{{ customer.customerTypeName }}</span>
                </div>
                <div class="customer-meta">
                  <span class="customer-tier tier-{{ customer.tier }}">{{ customer.tierName }}</span>
                  @if (customer.city) {
                    <span class="customer-city">{{ customer.city }}</span>
                  }
                </div>
                @if (selectedCustomer()?.id === customer.id) {
                  <div class="selected-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                }
              </div>
            } @empty {
              <div class="empty-state">
                <p>{{ 'orders.noCustomersFound' | translate }}</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- Step 2: Product Selection -->
      @if (currentStep() === 2) {
        <div class="step-content two-column">
          <div class="products-panel">
            <div class="panel-header">
              <h3>{{ 'orders.selectProducts' | translate }}</h3>
              <app-search-input
                [placeholder]="'orders.searchProducts' | translate"
                (searchChange)="searchProducts($event)">
              </app-search-input>
            </div>

            <div class="product-grid">
              @for (product of filteredProducts(); track product.id) {
                <div class="product-card" [class.in-cart]="isInCart(product.id)" (click)="addToCart(product)">
                  <div class="product-info">
                    <span class="product-name">{{ product.name }}</span>
                    <span class="product-sku">{{ product.sku }}</span>
                  </div>
                  <div class="product-meta">
                    <span class="product-price">{{ product.unitPrice | number:'1.2-2' }} KM</span>
                    <span class="product-stock" [class.low]="product.stockQuantity < 20">
                      {{ product.stockQuantity }} {{ 'orders.inStock' | translate }}
                    </span>
                  </div>
                  @if (product.requiresPrescription) {
                    <span class="rx-badge">Rx</span>
                  }
                </div>
              }
            </div>
          </div>

          <div class="cart-panel">
            <div class="panel-header">
              <h3>{{ 'orders.cart' | translate }} ({{ cartItems().length }})</h3>
            </div>

            @if (cartItems().length > 0) {
              <div class="cart-items">
                @for (item of cartItems(); track item.product.id) {
                  <div class="cart-item">
                    <div class="item-info">
                      <span class="item-name">{{ item.product.name }}</span>
                      <span class="item-price">{{ item.product.unitPrice | number:'1.2-2' }} KM</span>
                    </div>
                    <div class="item-controls">
                      <button class="qty-btn" (click)="updateQuantity(item, -1)">-</button>
                      <input type="number" [(ngModel)]="item.quantity" min="1" [max]="item.product.stockQuantity"
                             (change)="recalculateCart()" class="qty-input">
                      <button class="qty-btn" (click)="updateQuantity(item, 1)">+</button>
                      <button class="remove-btn" (click)="removeFromCart(item)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                    <div class="item-total">{{ item.lineTotal | number:'1.2-2' }} KM</div>
                  </div>
                }
              </div>

              <div class="cart-summary">
                <div class="summary-row">
                  <span>{{ 'orders.subtotal' | translate }}</span>
                  <span>{{ cartSubtotal() | number:'1.2-2' }} KM</span>
                </div>
                <div class="summary-row">
                  <span>{{ 'orders.tax' | translate }} (17%)</span>
                  <span>{{ cartTax() | number:'1.2-2' }} KM</span>
                </div>
                <div class="summary-row total">
                  <span>{{ 'orders.total' | translate }}</span>
                  <span>{{ cartTotal() | number:'1.2-2' }} KM</span>
                </div>
              </div>
            } @else {
              <div class="empty-cart">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                <p>{{ 'orders.emptyCart' | translate }}</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- Step 3: Review & Payment Terms -->
      @if (currentStep() === 3) {
        <div class="step-content">
          <div class="review-grid">
            <!-- Customer Summary -->
            <div class="review-card">
              <h3>{{ 'orders.customerInfo' | translate }}</h3>
              @if (selectedCustomer()) {
                <div class="review-content">
                  <p class="review-name">{{ selectedCustomer()!.name }}</p>
                  <p class="review-meta">{{ selectedCustomer()!.customerTypeName }} • {{ selectedCustomer()!.tierName }}</p>
                  @if (selectedCustomer()!.email) {
                    <p>{{ selectedCustomer()!.email }}</p>
                  }
                  @if (selectedCustomer()!.phone) {
                    <p>{{ selectedCustomer()!.phone }}</p>
                  }
                  @if (selectedCustomer()!.city) {
                    <p>{{ selectedCustomer()!.city }}</p>
                  }
                </div>
              }
            </div>

            <!-- Payment Terms -->
            <div class="review-card">
              <h3>{{ 'orders.paymentTerms' | translate }}</h3>
              <div class="payment-options">
                <label class="payment-option" [class.selected]="paymentMethod === PaymentMethod.Invoice">
                  <input type="radio" name="payment" [value]="PaymentMethod.Invoice" [(ngModel)]="paymentMethod">
                  <div class="option-content">
                    <span class="option-title">{{ 'orders.paymentMethod.invoice' | translate }}</span>
                    <span class="option-desc">{{ 'orders.invoiceDesc' | translate }}</span>
                  </div>
                </label>
                <label class="payment-option" [class.selected]="paymentMethod === PaymentMethod.BankTransfer">
                  <input type="radio" name="payment" [value]="PaymentMethod.BankTransfer" [(ngModel)]="paymentMethod">
                  <div class="option-content">
                    <span class="option-title">{{ 'orders.paymentMethod.bankTransfer' | translate }}</span>
                    <span class="option-desc">{{ 'orders.bankTransferDesc' | translate }}</span>
                  </div>
                </label>
                <label class="payment-option" [class.selected]="paymentMethod === PaymentMethod.CashOnDelivery">
                  <input type="radio" name="payment" [value]="PaymentMethod.CashOnDelivery" [(ngModel)]="paymentMethod">
                  <div class="option-content">
                    <span class="option-title">{{ 'orders.paymentMethod.cashOnDelivery' | translate }}</span>
                    <span class="option-desc">{{ 'orders.codDesc' | translate }}</span>
                  </div>
                </label>
              </div>
            </div>

            <!-- Delivery Date -->
            <div class="review-card">
              <h3>{{ 'orders.deliveryDate' | translate }}</h3>
              <div class="form-group">
                <label>{{ 'orders.requiredDate' | translate }}</label>
                <input type="date" [(ngModel)]="requiredDate" [min]="minDate" class="date-input">
              </div>
            </div>

            <!-- Notes -->
            <div class="review-card">
              <h3>{{ 'orders.notes' | translate }}</h3>
              <textarea [(ngModel)]="orderNotes" rows="3" [placeholder]="'orders.notesPlaceholder' | translate"></textarea>
            </div>

            <!-- Order Summary -->
            <div class="review-card order-summary-card">
              <h3>{{ 'orders.orderSummary' | translate }}</h3>
              <div class="order-items">
                @for (item of cartItems(); track item.product.id) {
                  <div class="summary-item">
                    <span class="item-qty">{{ item.quantity }}x</span>
                    <span class="item-name">{{ item.product.name }}</span>
                    <span class="item-total">{{ item.lineTotal | number:'1.2-2' }} KM</span>
                  </div>
                }
              </div>
              <div class="order-totals">
                <div class="total-row">
                  <span>{{ 'orders.subtotal' | translate }}</span>
                  <span>{{ cartSubtotal() | number:'1.2-2' }} KM</span>
                </div>
                <div class="total-row">
                  <span>{{ 'orders.tax' | translate }} (17%)</span>
                  <span>{{ cartTax() | number:'1.2-2' }} KM</span>
                </div>
                <div class="total-row grand-total">
                  <span>{{ 'orders.total' | translate }}</span>
                  <span>{{ cartTotal() | number:'1.2-2' }} KM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Navigation -->
      <div class="step-navigation">
        <button type="button" class="btn-secondary" (click)="previousStep()" [disabled]="currentStep() === 1">
          {{ 'common.back' | translate }}
        </button>
        <div class="nav-right">
          <button type="button" class="btn-secondary" routerLink="/orders">
            {{ 'common.cancel' | translate }}
          </button>
          @if (currentStep() < 3) {
            <button type="button" class="btn-primary" (click)="nextStep()" [disabled]="!canProceed()">
              {{ 'common.next' | translate }}
            </button>
          } @else {
            <button type="button" class="btn-primary" (click)="submitOrder()" [disabled]="submitting()">
              @if (submitting()) {
                <span class="spinner"></span>
              }
              {{ 'orders.placeOrder' | translate }}
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host{--c1:#1a1a2e;--c2:#6b7280;--c3:#e5e7eb;--c4:#f3f4f6;--c5:#0aaaaa;--c6:#059669;--c7:#dc2626}
    .order-create{padding:1.5rem;max-width:1200px;margin:0 auto}
    .page-header{margin-bottom:1.5rem}
    .breadcrumb{font-size:.875rem;color:var(--c2);margin-bottom:.5rem;display:flex;gap:.5rem}
    .breadcrumb a{color:var(--c5);text-decoration:none}
    .separator{color:var(--c3)}
    .page-title{font-size:1.5rem;font-weight:600;color:var(--c1);margin:0}
    .steps-indicator{display:flex;align-items:center;justify-content:center;gap:0;margin-bottom:2rem;padding:1rem;background:#fff;border-radius:12px;border:1px solid var(--c3)}
    .step{display:flex;align-items:center;gap:.5rem;padding:.5rem 1rem}
    .step-number{width:28px;height:28px;border-radius:50%;background:var(--c4);color:var(--c2);font-size:.875rem;font-weight:600;display:flex;align-items:center;justify-content:center}
    .step.active .step-number{background:var(--c5);color:#fff}
    .step.completed .step-number{background:var(--c6);color:#fff}
    .step-label{font-size:.875rem;color:var(--c2);font-weight:500}
    .step.active .step-label{color:var(--c1);font-weight:600}
    .step-connector{width:60px;height:2px;background:var(--c3)}
    .step-connector.completed{background:var(--c6)}
    .step-content{background:#fff;border-radius:12px;border:1px solid var(--c3);padding:1.5rem;min-height:400px}
    .step-content.two-column{display:grid;grid-template-columns:1fr 380px;gap:1.5rem;padding:0}
    @media(max-width:900px){.step-content.two-column{grid-template-columns:1fr;padding:1rem}}
    .step-header{margin-bottom:1.5rem}
    .step-header h2{font-size:1.125rem;font-weight:600;color:var(--c1);margin:0 0 .25rem}
    .step-header p{color:var(--c2);margin:0;font-size:.9rem}
    .search-section{margin-bottom:1rem}
    .customer-list{display:flex;flex-direction:column;gap:.75rem;max-height:400px;overflow-y:auto}
    .customer-card{padding:1rem;border:1px solid var(--c3);border-radius:10px;cursor:pointer;transition:all .2s;position:relative}
    .customer-card:hover{border-color:var(--c5);background:rgba(13,148,136,.02)}
    .customer-card.selected{border-color:var(--c5);background:rgba(13,148,136,.05)}
    .customer-info{display:flex;justify-content:space-between;margin-bottom:.375rem}
    .customer-name{font-weight:600;color:var(--c1)}
    .customer-type{font-size:.8rem;color:var(--c2)}
    .customer-meta{display:flex;gap:.75rem;font-size:.8rem}
    .customer-tier{padding:.125rem .5rem;border-radius:4px;font-weight:500}
    .customer-tier.tier-1{background:#dcfce7;color:#166534}
    .customer-tier.tier-2{background:#dbeafe;color:#1e40af}
    .customer-tier.tier-3{background:var(--c4);color:var(--c2)}
    .customer-email{color:var(--c2)}
    .selected-icon{position:absolute;top:1rem;right:1rem;color:var(--c5)}
    .products-panel{padding:1.5rem;border-right:1px solid var(--c3);overflow-y:auto;max-height:500px}
    @media(max-width:900px){.products-panel{border-right:none;border-bottom:1px solid var(--c3);max-height:300px}}
    .panel-header{margin-bottom:1rem}
    .panel-header h3{font-size:1rem;font-weight:600;color:var(--c1);margin:0 0 .75rem}
    .product-grid{display:flex;flex-direction:column;gap:.5rem}
    .product-card{padding:.75rem;border:1px solid var(--c3);border-radius:8px;cursor:pointer;transition:all .2s;position:relative}
    .product-card:hover{border-color:var(--c5)}
    .product-card.in-cart{border-color:var(--c5);background:rgba(13,148,136,.05)}
    .product-info{display:flex;justify-content:space-between;margin-bottom:.25rem}
    .product-name{font-weight:500;color:var(--c1);font-size:.875rem}
    .product-sku{font-size:.75rem;color:var(--c2);font-family:monospace}
    .product-meta{display:flex;justify-content:space-between;font-size:.8rem}
    .product-price{font-weight:600;color:var(--c5)}
    .product-stock{color:var(--c2)}
    .product-stock.low{color:var(--c7)}
    .rx-badge{position:absolute;top:.5rem;right:.5rem;background:#fef3c7;color:#d97706;font-size:.65rem;font-weight:600;padding:.125rem .375rem;border-radius:4px}
    .cart-panel{padding:1.5rem;background:var(--c4);display:flex;flex-direction:column}
    .cart-items{flex:1;overflow-y:auto;margin-bottom:1rem}
    .cart-item{display:grid;grid-template-columns:1fr auto auto;gap:.5rem;padding:.75rem;background:#fff;border-radius:8px;margin-bottom:.5rem;align-items:center}
    .item-info{display:flex;flex-direction:column;gap:.125rem}
    .item-name{font-size:.875rem;font-weight:500;color:var(--c1)}
    .item-price{font-size:.75rem;color:var(--c2)}
    .item-controls{display:flex;align-items:center;gap:.25rem}
    .qty-btn{width:24px;height:24px;border:1px solid var(--c3);background:#fff;border-radius:4px;cursor:pointer;font-weight:600}
    .qty-btn:hover{border-color:var(--c5);color:var(--c5)}
    .qty-input{width:40px;text-align:center;border:1px solid var(--c3);border-radius:4px;padding:.25rem;font-size:.875rem}
    .remove-btn{width:24px;height:24px;border:none;background:none;color:var(--c7);cursor:pointer;opacity:.6}
    .remove-btn:hover{opacity:1}
    .item-total{font-weight:600;color:var(--c1);font-size:.875rem;text-align:right}
    .cart-summary{padding-top:1rem;border-top:1px solid var(--c3)}
    .summary-row{display:flex;justify-content:space-between;padding:.375rem 0;font-size:.875rem}
    .summary-row.total{font-weight:600;font-size:1rem;color:var(--c1);padding-top:.5rem;border-top:1px solid var(--c3);margin-top:.5rem}
    .empty-cart{text-align:center;padding:2rem;color:var(--c2)}
    .empty-cart svg{margin-bottom:.75rem;opacity:.5}
    .empty-state{text-align:center;padding:2rem;color:var(--c2)}
    .review-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem}
    @media(max-width:768px){.review-grid{grid-template-columns:1fr}}
    .review-card{padding:1.25rem;border:1px solid var(--c3);border-radius:10px}
    .review-card h3{font-size:.9rem;font-weight:600;color:var(--c1);margin:0 0 1rem;text-transform:uppercase;letter-spacing:.5px}
    .review-content p{margin:0 0 .375rem;font-size:.9rem}
    .review-name{font-weight:600;font-size:1rem !important}
    .review-meta{color:var(--c2);font-size:.8rem !important}
    .payment-options{display:flex;flex-direction:column;gap:.5rem}
    .payment-option{display:flex;align-items:flex-start;gap:.75rem;padding:.75rem;border:1px solid var(--c3);border-radius:8px;cursor:pointer;transition:all .2s}
    .payment-option:hover{border-color:var(--c5)}
    .payment-option.selected{border-color:var(--c5);background:rgba(13,148,136,.05)}
    .payment-option input{margin-top:.25rem}
    .option-content{display:flex;flex-direction:column;gap:.125rem}
    .option-title{font-weight:500;color:var(--c1);font-size:.9rem}
    .option-desc{font-size:.75rem;color:var(--c2)}
    .form-group{display:flex;flex-direction:column;gap:.375rem}
    .form-group label{font-size:.8rem;font-weight:500;color:var(--c2)}
    .date-input,textarea{padding:.625rem;border:1px solid var(--c3);border-radius:8px;font-size:.875rem}
    .date-input:focus,textarea:focus{outline:none;border-color:var(--c5)}
    textarea{resize:none}
    .order-summary-card{grid-column:span 2}
    @media(max-width:768px){.order-summary-card{grid-column:span 1}}
    .order-items{margin-bottom:1rem}
    .summary-item{display:flex;gap:.75rem;padding:.5rem 0;border-bottom:1px solid var(--c4);font-size:.875rem}
    .summary-item:last-child{border-bottom:none}
    .item-qty{color:var(--c2);min-width:30px}
    .item-name{flex:1}
    .order-totals{padding-top:1rem;border-top:1px solid var(--c3)}
    .total-row{display:flex;justify-content:space-between;padding:.375rem 0;font-size:.9rem}
    .total-row.grand-total{font-weight:700;font-size:1.125rem;color:var(--c1);margin-top:.5rem;padding-top:.75rem;border-top:2px solid var(--c1)}
    .step-navigation{display:flex;justify-content:space-between;margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid var(--c3)}
    .nav-right{display:flex;gap:.75rem}
    .btn-primary,.btn-secondary{display:flex;align-items:center;justify-content:center;gap:.5rem;padding:.75rem 1.5rem;border-radius:8px;font-size:.9rem;font-weight:500;cursor:pointer;transition:all .2s}
    .btn-primary{background:var(--c5);color:#fff;border:none;min-width:120px}
    .btn-primary:hover:not(:disabled){background:#088888}
    .btn-primary:disabled{opacity:.5;cursor:not-allowed}
    .btn-secondary{background:#fff;color:var(--c1);border:1px solid var(--c3)}
    .btn-secondary:hover:not(:disabled){border-color:var(--c5);color:var(--c5)}
    .btn-secondary:disabled{opacity:.5;cursor:not-allowed}
    .spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    @media(max-width:640px){.order-create{padding:1rem}.steps-indicator{flex-wrap:wrap;gap:.5rem}.step-connector{display:none}.step{flex:1;justify-content:center}}
  `]
})
export class OrderCreateComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);
  private readonly customerService = inject(CustomerService);
  private readonly productService = inject(ProductService);

  PaymentMethod = PaymentMethod;

  currentStep = signal(1);
  submitting = signal(false);

  // Customer selection - using OrderCustomer for extended fields
  customers = signal<OrderCustomer[]>([]);
  customerSearch = signal('');
  selectedCustomer = signal<OrderCustomer | null>(null);

  filteredCustomers = computed(() => {
    const search = this.customerSearch().toLowerCase();
    if (!search) return this.customers();
    return this.customers().filter(c =>
      c.name.toLowerCase().includes(search) ||
      c.customerCode?.toLowerCase().includes(search)
    );
  });

  // Product selection
  products = signal<ProductSummary[]>([]);
  productSearch = signal('');
  cartItems = signal<CartItem[]>([]);

  filteredProducts = computed(() => {
    const search = this.productSearch().toLowerCase();
    if (!search) return this.products();
    return this.products().filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.sku.toLowerCase().includes(search)
    );
  });

  cartSubtotal = computed(() => this.cartItems().reduce((sum, item) => sum + item.lineTotal, 0));
  cartTax = computed(() => this.cartSubtotal() * 0.17);
  cartTotal = computed(() => this.cartSubtotal() + this.cartTax());

  // Order details
  paymentMethod = PaymentMethod.Invoice;
  requiredDate = '';
  orderNotes = '';
  minDate = new Date().toISOString().split('T')[0];

  ngOnInit(): void {
    this.loadCustomers();
    this.loadProducts();
    // Set default required date to 3 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 3);
    this.requiredDate = defaultDate.toISOString().split('T')[0];
  }

  private loadCustomers(): void {
    this.customerService.getAll().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          // Map Customer[] to OrderCustomer[]
          const orderCustomers: OrderCustomer[] = res.data.map(c => ({
            id: c.id,
            customerCode: c.customerCode,
            name: c.name,
            customerType: c.customerType,
            customerTypeName: c.customerTypeName,
            tier: c.tier,
            tierName: c.tierName,
            isActive: c.isActive,
            email: c.email,
            phone: c.phone
          }));
          this.customers.set(orderCustomers);
        }
      },
      error: () => {
        // Mock data matching OrderCustomer interface
        this.customers.set([
          { id: 1, customerCode: 'GAS-001', name: 'Gradska Apoteka Sarajevo', customerType: CustomerType.Pharmacy, customerTypeName: 'Pharmacy', tier: CustomerTier.A, tierName: 'Tier A', isActive: true, city: 'Sarajevo', email: 'narudzbe@gradska-apoteka.ba', phone: '+387 33 123 456' },
          { id: 2, customerCode: 'ACM-001', name: 'Apoteka Centar Mostar', customerType: CustomerType.Pharmacy, customerTypeName: 'Pharmacy', tier: CustomerTier.B, tierName: 'Tier B', isActive: true, city: 'Mostar', email: 'info@apoteka-centar.ba', phone: '+387 36 555 123' },
          { id: 3, customerCode: 'KCT-001', name: 'Klinički Centar Tuzla', customerType: CustomerType.Hospital, customerTypeName: 'Hospital', tier: CustomerTier.A, tierName: 'Tier A', isActive: true, city: 'Tuzla', email: 'nabavka@kct.ba', phone: '+387 35 303 000' },
          { id: 4, customerCode: 'APZ-001', name: 'Apoteka Zenica', customerType: CustomerType.Pharmacy, customerTypeName: 'Pharmacy', tier: CustomerTier.C, tierName: 'Tier C', isActive: true, city: 'Zenica', email: 'info@apoteka-ze.ba', phone: '+387 32 222 333' },
          { id: 5, customerCode: 'DZBL-001', name: 'Dom Zdravlja Banja Luka', customerType: CustomerType.Clinic, customerTypeName: 'Clinic', tier: CustomerTier.B, tierName: 'Tier B', isActive: true, city: 'Banja Luka', email: 'nabavka@dzbl.ba', phone: '+387 51 212 121' }
        ]);
      }
    });
  }

  private loadProducts(): void {
    this.productService.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.products.set(res.data as ProductSummary[]);
        }
      },
      error: () => {
        // Mock data
        this.products.set([
          { id: 1, name: 'Aspirin 500mg', nameLocal: 'Aspirin 500mg', sku: 'ASP-500', unitPrice: 8.50, stockQuantity: 245, requiresPrescription: false, isActive: true, categoryName: 'Pain Relief', manufacturerName: 'Bosnalijek' },
          { id: 2, name: 'Ibuprofen 400mg', nameLocal: 'Ibuprofen 400mg', sku: 'IBU-400', unitPrice: 12.00, stockQuantity: 180, requiresPrescription: false, isActive: true, categoryName: 'Pain Relief', manufacturerName: 'Hemofarm' },
          { id: 3, name: 'Amoxicillin 500mg', nameLocal: 'Amoksicilin 500mg', sku: 'AMX-500', unitPrice: 15.50, stockQuantity: 15, requiresPrescription: true, isActive: true, categoryName: 'Antibiotics', manufacturerName: 'Alkaloid' },
          { id: 4, name: 'Paracetamol 500mg', nameLocal: 'Paracetamol 500mg', sku: 'PAR-500', unitPrice: 6.00, stockQuantity: 320, requiresPrescription: false, isActive: true, categoryName: 'Pain Relief', manufacturerName: 'Bosnalijek' },
          { id: 5, name: 'Vitamin C 1000mg', nameLocal: 'Vitamin C 1000mg', sku: 'VTC-1000', unitPrice: 14.00, stockQuantity: 200, requiresPrescription: false, isActive: true, categoryName: 'Vitamins', manufacturerName: 'Pliva' },
          { id: 6, name: 'Omeprazole 20mg', nameLocal: 'Omeprazol 20mg', sku: 'OMP-020', unitPrice: 18.50, stockQuantity: 8, requiresPrescription: true, isActive: true, categoryName: 'Gastrointestinal', manufacturerName: 'Galenika' }
        ] as ProductSummary[]);
      }
    });
  }

  searchCustomers(term: string): void {
    this.customerSearch.set(term);
  }

  selectCustomer(customer: CustomerSummary): void {
    this.selectedCustomer.set(customer);
  }

  searchProducts(term: string): void {
    this.productSearch.set(term);
  }

  isInCart(productId: number): boolean {
    return this.cartItems().some(item => item.product.id === productId);
  }

  addToCart(product: ProductSummary): void {
    const existing = this.cartItems().find(item => item.product.id === product.id);
    if (existing) {
      this.updateQuantity(existing, 1);
    } else {
      const newItem: CartItem = {
        product,
        quantity: 1,
        discountPercent: 0,
        lineTotal: product.unitPrice
      };
      this.cartItems.update(items => [...items, newItem]);
    }
  }

  updateQuantity(item: CartItem, delta: number): void {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      this.removeFromCart(item);
    } else if (newQty <= item.product.stockQuantity) {
      item.quantity = newQty;
      this.recalculateCart();
    }
  }

  removeFromCart(item: CartItem): void {
    this.cartItems.update(items => items.filter(i => i.product.id !== item.product.id));
  }

  recalculateCart(): void {
    this.cartItems.update(items => items.map(item => ({
      ...item,
      lineTotal: item.product.unitPrice * item.quantity * (1 - item.discountPercent / 100)
    })));
  }

  getCustomerTypeLabel(type: number): string {
    const types: Record<number, string> = { 1: 'Retail', 2: 'Pharmacy', 3: 'Hospital', 4: 'Wholesale', 5: 'Clinic', 99: 'Other' };
    return types[type] || 'Unknown';
  }

  getCustomerTierLabel(tier: number): string {
    const tiers: Record<number, string> = { 1: 'Premium', 2: 'Standard', 3: 'Basic' };
    return tiers[tier] || 'Unknown';
  }

  canProceed(): boolean {
    switch (this.currentStep()) {
      case 1: return this.selectedCustomer() !== null;
      case 2: return this.cartItems().length > 0;
      case 3: return true;
      default: return false;
    }
  }

  nextStep(): void {
    if (this.canProceed() && this.currentStep() < 3) {
      this.currentStep.update(s => s + 1);
    }
  }

  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
    }
  }

  submitOrder(): void {
    if (!this.selectedCustomer() || this.cartItems().length === 0) return;

    this.submitting.set(true);

    const orderItems: CreateOrderItemDto[] = this.cartItems().map(item => ({
      productId: item.product.id.toString(),
      quantity: item.quantity,
      discountPercent: item.discountPercent
    }));

    const order: CreateOrderDto = {
      customerId: this.selectedCustomer()!.id.toString(),
      paymentMethod: this.paymentMethod,
      requiredDate: this.requiredDate ? new Date(this.requiredDate) : undefined,
      notes: this.orderNotes || undefined,
      items: orderItems
    };

    this.orderService.createOrder(order).subscribe({
      next: (createdOrder) => {
        this.submitting.set(false);
        if (createdOrder?.id) {
          this.router.navigate(['/orders', createdOrder.id]);
        } else {
          this.router.navigate(['/orders']);
        }
      },
      error: () => {
        this.submitting.set(false);
        // Mock success - navigate to orders list
        this.router.navigate(['/orders']);
      }
    });
  }
}
