import { Injectable, inject, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, from, Subject, forkJoin, timer } from 'rxjs';
import { map, catchError, tap, takeUntil, switchMap, retry, delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { OfflineStorageService, PendingOrder, CachedCustomer, CachedProduct, CachedPromotion } from './offline-storage.service';
import { NotificationService } from './notification.service';
import { TranslateService } from '@ngx-translate/core';
import { RepOrderService } from './rep-order.service';

// Sync configuration
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE = 1000; // 1 second, will exponentially increase

export interface SyncResult {
  orderId: string;
  success: boolean;
  serverId?: number;
  error?: string;
}

export interface CacheRefreshResult {
  customers: number;
  products: number;
  promotions: number;
  success: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderSyncService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly offlineStorage = inject(OfflineStorageService);
  private readonly notification = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly repOrderService = inject(RepOrderService);
  
  private readonly apiUrl = `${environment.apiUrl}/api/rep-orders`;
  private readonly destroy$ = new Subject<void>();
  private syncTimer: any;
  
  constructor() {
    this.setupEventListeners();
    this.startAutoSync();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
  }
  
  /**
   * Setup event listeners for sync triggers
   */
  private setupEventListeners(): void {
    window.addEventListener('pharma-sync-trigger', () => {
      this.syncPendingOrders();
    });
  }
  
  /**
   * Start automatic sync timer
   */
  private startAutoSync(): void {
    this.syncTimer = setInterval(() => {
      if (this.offlineStorage.isOnline() && this.offlineStorage.hasPendingOrders()) {
        this.syncPendingOrders();
      }
    }, SYNC_INTERVAL);
  }
  
  /**
   * Sync all pending orders to the server
   */
  async syncPendingOrders(): Promise<SyncResult[]> {
    if (!this.offlineStorage.isOnline()) {
      return [];
    }
    
    const ordersToSync = await this.offlineStorage.getOrdersToSync();
    if (ordersToSync.length === 0) {
      return [];
    }
    
    this.offlineStorage.setSyncing(true);
    const results: SyncResult[] = [];
    
    try {
      for (const order of ordersToSync) {
        const result = await this.syncSingleOrder(order);
        results.push(result);
        
        // Small delay between syncs to avoid overwhelming the server
        await this.delay(200);
      }
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      if (successCount > 0) {
        this.notification.success(
          this.translate.instant('repOrders.sync.syncedOrders', { count: successCount })
        );
      }
      
      if (failCount > 0) {
        this.notification.warning(
          this.translate.instant('repOrders.sync.failedOrders', { count: failCount })
        );
      }
      
      await this.offlineStorage.logSync('sync', 'orders', ordersToSync.length, 
        failCount === 0 ? 'success' : 'failed',
        `Synced ${successCount}, failed ${failCount}`
      );
      
    } finally {
      this.offlineStorage.setSyncing(false);
    }
    
    return results;
  }
  
  /**
   * Sync a single order to the server
   */
  private async syncSingleOrder(order: PendingOrder): Promise<SyncResult> {
    // Update status to syncing
    order.syncStatus = 'syncing';
    order.syncAttempts++;
    order.lastSyncAttempt = new Date().toISOString();
    await this.offlineStorage.updatePendingOrder(order);
    
    try {
      const result = await this.createOrderOnServer(order);
      
      if (result.success && result.serverId) {
        // Mark as synced
        order.syncStatus = 'synced';
        order.serverId = result.serverId;
        order.syncError = undefined;
        await this.offlineStorage.updatePendingOrder(order);
        
        // Optionally delete after successful sync
        // await this.offlineStorage.deletePendingOrder(order.id);
        
        return result;
      } else {
        throw new Error(result.error || 'Unknown error');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      
      // Determine if we should retry or mark as permanently failed
      if (order.syncAttempts >= MAX_RETRY_ATTEMPTS) {
        order.syncStatus = 'failed';
      } else {
        order.syncStatus = 'pending'; // Will retry later
      }
      
      order.syncError = errorMessage;
      await this.offlineStorage.updatePendingOrder(order);
      
      return {
        orderId: order.id,
        success: false,
        error: errorMessage,
      };
    }
  }
  
  /**
   * Create order on the server
   */
  private async createOrderOnServer(order: PendingOrder): Promise<SyncResult> {
    return new Promise((resolve) => {
      const createDto = {
        customerId: order.customerId,
        items: order.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
        })),
        notes: order.notes,
        deliveryDate: order.deliveryDate,
        promoCode: order.promoCode,
        offlineCreatedAt: order.createdAt,
      };
      
      this.http.post<{ orderId: number }>(`${this.apiUrl}/create`, createDto)
        .pipe(
          retry({
            count: 2,
            delay: (error, retryCount) => {
              const delayMs = RETRY_DELAY_BASE * Math.pow(2, retryCount);
              return timer(delayMs);
            },
          }),
          catchError((error: HttpErrorResponse) => {
            return of({ error: error.message || 'Server error' });
          })
        )
        .subscribe(response => {
          if ('orderId' in response) {
            resolve({
              orderId: order.id,
              success: true,
              serverId: response.orderId,
            });
          } else {
            resolve({
              orderId: order.id,
              success: false,
              error: (response as any).error,
            });
          }
        });
    });
  }
  
  /**
   * Retry failed orders
   */
  async retryFailedOrders(): Promise<SyncResult[]> {
    const pendingOrders = await this.offlineStorage.getPendingOrdersAsync();
    const failedOrders = pendingOrders.filter(o => o.syncStatus === 'failed');
    
    // Reset sync attempts for retry
    for (const order of failedOrders) {
      order.syncStatus = 'pending';
      order.syncAttempts = 0;
      order.syncError = undefined;
      await this.offlineStorage.updatePendingOrder(order);
    }
    
    return this.syncPendingOrders();
  }
  
  /**
   * Force sync a specific order
   */
  async forceSyncOrder(orderId: string): Promise<SyncResult> {
    const orders = await this.offlineStorage.getPendingOrdersAsync();
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
      return { orderId, success: false, error: 'Order not found' };
    }
    
    // Reset for force sync
    order.syncAttempts = 0;
    order.syncStatus = 'pending';
    
    return this.syncSingleOrder(order);
  }
  
  /**
   * Refresh cached data from server
   */
  async refreshCache(): Promise<CacheRefreshResult> {
    if (!this.offlineStorage.isOnline()) {
      return {
        customers: 0,
        products: 0,
        promotions: 0,
        success: false,
        error: 'Offline',
      };
    }
    
    this.offlineStorage.setSyncing(true);
    
    try {
      const [customers, products, promotions] = await Promise.all([
        this.fetchAndCacheCustomers(),
        this.fetchAndCacheProducts(),
        this.fetchAndCachePromotions(),
      ]);
      
      this.notification.success(
        this.translate.instant('repOrders.sync.cacheRefreshed')
      );
      
      return {
        customers,
        products,
        promotions,
        success: true,
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Cache refresh failed';
      
      this.notification.error(
        this.translate.instant('repOrders.sync.cacheError')
      );
      
      return {
        customers: 0,
        products: 0,
        promotions: 0,
        success: false,
        error: errorMessage,
      };
      
    } finally {
      this.offlineStorage.setSyncing(false);
    }
  }
  
  /**
   * Fetch and cache customers
   */
  private async fetchAndCacheCustomers(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.http.get<any[]>(`${environment.apiUrl}/api/rep-customers/my-customers`)
        .pipe(
          catchError(error => {
            console.error('Failed to fetch customers for cache:', error);
            return of([]);
          })
        )
        .subscribe(async customers => {
          if (customers.length > 0) {
            const cachedCustomers: CachedCustomer[] = customers.map(c => ({
              id: c.id,
              name: c.name,
              phone: c.phone,
              email: c.email,
              address: c.address,
              city: c.city,
              tier: c.tier,
              creditLimit: c.creditLimit,
              creditUsed: c.creditUsed,
              cachedAt: new Date().toISOString(),
            }));
            
            await this.offlineStorage.cacheCustomers(cachedCustomers);
          }
          resolve(customers.length);
        });
    });
  }
  
  /**
   * Fetch and cache products
   */
  private async fetchAndCacheProducts(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.http.get<any[]>(`${environment.apiUrl}/api/rep-products/catalog`)
        .pipe(
          catchError(error => {
            console.error('Failed to fetch products for cache:', error);
            return of([]);
          })
        )
        .subscribe(async products => {
          if (products.length > 0) {
            const cachedProducts: CachedProduct[] = products.map(p => ({
              id: p.id,
              name: p.name,
              sku: p.sku,
              categoryId: p.categoryId,
              categoryName: p.categoryName,
              manufacturerId: p.manufacturerId,
              manufacturerName: p.manufacturerName,
              price: p.price,
              stock: p.stock,
              imageUrl: p.imageUrl,
              cachedAt: new Date().toISOString(),
            }));
            
            await this.offlineStorage.cacheProducts(cachedProducts);
          }
          resolve(products.length);
        });
    });
  }
  
  /**
   * Fetch and cache promotions
   */
  private async fetchAndCachePromotions(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.repOrderService.getActivePromotions()
        .pipe(
          catchError(error => {
            console.error('Failed to fetch promotions for cache:', error);
            return of([]);
          })
        )
        .subscribe(async promotions => {
          if (promotions.length > 0) {
            const cachedPromotions: CachedPromotion[] = promotions.map(p => ({
              id: p.id,
              name: p.name,
              code: p.code,
              type: p.typeName, // Use the string type name
              value: p.value,
              minimumOrderValue: p.minimumOrderAmount,
              startDate: p.startDate,
              endDate: p.endDate,
              cachedAt: new Date().toISOString(),
            }));
            
            await this.offlineStorage.cachePromotions(cachedPromotions);
          }
          resolve(promotions.length);
        });
    });
  }
  
  /**
   * Check if data needs refresh (e.g., cached data is stale)
   */
  async shouldRefreshCache(): Promise<boolean> {
    const customers = await this.offlineStorage.getCachedCustomers();
    
    // If no cached data, definitely refresh
    if (customers.length === 0) {
      return true;
    }
    
    // Check if oldest cache is more than 24 hours old
    const oldestCache = customers.reduce((oldest, c) => {
      const cachedAt = new Date(c.cachedAt).getTime();
      return cachedAt < oldest ? cachedAt : oldest;
    }, Date.now());
    
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return Date.now() - oldestCache > twentyFourHours;
  }
  
  /**
   * Helper delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
