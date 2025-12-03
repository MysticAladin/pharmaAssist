import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CustomerService, Customer, CustomerNote, AddNoteRequest } from '../../core/services/customer.service';
import { OrderService } from '../../core/services/order.service';
import { OrderSummary, OrderStatus } from '../../core/models/order.model';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PaginationComponent, PageEvent } from '../../shared/components/pagination/pagination.component';
import { BadgeVariant } from '../../shared/components/status-badge';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslateModule,
    StatusBadgeComponent,
    EmptyStateComponent,
    PaginationComponent
  ],
  template: `
    <div class="customer-detail-page">
      @if (loading()) {
        <div class="loading-container">
          <div class="spinner"></div>
          <span>{{ 'common.loading' | translate }}</span>
        </div>
      } @else if (!customer()) {
        <app-empty-state
          icon="user-x"
          [title]="'customers.notFound' | translate"
          [description]="'customers.notFoundDescription' | translate"
          [actionLabel]="'common.goBack' | translate"
          (action)="goBack()">
        </app-empty-state>
      } @else {
        <!-- Header -->
        <header class="page-header">
          <div class="header-content">
            <div class="header-left">
              <button class="btn btn-icon" (click)="goBack()">
                <i class="icon-arrow-left"></i>
              </button>
              <div class="customer-header-info">
                <h1>{{ customer()!.name }}</h1>
                <div class="customer-meta">
                  <span class="customer-code">{{ customer()!.customerCode }}</span>
                  <app-status-badge
                    [variant]="customer()!.isActive ? 'success' : 'danger'"
                    [label]="(customer()!.isActive ? 'common.active' : 'common.inactive') | translate">
                  </app-status-badge>
                </div>
              </div>
            </div>
            <div class="header-actions">
              <button class="btn btn-secondary" [routerLink]="['/customers', customer()!.id, 'edit']">
                <i class="icon-edit"></i>
                {{ 'common.edit' | translate }}
              </button>
              <button class="btn btn-primary" [routerLink]="['/orders/new']" [queryParams]="{customerId: customer()!.id}">
                <i class="icon-shopping-cart"></i>
                {{ 'customers.createOrder' | translate }}
              </button>
            </div>
          </div>
        </header>

        <!-- Content Grid -->
        <div class="content-grid">
          <!-- Customer Info Card -->
          <section class="card info-card">
            <div class="card-header">
              <h2>{{ 'customers.details.info' | translate }}</h2>
            </div>
            <div class="card-body">
              <dl class="info-list">
                <div class="info-item">
                  <dt><i class="icon-building"></i>{{ 'customers.name' | translate }}</dt>
                  <dd>{{ customer()!.name }}</dd>
                </div>
                <div class="info-item">
                  <dt><i class="icon-hash"></i>{{ 'customers.code' | translate }}</dt>
                  <dd>{{ customer()!.customerCode }}</dd>
                </div>
                <div class="info-item">
                  <dt><i class="icon-mail"></i>{{ 'customers.email' | translate }}</dt>
                  <dd>
                    @if (customer()!.email) {
                      <a [href]="'mailto:' + customer()!.email">{{ customer()!.email }}</a>
                    } @else {
                      <span class="text-muted">-</span>
                    }
                  </dd>
                </div>
                <div class="info-item">
                  <dt><i class="icon-phone"></i>{{ 'customers.phone' | translate }}</dt>
                  <dd>{{ customer()!.phone || '-' }}</dd>
                </div>
                <div class="info-item">
                  <dt><i class="icon-map-pin"></i>{{ 'customers.address' | translate }}</dt>
                  <dd>{{ getFullAddress() || '-' }}</dd>
                </div>
                <div class="info-item">
                  <dt><i class="icon-file-text"></i>{{ 'customers.taxId' | translate }}</dt>
                  <dd>{{ customer()!.taxId || '-' }}</dd>
                </div>
                <div class="info-item">
                  <dt><i class="icon-tag"></i>{{ 'customers.type' | translate }}</dt>
                  <dd>
                    <span class="badge badge-{{ getTypeClass(customer()!.customerTypeName) }}">
                      {{ customer()!.customerTypeName }}
                    </span>
                  </dd>
                </div>
                <div class="info-item">
                  <dt><i class="icon-calendar"></i>{{ 'customers.createdAt' | translate }}</dt>
                  <dd>{{ customer()!.createdAt | date:'mediumDate' }}</dd>
                </div>
              </dl>
            </div>
          </section>

          <!-- Credit & Payment Info -->
          <section class="card credit-card">
            <div class="card-header">
              <h2>{{ 'customers.details.credit' | translate }}</h2>
            </div>
            <div class="card-body">
              <div class="credit-stats">
                <div class="stat-item">
                  <span class="stat-label">{{ 'customers.creditLimit' | translate }}</span>
                  <span class="stat-value">{{ customer()!.creditLimit | currency:'BAM ':'symbol':'1.2-2' }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">{{ 'customers.currentBalance' | translate }}</span>
                  <span class="stat-value" [class.text-danger]="customer()!.currentBalance > 0">
                    {{ customer()!.currentBalance | currency:'BAM ':'symbol':'1.2-2' }}
                  </span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">{{ 'customers.availableCredit' | translate }}</span>
                  <span class="stat-value text-success">
                    {{ availableCredit() | currency:'BAM ':'symbol':'1.2-2' }}
                  </span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">{{ 'customers.paymentTerms' | translate }}</span>
                  <span class="stat-value">{{ customer()!.paymentTermDays }} {{ 'common.days' | translate }}</span>
                </div>
              </div>

              <div class="credit-bar">
                <div class="credit-bar-label">
                  <span>{{ 'customers.creditUtilization' | translate }}</span>
                  <span>{{ creditUtilization() | number:'1.0-1' }}%</span>
                </div>
                <div class="credit-bar-track">
                  <div
                    class="credit-bar-fill"
                    [style.width.%]="creditUtilization()"
                    [class.warning]="creditUtilization() >= 75 && creditUtilization() < 90"
                    [class.danger]="creditUtilization() >= 90">
                  </div>
                </div>
              </div>

              <div class="payment-methods">
                <h4>{{ 'customers.preferredPayment' | translate }}</h4>
                <div class="payment-badges">
                  @if (customer()!.acceptsInvoice) {
                    <span class="payment-badge">
                      <i class="icon-file-text"></i>
                      {{ 'payments.methods.invoice' | translate }}
                    </span>
                  }
                  @if (customer()!.acceptsBankTransfer) {
                    <span class="payment-badge">
                      <i class="icon-building"></i>
                      {{ 'payments.methods.bankTransfer' | translate }}
                    </span>
                  }
                </div>
              </div>
            </div>
          </section>

          <!-- Order History -->
          <section class="card orders-card">
            <div class="card-header">
              <h2>{{ 'customers.details.orderHistory' | translate }}</h2>
              <button class="btn btn-text" [routerLink]="['/orders']" [queryParams]="{customerId: customer()!.id}">
                {{ 'common.viewAll' | translate }}
                <i class="icon-arrow-right"></i>
              </button>
            </div>
            <div class="card-body">
              @if (loadingOrders()) {
                <div class="loading-container small">
                  <div class="spinner"></div>
                </div>
              } @else if (orders().length === 0) {
                <div class="empty-orders">
                  <i class="icon-shopping-bag"></i>
                  <p>{{ 'customers.noOrders' | translate }}</p>
                </div>
              } @else {
                <div class="orders-table">
                  <table>
                    <thead>
                      <tr>
                        <th>{{ 'orders.orderNumber' | translate }}</th>
                        <th>{{ 'orders.date' | translate }}</th>
                        <th>{{ 'orders.total' | translate }}</th>
                        <th>{{ 'common.status' | translate }}</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (order of orders(); track order.id) {
                        <tr>
                          <td class="order-number">{{ order.orderNumber }}</td>
                          <td>{{ order.orderDate | date:'shortDate' }}</td>
                          <td class="order-total">{{ order.totalAmount | currency:'BAM ':'symbol':'1.2-2' }}</td>
                          <td>
                            <app-status-badge
                              [variant]="getOrderStatusVariant(order.status.toString())"
                              [label]="'orders.statuses.' + getStatusName(order.status) | translate">
                            </app-status-badge>
                          </td>
                          <td>
                            <button class="btn btn-icon btn-sm" [routerLink]="['/orders', order.id]">
                              <i class="icon-eye"></i>
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                @if (ordersTotalItems() > 5) {
                  <app-pagination
                    [page]="ordersPage()"
                    [size]="5"
                    [totalItems]="ordersTotalItems()"
                    (pageChange)="onOrdersPageChange($event)">
                  </app-pagination>
                }
              }
            </div>
          </section>

          <!-- Notes Section -->
          <section class="card notes-card">
            <div class="card-header">
              <h2>{{ 'customers.details.notes' | translate }}</h2>
              <button class="btn btn-sm btn-primary" (click)="showNoteForm.set(true)" *ngIf="!showNoteForm()">
                <i class="icon-plus"></i>
                {{ 'customers.addNote' | translate }}
              </button>
            </div>
            <div class="card-body">
              @if (showNoteForm()) {
                <div class="note-form">
                  <textarea
                    [(ngModel)]="newNoteContent"
                    [placeholder]="'customers.notePlaceholder' | translate"
                    class="form-control"
                    rows="3">
                  </textarea>
                  <div class="note-form-actions">
                    <button class="btn btn-secondary btn-sm" (click)="cancelNote()">
                      {{ 'common.cancel' | translate }}
                    </button>
                    <button
                      class="btn btn-primary btn-sm"
                      (click)="saveNote()"
                      [disabled]="!newNoteContent.trim() || savingNote()">
                      @if (savingNote()) {
                        <span class="spinner-sm"></span>
                      }
                      {{ 'common.save' | translate }}
                    </button>
                  </div>
                </div>
              }

              @if (loadingNotes()) {
                <div class="loading-container small">
                  <div class="spinner"></div>
                </div>
              } @else if (notes().length === 0) {
                <div class="empty-notes">
                  <i class="icon-message-square"></i>
                  <p>{{ 'customers.noNotes' | translate }}</p>
                </div>
              } @else {
                <div class="notes-list">
                  @for (note of notes(); track note.id) {
                    <div class="note-item">
                      <div class="note-header">
                        <span class="note-author">{{ note.createdByName }}</span>
                        <span class="note-date">{{ note.createdAt | date:'medium' }}</span>
                        <button
                          class="btn btn-icon btn-sm danger"
                          (click)="deleteNote(note)"
                          [title]="'common.delete' | translate">
                          <i class="icon-trash-2"></i>
                        </button>
                      </div>
                      <p class="note-content">{{ note.content }}</p>
                    </div>
                  }
                </div>
              }
            </div>
          </section>

          <!-- Activity Summary -->
          <section class="card activity-card">
            <div class="card-header">
              <h2>{{ 'customers.details.activitySummary' | translate }}</h2>
            </div>
            <div class="card-body">
              <div class="activity-stats">
                <div class="activity-item">
                  <div class="activity-icon orders">
                    <i class="icon-shopping-cart"></i>
                  </div>
                  <div class="activity-info">
                    <span class="activity-value">{{ orderStats().totalOrders }}</span>
                    <span class="activity-label">{{ 'customers.totalOrders' | translate }}</span>
                  </div>
                </div>
                <div class="activity-item">
                  <div class="activity-icon revenue">
                    <i class="icon-dollar-sign"></i>
                  </div>
                  <div class="activity-info">
                    <span class="activity-value">{{ orderStats().totalRevenue | currency:'BAM ':'symbol':'1.0-0' }}</span>
                    <span class="activity-label">{{ 'customers.totalRevenue' | translate }}</span>
                  </div>
                </div>
                <div class="activity-item">
                  <div class="activity-icon average">
                    <i class="icon-trending-up"></i>
                  </div>
                  <div class="activity-info">
                    <span class="activity-value">{{ orderStats().averageOrderValue | currency:'BAM ':'symbol':'1.0-0' }}</span>
                    <span class="activity-label">{{ 'customers.avgOrderValue' | translate }}</span>
                  </div>
                </div>
                <div class="activity-item">
                  <div class="activity-icon last-order">
                    <i class="icon-clock"></i>
                  </div>
                  <div class="activity-info">
                    @if (orderStats().lastOrderDate) {
                      <span class="activity-value">{{ orderStats().lastOrderDate | date:'shortDate' }}</span>
                    } @else {
                      <span class="activity-value">-</span>
                    }
                    <span class="activity-label">{{ 'customers.lastOrder' | translate }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .customer-detail-page {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 1rem;

      &.small {
        padding: 2rem;
      }
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border-color);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .page-header {
      margin-bottom: 1.5rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .customer-header-info {
      h1 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
      }
    }

    .customer-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.25rem;
    }

    .customer-code {
      color: var(--text-muted);
      font-size: 0.875rem;
      font-family: monospace;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .content-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
    }

    .card {
      background: var(--card-bg);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
      overflow: hidden;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-color);

      h2 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
      }
    }

    .card-body {
      padding: 1.5rem;
    }

    .info-list {
      display: grid;
      gap: 1rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      dt {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;

        i {
          font-size: 0.875rem;
        }
      }

      dd {
        margin: 0;
        font-size: 0.9375rem;
        color: var(--text-primary);

        a {
          color: var(--primary);
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }

    .badge {
      display: inline-flex;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius);
      font-size: 0.75rem;
      font-weight: 500;

      &.badge-pharmacy {
        background: rgba(var(--primary-rgb), 0.1);
        color: var(--primary);
      }

      &.badge-hospital {
        background: rgba(var(--info-rgb), 0.1);
        color: var(--info);
      }

      &.badge-clinic {
        background: rgba(var(--warning-rgb), 0.1);
        color: var(--warning);
      }

      &.badge-distributor {
        background: rgba(var(--success-rgb), 0.1);
        color: var(--success);
      }
    }

    /* Credit Card */
    .credit-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      .stat-label {
        font-size: 0.75rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .stat-value {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-primary);

        &.text-success { color: var(--success); }
        &.text-danger { color: var(--danger); }
      }
    }

    .credit-bar {
      margin-bottom: 1.5rem;
    }

    .credit-bar-label {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }

    .credit-bar-track {
      height: 8px;
      background: var(--bg-secondary);
      border-radius: 4px;
      overflow: hidden;
    }

    .credit-bar-fill {
      height: 100%;
      background: var(--success);
      border-radius: 4px;
      transition: width 0.3s ease;

      &.warning { background: var(--warning); }
      &.danger { background: var(--danger); }
    }

    .payment-methods {
      h4 {
        font-size: 0.75rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 0 0 0.75rem;
      }
    }

    .payment-badges {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .payment-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      background: var(--bg-secondary);
      border-radius: var(--radius);
      font-size: 0.8125rem;
      color: var(--text-primary);

      i { font-size: 0.875rem; }
    }

    /* Orders Card */
    .orders-card, .notes-card {
      grid-column: span 2;

      @media (max-width: 1024px) {
        grid-column: span 1;
      }
    }

    .orders-table {
      overflow-x: auto;

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th, td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid var(--border-color);
      }

      th {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .order-number {
        font-family: monospace;
        color: var(--primary);
      }

      .order-total {
        font-weight: 600;
      }
    }

    .empty-orders, .empty-notes {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      color: var(--text-muted);

      i {
        font-size: 2rem;
        margin-bottom: 0.5rem;
        opacity: 0.5;
      }

      p {
        margin: 0;
      }
    }

    /* Notes */
    .note-form {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);

      textarea {
        width: 100%;
        resize: vertical;
        min-height: 80px;
      }
    }

    .note-form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }

    .notes-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .note-item {
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: var(--radius);
    }

    .note-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .note-author {
      font-weight: 500;
      color: var(--text-primary);
    }

    .note-date {
      font-size: 0.75rem;
      color: var(--text-muted);
      flex: 1;
    }

    .note-content {
      margin: 0;
      color: var(--text-secondary);
      white-space: pre-wrap;
    }

    /* Activity Card */
    .activity-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .activity-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;

      &.orders {
        background: rgba(var(--primary-rgb), 0.1);
        color: var(--primary);
      }

      &.revenue {
        background: rgba(var(--success-rgb), 0.1);
        color: var(--success);
      }

      &.average {
        background: rgba(var(--info-rgb), 0.1);
        color: var(--info);
      }

      &.last-order {
        background: rgba(var(--warning-rgb), 0.1);
        color: var(--warning);
      }
    }

    .activity-info {
      display: flex;
      flex-direction: column;
    }

    .activity-value {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .activity-label {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* Buttons */
    .btn {
      padding: 0.625rem 1rem;
      border-radius: var(--radius);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      border: none;

      &.btn-primary {
        background: var(--primary);
        color: white;

        &:hover { background: var(--primary-dark); }
      }

      &.btn-secondary {
        background: var(--bg-secondary);
        color: var(--text-primary);
        border: 1px solid var(--border-color);

        &:hover { background: var(--hover-bg); }
      }

      &.btn-text {
        background: none;
        color: var(--primary);
        padding: 0.5rem;

        &:hover { background: var(--hover-bg); }
      }

      &.btn-icon {
        padding: 0.5rem;
        background: none;
        color: var(--text-muted);

        &:hover {
          background: var(--hover-bg);
          color: var(--text-primary);
        }

        &.danger:hover { color: var(--danger); }
      }

      &.btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.8125rem;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .form-control {
      padding: 0.75rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      font-size: 0.875rem;
      background: var(--input-bg);
      color: var(--text-primary);

      &:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px var(--primary-light);
      }
    }

    .spinner-sm {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .text-muted {
      color: var(--text-muted);
    }

    @media (max-width: 640px) {
      .customer-detail-page {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        align-items: flex-start;
      }

      .credit-stats, .activity-stats {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CustomerDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly customerService = inject(CustomerService);
  private readonly orderService = inject(OrderService);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translateService = inject(TranslateService);

  // Customer data
  customer = signal<Customer | null>(null);
  loading = signal(true);

  // Orders data
  orders = signal<OrderSummary[]>([]);
  loadingOrders = signal(false);
  ordersPage = signal(1);
  ordersTotalItems = signal(0);

  // Notes data
  notes = signal<CustomerNote[]>([]);
  loadingNotes = signal(false);
  showNoteForm = signal(false);
  newNoteContent = '';
  savingNote = signal(false);

  // Order statistics
  orderStats = signal<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    lastOrderDate: Date | null;
  }>({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    lastOrderDate: null
  });

  // Computed values
  availableCredit = computed(() => {
    const c = this.customer();
    if (!c) return 0;
    return Math.max(0, c.creditLimit - c.currentBalance);
  });

  creditUtilization = computed(() => {
    const c = this.customer();
    if (!c || c.creditLimit === 0) return 0;
    return Math.min(100, (c.currentBalance / c.creditLimit) * 100);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCustomer(id);
    } else {
      this.loading.set(false);
    }
  }

  private loadCustomer(id: string): void {
    this.loading.set(true);
    this.customerService.getCustomer(id).subscribe({
      next: (response) => {
        this.customer.set(response.data ?? null);
        this.loading.set(false);
        this.loadOrders(id);
        this.loadNotes(id);
        this.loadOrderStats(id);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.error(
          this.translateService.instant('customers.loadError')
        );
      }
    });
  }

  private loadOrders(customerId: string): void {
    this.loadingOrders.set(true);
    this.orderService.getOrders(
      this.ordersPage(),
      5,
      { customerId }
    ).subscribe({
      next: (response) => {
        this.orders.set(response.items || []);
        this.ordersTotalItems.set(response.totalCount || 0);
        this.loadingOrders.set(false);
      },
      error: () => {
        this.loadingOrders.set(false);
      }
    });
  }

  private loadNotes(customerId: string): void {
    this.loadingNotes.set(true);
    this.customerService.getCustomerNotes(customerId).subscribe({
      next: (response) => {
        this.notes.set(response.data || []);
        this.loadingNotes.set(false);
      },
      error: () => {
        this.loadingNotes.set(false);
      }
    });
  }

  private loadOrderStats(customerId: string): void {
    this.customerService.getCustomerStats(customerId).subscribe({
      next: (response) => {
        if (response.data) {
          this.orderStats.set(response.data);
        }
      },
      error: () => {
        // Stats are optional, ignore errors
      }
    });
  }

  getFullAddress(): string {
    const c = this.customer();
    if (!c || !c.addresses || c.addresses.length === 0) return '';

    // Get primary address or first address
    const address = c.addresses.find(a => a.isPrimary) || c.addresses[0];
    const parts = [
      address.street,
      address.buildingNumber,
      address.postalCode,
      address.cityName
    ].filter(Boolean);
    return parts.join(', ');
  }

  getTypeClass(type: string): string {
    return type.toLowerCase();
  }

  getStatusName(status: OrderStatus): string {
    const names: Record<OrderStatus, string> = {
      [OrderStatus.Pending]: 'pending',
      [OrderStatus.Confirmed]: 'confirmed',
      [OrderStatus.Processing]: 'processing',
      [OrderStatus.ReadyForShipment]: 'readyForShipment',
      [OrderStatus.Shipped]: 'shipped',
      [OrderStatus.Delivered]: 'delivered',
      [OrderStatus.Cancelled]: 'cancelled',
      [OrderStatus.Returned]: 'returned'
    };
    return names[status] || 'pending';
  }

  getOrderStatusVariant(status: string): BadgeVariant {
    const variants: Record<string, BadgeVariant> = {
      '1': 'warning',   // Pending
      '2': 'info',      // Confirmed
      '3': 'info',      // Processing
      '4': 'primary',   // ReadyForShipment
      '5': 'primary',   // Shipped
      '6': 'success',   // Delivered
      '7': 'danger',    // Cancelled
      '8': 'warning'    // Returned
    };
    return variants[status] || 'secondary';
  }

  onOrdersPageChange(event: PageEvent): void {
    this.ordersPage.set(event.page);
    const customerId = this.customer()?.id;
    if (customerId) {
      this.loadOrders(customerId.toString());
    }
  }

  cancelNote(): void {
    this.showNoteForm.set(false);
    this.newNoteContent = '';
  }

  saveNote(): void {
    const customerId = this.customer()?.id;
    if (!customerId || !this.newNoteContent.trim()) return;

    this.savingNote.set(true);

    const request: AddNoteRequest = {
      content: this.newNoteContent.trim()
    };

    const customerIdStr = customerId.toString();
    this.customerService.addCustomerNote(customerIdStr, request).subscribe({
      next: () => {
        this.notificationService.success(
          this.translateService.instant('customers.noteAdded')
        );
        this.savingNote.set(false);
        this.showNoteForm.set(false);
        this.newNoteContent = '';
        this.loadNotes(customerIdStr);
      },
      error: () => {
        this.savingNote.set(false);
        this.notificationService.error(
          this.translateService.instant('customers.noteAddError')
        );
      }
    });
  }

  deleteNote(note: CustomerNote): void {
    const customerId = this.customer()?.id;
    if (!customerId) return;

    const customerIdStr = customerId.toString();
    this.confirmationService.confirm({
      title: this.translateService.instant('customers.deleteNoteTitle'),
      message: this.translateService.instant('customers.deleteNoteMessage'),
      variant: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.customerService.deleteCustomerNote(customerIdStr, note.id).subscribe({
          next: () => {
            this.notificationService.success(
              this.translateService.instant('customers.noteDeleted')
            );
            this.loadNotes(customerIdStr);
          },
          error: () => {
            this.notificationService.error(
              this.translateService.instant('customers.noteDeleteError')
            );
          }
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/customers']);
  }
}
