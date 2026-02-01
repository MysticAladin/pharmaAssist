import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, from, of, Subject, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

// IndexedDB Database Configuration
const DB_NAME = 'pharma-assist-offline';
const DB_VERSION = 1;

// Store names
export const STORE_NAMES = {
  PENDING_ORDERS: 'pendingOrders',
  CUSTOMERS: 'customers',
  PRODUCTS: 'products',
  PROMOTIONS: 'promotions',
  ORDER_TEMPLATES: 'orderTemplates',
  SYNC_LOG: 'syncLog',
} as const;

// Sync status for orders
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

// Pending order stored locally
export interface PendingOrder {
  id: string; // Local UUID
  customerId: number;
  customerName: string;
  items: PendingOrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  notes?: string;
  deliveryDate?: string;
  promoCode?: string;
  appliedPromotions?: string[];
  createdAt: string;
  syncStatus: SyncStatus;
  syncAttempts: number;
  lastSyncAttempt?: string;
  syncError?: string;
  serverId?: number; // Set after successful sync
}

export interface PendingOrderItem {
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
}

// Cached customer for offline access
export interface CachedCustomer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  tier: string;
  creditLimit: number;
  creditUsed: number;
  cachedAt: string;
}

// Cached product for offline access
export interface CachedProduct {
  id: number;
  name: string;
  sku: string;
  categoryId: number;
  categoryName: string;
  manufacturerId: number;
  manufacturerName: string;
  price: number;
  stock: number;
  imageUrl?: string;
  cachedAt: string;
}

// Cached promotion for offline access
export interface CachedPromotion {
  id: number;
  name: string;
  code?: string;
  type: string;
  value: number;
  minimumOrderValue?: number;
  startDate: string;
  endDate: string;
  cachedAt: string;
}

// Sync log entry
export interface SyncLogEntry {
  id: string;
  action: 'sync' | 'cache' | 'clear';
  entityType: string;
  entityCount: number;
  status: 'success' | 'failed';
  message?: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineStorageService {
  private db: IDBDatabase | null = null;
  private dbReady = new BehaviorSubject<boolean>(false);
  
  // Reactive signals for UI
  private _isOnline = signal(navigator.onLine);
  private _pendingOrderCount = signal(0);
  private _isSyncing = signal(false);
  private _lastSyncTime = signal<Date | null>(null);
  
  // Public readonly signals
  readonly isOnline = this._isOnline.asReadonly();
  readonly pendingOrderCount = this._pendingOrderCount.asReadonly();
  readonly isSyncing = this._isSyncing.asReadonly();
  readonly lastSyncTime = this._lastSyncTime.asReadonly();
  
  readonly hasPendingOrders = computed(() => this._pendingOrderCount() > 0);
  readonly offlineStatusText = computed(() => {
    if (!this._isOnline()) return 'Offline';
    if (this._isSyncing()) return 'Syncing...';
    if (this._pendingOrderCount() > 0) return `${this._pendingOrderCount()} pending`;
    return 'Online';
  });
  
  constructor() {
    this.initDatabase();
    this.setupOnlineListener();
  }
  
  /**
   * Initialize IndexedDB database
   */
  private initDatabase(): void {
    if (!window.indexedDB) {
      console.warn('IndexedDB not supported');
      return;
    }
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
    };
    
    request.onsuccess = (event) => {
      this.db = (event.target as IDBOpenDBRequest).result;
      this.dbReady.next(true);
      this.updatePendingOrderCount();
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores
      if (!db.objectStoreNames.contains(STORE_NAMES.PENDING_ORDERS)) {
        const orderStore = db.createObjectStore(STORE_NAMES.PENDING_ORDERS, { keyPath: 'id' });
        orderStore.createIndex('customerId', 'customerId', { unique: false });
        orderStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        orderStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
      
      if (!db.objectStoreNames.contains(STORE_NAMES.CUSTOMERS)) {
        const customerStore = db.createObjectStore(STORE_NAMES.CUSTOMERS, { keyPath: 'id' });
        customerStore.createIndex('name', 'name', { unique: false });
        customerStore.createIndex('city', 'city', { unique: false });
      }
      
      if (!db.objectStoreNames.contains(STORE_NAMES.PRODUCTS)) {
        const productStore = db.createObjectStore(STORE_NAMES.PRODUCTS, { keyPath: 'id' });
        productStore.createIndex('categoryId', 'categoryId', { unique: false });
        productStore.createIndex('sku', 'sku', { unique: false });
        productStore.createIndex('name', 'name', { unique: false });
      }
      
      if (!db.objectStoreNames.contains(STORE_NAMES.PROMOTIONS)) {
        db.createObjectStore(STORE_NAMES.PROMOTIONS, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORE_NAMES.ORDER_TEMPLATES)) {
        const templateStore = db.createObjectStore(STORE_NAMES.ORDER_TEMPLATES, { keyPath: 'id' });
        templateStore.createIndex('customerId', 'customerId', { unique: false });
      }
      
      if (!db.objectStoreNames.contains(STORE_NAMES.SYNC_LOG)) {
        const logStore = db.createObjectStore(STORE_NAMES.SYNC_LOG, { keyPath: 'id' });
        logStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  }
  
  /**
   * Setup online/offline event listeners
   */
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      this._isOnline.set(true);
      // Auto-sync when coming back online
      this.triggerSync();
    });
    
    window.addEventListener('offline', () => {
      this._isOnline.set(false);
    });
  }
  
  /**
   * Wait for database to be ready
   */
  private waitForDb(): Observable<IDBDatabase> {
    return new Observable(observer => {
      if (this.db) {
        observer.next(this.db);
        observer.complete();
      } else {
        const sub = this.dbReady.subscribe(ready => {
          if (ready && this.db) {
            observer.next(this.db);
            observer.complete();
            sub.unsubscribe();
          }
        });
      }
    });
  }
  
  // ==================== Pending Orders ====================
  
  /**
   * Save a pending order for offline sync
   */
  savePendingOrder(order: Omit<PendingOrder, 'id' | 'createdAt' | 'syncStatus' | 'syncAttempts'>): Observable<PendingOrder> {
    const pendingOrder: PendingOrder = {
      ...order,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      syncStatus: 'pending',
      syncAttempts: 0,
    };
    
    return this.waitForDb().pipe(
      map(db => {
        const tx = db.transaction(STORE_NAMES.PENDING_ORDERS, 'readwrite');
        const store = tx.objectStore(STORE_NAMES.PENDING_ORDERS);
        store.add(pendingOrder);
        return pendingOrder;
      }),
      tap(() => this.updatePendingOrderCount())
    );
  }
  
  /**
   * Get all pending orders
   */
  getPendingOrders(): Observable<PendingOrder[]> {
    return this.waitForDb().pipe(
      map(db => {
        return new Promise<PendingOrder[]>((resolve, reject) => {
          const tx = db.transaction(STORE_NAMES.PENDING_ORDERS, 'readonly');
          const store = tx.objectStore(STORE_NAMES.PENDING_ORDERS);
          const request = store.getAll();
          
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      }),
      map(promise => from(promise)),
      map(obs => obs),
      // Flatten the observable
      map(() => {
        return new Promise<PendingOrder[]>((resolve, reject) => {
          if (!this.db) {
            resolve([]);
            return;
          }
          const tx = this.db.transaction(STORE_NAMES.PENDING_ORDERS, 'readonly');
          const store = tx.objectStore(STORE_NAMES.PENDING_ORDERS);
          const request = store.getAll();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      }),
      map(promise => {
        // Execute the promise synchronously for the map
        let result: PendingOrder[] = [];
        promise.then(r => result = r);
        return result;
      }),
      catchError(() => of([]))
    );
  }
  
  /**
   * Get pending orders as promise (simpler)
   */
  async getPendingOrdersAsync(): Promise<PendingOrder[]> {
    await this.ensureDbReady();
    if (!this.db) return [];
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAMES.PENDING_ORDERS, 'readonly');
      const store = tx.objectStore(STORE_NAMES.PENDING_ORDERS);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Update a pending order (e.g., after sync attempt)
   */
  async updatePendingOrder(order: PendingOrder): Promise<void> {
    await this.ensureDbReady();
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAMES.PENDING_ORDERS, 'readwrite');
      const store = tx.objectStore(STORE_NAMES.PENDING_ORDERS);
      const request = store.put(order);
      
      request.onsuccess = () => {
        this.updatePendingOrderCount();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Delete a pending order (after successful sync or manual removal)
   */
  async deletePendingOrder(id: string): Promise<void> {
    await this.ensureDbReady();
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAMES.PENDING_ORDERS, 'readwrite');
      const store = tx.objectStore(STORE_NAMES.PENDING_ORDERS);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        this.updatePendingOrderCount();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Get orders that need to be synced
   */
  async getOrdersToSync(): Promise<PendingOrder[]> {
    const orders = await this.getPendingOrdersAsync();
    return orders.filter(o => o.syncStatus === 'pending' || o.syncStatus === 'failed');
  }
  
  /**
   * Update pending order count signal
   */
  private async updatePendingOrderCount(): Promise<void> {
    const orders = await this.getPendingOrdersAsync();
    const pendingCount = orders.filter(o => o.syncStatus !== 'synced').length;
    this._pendingOrderCount.set(pendingCount);
  }
  
  // ==================== Cached Data ====================
  
  /**
   * Cache customers for offline access
   */
  async cacheCustomers(customers: CachedCustomer[]): Promise<void> {
    await this.ensureDbReady();
    if (!this.db) return;
    
    const cachedAt = new Date().toISOString();
    const tx = this.db.transaction(STORE_NAMES.CUSTOMERS, 'readwrite');
    const store = tx.objectStore(STORE_NAMES.CUSTOMERS);
    
    // Clear existing and add new
    store.clear();
    customers.forEach(c => store.add({ ...c, cachedAt }));
    
    await this.logSync('cache', 'customers', customers.length, 'success');
  }
  
  /**
   * Get cached customers
   */
  async getCachedCustomers(): Promise<CachedCustomer[]> {
    await this.ensureDbReady();
    if (!this.db) return [];
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAMES.CUSTOMERS, 'readonly');
      const store = tx.objectStore(STORE_NAMES.CUSTOMERS);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Get a single cached customer
   */
  async getCachedCustomer(id: number): Promise<CachedCustomer | null> {
    await this.ensureDbReady();
    if (!this.db) return null;
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAMES.CUSTOMERS, 'readonly');
      const store = tx.objectStore(STORE_NAMES.CUSTOMERS);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Cache products for offline access
   */
  async cacheProducts(products: CachedProduct[]): Promise<void> {
    await this.ensureDbReady();
    if (!this.db) return;
    
    const cachedAt = new Date().toISOString();
    const tx = this.db.transaction(STORE_NAMES.PRODUCTS, 'readwrite');
    const store = tx.objectStore(STORE_NAMES.PRODUCTS);
    
    store.clear();
    products.forEach(p => store.add({ ...p, cachedAt }));
    
    await this.logSync('cache', 'products', products.length, 'success');
  }
  
  /**
   * Get cached products
   */
  async getCachedProducts(): Promise<CachedProduct[]> {
    await this.ensureDbReady();
    if (!this.db) return [];
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAMES.PRODUCTS, 'readonly');
      const store = tx.objectStore(STORE_NAMES.PRODUCTS);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Search cached products
   */
  async searchCachedProducts(query: string): Promise<CachedProduct[]> {
    const products = await this.getCachedProducts();
    const lowerQuery = query.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.sku.toLowerCase().includes(lowerQuery)
    );
  }
  
  /**
   * Cache promotions for offline access
   */
  async cachePromotions(promotions: CachedPromotion[]): Promise<void> {
    await this.ensureDbReady();
    if (!this.db) return;
    
    const cachedAt = new Date().toISOString();
    const tx = this.db.transaction(STORE_NAMES.PROMOTIONS, 'readwrite');
    const store = tx.objectStore(STORE_NAMES.PROMOTIONS);
    
    store.clear();
    promotions.forEach(p => store.add({ ...p, cachedAt }));
    
    await this.logSync('cache', 'promotions', promotions.length, 'success');
  }
  
  /**
   * Get cached promotions
   */
  async getCachedPromotions(): Promise<CachedPromotion[]> {
    await this.ensureDbReady();
    if (!this.db) return [];
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAMES.PROMOTIONS, 'readonly');
      const store = tx.objectStore(STORE_NAMES.PROMOTIONS);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  // ==================== Sync Management ====================
  
  /**
   * Trigger sync of pending orders
   */
  triggerSync(): void {
    if (this._isSyncing() || !this._isOnline()) return;
    
    // Emit sync event that OrderSyncService will listen to
    window.dispatchEvent(new CustomEvent('pharma-sync-trigger'));
  }
  
  /**
   * Mark sync as in progress
   */
  setSyncing(syncing: boolean): void {
    this._isSyncing.set(syncing);
    if (!syncing) {
      this._lastSyncTime.set(new Date());
    }
  }
  
  /**
   * Log a sync operation
   */
  async logSync(
    action: 'sync' | 'cache' | 'clear',
    entityType: string,
    entityCount: number,
    status: 'success' | 'failed',
    message?: string
  ): Promise<void> {
    await this.ensureDbReady();
    if (!this.db) return;
    
    const entry: SyncLogEntry = {
      id: crypto.randomUUID(),
      action,
      entityType,
      entityCount,
      status,
      message,
      timestamp: new Date().toISOString(),
    };
    
    const tx = this.db.transaction(STORE_NAMES.SYNC_LOG, 'readwrite');
    const store = tx.objectStore(STORE_NAMES.SYNC_LOG);
    store.add(entry);
    
    // Keep only last 100 entries
    const countRequest = store.count();
    countRequest.onsuccess = () => {
      if (countRequest.result > 100) {
        const deleteCount = countRequest.result - 100;
        const cursorRequest = store.index('timestamp').openCursor();
        let deleted = 0;
        
        cursorRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor && deleted < deleteCount) {
            cursor.delete();
            deleted++;
            cursor.continue();
          }
        };
      }
    };
  }
  
  /**
   * Get sync log
   */
  async getSyncLog(limit: number = 20): Promise<SyncLogEntry[]> {
    await this.ensureDbReady();
    if (!this.db) return [];
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAMES.SYNC_LOG, 'readonly');
      const store = tx.objectStore(STORE_NAMES.SYNC_LOG);
      const request = store.index('timestamp').openCursor(null, 'prev');
      const results: SyncLogEntry[] = [];
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
  
  // ==================== Clear Data ====================
  
  /**
   * Clear all offline data
   */
  async clearAllData(): Promise<void> {
    await this.ensureDbReady();
    if (!this.db) return;
    
    const stores = [
      STORE_NAMES.PENDING_ORDERS,
      STORE_NAMES.CUSTOMERS,
      STORE_NAMES.PRODUCTS,
      STORE_NAMES.PROMOTIONS,
      STORE_NAMES.ORDER_TEMPLATES,
    ];
    
    for (const storeName of stores) {
      const tx = this.db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).clear();
    }
    
    this._pendingOrderCount.set(0);
    await this.logSync('clear', 'all', 0, 'success');
  }
  
  /**
   * Clear cached data only (keep pending orders)
   */
  async clearCachedData(): Promise<void> {
    await this.ensureDbReady();
    if (!this.db) return;
    
    const stores = [
      STORE_NAMES.CUSTOMERS,
      STORE_NAMES.PRODUCTS,
      STORE_NAMES.PROMOTIONS,
    ];
    
    for (const storeName of stores) {
      const tx = this.db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).clear();
    }
    
    await this.logSync('clear', 'cached', 0, 'success');
  }
  
  // ==================== Helpers ====================
  
  /**
   * Ensure database is ready
   */
  private async ensureDbReady(): Promise<void> {
    if (this.db) return;
    
    return new Promise(resolve => {
      const sub = this.dbReady.subscribe(ready => {
        if (ready) {
          resolve();
          sub.unsubscribe();
        }
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        resolve();
        sub.unsubscribe();
      }, 5000);
    });
  }
  
  /**
   * Check if IndexedDB is available
   */
  isAvailable(): boolean {
    return !!window.indexedDB && this.db !== null;
  }
  
  /**
   * Get storage usage estimate
   */
  async getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    return null;
  }
}
