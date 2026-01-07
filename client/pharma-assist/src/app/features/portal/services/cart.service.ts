import { Injectable, signal, computed, effect } from '@angular/core';
import { CartItem, ShoppingCart, ProductCatalogItem, PriceType } from '../models/portal.model';

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

  // Computed cart summary with split invoice calculations
  cart = computed<ShoppingCart>(() => {
    const items = this.cartItems();
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = subtotal * this.taxRate;
    const discount = 0; // Could be applied based on promotions
    const total = subtotal + tax - discount;

    // Calculate split invoice totals
    const commercialItems = items.filter(item => item.priceType === PriceType.Commercial);
    const essentialItems = items.filter(item => item.priceType === PriceType.Essential);

    const commercialSubtotal = commercialItems.reduce((sum, item) => sum + item.subtotal, 0);
    const commercialTax = commercialSubtotal * this.taxRate;
    const commercialTotal = commercialSubtotal + commercialTax;

    const essentialSubtotal = essentialItems.reduce((sum, item) => sum + item.subtotal, 0);
    const essentialTax = essentialSubtotal * this.taxRate;
    const essentialTotal = essentialSubtotal + essentialTax;

    return {
      items,
      subtotal,
      tax,
      discount,
      total,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      lastUpdated: new Date(),
      commercialSubtotal,
      commercialTax,
      commercialTotal,
      essentialSubtotal,
      essentialTax,
      essentialTotal
    };
  });

  // Quick access computed values
  itemCount = computed(() => this.cart().itemCount);
  isEmpty = computed(() => this.cartItems().length === 0);
  subtotal = computed(() => this.cart().subtotal);
  total = computed(() => this.cart().total);

  // Split invoice computed values
  commercialItems = computed(() => this.cartItems().filter(item => item.priceType === PriceType.Commercial));
  essentialItems = computed(() => this.cartItems().filter(item => item.priceType === PriceType.Essential));
  hasCommercialItems = computed(() => this.commercialItems().length > 0);
  hasEssentialItems = computed(() => this.essentialItems().length > 0);
  hasMixedPriceTypes = computed(() => this.hasCommercialItems() && this.hasEssentialItems());

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
   * @param product Product or existing cart item
   * @param quantity Quantity to add
   * @param batchId Optional batch ID for batch-specific orders
   * @param batchNumber Optional batch number for display
   * @param expiryDate Optional expiry date for this specific batch
   * @param priceType Optional price type (Commercial or Essential)
   */
  addItem(
    product: ProductCatalogItem | CartItem,
    quantity: number = 1,
    batchId?: string,
    batchNumber?: string,
    expiryDate?: string,
    priceType?: PriceType
  ): void {
    // Check if it's already a CartItem (has productId as string and subtotal)
    const isCartItem = 'productId' in product && 'subtotal' in product;

    const productId = isCartItem ? (product as CartItem).productId : (product as ProductCatalogItem).id;

    // For batch-specific items, use both productId and batchId for uniqueness
    // Also differentiate by price type - same product can be added with different price types
    const itemPriceType = priceType ?? PriceType.Commercial;
    const itemKey = batchId ? `${productId}-${batchId}-${itemPriceType}` : `${productId}-${itemPriceType}`;

    const existingIndex = this.cartItems().findIndex(
      item => {
        const existingKey = item.batchId
          ? `${item.productId}-${item.batchId}-${item.priceType}`
          : `${item.productId}-${item.priceType}`;
        return existingKey === itemKey;
      }
    );

    if (existingIndex >= 0) {
      // Update existing item quantity
      const existingItem = this.cartItems()[existingIndex];
      this.updateQuantity(existingItem.productId, existingItem.quantity + quantity, existingItem.batchId);
    } else {
      // Add new item
      let newItem: CartItem;

      if (isCartItem) {
        const cartItem = product as CartItem;
        newItem = {
          ...cartItem,
          batchId: batchId || cartItem.batchId,
          batchNumber: batchNumber || cartItem.batchNumber,
          expiryDate: expiryDate || cartItem.expiryDate,
          quantity: cartItem.quantity || quantity,
          subtotal: cartItem.unitPrice * (cartItem.quantity || quantity),
          priceType: priceType ?? cartItem.priceType ?? PriceType.Commercial
        };
      } else {
        const catalogItem = product as ProductCatalogItem;
        // Determine the price based on price type
        const effectivePriceType = priceType ?? PriceType.Commercial;
        const unitPrice = effectivePriceType === PriceType.Essential && catalogItem.essentialPrice
          ? catalogItem.essentialPrice
          : (catalogItem.commercialPrice ?? catalogItem.customerPrice ?? catalogItem.unitPrice);

        newItem = {
          productId: catalogItem.id,
          batchId,
          batchNumber,
          productName: catalogItem.name,
          productCode: catalogItem.code,
          manufacturer: catalogItem.manufacturer,
          packSize: catalogItem.packSize,
          expiryDate: expiryDate || catalogItem.earliestExpiryDate || undefined,
          unitPrice,
          quantity: Math.min(quantity, catalogItem.stockQuantity),
          maxQuantity: catalogItem.stockQuantity,
          imageUrl: catalogItem.imageUrl,
          subtotal: unitPrice * quantity,
          priceType: effectivePriceType
        };
      }

      this.cartItems.update(items => [...items, newItem]);
    }
  }

  /**
   * Remove item from cart
   * @param productId Product ID
   * @param batchId Optional batch ID for batch-specific removal
   */
  removeItem(productId: string, batchId?: string): void {
    this.cartItems.update(items =>
      items.filter(item => {
        if (batchId) {
          return !(item.productId === productId && item.batchId === batchId);
        }
        return item.productId !== productId;
      })
    );
  }

  /**
   * Update item quantity
   * @param productId Product ID
   * @param quantity New quantity
   * @param batchId Optional batch ID for batch-specific updates
   */
  updateQuantity(productId: string, quantity: number, batchId?: string): void {
    if (quantity <= 0) {
      this.removeItem(productId, batchId);
      return;
    }

    this.cartItems.update(items =>
      items.map(item => {
        const isMatch = batchId
          ? (item.productId === productId && item.batchId === batchId)
          : item.productId === productId;

        if (isMatch) {
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
  incrementQuantity(productId: string, batchId?: string): void {
    const item = this.cartItems().find(i => {
      return batchId
        ? (i.productId === productId && i.batchId === batchId)
        : i.productId === productId;
    });
    if (item && item.quantity < item.maxQuantity) {
      this.updateQuantity(productId, item.quantity + 1, batchId);
    }
  }

  /**
   * Decrement item quantity
   */
  decrementQuantity(productId: string, batchId?: string): void {
    const item = this.cartItems().find(i => {
      return batchId
        ? (i.productId === productId && i.batchId === batchId)
        : i.productId === productId;
    });
    if (item) {
      this.updateQuantity(productId, item.quantity - 1, batchId);
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
        issues.push(`${item.productName}: Quantity exceeds available stock`);
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
