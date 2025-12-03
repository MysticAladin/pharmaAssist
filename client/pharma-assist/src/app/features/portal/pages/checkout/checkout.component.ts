import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CartService } from '../../services/cart.service';
import { DeliveryAddress, DeliveryOption, PaymentMethod, DELIVERY_OPTIONS, CheckoutData } from '../../models/portal.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule],
  template: `
    <div class="checkout-page">
      <h1>{{ 'portal.checkout.title' | translate }}</h1>

      <div class="checkout-content">
        <div class="checkout-steps">
          <!-- Step 1: Delivery Address -->
          <div class="step" [class.active]="currentStep() === 1" [class.completed]="currentStep() > 1">
            <div class="step-header" (click)="currentStep() > 1 && goToStep(1)">
              <span class="step-number">1</span>
              <span class="step-title">{{ 'portal.checkout.deliveryAddress' | translate }}</span>
              @if (currentStep() > 1) {
                <span class="step-edit">{{ 'common.edit' | translate }}</span>
              }
            </div>
            @if (currentStep() === 1) {
              <div class="step-content">
                <div class="address-form">
                  <div class="form-row">
                    <div class="form-group">
                      <label>{{ 'portal.checkout.street' | translate }} *</label>
                      <input type="text" [(ngModel)]="address.street" required />
                    </div>
                  </div>
                  <div class="form-row two-cols">
                    <div class="form-group">
                      <label>{{ 'portal.checkout.city' | translate }} *</label>
                      <input type="text" [(ngModel)]="address.city" required />
                    </div>
                    <div class="form-group">
                      <label>{{ 'portal.checkout.postalCode' | translate }} *</label>
                      <input type="text" [(ngModel)]="address.postalCode" required />
                    </div>
                  </div>
                  <div class="form-row two-cols">
                    <div class="form-group">
                      <label>{{ 'portal.checkout.canton' | translate }}</label>
                      <input type="text" [(ngModel)]="address.canton" />
                    </div>
                    <div class="form-group">
                      <label>{{ 'portal.checkout.country' | translate }}</label>
                      <input type="text" [(ngModel)]="address.country" value="Bosnia and Herzegovina" />
                    </div>
                  </div>
                  <div class="form-row two-cols">
                    <div class="form-group">
                      <label>{{ 'portal.checkout.contactPerson' | translate }}</label>
                      <input type="text" [(ngModel)]="address.contactPerson" />
                    </div>
                    <div class="form-group">
                      <label>{{ 'portal.checkout.contactPhone' | translate }}</label>
                      <input type="tel" [(ngModel)]="address.contactPhone" />
                    </div>
                  </div>
                </div>
                <button class="btn btn-primary" (click)="nextStep()" [disabled]="!isAddressValid()">
                  {{ 'portal.checkout.continue' | translate }}
                </button>
              </div>
            }
          </div>

          <!-- Step 2: Delivery Method -->
          <div class="step" [class.active]="currentStep() === 2" [class.completed]="currentStep() > 2">
            <div class="step-header" (click)="currentStep() > 2 && goToStep(2)">
              <span class="step-number">2</span>
              <span class="step-title">{{ 'portal.checkout.deliveryMethod' | translate }}</span>
            </div>
            @if (currentStep() === 2) {
              <div class="step-content">
                <div class="delivery-options">
                  @for (option of deliveryOptions; track option.id) {
                    <label class="delivery-option" [class.selected]="selectedDelivery?.id === option.id">
                      <input type="radio" name="delivery" [value]="option.id" (change)="selectDelivery(option)" />
                      <div class="option-content">
                        <span class="option-icon">{{ option.icon === 'truck' ? '🚚' : option.icon === 'rocket' ? '🚀' : '⚡' }}</span>
                        <div class="option-info">
                          <span class="option-name">{{ option.name }}</span>
                          <span class="option-desc">{{ option.description }}</span>
                        </div>
                        <span class="option-price">
                          {{ option.price === 0 ? ('portal.checkout.free' | translate) : (option.price | currency:'BAM':'symbol':'1.2-2') }}
                        </span>
                      </div>
                    </label>
                  }
                </div>
                <div class="step-actions">
                  <button class="btn btn-secondary" (click)="prevStep()">{{ 'common.back' | translate }}</button>
                  <button class="btn btn-primary" (click)="nextStep()" [disabled]="!selectedDelivery">
                    {{ 'portal.checkout.continue' | translate }}
                  </button>
                </div>
              </div>
            }
          </div>

          <!-- Step 3: Payment -->
          <div class="step" [class.active]="currentStep() === 3" [class.completed]="currentStep() > 3">
            <div class="step-header">
              <span class="step-number">3</span>
              <span class="step-title">{{ 'portal.checkout.payment' | translate }}</span>
            </div>
            @if (currentStep() === 3) {
              <div class="step-content">
                <div class="payment-options">
                  <label class="payment-option" [class.selected]="paymentMethod === 'invoice'">
                    <input type="radio" name="payment" value="invoice" [(ngModel)]="paymentMethod" />
                    <span class="option-icon">📄</span>
                    <div class="option-info">
                      <span class="option-name">{{ 'portal.checkout.invoice' | translate }}</span>
                      <span class="option-desc">{{ 'portal.checkout.invoiceDesc' | translate }}</span>
                    </div>
                  </label>
                  <label class="payment-option" [class.selected]="paymentMethod === 'bank-transfer'">
                    <input type="radio" name="payment" value="bank-transfer" [(ngModel)]="paymentMethod" />
                    <span class="option-icon">🏦</span>
                    <div class="option-info">
                      <span class="option-name">{{ 'portal.checkout.bankTransfer' | translate }}</span>
                      <span class="option-desc">{{ 'portal.checkout.bankTransferDesc' | translate }}</span>
                    </div>
                  </label>
                </div>
                <div class="form-group">
                  <label>{{ 'portal.checkout.poNumber' | translate }}</label>
                  <input type="text" [(ngModel)]="purchaseOrderNumber" [placeholder]="'portal.checkout.poNumberPlaceholder' | translate" />
                </div>
                <div class="form-group">
                  <label>{{ 'portal.checkout.notes' | translate }}</label>
                  <textarea [(ngModel)]="notes" rows="3" [placeholder]="'portal.checkout.notesPlaceholder' | translate"></textarea>
                </div>
                <div class="step-actions">
                  <button class="btn btn-secondary" (click)="prevStep()">{{ 'common.back' | translate }}</button>
                  <button class="btn btn-primary" (click)="nextStep()">{{ 'portal.checkout.reviewOrder' | translate }}</button>
                </div>
              </div>
            }
          </div>

          <!-- Step 4: Review & Confirm -->
          <div class="step" [class.active]="currentStep() === 4">
            <div class="step-header">
              <span class="step-number">4</span>
              <span class="step-title">{{ 'portal.checkout.review' | translate }}</span>
            </div>
            @if (currentStep() === 4) {
              <div class="step-content">
                <div class="review-section">
                  <h4>{{ 'portal.checkout.deliveryAddress' | translate }}</h4>
                  <p>{{ address.street }}<br>{{ address.postalCode }} {{ address.city }}<br>{{ address.country }}</p>
                </div>
                <div class="review-section">
                  <h4>{{ 'portal.checkout.deliveryMethod' | translate }}</h4>
                  <p>{{ selectedDelivery?.name }} - {{ selectedDelivery?.price === 0 ? 'Free' : (selectedDelivery?.price | currency:'BAM') }}</p>
                </div>
                <div class="review-section">
                  <h4>{{ 'portal.checkout.payment' | translate }}</h4>
                  <p>{{ paymentMethod === 'invoice' ? 'Invoice' : 'Bank Transfer' }}</p>
                </div>
                <div class="step-actions">
                  <button class="btn btn-secondary" (click)="prevStep()">{{ 'common.back' | translate }}</button>
                  <button class="btn btn-primary btn-lg" (click)="placeOrder()" [disabled]="isSubmitting()">
                    {{ isSubmitting() ? ('common.processing' | translate) : ('portal.checkout.placeOrder' | translate) }}
                  </button>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Order Summary Sidebar -->
        <div class="order-summary">
          <h3>{{ 'portal.cart.orderSummary' | translate }}</h3>
          <div class="summary-items">
            @for (item of cartItems(); track item.productId) {
              <div class="summary-item">
                <span class="item-qty">{{ item.quantity }}x</span>
                <span class="item-name">{{ item.productName }}</span>
                <span class="item-price">{{ item.subtotal | currency:'BAM':'symbol':'1.2-2' }}</span>
              </div>
            }
          </div>
          <div class="summary-row"><span>{{ 'portal.cart.subtotal' | translate }}</span><span>{{ subtotal() | currency:'BAM':'symbol':'1.2-2' }}</span></div>
          <div class="summary-row"><span>{{ 'portal.cart.delivery' | translate }}</span><span>{{ (selectedDelivery?.price ?? 0) | currency:'BAM':'symbol':'1.2-2' }}</span></div>
          <div class="summary-row"><span>{{ 'portal.cart.tax' | translate }}</span><span>{{ tax() | currency:'BAM':'symbol':'1.2-2' }}</span></div>
          <div class="summary-row total"><span>{{ 'portal.cart.total' | translate }}</span><span>{{ grandTotal() | currency:'BAM':'symbol':'1.2-2' }}</span></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .checkout-page { max-width: 1200px; margin: 0 auto; }
    h1 { font-size: 1.75rem; margin-bottom: 2rem; }
    .checkout-content { display: grid; grid-template-columns: 1fr 360px; gap: 2rem; }
    .checkout-steps { display: flex; flex-direction: column; gap: 1rem; }
    .step { background: var(--surface-card, white); border-radius: 12px; overflow: hidden; }
    .step-header { display: flex; align-items: center; gap: 1rem; padding: 1.25rem 1.5rem; cursor: pointer; }
    .step-number { width: 32px; height: 32px; border-radius: 50%; background: var(--surface-ground); display: flex; align-items: center; justify-content: center; font-weight: 600; }
    .step.active .step-number, .step.completed .step-number { background: var(--primary-color); color: white; }
    .step-title { font-weight: 600; flex: 1; }
    .step-edit { color: var(--primary-color); font-size: 0.875rem; }
    .step-content { padding: 0 1.5rem 1.5rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem; }
    .form-row { margin-bottom: 1rem; }
    .form-row.two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem; }
    .form-group input, .form-group textarea { width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; }
    .delivery-options, .payment-options { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
    .delivery-option, .payment-option { display: flex; align-items: center; gap: 1rem; padding: 1rem; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer; }
    .delivery-option.selected, .payment-option.selected { border-color: var(--primary-color); background: rgba(59, 130, 246, 0.05); }
    .delivery-option input, .payment-option input { display: none; }
    .option-icon { font-size: 1.5rem; }
    .option-info { flex: 1; }
    .option-name { display: block; font-weight: 600; }
    .option-desc { font-size: 0.875rem; color: var(--text-secondary); }
    .option-price { font-weight: 600; color: var(--primary-color); }
    .step-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem; }
    .review-section { margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); }
    .review-section h4 { font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem; }
    .order-summary { background: var(--surface-card, white); border-radius: 12px; padding: 1.5rem; height: fit-content; position: sticky; top: 180px; }
    .order-summary h3 { font-size: 1.125rem; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); }
    .summary-items { margin-bottom: 1rem; max-height: 200px; overflow-y: auto; }
    .summary-item { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.875rem; }
    .item-qty { color: var(--text-secondary); min-width: 30px; }
    .item-name { flex: 1; }
    .item-price { font-weight: 500; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
    .summary-row.total { font-size: 1.25rem; font-weight: 700; padding-top: 1rem; margin-top: 1rem; border-top: 1px solid var(--border-color); }
    .btn { padding: 0.75rem 1.5rem; border-radius: 8px; border: none; cursor: pointer; font-weight: 500; }
    .btn-primary { background: var(--primary-color); color: white; }
    .btn-secondary { background: var(--surface-ground); color: var(--text-color); }
    .btn-lg { padding: 1rem 2rem; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    @media (max-width: 1024px) { .checkout-content { grid-template-columns: 1fr; } .order-summary { position: static; } }
  `]
})
export class CheckoutComponent implements OnInit {
  private cartService = inject(CartService);
  private router = inject(Router);

  currentStep = signal(1);
  isSubmitting = signal(false);

  address: DeliveryAddress = { label: 'Default', street: '', city: '', postalCode: '', canton: '', country: 'Bosnia and Herzegovina', isDefault: true };
  deliveryOptions = DELIVERY_OPTIONS;
  selectedDelivery: DeliveryOption | null = null;
  paymentMethod: PaymentMethod = PaymentMethod.Invoice;
  purchaseOrderNumber = '';
  notes = '';

  cartItems = computed(() => this.cartService.cart().items);
  subtotal = computed(() => this.cartService.cart().subtotal);
  tax = computed(() => this.cartService.cart().tax);
  grandTotal = computed(() => this.cartService.cart().total + (this.selectedDelivery?.price ?? 0));

  ngOnInit() {
    if (this.cartService.isEmpty()) {
      this.router.navigate(['/portal/cart']);
    }
  }

  isAddressValid(): boolean {
    return !!(this.address.street && this.address.city && this.address.postalCode);
  }

  selectDelivery(option: DeliveryOption) { this.selectedDelivery = option; }
  nextStep() { this.currentStep.update(s => Math.min(4, s + 1)); }
  prevStep() { this.currentStep.update(s => Math.max(1, s - 1)); }
  goToStep(step: number) { this.currentStep.set(step); }

  placeOrder() {
    this.isSubmitting.set(true);
    // Simulate API call
    setTimeout(() => {
      const orderId = 'ORD-' + Date.now();
      this.cartService.clearCart();
      this.router.navigate(['/portal/order-confirmation', orderId]);
    }, 1500);
  }
}
