import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { KmCurrencyPipe } from '../../../../core/pipes/km-currency.pipe';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, KmCurrencyPipe],
  template: `
    <div class="confirmation-page">
      <div class="confirmation-card">
        <div class="success-icon">✓</div>
        <h1>{{ 'portal.orderConfirmation.title' | translate }}</h1>
        <p class="subtitle">{{ 'portal.orderConfirmation.subtitle' | translate }}</p>

        <div class="order-info">
          <div class="info-row">
            <span class="label">{{ 'portal.orderConfirmation.orderNumber' | translate }}</span>
            <span class="value">{{ orderId() }}</span>
          </div>
          <div class="info-row">
            <span class="label">{{ 'portal.orderConfirmation.date' | translate }}</span>
            <span class="value">{{ orderDate | date:'medium' }}</span>
          </div>
          <div class="info-row">
            <span class="label">{{ 'portal.orderConfirmation.estimatedDelivery' | translate }}</span>
            <span class="value">{{ estimatedDelivery | date:'mediumDate' }}</span>
          </div>
        </div>

        @if (orderData()?.splitInvoice) {
          <div class="split-invoice-info">
            <h3>{{ 'portal.orderConfirmation.invoiceDetails' | translate }}</h3>
            <p class="split-note">{{ 'portal.orderConfirmation.splitInvoiceNote' | translate }}</p>
            <div class="invoice-breakdown">
              <div class="invoice-card commercial">
                <span class="invoice-badge">{{ 'portal.checkout.commercialList' | translate }}</span>
                <div class="invoice-details">
                  <span class="invoice-items">{{ orderData()?.commercialItemCount }} {{ 'portal.checkout.items' | translate }}</span>
                  <span class="invoice-total">{{ orderData()?.commercialTotal | kmCurrency }}</span>
                </div>
              </div>
              <div class="invoice-card essential">
                <span class="invoice-badge">{{ 'portal.checkout.essentialList' | translate }}</span>
                <div class="invoice-details">
                  <span class="invoice-items">{{ orderData()?.essentialItemCount }} {{ 'portal.checkout.items' | translate }}</span>
                  <span class="invoice-total">{{ orderData()?.essentialTotal | kmCurrency }}</span>
                </div>
              </div>
            </div>
          </div>
        }

        <div class="next-steps">
          <h3>{{ 'portal.orderConfirmation.nextSteps' | translate }}</h3>
          <ul>
            <li>
              <span class="step-icon">📧</span>
              <span>{{ 'portal.orderConfirmation.emailConfirmation' | translate }}</span>
            </li>
            <li>
              <span class="step-icon">📄</span>
              <span>{{ orderData()?.splitInvoice ? ('portal.orderConfirmation.invoicesSent' | translate) : ('portal.orderConfirmation.invoiceSent' | translate) }}</span>
            </li>
            <li>
              <span class="step-icon">📦</span>
              <span>{{ 'portal.orderConfirmation.trackingInfo' | translate }}</span>
            </li>
          </ul>
        </div>

        <div class="actions">
          <a routerLink="/portal/orders" class="btn btn-secondary">
            {{ 'portal.orderConfirmation.viewOrders' | translate }}
          </a>
          <a routerLink="/portal/catalog" class="btn btn-primary">
            {{ 'portal.orderConfirmation.continueShopping' | translate }}
          </a>
        </div>
      </div>

      <div class="help-section">
        <h4>{{ 'portal.orderConfirmation.needHelp' | translate }}</h4>
        <p>{{ 'portal.orderConfirmation.contactUs' | translate }}</p>
        <div class="contact-options">
          <a href="tel:+38733123456" class="contact-link">
            <span>📞</span> +387 33 123 456
          </a>
          <a href="mailto:orders&#64;pharmaassist.ba" class="contact-link">
            <span>✉️</span> orders&#64;pharmaassist.ba
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirmation-page {
      max-width: 600px;
      margin: 0 auto;
      text-align: center;
    }

    .confirmation-card {
      background: var(--surface-card, white);
      border-radius: 16px;
      padding: 3rem 2rem;
      margin-bottom: 2rem;
    }

    .success-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      color: white;
      margin: 0 auto 1.5rem;
      animation: scaleIn 0.5s ease-out;
    }

    @keyframes scaleIn {
      from { transform: scale(0); }
      to { transform: scale(1); }
    }

    h1 {
      font-size: 1.75rem;
      margin-bottom: 0.5rem;
      color: var(--color-success-dark);
    }

    .subtitle {
      color: var(--text-secondary);
      margin-bottom: 2rem;
    }

    .order-info {
      background: var(--surface-ground);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
    }

    .info-row:not(:last-child) {
      border-bottom: 1px solid var(--border-color);
    }

    .info-row .label {
      color: var(--text-secondary);
    }

    .info-row .value {
      font-weight: 600;
    }

    .next-steps {
      text-align: left;
      margin-bottom: 2rem;
    }

    .next-steps h3 {
      font-size: 1rem;
      margin-bottom: 1rem;
    }

    .next-steps ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .next-steps li {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border-color);
    }

    .next-steps li:last-child {
      border-bottom: none;
    }

    .step-icon {
      font-size: 1.25rem;
    }

    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    .btn {
      padding: 0.875rem 1.5rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
    }

    .btn-primary {
      background: var(--primary-color);
      color: white;
    }

    .btn-secondary {
      background: var(--surface-ground);
      color: var(--text-color);
    }

    .help-section {
      background: var(--surface-card, white);
      border-radius: 12px;
      padding: 1.5rem;
    }

    .help-section h4 {
      margin-bottom: 0.5rem;
    }

    .help-section p {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    .contact-options {
      display: flex;
      gap: 2rem;
      justify-content: center;
    }

    .contact-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--primary-color);
      text-decoration: none;
    }

    @media (max-width: 480px) {
      .confirmation-card {
        padding: 2rem 1.5rem;
      }

      .actions {
        flex-direction: column;
      }

      .contact-options {
        flex-direction: column;
        gap: 1rem;
      }
    }

    /* Split Invoice Styles */
    .split-invoice-info {
      background: var(--surface-ground);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      text-align: left;
    }

    .split-invoice-info h3 {
      font-size: 1rem;
      margin-bottom: 0.5rem;
    }

    .split-note {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 1rem;
    }

    .invoice-breakdown {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .invoice-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-radius: 8px;
      background: white;
    }

    .invoice-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .invoice-card.commercial .invoice-badge {
      background: var(--status-processing-bg);
      color: var(--brand-primary-darker);
    }

    .invoice-card.essential .invoice-badge {
      background: var(--color-success-bg);
      color: #15803d;
    }

    .invoice-details {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .invoice-items {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .invoice-total {
      font-weight: 700;
      font-size: 1.125rem;
    }
  `]
})
export class OrderConfirmationComponent implements OnInit {
  private route = inject(ActivatedRoute);

  orderId = signal('');
  orderDate = new Date();
  estimatedDelivery = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
  orderData = signal<{
    splitInvoice: boolean;
    commercialTotal: number;
    essentialTotal: number;
    commercialItemCount: number;
    essentialItemCount: number;
    total: number;
  } | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.orderId.set(id || 'Unknown');

    // Load order data from sessionStorage
    const storedData = sessionStorage.getItem('lastOrderData');
    if (storedData) {
      try {
        this.orderData.set(JSON.parse(storedData));
        sessionStorage.removeItem('lastOrderData');
      } catch (e) {
        console.error('Failed to parse order data', e);
      }
    }
  }
}
