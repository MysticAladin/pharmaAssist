/**
 * DTOs and models for sales representative order taking
 */

import { OrderStatus, PaymentStatus } from './order.model';
import { CustomerTier, CustomerType } from './customer.model';

// ============= Rep Order DTOs =============

/**
 * Create order request from sales rep
 */
export interface CreateRepOrder {
  customerId: number;
  visitId?: number;
  items: CreateRepOrderItem[];
  notes?: string;
  deviceId?: string;
  offlineCreatedAt?: Date;
}

/**
 * Order item for rep order creation
 */
export interface CreateRepOrderItem {
  productId: number;
  quantity: number;
  unitPrice?: number;
  discount?: number;
}

/**
 * Rep order summary for lists
 */
export interface RepOrderSummary {
  orderId: number;
  orderNumber: string;
  orderDate: Date;
  customerId: number;
  customerName: string;
  status: OrderStatus;
  statusName: string;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  itemCount: number;
  createdDuringVisit: boolean;
  visitId?: number;
}

/**
 * Filter for rep's orders
 */
export interface RepOrderFilter {
  customerId?: number;
  status?: OrderStatus;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}

/**
 * Result for rep order list
 */
export interface RepOrderResult {
  orders: RepOrderSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Statistics for rep's orders
 */
export interface RepOrderStats {
  totalOrders: number;
  pendingOrders: number;
  totalOrderValue: number;
  averageOrderValue: number;
  ordersThisMonth: number;
  orderValueThisMonth: number;
  ordersThisWeek: number;
  ordersByStatus: Record<string, number>;
}

// ============= Rep Customer DTOs =============

/**
 * Customer summary for sales rep's assigned customers
 */
export interface RepCustomer {
  id: number;
  customerCode: string;
  name: string;
  customerType: CustomerType;
  customerTypeName: string;
  tier: CustomerTier;
  tierName: string;
  contactPerson?: string;
  phone?: string;
  email: string;
  city?: string;
  fullAddress?: string;
  creditLimit: number;
  creditUsed: number;
  creditAvailable: number;
  creditWarning: boolean;
  lastVisitDate?: Date;
  lastOrderDate?: Date;
  lastOrderAmount?: number;
  assignedAt: Date;
  isActive: boolean;
}

/**
 * Customer credit status
 */
export interface RepCustomerCredit {
  customerId: number;
  customerName: string;
  creditLimit: number;
  creditUsed: number;
  creditAvailable: number;
  creditUtilization: number;
  paymentTermDays: number;
  overdueAmount: number;
  overdueInvoiceCount: number;
  oldestOverdueDate?: Date;
  canPlaceOrders: boolean;
  creditWarningMessage?: string;
}

/**
 * Customer order history entry for rep
 */
export interface RepCustomerOrder {
  orderId: number;
  orderNumber: string;
  orderDate: Date;
  status: OrderStatus;
  statusName: string;
  totalAmount: number;
  itemCount: number;
  createdByRep: boolean;
  createdDuringVisit: boolean;
  visitId?: number;
}

/**
 * Customer visit history entry for rep
 */
export interface RepCustomerVisit {
  visitId: number;
  visitDate: Date;
  startTime?: string;
  endTime?: string;
  visitType: number;
  visitTypeName: string;
  outcome?: number;
  outcomeName: string;
  notes?: string;
  hasOrders: boolean;
  orderCount: number;
  totalOrderValue?: number;
}

/**
 * Filter for getting assigned customers
 */
export interface RepCustomerFilter {
  search?: string;
  customerType?: CustomerType;
  tier?: CustomerTier;
  needsVisit?: boolean;
  hasCreditWarning?: boolean;
  city?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

/**
 * Result for rep customer list
 */
export interface RepCustomerResult {
  customers: RepCustomer[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Statistics for rep's assigned customers
 */
export interface RepCustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  customersByType: Record<string, number>;
  customersByTier: Record<string, number>;
  customersWithCreditWarning: number;
  customersNeedingVisit: number;
  customersVisitedThisWeek: number;
  customersWithOrdersThisMonth: number;
  totalOrderValueThisMonth: number;
}

// ============= Rep Product DTOs =============

/**
 * Product for rep catalog
 */
export interface RepProduct {
  id: number;
  name: string;
  genericName?: string;
  sku: string;
  manufacturer?: string;
  category?: string;
  unitPrice: number;
  wholesalePrice?: number;
  isAvailable: boolean;
  stockQuantity: number;
  stockWarning: boolean;
  requiresPrescription: boolean;
  description?: string;
  imageUrl?: string;
}

/**
 * Product stock summary
 */
export interface ProductStockSummary {
  productId: number;
  productName: string;
  sku: string;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  warehouseStock: WarehouseStock[];
}

/**
 * Stock per warehouse
 */
export interface WarehouseStock {
  warehouseId: number;
  warehouseName: string;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  isLow: boolean;
}
