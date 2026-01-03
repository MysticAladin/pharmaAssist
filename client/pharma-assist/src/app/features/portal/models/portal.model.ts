// Portal Models
// Models specific to the e-pharmacy customer portal

/**
 * Price classification for medicines
 * Commercial - standard commercial pricing
 * Essential - essential medicines list (often with regulated pricing)
 */
export enum PriceType {
  Commercial = 'commercial',
  Essential = 'essential'
}

export interface CartItem {
  productId: string;
  productName: string;
  productCode: string;
  manufacturer: string;
  packSize?: string;
  earliestExpiryDate?: string | null;
  unitPrice: number;
  quantity: number;
  maxQuantity: number; // Available stock
  imageUrl?: string;
  subtotal: number;
  priceType: PriceType; // Commercial or Essential classification
}

export interface ShoppingCart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  itemCount: number;
  lastUpdated: Date;
  // Split invoice calculations
  commercialSubtotal: number;
  commercialTax: number;
  commercialTotal: number;
  essentialSubtotal: number;
  essentialTax: number;
  essentialTotal: number;
}

export interface DeliveryAddress {
  id?: string;
  label: string; // "Main Office", "Warehouse", etc.
  street: string;
  city: string;
  postalCode: string;
  canton: string;
  country: string;
  contactPerson?: string;
  contactPhone?: string;
  isDefault: boolean;
}

export interface DeliveryOption {
  id: string;
  name: string;
  description: string;
  estimatedDays: number;
  price: number;
  icon: string;
}

export const DELIVERY_OPTIONS: DeliveryOption[] = [
  {
    id: 'standard',
    name: 'Standard Delivery',
    description: 'Delivery within 3-5 business days',
    estimatedDays: 5,
    price: 0,
    icon: 'truck'
  },
  {
    id: 'express',
    name: 'Express Delivery',
    description: 'Delivery within 1-2 business days',
    estimatedDays: 2,
    price: 15,
    icon: 'rocket'
  },
  {
    id: 'same-day',
    name: 'Same Day Delivery',
    description: 'Delivery today (order before 12:00)',
    estimatedDays: 0,
    price: 35,
    icon: 'flash'
  }
];

export enum PaymentMethod {
  Invoice = 'invoice',
  BankTransfer = 'bank-transfer'
}

export interface PaymentInfo {
  method: PaymentMethod;
  purchaseOrderNumber?: string;
  notes?: string;
  splitInvoice: boolean; // Option to split invoice by price type
}

export interface InvoiceSummary {
  invoiceNumber?: string;
  priceType: PriceType;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  invoiceUrl?: string;
}

export interface CheckoutData {
  deliveryAddress: DeliveryAddress;
  deliveryOption: DeliveryOption;
  payment: PaymentInfo;
  cart: ShoppingCart;
  specialInstructions?: string;
  splitInvoice: boolean;
}

export interface PortalOrder {
  id: string;
  orderNumber: string;
  status: PortalOrderStatus;
  placedAt: Date;
  items: CartItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: DeliveryAddress;
  deliveryOption: string;
  paymentMethod: PaymentMethod;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  trackingNumber?: string;
  invoiceUrl?: string;
  // Split invoice support
  splitInvoice: boolean;
  invoices?: InvoiceSummary[]; // When splitInvoice is true, contains Commercial and Essential invoices
}

export enum PortalOrderStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Processing = 'processing',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Cancelled = 'cancelled'
}

export const PORTAL_ORDER_STATUS_LABELS: Record<PortalOrderStatus, string> = {
  [PortalOrderStatus.Pending]: 'Pending',
  [PortalOrderStatus.Confirmed]: 'Confirmed',
  [PortalOrderStatus.Processing]: 'Processing',
  [PortalOrderStatus.Shipped]: 'Shipped',
  [PortalOrderStatus.Delivered]: 'Delivered',
  [PortalOrderStatus.Cancelled]: 'Cancelled'
};

export const PORTAL_ORDER_STATUS_COLORS: Record<PortalOrderStatus, string> = {
  [PortalOrderStatus.Pending]: 'warning',
  [PortalOrderStatus.Confirmed]: 'info',
  [PortalOrderStatus.Processing]: 'primary',
  [PortalOrderStatus.Shipped]: 'accent',
  [PortalOrderStatus.Delivered]: 'success',
  [PortalOrderStatus.Cancelled]: 'danger'
};

export interface ProductCatalogItem {
  id: string;
  code: string;
  name: string;
  genericName?: string;
  manufacturer: string;
  manufacturerId: string;
  category: string;
  categoryId: string;
  description?: string;
  unitPrice: number;
  priceType: PriceType; // Commercial or Essential classification
  customerPrice?: number; // Customer-specific pricing
  stockQuantity: number;
  isAvailable: boolean;
  earliestExpiryDate?: string | null;
  imageUrl?: string;
  requiresPrescription: boolean;
  dosageForm?: string;
  strength?: string;
  packSize?: string;
}

export interface ProductFilter {
  search?: string;
  category?: string; // Category slug/name for nav links (e.g., 'medications', 'medical-supplies')
  categoryId?: string;
  manufacturerId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  requiresPrescription?: boolean;
}

export interface CategoryNode {
  id: string;
  name: string;
  icon?: string;
  productCount: number;
  children?: CategoryNode[];
}

export interface QuickOrderItem {
  sku: string; // SKU or product code
  quantity: number;
  productId?: string;
  productName?: string;
  unitPrice?: number;
  inStock?: boolean;
  error?: string;
  priceType?: PriceType;
}

export interface Favorite {
  productId: string;
  product: ProductCatalogItem;
  addedAt: Date;
}

export interface ReorderSuggestion {
  product: ProductCatalogItem;
  lastOrderDate: Date;
  usualQuantity: number;
  daysUntilReorder?: number;
}
