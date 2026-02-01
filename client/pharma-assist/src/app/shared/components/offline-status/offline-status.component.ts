import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OfflineStorageService, PendingOrder } from '../../../core/services/offline-storage.service';
import { OrderSyncService } from '../../../core/services/order-sync.service';

@Component({
  selector: 'app-offline-status',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="offline-status" [class.offline]="!isOnline()" [class.syncing]="isSyncing()">
      <!-- Status Indicator -->
      <div class="status-indicator" [class.online]="isOnline()" [class.offline]="!isOnline()">
        <span class="status-dot"></span>
        <span class="status-text">{{ statusText() }}</span>
      </div>
      
      <!-- Pending Orders Badge -->
      @if (pendingCount() > 0) {
        <div class="pending-badge" (click)="toggleDetails()">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ pendingCount() }}</span>
        </div>
      }
      
      <!-- Sync Button -->
      @if (isOnline() && pendingCount() > 0 && !isSyncing()) {
        <button class="sync-btn" (click)="syncNow()" [title]="'repOrders.sync.syncNow' | translate">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
      }
      
      <!-- Syncing Spinner -->
      @if (isSyncing()) {
        <div class="syncing-spinner">
          <svg class="spinner" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle class="spinner-circle" cx="12" cy="12" r="10" fill="none" stroke-width="2"/>
          </svg>
        </div>
      }
      
      <!-- Details Dropdown -->
      @if (showDetails()) {
        <div class="details-dropdown">
          <div class="details-header">
            <h4>{{ 'repOrders.sync.pendingOrders' | translate }}</h4>
            <button class="close-btn" (click)="toggleDetails()">×</button>
          </div>
          
          <div class="details-content">
            @if (pendingOrders().length === 0) {
              <p class="no-orders">{{ 'repOrders.sync.noPending' | translate }}</p>
            } @else {
              <ul class="order-list">
                @for (order of pendingOrders(); track order.id) {
                  <li class="order-item" [class.failed]="order.syncStatus === 'failed'">
                    <div class="order-info">
                      <span class="customer">{{ order.customerName }}</span>
                      <span class="total">{{ order.total | currency }}</span>
                    </div>
                    <div class="order-meta">
                      <span class="date">{{ order.createdAt | date:'short' }}</span>
                      <span class="status" [class]="order.syncStatus">
                        {{ 'repOrders.sync.status.' + order.syncStatus | translate }}
                      </span>
                    </div>
                    @if (order.syncStatus === 'failed') {
                      <div class="error-message">{{ order.syncError }}</div>
                      <button class="retry-btn" (click)="retryOrder(order.id)">
                        {{ 'repOrders.sync.retry' | translate }}
                      </button>
                    }
                  </li>
                }
              </ul>
            }
          </div>
          
          <div class="details-footer">
            @if (lastSyncTime()) {
              <span class="last-sync">
                {{ 'repOrders.sync.lastSync' | translate }}: {{ lastSyncTime() | date:'short' }}
              </span>
            }
            <button class="refresh-cache-btn" (click)="refreshCache()" [disabled]="isSyncing() || !isOnline()">
              {{ 'repOrders.sync.refreshCache' | translate }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .offline-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      position: relative;
      padding: 0.25rem 0.5rem;
      border-radius: 0.5rem;
      background: var(--surface-secondary);
    }
    
    .offline-status.offline {
      background: rgba(239, 68, 68, 0.1);
    }
    
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }
    
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-success);
    }
    
    .status-indicator.offline .status-dot {
      background: var(--color-error);
    }
    
    .status-text {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-secondary);
    }
    
    .pending-badge {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.125rem 0.5rem;
      background: var(--color-warning);
      color: white;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }
    
    .pending-badge:hover {
      transform: scale(1.05);
    }
    
    .pending-badge .icon {
      width: 14px;
      height: 14px;
    }
    
    .sync-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      padding: 0;
      border: none;
      background: var(--color-primary);
      color: white;
      border-radius: 50%;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .sync-btn:hover {
      background: var(--color-primary-dark);
    }
    
    .sync-btn .icon {
      width: 16px;
      height: 16px;
    }
    
    .syncing-spinner {
      width: 24px;
      height: 24px;
    }
    
    .spinner {
      width: 100%;
      height: 100%;
      animation: rotate 1s linear infinite;
    }
    
    .spinner-circle {
      stroke: var(--color-primary);
      stroke-dasharray: 62.8;
      stroke-dashoffset: 15;
      animation: dash 1s ease-in-out infinite;
    }
    
    @keyframes rotate {
      100% {
        transform: rotate(360deg);
      }
    }
    
    @keyframes dash {
      0% {
        stroke-dashoffset: 62.8;
      }
      50% {
        stroke-dashoffset: 15;
      }
      100% {
        stroke-dashoffset: 62.8;
      }
    }
    
    .details-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 0.5rem;
      width: 320px;
      max-height: 400px;
      background: var(--surface-primary);
      border-radius: 0.75rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      overflow: hidden;
    }
    
    .details-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-color);
    }
    
    .details-header h4 {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
    }
    
    .close-btn {
      width: 24px;
      height: 24px;
      padding: 0;
      border: none;
      background: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: var(--text-secondary);
    }
    
    .details-content {
      max-height: 280px;
      overflow-y: auto;
      padding: 0.5rem;
    }
    
    .no-orders {
      text-align: center;
      color: var(--text-secondary);
      padding: 1rem;
      margin: 0;
    }
    
    .order-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    
    .order-item {
      padding: 0.75rem;
      border-radius: 0.5rem;
      background: var(--surface-secondary);
      margin-bottom: 0.5rem;
    }
    
    .order-item.failed {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    
    .order-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
    }
    
    .customer {
      font-weight: 500;
      font-size: 0.875rem;
    }
    
    .total {
      font-weight: 600;
      color: var(--color-primary);
    }
    
    .order-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
    
    .status {
      font-weight: 500;
      text-transform: uppercase;
    }
    
    .status.pending {
      color: var(--color-warning);
    }
    
    .status.syncing {
      color: var(--color-info);
    }
    
    .status.synced {
      color: var(--color-success);
    }
    
    .status.failed {
      color: var(--color-error);
    }
    
    .error-message {
      font-size: 0.75rem;
      color: var(--color-error);
      margin-top: 0.5rem;
      padding: 0.25rem 0.5rem;
      background: rgba(239, 68, 68, 0.1);
      border-radius: 0.25rem;
    }
    
    .retry-btn {
      margin-top: 0.5rem;
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      border: 1px solid var(--color-primary);
      background: none;
      color: var(--color-primary);
      border-radius: 0.25rem;
      cursor: pointer;
    }
    
    .retry-btn:hover {
      background: var(--color-primary);
      color: white;
    }
    
    .details-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      border-top: 1px solid var(--border-color);
      background: var(--surface-secondary);
    }
    
    .last-sync {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
    
    .refresh-cache-btn {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
      border: none;
      background: var(--color-secondary);
      color: white;
      border-radius: 0.25rem;
      cursor: pointer;
    }
    
    .refresh-cache-btn:hover:not(:disabled) {
      opacity: 0.9;
    }
    
    .refresh-cache-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class OfflineStatusComponent {
  private readonly offlineStorage = inject(OfflineStorageService);
  private readonly syncService = inject(OrderSyncService);
  private readonly translate = inject(TranslateService);
  
  // Signals from service
  readonly isOnline = this.offlineStorage.isOnline;
  readonly pendingCount = this.offlineStorage.pendingOrderCount;
  readonly isSyncing = this.offlineStorage.isSyncing;
  readonly lastSyncTime = this.offlineStorage.lastSyncTime;
  
  // Local state
  readonly showDetails = signal(false);
  readonly pendingOrders = signal<PendingOrder[]>([]);
  
  readonly statusText = computed(() => {
    if (!this.isOnline()) return this.translate.instant('repOrders.sync.offline');
    if (this.isSyncing()) return this.translate.instant('repOrders.sync.syncing');
    return this.translate.instant('repOrders.sync.online');
  });
  
  toggleDetails(): void {
    const newValue = !this.showDetails();
    this.showDetails.set(newValue);
    
    if (newValue) {
      this.loadPendingOrders();
    }
  }
  
  async loadPendingOrders(): Promise<void> {
    const orders = await this.offlineStorage.getPendingOrdersAsync();
    this.pendingOrders.set(orders);
  }
  
  syncNow(): void {
    this.syncService.syncPendingOrders();
  }
  
  async retryOrder(orderId: string): Promise<void> {
    await this.syncService.forceSyncOrder(orderId);
    await this.loadPendingOrders();
  }
  
  async refreshCache(): Promise<void> {
    await this.syncService.refreshCache();
  }
}
