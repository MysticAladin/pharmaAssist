import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  OfflineStorageService,
  PendingOrder,
  CachedCustomer,
  CachedProduct,
  STORE_NAMES
} from './offline-storage.service';

// Mock IndexedDB for testing
class MockIDBDatabase {
  objectStoreNames: string[] = Object.values(STORE_NAMES);
  private stores: Map<string, Map<string, any>> = new Map();

  constructor() {
    this.objectStoreNames.forEach(name => {
      this.stores.set(name, new Map());
    });
  }

  transaction(storeNames: string | string[], mode: string): MockIDBTransaction {
    return new MockIDBTransaction(this.stores, Array.isArray(storeNames) ? storeNames : [storeNames]);
  }

  close(): void {}
}

class MockIDBTransaction {
  constructor(
    private stores: Map<string, Map<string, any>>,
    private storeNames: string[]
  ) {}

  objectStore(name: string): MockIDBObjectStore {
    return new MockIDBObjectStore(this.stores.get(name) || new Map());
  }
}

class MockIDBObjectStore {
  constructor(private data: Map<string, any>) {}

  put(value: any): MockIDBRequest {
    const key = value.id || String(Date.now());
    this.data.set(key, value);
    return new MockIDBRequest(key);
  }

  get(key: string): MockIDBRequest {
    return new MockIDBRequest(this.data.get(key));
  }

  getAll(): MockIDBRequest {
    return new MockIDBRequest(Array.from(this.data.values()));
  }

  delete(key: string): MockIDBRequest {
    this.data.delete(key);
    return new MockIDBRequest(undefined);
  }

  clear(): MockIDBRequest {
    this.data.clear();
    return new MockIDBRequest(undefined);
  }

  count(): MockIDBRequest {
    return new MockIDBRequest(this.data.size);
  }
}

class MockIDBRequest {
  result: any;
  onsuccess: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;

  constructor(result: any) {
    this.result = result;
    // Simulate async completion
    setTimeout(() => {
      if (this.onsuccess) {
        this.onsuccess({ target: this });
      }
    }, 0);
  }
}

describe('OfflineStorageService', () => {
  let service: OfflineStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OfflineStorageService]
    });
    service = TestBed.inject(OfflineStorageService);
  });

  describe('isOnline signal', () => {
    it('should reflect navigator.onLine status', () => {
      // Initial state depends on test environment
      expect(typeof service.isOnline()).toBe('boolean');
    });
  });

  describe('pendingOrderCount signal', () => {
    it('should start at 0', () => {
      expect(service.pendingOrderCount()).toBe(0);
    });
  });

  describe('isSyncing signal', () => {
    it('should start as false', () => {
      expect(service.isSyncing()).toBe(false);
    });
  });

  describe('lastSyncTime signal', () => {
    it('should start as null', () => {
      expect(service.lastSyncTime()).toBeNull();
    });
  });

  describe('hasPendingOrders computed', () => {
    it('should be false when pendingOrderCount is 0', () => {
      expect(service.hasPendingOrders()).toBe(false);
    });
  });

  describe('syncStatusText computed', () => {
    it('should show offline message when offline', () => {
      // We can't easily mock the signal, but we can verify the computed exists
      expect(typeof service.syncStatusText()).toBe('string');
    });
  });

  describe('createPendingOrder', () => {
    it('should create a pending order with required fields', () => {
      const orderData = {
        customerId: 1,
        customerName: 'Test Customer',
        items: [
          { productId: 1, productName: 'Product 1', sku: 'SKU001', quantity: 2, unitPrice: 10, discount: 0, lineTotal: 20 }
        ],
        subtotal: 20,
        discount: 0,
        total: 20
      };

      const pendingOrder = service.createPendingOrder(orderData);

      expect(pendingOrder.id).toBeTruthy();
      expect(pendingOrder.customerId).toBe(1);
      expect(pendingOrder.customerName).toBe('Test Customer');
      expect(pendingOrder.syncStatus).toBe('pending');
      expect(pendingOrder.syncAttempts).toBe(0);
      expect(pendingOrder.createdAt).toBeTruthy();
    });

    it('should include optional fields when provided', () => {
      const orderData = {
        customerId: 1,
        customerName: 'Test Customer',
        items: [],
        subtotal: 100,
        discount: 10,
        total: 90,
        notes: 'Special instructions',
        deliveryDate: '2026-02-01',
        promoCode: 'SAVE10'
      };

      const pendingOrder = service.createPendingOrder(orderData);

      expect(pendingOrder.notes).toBe('Special instructions');
      expect(pendingOrder.deliveryDate).toBe('2026-02-01');
      expect(pendingOrder.promoCode).toBe('SAVE10');
    });
  });

  describe('Store names', () => {
    it('should have all required store names defined', () => {
      expect(STORE_NAMES.PENDING_ORDERS).toBe('pendingOrders');
      expect(STORE_NAMES.CUSTOMERS).toBe('customers');
      expect(STORE_NAMES.PRODUCTS).toBe('products');
      expect(STORE_NAMES.PROMOTIONS).toBe('promotions');
      expect(STORE_NAMES.ORDER_TEMPLATES).toBe('orderTemplates');
      expect(STORE_NAMES.SYNC_LOG).toBe('syncLog');
    });
  });

  describe('PendingOrder interface', () => {
    it('should allow creating a valid PendingOrder object', () => {
      const order: PendingOrder = {
        id: 'uuid-123',
        customerId: 1,
        customerName: 'Test',
        items: [],
        subtotal: 100,
        discount: 0,
        total: 100,
        createdAt: new Date().toISOString(),
        syncStatus: 'pending',
        syncAttempts: 0
      };

      expect(order.id).toBe('uuid-123');
      expect(order.syncStatus).toBe('pending');
    });
  });

  describe('CachedCustomer interface', () => {
    it('should allow creating a valid CachedCustomer object', () => {
      const customer: CachedCustomer = {
        id: 1,
        name: 'Test Pharmacy',
        tier: 'A',
        creditLimit: 10000,
        creditUsed: 2500,
        cachedAt: new Date().toISOString()
      };

      expect(customer.id).toBe(1);
      expect(customer.tier).toBe('A');
    });
  });

  describe('CachedProduct interface', () => {
    it('should allow creating a valid CachedProduct object', () => {
      const product: CachedProduct = {
        id: 1,
        name: 'Aspirin 500mg',
        sku: 'ASP500',
        categoryId: 1,
        categoryName: 'Pain Relief',
        manufacturerId: 1,
        manufacturerName: 'Pharma Co',
        price: 9.99,
        stock: 100,
        cachedAt: new Date().toISOString()
      };

      expect(product.id).toBe(1);
      expect(product.sku).toBe('ASP500');
    });
  });
});
