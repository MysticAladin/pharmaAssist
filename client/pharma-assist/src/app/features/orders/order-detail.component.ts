import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { OrderService } from '../../core/services/order.service';
import { PrintService, OrderPrintData } from '../../core/services/print.service';
import {
  Order,
  OrderItem,
  Prescription,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  getOrderStatusLabel,
  getOrderStatusColor,
  getPaymentStatusLabel,
  getPaymentStatusColor,
  getPaymentMethodLabel
} from '../../core/models/order.model';

import { StatusBadgeComponent } from '../../shared/components/status-badge';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    StatusBadgeComponent,
    ConfirmDialogComponent
  ],
  template: `
    <div class="order-detail-page">
      <!-- Back Button -->
      <div class="back-nav">
        <button class="btn-back" routerLink="/orders">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          {{ 'orders.title' | translate }}
        </button>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <div class="loading-skeleton">
            <div class="skeleton-header">
              <div class="skeleton skeleton-title"></div>
              <div class="skeleton skeleton-badges"></div>
            </div>
            <div class="skeleton-content">
              <div class="skeleton skeleton-card"></div>
              <div class="skeleton skeleton-sidebar"></div>
            </div>
          </div>
        </div>
      } @else if (!order()) {
        <div class="not-found">
          <h2>{{ 'orders.notFound.title' | translate }}</h2>
          <p>{{ 'orders.notFound.description' | translate }}</p>
          <button class="btn btn-primary" routerLink="/orders">
            {{ 'orders.backToOrders' | translate }}
          </button>
        </div>
      } @else {
        <!-- Header -->
        <div class="page-header">
          <div class="header-left">
            <h1 class="order-number">{{ order()!.orderNumber }}</h1>
            <div class="order-badges">
              <app-status-badge
                [label]="getOrderStatusLabel(order()!.status)"
                [variant]="getOrderStatusBadgeVariant(order()!.status)"
                [shouldTranslate]="true"
                [dot]="true"
              ></app-status-badge>
              <app-status-badge
                [label]="getPaymentStatusLabel(order()!.paymentStatus)"
                [variant]="getPaymentStatusBadgeVariant(order()!.paymentStatus)"
                [shouldTranslate]="true"
              ></app-status-badge>
            </div>
          </div>
          <div class="header-actions">
            @if (canEditOrder()) {
              <button class="btn btn-secondary" (click)="editOrder()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                {{ 'common.edit' | translate }}
              </button>
            }
            @if (canCancelOrder()) {
              <button class="btn btn-danger-outline" (click)="showCancelConfirm.set(true)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {{ 'orders.cancel' | translate }}
              </button>
            }
            <button class="btn btn-secondary" (click)="printOrder()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              {{ 'common.print' | translate }}
            </button>
          </div>
        </div>

        <!-- Main Content -->
        <div class="content-grid">
          <!-- Left Column - Order Details -->
          <div class="main-column">
            <!-- Order Items -->
            <div class="card">
              <div class="card-header">
                <h2>{{ 'orders.detail.items' | translate }}</h2>
                <span class="item-count">{{ order()!.items.length }} {{ (order()!.items.length === 1 ? 'common.item' : 'common.items') | translate }}</span>
              </div>
              <div class="card-content">
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>{{ 'orders.detail.product' | translate }}</th>
                      <th class="text-right">{{ 'orders.detail.quantity' | translate }}</th>
                      <th class="text-right">{{ 'orders.detail.unitPrice' | translate }}</th>
                      <th class="text-right">{{ 'orders.detail.discount' | translate }}</th>
                      <th class="text-right">{{ 'orders.detail.lineTotal' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of order()!.items; track item.id) {
                      <tr>
                        <td>
                          <div class="product-cell">
                            <span class="product-name">{{ item.productName }}</span>
                            @if (item.productSku) {
                              <span class="product-sku">{{ item.productSku }}</span>
                            }
                            @if (item.batchNumber) {
                              <span class="batch-info">{{ 'orders.detail.batch' | translate }}: {{ item.batchNumber }}</span>
                            }
                          </div>
                        </td>
                        <td class="text-right">{{ item.quantity }}</td>
                        <td class="text-right">{{ item.unitPrice | number:'1.2-2' }} KM</td>
                        <td class="text-right">
                          @if (item.discountPercentage > 0) {
                            <span class="discount">-{{ item.discountPercentage }}%</span>
                          } @else {
                            <span class="no-discount">—</span>
                          }
                        </td>
                        <td class="text-right text-bold">{{ item.lineTotal | number:'1.2-2' }} KM</td>
                      </tr>
                    }
                  </tbody>
                </table>

                <!-- Order Totals -->
                <div class="order-totals">
                  <div class="total-row">
                    <span>{{ 'orders.detail.subtotal' | translate }}</span>
                    <span>{{ order()!.subtotal | number:'1.2-2' }} KM</span>
                  </div>
                  @if (order()!.discountAmount > 0) {
                    <div class="total-row discount">
                      <span>{{ 'orders.detail.discountTotal' | translate }}</span>
                      <span>-{{ order()!.discountAmount | number:'1.2-2' }} KM</span>
                    </div>
                  }
                  @if (order()!.taxAmount > 0) {
                    <div class="total-row">
                      <span>{{ 'orders.detail.tax' | translate }}</span>
                      <span>{{ order()!.taxAmount | number:'1.2-2' }} KM</span>
                    </div>
                  }
                  @if (order()!.shippingAmount > 0) {
                    <div class="total-row">
                      <span>{{ 'orders.detail.shipping' | translate }}</span>
                      <span>{{ order()!.shippingAmount | number:'1.2-2' }} KM</span>
                    </div>
                  }
                  <div class="total-row grand-total">
                    <span>{{ 'orders.detail.total' | translate }}</span>
                    <span>{{ order()!.totalAmount | number:'1.2-2' }} KM</span>
                  </div>
                  @if (order()!.paidAmount && order()!.paidAmount! > 0 && order()!.paidAmount! < order()!.totalAmount) {
                    <div class="total-row paid">
                      <span>{{ 'orders.detail.paid' | translate }}</span>
                      <span>{{ order()!.paidAmount | number:'1.2-2' }} KM</span>
                    </div>
                    <div class="total-row due">
                      <span>{{ 'orders.detail.due' | translate }}</span>
                      <span>{{ order()!.totalAmount - order()!.paidAmount! | number:'1.2-2' }} KM</span>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Prescriptions -->
            @if (order()!.prescriptions.length > 0) {
              <div class="card">
                <div class="card-header">
                  <h2>{{ 'orders.detail.prescriptions' | translate }}</h2>
                </div>
                <div class="card-content">
                  <div class="prescriptions-list">
                    @for (prescription of order()!.prescriptions; track prescription.id) {
                      <div class="prescription-item">
                        <div class="prescription-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 12l2 2 4-4"/>
                            <path d="M12 2a10 10 0 1 0 10 10H12V2z"/>
                          </svg>
                        </div>
                        <div class="prescription-info">
                          <div class="prescription-header">
                            <span class="prescription-number">{{ prescription.prescriptionNumber }}</span>
                            @if (prescription.isVerified) {
                              <span class="verified-badge">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                {{ 'orders.detail.verified' | translate }}
                              </span>
                            } @else {
                              <span class="pending-badge">{{ 'orders.detail.pendingVerification' | translate }}</span>
                            }
                          </div>
                          <div class="prescription-details">
                            <span><strong>{{ 'orders.detail.doctor' | translate }}:</strong> {{ prescription.doctorName }}</span>
                            <span><strong>{{ 'orders.detail.patient' | translate }}:</strong> {{ prescription.patientName }}</span>
                            <span><strong>{{ 'orders.detail.issued' | translate }}:</strong> {{ prescription.issueDate | date:'mediumDate' }}</span>
                          </div>
                        </div>
                        @if (prescription.imageUrl) {
                          <button class="btn-icon" [title]="'common.view' | translate">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                        }
                      </div>
                    }
                  </div>
                </div>
              </div>
            }

            <!-- Notes -->
            @if (order()!.notes) {
              <div class="card">
                <div class="card-header">
                  <h2>{{ 'orders.detail.notes' | translate }}</h2>
                </div>
                <div class="card-content">
                  <p class="order-notes">{{ order()!.notes }}</p>
                </div>
              </div>
            }
          </div>

          <!-- Right Column - Sidebar -->
          <div class="side-column">
            <!-- Customer Info -->
            <div class="card">
              <div class="card-header">
                <h2>{{ 'orders.detail.customer' | translate }}</h2>
              </div>
              <div class="card-content">
                <div class="customer-info">
                  <div class="customer-avatar">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div class="customer-details">
                    <span class="customer-name">{{ order()!.customerName }}</span>
                    @if (order()!.customerEmail) {
                      <a class="customer-email" href="mailto:{{ order()!.customerEmail }}">{{ order()!.customerEmail }}</a>
                    }
                    @if (order()!.customerPhone) {
                      <a class="customer-phone" href="tel:{{ order()!.customerPhone }}">{{ order()!.customerPhone }}</a>
                    }
                  </div>
                </div>
                <button class="btn btn-link" [routerLink]="['/customers', order()!.customerId]">
                  {{ 'orders.detail.viewCustomer' | translate }}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Order Timeline -->
            <div class="card">
              <div class="card-header">
                <h2>{{ 'orders.detail.timeline' | translate }}</h2>
              </div>
              <div class="card-content">
                <div class="timeline">
                  <div class="timeline-item" [class.active]="true">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                      <span class="timeline-label">{{ 'orders.detail.created' | translate }}</span>
                      <span class="timeline-date">{{ order()!.createdAt | date:'medium' }}</span>
                    </div>
                  </div>
                  @if (order()!.status >= OrderStatus.Confirmed) {
                    <div class="timeline-item" [class.active]="order()!.status >= OrderStatus.Confirmed">
                      <div class="timeline-marker"></div>
                      <div class="timeline-content">
                        <span class="timeline-label">{{ 'orders.status.confirmed' | translate }}</span>
                      </div>
                    </div>
                  }
                  @if (order()!.status >= OrderStatus.Processing) {
                    <div class="timeline-item" [class.active]="order()!.status >= OrderStatus.Processing">
                      <div class="timeline-marker"></div>
                      <div class="timeline-content">
                        <span class="timeline-label">{{ 'orders.status.processing' | translate }}</span>
                      </div>
                    </div>
                  }
                  @if (order()!.shippedDate) {
                    <div class="timeline-item active">
                      <div class="timeline-marker"></div>
                      <div class="timeline-content">
                        <span class="timeline-label">{{ 'orders.status.shipped' | translate }}</span>
                        <span class="timeline-date">{{ order()!.shippedDate | date:'medium' }}</span>
                      </div>
                    </div>
                  }
                  @if (order()!.deliveredDate) {
                    <div class="timeline-item active completed">
                      <div class="timeline-marker"></div>
                      <div class="timeline-content">
                        <span class="timeline-label">{{ 'orders.status.delivered' | translate }}</span>
                        <span class="timeline-date">{{ order()!.deliveredDate | date:'medium' }}</span>
                      </div>
                    </div>
                  }
                  @if (order()!.status === OrderStatus.Cancelled) {
                    <div class="timeline-item active cancelled">
                      <div class="timeline-marker"></div>
                      <div class="timeline-content">
                        <span class="timeline-label">{{ 'orders.status.cancelled' | translate }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Order Info -->
            <div class="card">
              <div class="card-header">
                <h2>{{ 'orders.detail.orderInfo' | translate }}</h2>
              </div>
              <div class="card-content">
                <div class="info-list">
                  <div class="info-row">
                    <span class="info-label">{{ 'orders.orderDate' | translate }}</span>
                    <span class="info-value">{{ order()!.orderDate | date:'mediumDate' }}</span>
                  </div>
                  @if (order()!.requiredDate) {
                    <div class="info-row">
                      <span class="info-label">{{ 'orders.detail.requiredDate' | translate }}</span>
                      <span class="info-value">{{ order()!.requiredDate | date:'mediumDate' }}</span>
                    </div>
                  }
                  @if (order()!.paymentMethod) {
                    <div class="info-row">
                      <span class="info-label">{{ 'orders.detail.paymentMethod' | translate }}</span>
                      <span class="info-value">{{ getPaymentMethodLabel(order()!.paymentMethod!) | translate }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Addresses -->
            @if (order()!.shippingAddress || order()!.billingAddress) {
              <div class="card">
                <div class="card-header">
                  <h2>{{ 'orders.detail.addresses' | translate }}</h2>
                </div>
                <div class="card-content">
                  @if (order()!.shippingAddress) {
                    <div class="address-block">
                      <h4>{{ 'orders.detail.shippingAddress' | translate }}</h4>
                      <p>{{ order()!.shippingAddress }}</p>
                    </div>
                  }
                  @if (order()!.billingAddress && order()!.billingAddress !== order()!.shippingAddress) {
                    <div class="address-block">
                      <h4>{{ 'orders.detail.billingAddress' | translate }}</h4>
                      <p>{{ order()!.billingAddress }}</p>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Cancel Confirmation -->
      <app-confirm-dialog
        [isOpen]="showCancelConfirm()"
        [title]="'orders.cancelConfirm.title' | translate"
        [message]="'orders.cancelConfirm.message' | translate"
        [confirmLabel]="'orders.cancel' | translate"
        [cancelLabel]="'common.goBack' | translate"
        variant="danger"
        (confirm)="cancelOrder()"
        (cancel)="showCancelConfirm.set(false)"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    :host{--c1:#1a1a2e;--c2:#6b7280;--c3:#9ca3af;--c4:#e5e7eb;--c5:#f3f4f6;--c6:#0aaaaa;--c7:#088888}
    .order-detail-page{padding:1.5rem;max-width:1200px;margin:0 auto}
    .back-nav{margin-bottom:1rem}
    .btn-back{display:inline-flex;align-items:center;gap:.5rem;padding:.5rem .75rem;background:0 0;border:none;color:var(--c2);font-size:.875rem;font-weight:500;cursor:pointer;border-radius:6px;transition:all .2s}
    .btn-back:hover{background:var(--c5);color:var(--c1)}
    .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem;gap:1rem;flex-wrap:wrap}
    .header-left{display:flex;flex-direction:column;gap:.75rem}
    .order-number{font-size:1.75rem;font-weight:600;color:var(--c1);margin:0}
    .order-badges,.header-actions{display:flex;gap:.5rem;flex-wrap:wrap}
    .content-grid{display:grid;grid-template-columns:1fr 360px;gap:1.5rem}
    @media(max-width:1024px){.content-grid{grid-template-columns:1fr}}
    .card{background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.08);border:1px solid var(--c4);margin-bottom:1rem}
    .card-header{display:flex;justify-content:space-between;align-items:center;padding:1rem 1.25rem;border-bottom:1px solid var(--c4)}
    .card-header h2{font-size:1rem;font-weight:600;color:var(--c1);margin:0}
    .item-count{font-size:.8rem;color:var(--c2);background:var(--c5);padding:.25rem .75rem;border-radius:20px}
    .card-content{padding:1.25rem}
    .items-table{width:100%;border-collapse:collapse}
    .items-table th{text-align:left;padding:.75rem;font-size:.75rem;font-weight:600;color:var(--c2);text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--c4)}
    .items-table td{padding:1rem .75rem;border-bottom:1px solid var(--c4);vertical-align:top}
    .items-table tr:last-child td{border-bottom:none}
    .text-right{text-align:right}.text-bold{font-weight:600}
    .product-cell{display:flex;flex-direction:column;gap:.25rem}
    .product-name{font-weight:500;color:var(--c1)}
    .product-sku{font-size:.8rem;color:var(--c2)}
    .batch-info{font-size:.75rem;color:var(--c3)}
    .discount{color:#059669;font-weight:500}
    .no-discount{color:var(--c3)}
    .order-totals{margin:1.5rem 0 0 auto;padding-top:1rem;border-top:1px solid var(--c4);display:flex;flex-direction:column;gap:.5rem;max-width:300px}
    .total-row{display:flex;justify-content:space-between;font-size:.9rem;color:var(--c2)}
    .total-row.discount span:last-child{color:#059669}
    .total-row.grand-total{padding-top:.75rem;margin-top:.5rem;border-top:2px solid var(--c4);font-size:1.125rem;font-weight:600;color:var(--c1)}
    .total-row.due span:last-child{color:#dc2626}
    .prescriptions-list{display:flex;flex-direction:column;gap:1rem}
    .prescription-item{display:flex;align-items:flex-start;gap:1rem;padding:1rem;background:#f9fafb;border-radius:8px}
    .prescription-icon{width:40px;height:40px;border-radius:8px;background:#dbeafe;color:#2563eb;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .prescription-info{flex:1}
    .prescription-header{display:flex;align-items:center;gap:.75rem;margin-bottom:.5rem}
    .prescription-number{font-weight:600;color:var(--c1)}
    .verified-badge{display:inline-flex;align-items:center;gap:.25rem;font-size:.75rem;padding:.125rem .5rem;background:#d1fae5;color:#059669;border-radius:4px}
    .pending-badge{font-size:.75rem;padding:.125rem .5rem;background:#fef3c7;color:#d97706;border-radius:4px}
    .prescription-details{display:flex;flex-wrap:wrap;gap:.5rem 1.5rem;font-size:.8rem;color:var(--c2)}
    .customer-info{display:flex;gap:1rem;margin-bottom:1rem}
    .customer-avatar{width:48px;height:48px;border-radius:50%;background:var(--c5);color:var(--c2);display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .customer-details{display:flex;flex-direction:column;gap:.25rem}
    .customer-name{font-weight:600;color:var(--c1)}
    .customer-email,.customer-phone{font-size:.875rem;color:var(--c6);text-decoration:none}
    .customer-email:hover,.customer-phone:hover{text-decoration:underline}
    .timeline{display:flex;flex-direction:column}
    .timeline-item{display:flex;gap:1rem;padding-bottom:1.5rem;position:relative}
    .timeline-item:last-child{padding-bottom:0}
    .timeline-item::before{content:'';position:absolute;left:7px;top:18px;bottom:0;width:2px;background:var(--c4)}
    .timeline-item:last-child::before{display:none}
    .timeline-item.active::before{background:var(--c6)}
    .timeline-marker{width:16px;height:16px;border-radius:50%;background:var(--c4);border:3px solid #fff;box-shadow:0 0 0 2px var(--c4);flex-shrink:0;z-index:1}
    .timeline-item.active .timeline-marker{background:var(--c6);box-shadow:0 0 0 2px var(--c6)}
    .timeline-item.completed .timeline-marker{background:#059669;box-shadow:0 0 0 2px #059669}
    .timeline-item.cancelled .timeline-marker{background:#dc2626;box-shadow:0 0 0 2px #dc2626}
    .timeline-content{display:flex;flex-direction:column;gap:.125rem}
    .timeline-label{font-size:.875rem;font-weight:500;color:var(--c1)}
    .timeline-date{font-size:.75rem;color:var(--c2)}
    .info-list{display:flex;flex-direction:column;gap:.75rem}
    .info-row{display:flex;justify-content:space-between;gap:1rem}
    .info-label{font-size:.875rem;color:var(--c2)}
    .info-value{font-size:.875rem;font-weight:500;color:var(--c1);text-align:right}
    .address-block{margin-bottom:1rem}
    .address-block:last-child{margin-bottom:0}
    .address-block h4{font-size:.8rem;font-weight:600;color:var(--c2);margin:0 0 .5rem;text-transform:uppercase;letter-spacing:.05em}
    .address-block p{font-size:.875rem;color:var(--c1);margin:0;line-height:1.5;white-space:pre-line}
    .order-notes{font-size:.9rem;color:var(--c1);line-height:1.6;margin:0}
    .loading-container,.not-found{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4rem 2rem;text-align:center}
    .loading-skeleton{width:100%;max-width:1000px}
    .skeleton-header{display:flex;flex-direction:column;gap:.75rem;margin-bottom:1.5rem}
    .skeleton{background:linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:8px}
    @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
    .skeleton-title{height:32px;width:200px}
    .skeleton-badges{height:24px;width:180px}
    .skeleton-content{display:grid;grid-template-columns:1fr 300px;gap:1.5rem}
    .skeleton-card{height:400px;border-radius:12px}
    .skeleton-sidebar{height:600px;border-radius:12px}
    .not-found h2{font-size:1.25rem;margin:0 0 .5rem}
    .not-found p{color:var(--c2);margin:0 0 1.5rem}
    .btn{display:inline-flex;align-items:center;gap:.5rem;padding:.5rem 1rem;font-size:.875rem;font-weight:500;border-radius:8px;border:none;cursor:pointer;transition:all .2s;font-family:inherit}
    .btn-primary{background:var(--c6);color:#fff}
    .btn-primary:hover{background:var(--c7)}
    .btn-secondary{background:#fff;color:var(--c1);border:1px solid var(--c4)}
    .btn-secondary:hover{background:#f9fafb}
    .btn-danger-outline{background:0 0;color:#dc2626;border:1px solid #dc2626}
    .btn-danger-outline:hover{background:#fef2f2}
    .btn-link{background:0 0;color:var(--c6);padding:0;font-size:.875rem}
    .btn-link:hover{text-decoration:underline}
    .btn-icon{display:flex;align-items:center;justify-content:center;width:36px;height:36px;border:none;border-radius:6px;background:0 0;color:var(--c2);cursor:pointer;transition:all .2s}
    .btn-icon:hover{background:var(--c5);color:var(--c6)}
    @media(max-width:768px){.order-detail-page{padding:1rem}.page-header{flex-direction:column}.header-actions{width:100%;justify-content:flex-start}.items-table{display:block;overflow-x:auto}.order-totals{max-width:100%}}
  `]
})
export class OrderDetailComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly printService = inject(PrintService);
  private readonly translateService = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // State
  loading = signal(true);
  order = signal<Order | null>(null);
  showCancelConfirm = signal(false);

  // Expose enum for template
  OrderStatus = OrderStatus;

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrder(orderId);
    }
  }

  private loadOrder(id: string): void {
    this.loading.set(true);

    this.orderService.getOrder(id).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading order:', error);
        this.loading.set(false);
        // Set mock data for demo
        this.setMockOrder(id);
      }
    });
  }

  private setMockOrder(id: string): void {
    const orderId = parseInt(id, 10);
    const mockOrder: Order = {
      id: orderId,
      orderNumber: 'ORD-2024-0001',
      customerId: 1,
      customerName: 'Apoteka Moja d.o.o.',
      customerCode: 'APT-001',
      customerEmail: 'narudzbe@apotekamoja.ba',
      customerPhone: '+387 33 123 456',
      status: OrderStatus.Processing,
      statusName: 'Processing',
      paymentStatus: PaymentStatus.Paid,
      paymentStatusName: 'Paid',
      paymentMethod: PaymentMethod.BankTransfer,
      orderDate: new Date('2024-01-15'),
      requiredDate: new Date('2024-01-20'),
      shippedDate: undefined,
      deliveredDate: undefined,
      subtotal: 1150.00,
      discountAmount: 50.00,
      taxAmount: 187.00,
      shippingAmount: 15.00,
      totalAmount: 1302.00,
      paidAmount: 1302.00,
      notes: 'Please deliver during business hours (8:00 - 16:00).',
      shippingAddress: 'Ferhadija 12\n71000 Sarajevo\nBosnia and Herzegovina',
      billingAddress: 'Ferhadija 12\n71000 Sarajevo\nBosnia and Herzegovina',
      items: [
        {
          id: 1,
          orderId: orderId,
          productId: 1,
          productName: 'Paracetamol 500mg',
          productSku: 'PAR-500',
          quantity: 100,
          unitPrice: 5.50,
          discountPercentage: 5,
          discountAmount: 27.50,
          taxRate: 17,
          taxAmount: 79.48,
          lineTotal: 522.50,
          batchNumber: 'B2024-001'
        },
        {
          id: 2,
          orderId: orderId,
          productId: 2,
          productName: 'Ibuprofen 400mg',
          productSku: 'IBU-400',
          quantity: 50,
          unitPrice: 8.00,
          discountPercentage: 0,
          discountAmount: 0,
          taxRate: 17,
          taxAmount: 68.00,
          lineTotal: 400.00
        },
        {
          id: 3,
          orderId: orderId,
          productId: 3,
          productName: 'Amoxicillin 500mg',
          productSku: 'AMX-500',
          quantity: 30,
          unitPrice: 12.00,
          discountPercentage: 10,
          discountAmount: 36.00,
          taxRate: 17,
          taxAmount: 55.08,
          lineTotal: 324.00,
          batchNumber: 'B2024-015'
        }
      ],
      prescriptions: [
        {
          id: 1,
          orderId: orderId,
          prescriptionNumber: 'RX-2024-00123',
          doctorName: 'Dr. Amira Hadžić',
          patientName: 'Edin Mujkić',
          issueDate: new Date('2024-01-14'),
          isVerified: true,
          verifiedBy: 'Pharmacist Merima',
          verifiedAt: new Date('2024-01-15')
        }
      ],
      createdAt: new Date('2024-01-15T10:30:00'),
      updatedAt: new Date('2024-01-15T14:45:00')
    };

    this.order.set(mockOrder);
  }

  // Actions
  editOrder(): void {
    if (this.order()) {
      this.router.navigate(['/orders', this.order()!.id, 'edit']);
    }
  }

  cancelOrder(): void {
    if (!this.order()) return;

    this.orderService.cancelOrder(this.order()!.id).subscribe({
      next: (updatedOrder) => {
        this.order.set(updatedOrder);
        this.showCancelConfirm.set(false);
      },
      error: (error) => {
        console.error('Error cancelling order:', error);
        this.showCancelConfirm.set(false);
      }
    });
  }

  printOrder(): void {
    const order = this.order();
    if (!order) return;

    const printData: OrderPrintData = {
      orderNumber: order.orderNumber,
      orderDate: order.createdAt ? new Date(order.createdAt).toLocaleDateString('bs-BA') : new Date(order.orderDate).toLocaleDateString('bs-BA'),
      customer: {
        name: order.customerName || 'N/A',
        address: order.shippingAddress ? this.formatAddress(order.shippingAddress) : undefined,
        email: order.customerEmail,
        phone: order.customerPhone
      },
      items: order.items.map(item => ({
        name: item.productName,
        sku: item.productSku || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.lineTotal
      })),
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      discount: order.discountAmount || undefined,
      total: order.totalAmount,
      paymentStatus: this.translateService.instant(this.getPaymentStatusLabel(order.paymentStatus)),
      notes: order.notes
    };

    this.printService.printOrder(printData, {
      title: `Order ${order.orderNumber}`
    });
  }

  private formatAddress(address: any): string {
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.postalCode) parts.push(address.postalCode);
    if (address.country) parts.push(address.country);
    return parts.join(', ');
  }

  // Permission checks
  canEditOrder(): boolean {
    const order = this.order();
    if (!order) return false;
    return order.status === OrderStatus.Pending || order.status === OrderStatus.Confirmed;
  }

  canCancelOrder(): boolean {
    const order = this.order();
    if (!order) return false;
    return order.status !== OrderStatus.Cancelled &&
           order.status !== OrderStatus.Delivered &&
           order.status !== OrderStatus.Returned;
  }

  // Status helpers
  getOrderStatusLabel(status: OrderStatus): string {
    return getOrderStatusLabel(status);
  }

  getPaymentStatusLabel(status: PaymentStatus): string {
    return getPaymentStatusLabel(status);
  }

  getPaymentMethodLabel(method: PaymentMethod): string {
    return getPaymentMethodLabel(method);
  }

  getOrderStatusBadgeVariant(status: OrderStatus): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    const color = getOrderStatusColor(status);
    return color === 'default' ? 'neutral' : color;
  }

  getPaymentStatusBadgeVariant(status: PaymentStatus): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    const color = getPaymentStatusColor(status);
    return color === 'default' ? 'neutral' : color;
  }
}
