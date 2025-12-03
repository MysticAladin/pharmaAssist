import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

export type ActivityType =
  | 'order_created'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'prescription_dispensed'
  | 'product_added'
  | 'product_updated'
  | 'stock_adjusted'
  | 'customer_registered'
  | 'payment_received';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: Date;
  entityId?: string;
  entityType?: 'order' | 'product' | 'customer' | 'prescription';
  metadata?: Record<string, unknown>;
}

export interface ActivityConfig {
  icon: string;
  color: string;
  route?: string;
}

const ACTIVITY_CONFIGS: Record<ActivityType, ActivityConfig> = {
  order_created: { icon: 'shopping-cart', color: 'blue', route: '/orders' },
  order_shipped: { icon: 'truck', color: 'indigo', route: '/orders' },
  order_delivered: { icon: 'check-circle', color: 'green', route: '/orders' },
  order_cancelled: { icon: 'x-circle', color: 'red', route: '/orders' },
  prescription_dispensed: { icon: 'clipboard', color: 'teal', route: '/prescriptions' },
  product_added: { icon: 'package-plus', color: 'green', route: '/products' },
  product_updated: { icon: 'package', color: 'blue', route: '/products' },
  stock_adjusted: { icon: 'layers', color: 'orange', route: '/inventory' },
  customer_registered: { icon: 'user-plus', color: 'purple', route: '/customers' },
  payment_received: { icon: 'credit-card', color: 'green', route: '/orders' }
};

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private readonly router = inject(Router);

  private readonly _activities = signal<Activity[]>([]);

  readonly activities = computed(() => this._activities());
  readonly recentActivities = computed(() => this._activities().slice(0, 10));
  readonly todayActivities = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this._activities().filter(a => new Date(a.timestamp) >= today);
  });

  constructor() {
    this.loadActivities();
  }

  // Log a new activity
  logActivity(
    type: ActivityType,
    title: string,
    description: string,
    options?: {
      entityId?: string;
      entityType?: 'order' | 'product' | 'customer' | 'prescription';
      metadata?: Record<string, unknown>;
    }
  ): void {
    const activity: Activity = {
      id: this.generateId(),
      type,
      title,
      description,
      timestamp: new Date(),
      entityId: options?.entityId,
      entityType: options?.entityType,
      metadata: options?.metadata
    };

    this._activities.update(activities => [activity, ...activities]);
    this.saveActivities();
  }

  // Convenience methods for common activities
  logOrderCreated(orderNumber: string, customerName: string, orderId: string): void {
    this.logActivity(
      'order_created',
      'New Order Created',
      `Order #${orderNumber} placed by ${customerName}`,
      { entityId: orderId, entityType: 'order' }
    );
  }

  logOrderShipped(orderNumber: string, orderId: string): void {
    this.logActivity(
      'order_shipped',
      'Order Shipped',
      `Order #${orderNumber} has been shipped`,
      { entityId: orderId, entityType: 'order' }
    );
  }

  logOrderDelivered(orderNumber: string, orderId: string): void {
    this.logActivity(
      'order_delivered',
      'Order Delivered',
      `Order #${orderNumber} has been delivered`,
      { entityId: orderId, entityType: 'order' }
    );
  }

  logPrescriptionDispensed(prescriptionNumber: string, patientName: string, prescriptionId: string): void {
    this.logActivity(
      'prescription_dispensed',
      'Prescription Dispensed',
      `Prescription #${prescriptionNumber} for ${patientName}`,
      { entityId: prescriptionId, entityType: 'prescription' }
    );
  }

  logProductAdded(productName: string, productId: string): void {
    this.logActivity(
      'product_added',
      'Product Added',
      `${productName} added to inventory`,
      { entityId: productId, entityType: 'product' }
    );
  }

  logStockAdjusted(productName: string, quantity: number, productId: string): void {
    const direction = quantity > 0 ? 'increased' : 'decreased';
    this.logActivity(
      'stock_adjusted',
      'Stock Adjusted',
      `${productName} stock ${direction} by ${Math.abs(quantity)}`,
      { entityId: productId, entityType: 'product', metadata: { quantity } }
    );
  }

  logCustomerRegistered(customerName: string, customerId: string): void {
    this.logActivity(
      'customer_registered',
      'New Customer',
      `${customerName} registered as a new customer`,
      { entityId: customerId, entityType: 'customer' }
    );
  }

  logPaymentReceived(orderNumber: string, amount: number, orderId: string): void {
    this.logActivity(
      'payment_received',
      'Payment Received',
      `Payment of ${amount.toFixed(2)} KM received for Order #${orderNumber}`,
      { entityId: orderId, entityType: 'order', metadata: { amount } }
    );
  }

  // Get config for activity type
  getConfig(type: ActivityType): ActivityConfig {
    return ACTIVITY_CONFIGS[type];
  }

  // Navigate to entity
  navigateToEntity(activity: Activity): void {
    const config = this.getConfig(activity.type);
    if (activity.entityId && activity.entityType) {
      this.router.navigate([`/${activity.entityType}s`, activity.entityId]);
    } else if (config.route) {
      this.router.navigate([config.route]);
    }
  }

  // Clear all activities
  clearActivities(): void {
    this._activities.set([]);
    this.saveActivities();
  }

  // Format relative time
  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;

    return new Date(date).toLocaleDateString();
  }

  // Private methods
  private generateId(): string {
    return `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadActivities(): void {
    try {
      const stored = localStorage.getItem('pharma_activities');
      if (stored) {
        const parsed = JSON.parse(stored);
        const activities = parsed.map((a: Activity) => ({
          ...a,
          timestamp: new Date(a.timestamp)
        }));
        this._activities.set(activities);
      } else {
        // Add some demo activities for first use
        this.addDemoActivities();
      }
    } catch {
      console.warn('Failed to load activities');
      this.addDemoActivities();
    }
  }

  private saveActivities(): void {
    try {
      // Keep only last 100 activities
      const toSave = this._activities().slice(0, 100);
      localStorage.setItem('pharma_activities', JSON.stringify(toSave));
    } catch {
      console.warn('Failed to save activities');
    }
  }

  private addDemoActivities(): void {
    const now = new Date();
    const activities: Activity[] = [
      {
        id: 'demo-1',
        type: 'order_created',
        title: 'New Order Created',
        description: 'Order #ORD-2024-0042 placed by Apoteka Centar',
        timestamp: new Date(now.getTime() - 15 * 60000),
        entityType: 'order'
      },
      {
        id: 'demo-2',
        type: 'prescription_dispensed',
        title: 'Prescription Dispensed',
        description: 'Prescription #RX-12345 for Marko Marković',
        timestamp: new Date(now.getTime() - 45 * 60000),
        entityType: 'prescription'
      },
      {
        id: 'demo-3',
        type: 'stock_adjusted',
        title: 'Stock Adjusted',
        description: 'Aspirin 500mg stock increased by 100',
        timestamp: new Date(now.getTime() - 2 * 3600000),
        entityType: 'product'
      },
      {
        id: 'demo-4',
        type: 'order_delivered',
        title: 'Order Delivered',
        description: 'Order #ORD-2024-0039 has been delivered',
        timestamp: new Date(now.getTime() - 4 * 3600000),
        entityType: 'order'
      },
      {
        id: 'demo-5',
        type: 'customer_registered',
        title: 'New Customer',
        description: 'Ljekarna Nova registered as a new customer',
        timestamp: new Date(now.getTime() - 24 * 3600000),
        entityType: 'customer'
      }
    ];

    this._activities.set(activities);
    this.saveActivities();
  }
}
