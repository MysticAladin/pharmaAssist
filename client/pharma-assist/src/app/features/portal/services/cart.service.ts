import { Injectable, signal, computed, effect } from '@angular/core';
import { CartItem, ShoppingCart, ProductCatalogItem } from '../models/portal.model';

const CART_STORAGE_KEY = 'pharma_cart';

/**
 * Shopping Cart Service
 * Manages the customer's shopping cart with localStorage persistence
 */
@Injectable({
  providedIn: 'root'
})
export class CartService {
  // Cart state
  private cartItems = signal<CartItem[]>([]);

  // Tax rate (could be configurable)
  private taxRate = 0.17; // 17% VAT

  // Computed cart summary
  cart = computed<ShoppingCart>(() => {
    const items = this.cartItems();
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = subtotal * this.taxRate;
    const discount = 0; // Could be applied based on promotions
    const total = subtotal + tax - discount;

    return {
      items,
      subtotal,
      tax,
      discount,
      total,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      lastUpdated: new Date()
    };
  });

  // Quick access computed values
  itemCount = computed(() => this.cart().itemCount);
  isEmpty = computed(() => this.cartItems().length === 0);
  subtotal = computed(() => this.cart().subtotal);
  total = computed(() => this.cart().total);

  constructor() {
    // Load cart from localStorage
    this.loadCart();

    // Auto-save cart changes
    effect(() => {
      const items = this.cartItems();
      this.saveCart(items);
    });
  }

  /**
   * Add product to cart
   */
  addItem(product: ProductCatalogItem | CartItem, quantity: number = 1): void {
    // Check if it's already a CartItem (has productId as string and subtotal)
    const isCartItem = 'productId' in product && 'subtotal' in product;

    const productId = isCartItem ? (product as CartItem).productId : (product as ProductCatalogItem).id;

    const existingIndex = this.cartItems().findIndex(
      item => item.productId === productId
    );

    if (existingIndex >= 0) {
      // Update existing item quantity
      this.updateQuantity(productId, this.cartItems()[existingIndex].quantity + quantity);
    } else {
      // Add new item
      let newItem: CartItem;

      if (isCartItem) {
        const cartItem = product as CartItem;
        newItem = {
          ...cartItem,
          quantity: cartItem.quantity || quantity,
          subtotal: cartItem.unitPrice * (cartItem.quantity || quantity)
        };
      } else {
        const catalogItem = product as ProductCatalogItem;
        newItem = {
          productId: catalogItem.id,
          productName: catalogItem.name,
          productCode: catalogItem.code,
          manufacturer: catalogItem.manufacturer,
          unitPrice: catalogItem.customerPrice ?? catalogItem.unitPrice,
          quantity: Math.min(quantity, catalogItem.stockQuantity),
          maxQuantity: catalogItem.stockQuantity,
          imageUrl: catalogItem.imageUrl,
          subtotal: (catalogItem.customerPrice ?? catalogItem.unitPrice) * quantity
        };
      }

      this.cartItems.update(items => [...items, newItem]);
    }
  }

  /**
   * Remove item from cart
   */
  removeItem(productId: string): void {
    this.cartItems.update(items =>
      items.filter(item => item.productId !== productId)
    );
  }

  /**
   * Update item quantity
   */
  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }

    this.cartItems.update(items =>
      items.map(item => {
        if (item.productId === productId) {
          const newQty = Math.min(quantity, item.maxQuantity);
          return {
            ...item,
            quantity: newQty,
            subtotal: item.unitPrice * newQty
          };
        }
        return item;
      })
    );
  }

  /**
   * Increment item quantity
   */
  incrementQuantity(productId: string): void {
    const item = this.cartItems().find(i => i.productId === productId);
    if (item && item.quantity < item.maxQuantity) {
      this.updateQuantity(productId, item.quantity + 1);
    }
  }

  /**
   * Decrement item quantity
   */
  decrementQuantity(productId: string): void {
    const item = this.cartItems().find(i => i.productId === productId);
    if (item) {
      this.updateQuantity(productId, item.quantity - 1);
    }
  }

  /**
   * Check if product is in cart
   */
  isInCart(productId: string): boolean {
    return this.cartItems().some(item => item.productId === productId);
  }

  /**
   * Get quantity of product in cart
   */
  getQuantity(productId: string): number {
    const item = this.cartItems().find(i => i.productId === productId);
    return item?.quantity ?? 0;
  }

  /**
   * Clear entire cart
   */
  clearCart(): void {
    this.cartItems.set([]);
  }

  /**
   * Add multiple items (for quick order / reorder)
   */
  addItems(items: { productId: string; product: ProductCatalogItem; quantity: number }[]): void {
    items.forEach(({ product, quantity }) => {
      this.addItem(product, quantity);
    });
  }

  /**
   * Load cart from localStorage
   */
  private loadCart(): void {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const items = JSON.parse(stored) as CartItem[];
        this.cartItems.set(items);
      }
    } catch (error) {
      console.error('Failed to load cart from storage:', error);
      this.cartItems.set([]);
    }
  }

  /**
   * Save cart to localStorage
   */
  private saveCart(items: CartItem[]): void {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save cart to storage:', error);
    }
  }

  /**
   * Validate cart items (check stock availability)
   */
  async validateCart(): Promise<{ valid: boolean; issues: string[] }> {
    // This would call the API to verify stock levels
    // For now, return valid
    const issues: string[] = [];

    for (const item of this.cartItems()) {
      if (item.quantity > item.maxQuantity) {
        issues.push(`${item.productName}: Only ${item.maxQuantity} available`);
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Apply discount code
   */
  applyDiscount(code: string): Promise<{ success: boolean; discount: number; message: string }> {
    // This would call the API to validate and apply discount
    return Promise.resolve({
      success: false,
      discount: 0,
      message: 'Discount codes not yet implemented'
    });
  }
}
