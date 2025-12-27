// Order status enum matching backend
export enum OrderStatus {
  Pending = 1,
  Confirmed = 2,
  Processing = 3,
  ReadyForShipment = 4,
  Shipped = 5,
  Delivered = 6,
  Cancelled = 7,
  Returned = 8
}

// Payment status enum matching backend
export enum PaymentStatus {
  Pending = 1,
  PartiallyPaid = 2,
  Paid = 3,
  Refunded = 4,
  Failed = 5
}

// Payment method enum matching backend
export enum PaymentMethod {
  Cash = 1,
  CashOnDelivery = 2,
  BankTransfer = 3,
  CreditCard = 4,
  Invoice = 5
}

// Order item interface
export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productSku: string;
  productBatchId?: number;
  batchNumber?: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  prescriptionId?: number;
}

// Prescription interface
export interface Prescription {
  id: number;
  orderId: number;
  prescriptionNumber: string;
  doctorName: string;
  doctorLicense?: string;
  patientName?: string;
  issueDate: Date | string;
  expiryDate?: Date | string;
  imageUrl?: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date | string;
  notes?: string;
}

// Full order interface
export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerCode: string;
  customerEmail?: string;
  customerPhone?: string;
  status: OrderStatus;
  statusName: string;
  paymentStatus: PaymentStatus;
  paymentStatusName: string;
  paymentMethod?: PaymentMethod;
  orderDate: Date | string;
  requiredDate?: Date | string;
  shippedDate?: Date | string;
  deliveredDate?: Date | string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  paidAmount?: number;
  notes?: string;
  internalNotes?: string;
  shippingAddressId?: number;
  shippingAddress?: string;
  billingAddressId?: number;
  billingAddress?: string;
  items: OrderItem[];
  prescriptions: Prescription[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Summary interface for list view
export interface OrderSummary {
  id: number;
  orderNumber: string;
  customerName: string;
  customerCode: string;
  status: OrderStatus;
  statusName: string;
  paymentStatus: PaymentStatus;
  paymentStatusName: string;
  orderDate: Date | string;
  totalAmount: number;
  itemCount: number;
}

// Create order DTO
export interface CreateOrderDto {
  customerId: number;
  shippingAddressId?: number;
  billingAddressId?: number;
  paymentMethod?: PaymentMethod;
  requiredDate?: Date | string;
  notes?: string;
  items: CreateOrderItemDto[];
}

export interface CreateOrderItemDto {
  productId: number;
  productBatchId?: number;
  quantity: number;
  discountPercentage?: number;
  prescriptionId?: number;
}

// Update order DTO
export interface UpdateOrderDto {
  shippingAddressId?: number;
  billingAddressId?: number;
  requiredDate?: Date | string;
  notes?: string;
  internalNotes?: string;
}

// Update order status DTO
export interface UpdateOrderStatusDto {
  status: OrderStatus;
  notes?: string;
}

// Update payment status DTO
export interface UpdatePaymentStatusDto {
  paymentStatus: PaymentStatus;
  paidAmount?: number;
  paymentReference?: string;
  notes?: string;
}

// Order filter interface
export interface OrderFilter {
  searchTerm?: string;
  customerId?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  fromDate?: Date;
  toDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  hasPrescription?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

// Helper functions
export function getOrderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    [OrderStatus.Pending]: 'orders.status.pending',
    [OrderStatus.Confirmed]: 'orders.status.confirmed',
    [OrderStatus.Processing]: 'orders.status.processing',
    [OrderStatus.ReadyForShipment]: 'orders.status.readyForShipment',
    [OrderStatus.Shipped]: 'orders.status.shipped',
    [OrderStatus.Delivered]: 'orders.status.delivered',
    [OrderStatus.Cancelled]: 'orders.status.cancelled',
    [OrderStatus.Returned]: 'orders.status.returned'
  };
  return labels[status] || 'common.unknown';
}

export function getOrderStatusColor(status: OrderStatus): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  const colors: Record<OrderStatus, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
    [OrderStatus.Pending]: 'warning',
    [OrderStatus.Confirmed]: 'info',
    [OrderStatus.Processing]: 'info',
    [OrderStatus.ReadyForShipment]: 'info',
    [OrderStatus.Shipped]: 'info',
    [OrderStatus.Delivered]: 'success',
    [OrderStatus.Cancelled]: 'danger',
    [OrderStatus.Returned]: 'warning'
  };
  return colors[status] || 'default';
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    [PaymentStatus.Pending]: 'orders.paymentStatus.pending',
    [PaymentStatus.PartiallyPaid]: 'orders.paymentStatus.partiallyPaid',
    [PaymentStatus.Paid]: 'orders.paymentStatus.paid',
    [PaymentStatus.Refunded]: 'orders.paymentStatus.refunded',
    [PaymentStatus.Failed]: 'orders.paymentStatus.failed'
  };
  return labels[status] || 'common.unknown';
}

export function getPaymentStatusColor(status: PaymentStatus): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  const colors: Record<PaymentStatus, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
    [PaymentStatus.Pending]: 'warning',
    [PaymentStatus.PartiallyPaid]: 'info',
    [PaymentStatus.Paid]: 'success',
    [PaymentStatus.Refunded]: 'warning',
    [PaymentStatus.Failed]: 'danger'
  };
  return colors[status] || 'default';
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    [PaymentMethod.Cash]: 'orders.paymentMethod.cash',
    [PaymentMethod.CashOnDelivery]: 'orders.paymentMethod.cashOnDelivery',
    [PaymentMethod.BankTransfer]: 'orders.paymentMethod.bankTransfer',
    [PaymentMethod.CreditCard]: 'orders.paymentMethod.creditCard',
    [PaymentMethod.Invoice]: 'orders.paymentMethod.invoice'
  };
  return labels[method] || 'common.unknown';
}
