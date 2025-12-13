import { Component, OnInit, inject, signal, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { OrderService, PaginatedResult } from '../../core/services/order.service';
import { ExportService, ExportColumn } from '../../core/services/export.service';
import {
  OrderSummary,
  OrderStatus,
  PaymentStatus,
  OrderFilter,
  getOrderStatusLabel,
  getOrderStatusColor,
  getPaymentStatusLabel,
  getPaymentStatusColor
} from '../../core/models/order.model';

import { DataTableComponent, TableColumn } from '../../shared/components/data-table';
import { SearchInputComponent } from '../../shared/components/search-input';
import { StatusBadgeComponent } from '../../shared/components/status-badge';
import { EmptyStateComponent } from '../../shared/components/empty-state';
import { PaginationComponent, PageEvent } from '../../shared/components/pagination';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    DatePipe,
    CurrencyPipe,
    DataTableComponent,
    SearchInputComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    PaginationComponent,
    ConfirmDialogComponent
  ],
  template: `
    <div class="orders-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">{{ 'orders.title' | translate }}</h1>
          <p class="page-subtitle">{{ 'orders.subtitle' | translate }}</p>
        </div>
        <div class="header-actions">
          <div class="export-dropdown" [class.open]="showExportMenu()">
            <button class="btn btn-secondary" (click)="toggleExportMenu()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {{ 'common.export' | translate }}
            </button>
            <div class="export-menu">
              <button class="export-menu-item" (click)="exportToCSV()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                CSV
              </button>
              <button class="export-menu-item" (click)="exportToExcel()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <rect x="8" y="12" width="8" height="6"/>
                </svg>
                Excel
              </button>
              <button class="export-menu-item" (click)="exportToPDF()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <path d="M10 12h4"/>
                  <path d="M10 16h4"/>
                </svg>
                PDF
              </button>
            </div>
          </div>
          <button class="btn btn-primary" (click)="createNewOrder()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            {{ 'orders.newOrder' | translate }}
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon pending">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ pendingCount() }}</span>
            <span class="stat-label">{{ 'orders.stats.pending' | translate }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon processing">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ processingCount() }}</span>
            <span class="stat-label">{{ 'orders.stats.processing' | translate }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon shipped">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="3" width="15" height="13"/>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ shippedCount() }}</span>
            <span class="stat-label">{{ 'orders.stats.shipped' | translate }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon delivered">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ deliveredCount() }}</span>
            <span class="stat-label">{{ 'orders.stats.delivered' | translate }}</span>
          </div>
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="filters-bar">
        <app-search-input
          [placeholder]="'orders.searchPlaceholder' | translate"
          [debounceTime]="300"
          (searchChange)="onSearch($event)"
        ></app-search-input>

        <div class="filter-group">
          <select [(ngModel)]="selectedStatus" (ngModelChange)="onStatusFilterChange($event)" class="filter-select">
            <option [ngValue]="null">{{ 'orders.allStatuses' | translate }}</option>
            @for (status of orderStatusOptions; track status.value) {
              <option [ngValue]="status.value">{{ status.label | translate }}</option>
            }
          </select>

          <select [(ngModel)]="selectedPaymentStatus" (ngModelChange)="onPaymentStatusFilterChange($event)" class="filter-select">
            <option [ngValue]="null">{{ 'orders.allPaymentStatuses' | translate }}</option>
            @for (status of paymentStatusOptions; track status.value) {
              <option [ngValue]="status.value">{{ status.label | translate }}</option>
            }
          </select>

          <div class="date-filter">
            <label>{{ 'common.from' | translate }}</label>
            <input
              type="date"
              [(ngModel)]="fromDate"
              (ngModelChange)="onDateFilterChange()"
              class="date-input"
            >
          </div>
          <div class="date-filter">
            <label>{{ 'common.to' | translate }}</label>
            <input
              type="date"
              [(ngModel)]="toDate"
              (ngModelChange)="onDateFilterChange()"
              class="date-input"
            >
          </div>
        </div>

        @if (hasActiveFilters()) {
          <button class="btn btn-ghost" (click)="clearFilters()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            {{ 'common.clearFilters' | translate }}
          </button>
        }
      </div>

      <!-- Orders Table -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>{{ 'common.loading' | translate }}</p>
        </div>
      } @else if (orders().length === 0 && !hasActiveFilters()) {
        <app-empty-state
          icon="package"
          [title]="'orders.empty.title' | translate"
          [description]="'orders.empty.description' | translate"
          [actionLabel]="'orders.newOrder' | translate"
          (actionClick)="createNewOrder()"
        ></app-empty-state>
      } @else if (orders().length === 0 && hasActiveFilters()) {
        <app-empty-state
          icon="search"
          [title]="'common.noSearchResults' | translate"
          [description]="'common.tryDifferentSearch' | translate"
        ></app-empty-state>
      } @else {
        <app-data-table
          [data]="orders()"
          [columns]="columns"
          [selectable]="true"
          [hoverable]="true"
          [striped]="true"
          (rowClick)="viewOrder($event)"
          (selectionChange)="onSelectionChange($event)"
        >
          <!-- Order Number Template -->
          <ng-template #orderNumberTemplate let-row>
            <div class="order-number-cell">
              <span class="order-number">{{ row.orderNumber }}</span>
              @if (row.hasPrescription) {
                <span class="prescription-badge" [title]="'orders.hasPrescription' | translate">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 12l2 2 4-4"/>
                    <path d="M12 2a10 10 0 1 0 10 10H12V2z"/>
                  </svg>
                </span>
              }
            </div>
          </ng-template>

          <!-- Customer Template -->
          <ng-template #customerTemplate let-row>
            <div class="customer-cell">
              <span class="customer-name">{{ row.customerName }}</span>
            </div>
          </ng-template>

          <!-- Order Status Template -->
          <ng-template #orderStatusTemplate let-row>
            <app-status-badge
              [label]="getOrderStatusLabel(row.status)"
              [variant]="getOrderStatusBadgeVariant(row.status)"
              [shouldTranslate]="true"
              [dot]="true"
            ></app-status-badge>
          </ng-template>

          <!-- Payment Status Template -->
          <ng-template #paymentStatusTemplate let-row>
            <app-status-badge
              [label]="getPaymentStatusLabel(row.paymentStatus)"
              [variant]="getPaymentStatusBadgeVariant(row.paymentStatus)"
              [shouldTranslate]="true"
              [dot]="true"
            ></app-status-badge>
          </ng-template>

          <!-- Date Template -->
          <ng-template #dateTemplate let-row>
            <span class="date-cell">{{ row.orderDate | date:'mediumDate' }}</span>
          </ng-template>

          <!-- Amount Template -->
          <ng-template #amountTemplate let-row>
            <span class="amount-cell">{{ row.totalAmount | currency:'BAM':'symbol':'1.2-2' }}</span>
          </ng-template>

          <!-- Items Count Template -->
          <ng-template #itemsTemplate let-row>
            <span class="items-count">{{ row.itemCount }} {{ (row.itemCount === 1 ? 'common.item' : 'common.items') | translate }}</span>
          </ng-template>

          <!-- Actions Template -->
          <ng-template #actionsTemplate let-row>
            <div class="action-buttons">
              <button class="btn-icon" (click)="viewOrder(row); $event.stopPropagation()" [title]="'common.view' | translate">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
              @if (canEditOrder(row)) {
                <button class="btn-icon" (click)="editOrder(row); $event.stopPropagation()" [title]="'common.edit' | translate">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              }
              @if (canCancelOrder(row)) {
                <button class="btn-icon btn-danger" (click)="confirmCancelOrder(row); $event.stopPropagation()" [title]="'orders.cancel' | translate">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                </button>
              }
            </div>
          </ng-template>
        </app-data-table>

        <!-- Pagination -->
        <div class="pagination-container">
          <app-pagination
            [page]="currentPage()"
            [size]="pageSize"
            [totalItems]="totalItems()"
            (pageChange)="onPageChange($event)"
          ></app-pagination>
        </div>
      }

      <!-- Bulk Actions Bar -->
      @if (selectedOrders().length > 0) {
        <div class="bulk-actions-bar">
          <span class="selection-count">
            {{ selectedOrders().length }} {{ 'common.selected' | translate }}
          </span>
          <div class="bulk-buttons">
            <button class="btn btn-secondary" (click)="exportSelected()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {{ 'common.export' | translate }}
            </button>
            <button class="btn btn-ghost" (click)="clearSelection()">
              {{ 'common.clearSelection' | translate }}
            </button>
          </div>
        </div>
      }

      <!-- Cancel Order Confirmation -->
      <app-confirm-dialog
        [isOpen]="showCancelConfirm()"
        [title]="'orders.cancelConfirm.title' | translate"
        [message]="'orders.cancelConfirm.message' | translate"
        [confirmLabel]="'orders.cancel' | translate"
        [cancelLabel]="'common.goBack' | translate"
        variant="danger"
        (confirm)="cancelOrder()"
        (cancel)="closeCancelConfirm()"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    .orders-page {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      gap: 1rem;
    }

    .header-content {
      flex: 1;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.25rem 0;
    }

    .page-subtitle {
      font-size: 0.9rem;
      color: var(--text-secondary);
      margin: 0;
    }

    /* Stats Row */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      border: 1px solid var(--border-color);
    }

    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon.pending {
      background: var(--status-pending-bg);
      color: var(--status-pending-text);
    }

    .stat-icon.processing {
      background: var(--status-processing-bg);
      color: var(--status-processing-text);
    }

    .stat-icon.shipped {
      background: var(--status-shipped-bg);
      color: var(--status-shipped-text);
    }

    .stat-icon.delivered {
      background: var(--status-completed-bg);
      color: var(--status-completed-text);
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .stat-label {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    /* Filters Bar */
    .filters-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      border: 1px solid var(--border-color);
      align-items: center;
    }

    .filter-group {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .filter-select {
      padding: 0.5rem 2rem 0.5rem 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 0.875rem;
      background: white;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.5rem center;
      cursor: pointer;
      min-width: 140px;
    }

    .filter-select:focus {
      outline: none;
      border-color: var(--pharma-teal);
      box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
    }

    .date-filter {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .date-filter label {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .date-input {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 0.875rem;
      font-family: inherit;
    }

    .date-input:focus {
      outline: none;
      border-color: var(--pharma-teal);
      box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
    }

    /* Table Cells */
    .order-number-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .order-number {
      font-weight: 600;
      color: var(--pharma-teal);
    }

    .prescription-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--status-processing-bg);
      color: var(--brand-primary-dark);
    }

    .customer-cell {
      display: flex;
      flex-direction: column;
    }

    .customer-name {
      font-weight: 500;
      color: var(--text-primary);
    }

    .date-cell {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .amount-cell {
      font-weight: 600;
      color: var(--text-primary);
    }

    .items-count {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    /* Actions */
    .action-buttons {
      display: flex;
      gap: 0.25rem;
    }

    .btn-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-icon:hover {
      background: var(--bg-hover);
      color: var(--pharma-teal);
    }

    .btn-icon.btn-danger:hover {
      background: var(--color-error-bg);
      color: var(--color-error-dark);
    }

    /* Pagination Container */
    .pagination-container {
      margin-top: 1.5rem;
    }

    /* Bulk Actions Bar */
    .bulk-actions-bar {
      position: fixed;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 0.75rem 1.25rem;
      background: var(--text-primary);
      color: white;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      z-index: 100;
    }

    .selection-count {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .bulk-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .bulk-buttons .btn {
      padding: 0.5rem 1rem;
      font-size: 0.8rem;
    }

    .bulk-buttons .btn-secondary {
      background: white;
      color: var(--text-primary);
    }

    .bulk-buttons .btn-ghost {
      color: rgba(255, 255, 255, 0.7);
    }

    .bulk-buttons .btn-ghost:hover {
      color: white;
      background: rgba(255, 255, 255, 0.1);
    }

    /* Loading State */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border-color);
      border-top-color: var(--pharma-teal);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-state p {
      margin-top: 1rem;
      color: var(--text-secondary);
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
    }

    .btn-primary {
      background: var(--pharma-teal);
      color: white;
    }

    .btn-primary:hover {
      background: var(--pharma-teal-dark);
    }

    .btn-secondary {
      background: white;
      color: var(--text-primary);
      border: 1px solid var(--border-color);
    }

    .btn-secondary:hover {
      background: var(--bg-hover);
    }

    .btn-ghost {
      background: transparent;
      color: var(--text-secondary);
    }

    .btn-ghost:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }

    /* Export Dropdown */
    .export-dropdown {
      position: relative;
    }

    .export-menu {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 0.5rem;
      background: white;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      min-width: 160px;
      z-index: 100;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-8px);
      transition: all 0.2s ease;
    }

    .export-dropdown.open .export-menu {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .export-menu-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.75rem 1rem;
      border: none;
      background: none;
      font-size: 0.875rem;
      color: var(--text-primary);
      cursor: pointer;
      transition: background 0.15s;
    }

    .export-menu-item:first-child {
      border-radius: 8px 8px 0 0;
    }

    .export-menu-item:last-child {
      border-radius: 0 0 8px 8px;
    }

    .export-menu-item:hover {
      background: var(--bg-hover);
    }

    .export-menu-item lucide-icon {
      color: var(--text-secondary);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .orders-page {
        padding: 1rem;
      }

      .page-header {
        flex-direction: column;
      }

      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }

      .filters-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .filter-group {
        flex-direction: column;
        align-items: stretch;
      }

      .filter-select {
        width: 100%;
      }

      .date-filter {
        flex-direction: column;
        align-items: stretch;
      }

      .date-input {
        width: 100%;
      }
    }
  `]
})
export class OrdersListComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly exportService = inject(ExportService);
  private readonly router = inject(Router);
  private readonly translateService = inject(TranslateService);

  // Templates
  @ViewChild('orderNumberTemplate', { static: true }) orderNumberTemplate!: TemplateRef<unknown>;
  @ViewChild('customerTemplate', { static: true }) customerTemplate!: TemplateRef<unknown>;
  @ViewChild('orderStatusTemplate', { static: true }) orderStatusTemplate!: TemplateRef<unknown>;
  @ViewChild('paymentStatusTemplate', { static: true }) paymentStatusTemplate!: TemplateRef<unknown>;
  @ViewChild('dateTemplate', { static: true }) dateTemplate!: TemplateRef<unknown>;
  @ViewChild('amountTemplate', { static: true }) amountTemplate!: TemplateRef<unknown>;
  @ViewChild('itemsTemplate', { static: true }) itemsTemplate!: TemplateRef<unknown>;
  @ViewChild('actionsTemplate', { static: true }) actionsTemplate!: TemplateRef<unknown>;

  // State
  loading = signal(false);
  orders = signal<OrderSummary[]>([]);
  selectedOrders = signal<OrderSummary[]>([]);
  currentPage = signal(1);
  totalPages = signal(1);
  totalItems = signal(0);
  pageSize = 10;
  showExportMenu = signal(false);

  // Stats
  pendingCount = signal(0);
  processingCount = signal(0);
  shippedCount = signal(0);
  deliveredCount = signal(0);

  // Filters
  searchTerm = '';
  selectedStatus: OrderStatus | null = null;
  selectedPaymentStatus: PaymentStatus | null = null;
  fromDate: string | null = null;
  toDate: string | null = null;

  // Cancel confirmation
  showCancelConfirm = signal(false);
  orderToCancel: OrderSummary | null = null;

  // Status options
  orderStatusOptions = [
    { value: OrderStatus.Pending, label: 'orders.status.pending' },
    { value: OrderStatus.Confirmed, label: 'orders.status.confirmed' },
    { value: OrderStatus.Processing, label: 'orders.status.processing' },
    { value: OrderStatus.ReadyForShipment, label: 'orders.status.readyForShipment' },
    { value: OrderStatus.Shipped, label: 'orders.status.shipped' },
    { value: OrderStatus.Delivered, label: 'orders.status.delivered' },
    { value: OrderStatus.Cancelled, label: 'orders.status.cancelled' },
    { value: OrderStatus.Returned, label: 'orders.status.returned' }
  ];

  paymentStatusOptions = [
    { value: PaymentStatus.Pending, label: 'orders.paymentStatus.pending' },
    { value: PaymentStatus.PartiallyPaid, label: 'orders.paymentStatus.partiallyPaid' },
    { value: PaymentStatus.Paid, label: 'orders.paymentStatus.paid' },
    { value: PaymentStatus.Refunded, label: 'orders.paymentStatus.refunded' },
    { value: PaymentStatus.Failed, label: 'orders.paymentStatus.failed' }
  ];

  // Table columns
  columns: TableColumn[] = [];

  ngOnInit(): void {
    this.initColumns();
    this.loadOrders();
    this.loadStats();
  }

  private initColumns(): void {
    this.columns = [
      {
        key: 'orderNumber',
        label: 'orders.orderNumber',
        sortable: true,
        template: this.orderNumberTemplate
      },
      {
        key: 'customerName',
        label: 'orders.customer',
        sortable: true,
        template: this.customerTemplate
      },
      {
        key: 'status',
        label: 'orders.status.label',
        sortable: true,
        template: this.orderStatusTemplate
      },
      {
        key: 'paymentStatus',
        label: 'orders.paymentStatus.label',
        sortable: true,
        template: this.paymentStatusTemplate
      },
      {
        key: 'orderDate',
        label: 'orders.orderDate',
        sortable: true,
        template: this.dateTemplate
      },
      {
        key: 'totalAmount',
        label: 'orders.totalAmount',
        sortable: true,
        template: this.amountTemplate
      },
      {
        key: 'itemCount',
        label: 'orders.items',
        sortable: true,
        template: this.itemsTemplate
      },
      {
        key: 'actions',
        label: '',
        sortable: false,
        width: '120px',
        template: this.actionsTemplate
      }
    ];
  }

  loadOrders(): void {
    this.loading.set(true);

    const filter: OrderFilter = {};

    if (this.searchTerm) {
      filter.searchTerm = this.searchTerm;
    }
    if (this.selectedStatus !== null) {
      filter.status = this.selectedStatus;
    }
    if (this.selectedPaymentStatus !== null) {
      filter.paymentStatus = this.selectedPaymentStatus;
    }
    if (this.fromDate) {
      filter.fromDate = new Date(this.fromDate);
    }
    if (this.toDate) {
      filter.toDate = new Date(this.toDate);
    }

    this.orderService.getOrders(this.currentPage(), this.pageSize, filter).subscribe({
      next: (result) => {
        this.orders.set(result.items);
        this.totalPages.set(result.totalPages);
        this.totalItems.set(result.totalCount);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.loading.set(false);
        // For demo, set mock data
        this.setMockData();
      }
    });
  }

  private setMockData(): void {
    const mockOrders: OrderSummary[] = [
      {
        id: '1',
        orderNumber: 'ORD-2024-0001',
        customerId: 'c1',
        customerName: 'Apoteka Moja',
        status: OrderStatus.Processing,
        paymentStatus: PaymentStatus.Paid,
        orderDate: new Date('2024-01-15'),
        totalAmount: 1250.00,
        itemCount: 5,
        hasPrescription: true
      },
      {
        id: '2',
        orderNumber: 'ORD-2024-0002',
        customerId: 'c2',
        customerName: 'Pharmacy Plus',
        status: OrderStatus.Pending,
        paymentStatus: PaymentStatus.Pending,
        orderDate: new Date('2024-01-16'),
        totalAmount: 890.50,
        itemCount: 3,
        hasPrescription: false
      },
      {
        id: '3',
        orderNumber: 'ORD-2024-0003',
        customerId: 'c3',
        customerName: 'HealthCare Sarajevo',
        status: OrderStatus.Shipped,
        paymentStatus: PaymentStatus.Paid,
        orderDate: new Date('2024-01-14'),
        totalAmount: 2340.75,
        itemCount: 8,
        hasPrescription: true
      },
      {
        id: '4',
        orderNumber: 'ORD-2024-0004',
        customerId: 'c4',
        customerName: 'MediPharm Tuzla',
        status: OrderStatus.Delivered,
        paymentStatus: PaymentStatus.Paid,
        orderDate: new Date('2024-01-12'),
        totalAmount: 560.00,
        itemCount: 2,
        hasPrescription: false
      },
      {
        id: '5',
        orderNumber: 'ORD-2024-0005',
        customerId: 'c5',
        customerName: 'PharmaNet Mostar',
        status: OrderStatus.Cancelled,
        paymentStatus: PaymentStatus.Refunded,
        orderDate: new Date('2024-01-10'),
        totalAmount: 1100.25,
        itemCount: 4,
        hasPrescription: false
      }
    ];

    this.orders.set(mockOrders);
    this.totalPages.set(1);
    this.totalItems.set(mockOrders.length);
  }

  private loadStats(): void {
    this.orderService.getOrderStats().subscribe({
      next: (stats) => {
        this.pendingCount.set(stats.pendingOrders);
        this.processingCount.set(stats.processingOrders);
        // We'll need to add shipped count to the API
        this.deliveredCount.set(stats.completedOrders);
      },
      error: () => {
        // Set mock stats
        this.pendingCount.set(12);
        this.processingCount.set(8);
        this.shippedCount.set(5);
        this.deliveredCount.set(156);
      }
    });
  }

  // Event handlers
  onSearch(term: string): void {
    this.searchTerm = term;
    this.currentPage.set(1);
    this.loadOrders();
  }

  onStatusFilterChange(status: OrderStatus | null): void {
    this.selectedStatus = status;
    this.currentPage.set(1);
    this.loadOrders();
  }

  onPaymentStatusFilterChange(status: PaymentStatus | null): void {
    this.selectedPaymentStatus = status;
    this.currentPage.set(1);
    this.loadOrders();
  }

  onDateFilterChange(): void {
    this.currentPage.set(1);
    this.loadOrders();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.page);
    this.pageSize = event.pageSize;
    this.loadOrders();
  }

  onSelectionChange(selected: OrderSummary[]): void {
    this.selectedOrders.set(selected);
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.selectedStatus !== null || this.selectedPaymentStatus !== null || this.fromDate || this.toDate);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = null;
    this.selectedPaymentStatus = null;
    this.fromDate = null;
    this.toDate = null;
    this.currentPage.set(1);
    this.loadOrders();
  }

  clearSelection(): void {
    this.selectedOrders.set([]);
  }

  // Navigation
  createNewOrder(): void {
    this.router.navigate(['/orders/new']);
  }

  viewOrder(order: OrderSummary): void {
    this.router.navigate(['/orders', order.id]);
  }

  editOrder(order: OrderSummary): void {
    this.router.navigate(['/orders', order.id, 'edit']);
  }

  // Order actions
  canEditOrder(order: OrderSummary): boolean {
    return order.status === OrderStatus.Pending || order.status === OrderStatus.Confirmed;
  }

  canCancelOrder(order: OrderSummary): boolean {
    return order.status !== OrderStatus.Cancelled &&
           order.status !== OrderStatus.Delivered &&
           order.status !== OrderStatus.Returned;
  }

  confirmCancelOrder(order: OrderSummary): void {
    this.orderToCancel = order;
    this.showCancelConfirm.set(true);
  }

  closeCancelConfirm(): void {
    this.showCancelConfirm.set(false);
    this.orderToCancel = null;
  }

  cancelOrder(): void {
    if (!this.orderToCancel) return;

    this.orderService.cancelOrder(this.orderToCancel.id).subscribe({
      next: () => {
        this.loadOrders();
        this.loadStats();
        this.closeCancelConfirm();
      },
      error: (error) => {
        console.error('Error cancelling order:', error);
        this.closeCancelConfirm();
      }
    });
  }

  exportSelected(): void {
    // Implementation for exporting selected orders
    const selectedIds = this.selectedOrders().map(o => o.id);
    console.log('Exporting orders:', selectedIds);
    // TODO: Implement export functionality
  }

  // Status helpers
  getOrderStatusLabel(status: OrderStatus): string {
    return getOrderStatusLabel(status);
  }

  getPaymentStatusLabel(status: PaymentStatus): string {
    return getPaymentStatusLabel(status);
  }

  getOrderStatusBadgeVariant(status: OrderStatus): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    const color = getOrderStatusColor(status);
    return color === 'default' ? 'neutral' : color;
  }

  getPaymentStatusBadgeVariant(status: PaymentStatus): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    const color = getPaymentStatusColor(status);
    return color === 'default' ? 'neutral' : color;
  }

  // Export functionality
  toggleExportMenu(): void {
    this.showExportMenu.update(v => !v);
  }

  private getExportColumns(): ExportColumn<OrderSummary>[] {
    return [
      { key: 'orderNumber', header: this.translateService.instant('orders.columns.orderNumber') },
      { key: 'customerName', header: this.translateService.instant('orders.columns.customer') },
      {
        key: 'orderDate',
        header: this.translateService.instant('orders.columns.date'),
        format: (value) => value ? new Date(value).toLocaleDateString('bs-BA') : ''
      },
      {
        key: 'status',
        header: this.translateService.instant('orders.columns.status'),
        format: (value) => this.translateService.instant(getOrderStatusLabel(value))
      },
      {
        key: 'paymentStatus',
        header: this.translateService.instant('orders.columns.paymentStatus'),
        format: (value) => this.translateService.instant(getPaymentStatusLabel(value))
      },
      { key: 'itemCount', header: this.translateService.instant('orders.columns.items') },
      {
        key: 'totalAmount',
        header: this.translateService.instant('orders.columns.total'),
        format: (value) => value?.toFixed(2) + ' BAM' || ''
      }
    ];
  }

  exportToCSV(): void {
    this.showExportMenu.set(false);
    const data = this.selectedOrders().length > 0 ? this.selectedOrders() : this.orders();
    this.exportService.exportToCSV(
      data,
      this.getExportColumns(),
      { filename: `orders-${new Date().toISOString().split('T')[0]}` }
    );
  }

  exportToExcel(): void {
    this.showExportMenu.set(false);
    const data = this.selectedOrders().length > 0 ? this.selectedOrders() : this.orders();
    this.exportService.exportToExcel(
      data,
      this.getExportColumns(),
      { filename: `orders-${new Date().toISOString().split('T')[0]}` }
    );
  }

  exportToPDF(): void {
    this.showExportMenu.set(false);
    const data = this.selectedOrders().length > 0 ? this.selectedOrders() : this.orders();
    this.exportService.exportToPDF(
      data,
      this.getExportColumns(),
      {
        filename: `orders-${new Date().toISOString().split('T')[0]}`,
        title: this.translateService.instant('orders.title'),
        subtitle: this.translateService.instant('orders.subtitle')
      }
    );
  }
}
