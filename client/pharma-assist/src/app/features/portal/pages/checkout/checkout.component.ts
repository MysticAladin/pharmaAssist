import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CartService } from '../../services/cart.service';
import { DeliveryAddress, DeliveryOption, PaymentMethod, DELIVERY_OPTIONS } from '../../models/portal.model';
import { DbFeatureFlagService } from '../../../../core/services/db-feature-flag.service';
import { SYSTEM_FLAGS } from '../../../../core/models/feature-flag.model';
import { KmCurrencyPipe } from '../../../../core/pipes/km-currency.pipe';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule, KmCurrencyPipe],
  templateUrl: './checkout-component/checkout.component.html',
  styleUrl: './checkout-component/checkout.component.scss'
})
export class CheckoutComponent implements OnInit {
  private cartService = inject(CartService);
  private router = inject(Router);
  private featureFlagService = inject(DbFeatureFlagService);

  currentStep = signal(1);
  isSubmitting = signal(false);

  address: DeliveryAddress = { label: 'Default', street: '', city: '', postalCode: '', canton: '', country: 'Bosnia and Herzegovina', isDefault: true };
  deliveryOptions = DELIVERY_OPTIONS;
  selectedDelivery: DeliveryOption | null = null;
  paymentMethod: PaymentMethod = PaymentMethod.Invoice;
  purchaseOrderNumber = '';
  notes = '';
  splitInvoice = false;

  cartItems = computed(() => this.cartService.cart().items);
  subtotal = computed(() => this.cartService.cart().subtotal);
  tax = computed(() => this.cartService.cart().tax);
  grandTotal = computed(() => this.cartService.cart().total + (this.selectedDelivery?.price ?? 0));

  splitInvoiceEnabled = this.featureFlagService.createFlagSignal(SYSTEM_FLAGS.PORTAL_SPLIT_INVOICE);

  hasMixedPriceTypes = computed(() => this.cartService.hasMixedPriceTypes());
  commercialItems = computed(() => this.cartService.commercialItems());
  essentialItems = computed(() => this.cartService.essentialItems());
  commercialItemCount = computed(() => this.commercialItems().length);
  essentialItemCount = computed(() => this.essentialItems().length);
  commercialTotal = computed(() => this.cartService.cart().commercialTotal);
  essentialTotal = computed(() => this.cartService.cart().essentialTotal);

  ngOnInit() {
    if (this.cartService.isEmpty()) {
      this.router.navigate(['/portal/cart']);
    }
  }

  isAddressValid(): boolean {
    return !!(this.address.street && this.address.city && this.address.postalCode);
  }

  selectDelivery(option: DeliveryOption) {
    this.selectedDelivery = option;
  }

  nextStep() {
    this.currentStep.update(s => Math.min(4, s + 1));
  }

  prevStep() {
    this.currentStep.update(s => Math.max(1, s - 1));
  }

  goToStep(step: number) {
    this.currentStep.set(step);
  }

  placeOrder() {
    this.isSubmitting.set(true);
    setTimeout(() => {
      const orderId = 'ORD-' + Date.now();
      const orderData = {
        splitInvoice: this.splitInvoice && this.hasMixedPriceTypes() && this.splitInvoiceEnabled(),
        commercialTotal: this.commercialTotal(),
        essentialTotal: this.essentialTotal(),
        commercialItemCount: this.commercialItemCount(),
        essentialItemCount: this.essentialItemCount(),
        total: this.grandTotal()
      };
      sessionStorage.setItem('lastOrderData', JSON.stringify(orderData));
      this.cartService.clearCart();
      this.router.navigate(['/portal/order-confirmation', orderId]);
    }, 1500);
  }
}
