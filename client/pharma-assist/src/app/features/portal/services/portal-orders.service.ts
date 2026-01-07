import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PortalOrder {
  id: number;
  orderNumber: string;
  orderDate: string;
  requiredDate?: string;
  shippedDate?: string;
  deliveredDate?: string;
  status: OrderStatus;
  statusName: string;
  subTotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentStatusName: string;
  paymentMethod: PaymentMethod;
  paymentMethodName: string;
  notes?: string;
  cancellationReason?: string;
  itemCount: number;
  items?: OrderItem[];
  shippingAddress?: Address;
  billingAddress?: Address;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  batchNumber?: string;
  /** Price type: 1 = Commercial, 2 = Essential */
  priceType: number;
}

export interface Address {
  street: string;
  street2?: string;
  city: string;
  postalCode: string;
  canton?: string;
  country: string;
}

export interface CreateOrderRequest {
  shippingAddressId?: number;
  billingAddressId?: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  items: CreateOrderItemRequest[];
}

export interface CreateOrderItemRequest {
  productId: number;
  quantity: number;
  /** The unit price to use for this order item (pre-calculated from pricing system) */
  unitPrice?: number;
  /** The price type: 1 = Commercial, 2 = Essential */
  priceType?: number;
}

export interface PagedResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

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

export enum PaymentStatus {
  Pending = 1,
  PartiallyPaid = 2,
  Paid = 3,
  Refunded = 4,
  Failed = 5
}

export enum PaymentMethod {
  Cash = 1,
  CashOnDelivery = 2,
  BankTransfer = 3,
  CreditCard = 4,
  Invoice = 5
}

@Injectable({
  providedIn: 'root'
})
export class PortalOrdersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/portal`;

  /**
   * Get customer's orders with pagination
   */
  getMyOrders(page = 1, pageSize = 10, status?: OrderStatus, fromDate?: Date, toDate?: Date): Observable<PagedResponse<PortalOrder>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (status !== undefined) params = params.set('status', status.toString());
    if (fromDate) params = params.set('fromDate', fromDate.toISOString());
    if (toDate) params = params.set('toDate', toDate.toISOString());

    return this.http.get<PagedResponse<PortalOrder>>(`${this.apiUrl}/orders`, { params });
  }

  /**
   * Get order by ID
   */
  getOrderById(id: number): Observable<ApiResponse<PortalOrder>> {
    return this.http.get<ApiResponse<PortalOrder>>(`${this.apiUrl}/orders/${id}`);
  }

  /**
   * Get order by order number
   */
  getOrderByNumber(orderNumber: string): Observable<ApiResponse<PortalOrder>> {
    return this.http.get<ApiResponse<PortalOrder>>(`${this.apiUrl}/orders/number/${orderNumber}`);
  }

  /**
   * Cancel an order
   */
  cancelOrder(orderId: number, reason: string): Observable<ApiResponse<PortalOrder>> {
    return this.http.post<ApiResponse<PortalOrder>>(`${this.apiUrl}/orders/${orderId}/cancel`, { reason });
  }

  /**
   * Create a new order
   */
  createOrder(order: CreateOrderRequest): Observable<ApiResponse<PortalOrder>> {
    return this.http.post<ApiResponse<PortalOrder>>(`${this.apiUrl}/orders`, order);
  }

  /**
   * Reorder items from a previous order
   */
  reorder(orderId: number): Observable<ApiResponse<PortalOrder>> {
    return this.http.post<ApiResponse<PortalOrder>>(`${this.apiUrl}/orders/${orderId}/reorder`, {});
  }

  /**
   * Download invoice PDF for an order
   */
  downloadInvoice(orderId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/orders/${orderId}/invoice`, { responseType: 'blob' });
  }

  /**
   * Download split invoices (Commercial & Essential) for an order with mixed price types
   * @param orderId Order ID
   * @param priceType 1 = Commercial, 2 = Essential
   */
  downloadSplitInvoice(orderId: number, priceType: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/orders/${orderId}/invoice/split/${priceType}`, { responseType: 'blob' });
  }

  /**
   * Get status display name
   */
  getStatusDisplayName(status: OrderStatus): string {
    const statusNames: Record<OrderStatus, string> = {
      [OrderStatus.Pending]: 'Na čekanju',
      [OrderStatus.Confirmed]: 'Potvrđeno',
      [OrderStatus.Processing]: 'U obradi',
      [OrderStatus.ReadyForShipment]: 'Spremno za slanje',
      [OrderStatus.Shipped]: 'Poslano',
      [OrderStatus.Delivered]: 'Dostavljeno',
      [OrderStatus.Cancelled]: 'Otkazano',
      [OrderStatus.Returned]: 'Vraćeno'
    };
    return statusNames[status] || 'Nepoznato';
  }

  /**
   * Check if order can be cancelled
   */
  canCancelOrder(status: OrderStatus): boolean {
    return status === OrderStatus.Pending || status === OrderStatus.Confirmed;
  }

  /**
   * Check if order can have claims filed against it
   */
  canFileClaim(status: OrderStatus): boolean {
    return status === OrderStatus.Shipped || status === OrderStatus.Delivered;
  }

  /**
   * Get portal dashboard statistics
   */
  getStats(): Observable<ApiResponse<PortalDashboardStats>> {
    return this.http.get<ApiResponse<PortalDashboardStats>>(`${this.apiUrl}/stats`);
  }
}

export interface PortalDashboardStats {
  pendingOrders: number;
  totalOrders: number;
  favoriteCount: number;
  cartItemCount: number;
}
