import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Order,
  OrderSummary,
  CreateOrderDto,
  UpdateOrderDto,
  UpdateOrderStatusDto,
  UpdatePaymentStatusDto,
  OrderFilter,
  OrderStatus,
  PaymentStatus
} from '../models/order.model';
import { ApiResponse, PagedResponse } from '../models/customer.model';

export type { OrderSummary };

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  success?: boolean;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/orders`;

  /**
   * Get paginated list of orders with optional filtering
   */
  getOrders(
    page: number = 1,
    pageSize: number = 10,
    filter?: OrderFilter
  ): Observable<PaginatedResult<OrderSummary>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (filter) {
      if (filter.searchTerm) {
        params = params.set('searchTerm', filter.searchTerm);
      }
      if (filter.customerId) {
        params = params.set('customerId', filter.customerId);
      }
      if (filter.status !== undefined) {
        params = params.set('status', filter.status.toString());
      }
      if (filter.paymentStatus !== undefined) {
        params = params.set('paymentStatus', filter.paymentStatus.toString());
      }
      if (filter.fromDate) {
        params = params.set('fromDate', filter.fromDate.toISOString());
      }
      if (filter.toDate) {
        params = params.set('toDate', filter.toDate.toISOString());
      }
      if (filter.minAmount !== undefined) {
        params = params.set('minAmount', filter.minAmount.toString());
      }
      if (filter.maxAmount !== undefined) {
        params = params.set('maxAmount', filter.maxAmount.toString());
      }
      if (filter.hasPrescription !== undefined) {
        params = params.set('hasPrescription', filter.hasPrescription.toString());
      }
      if (filter.sortBy) {
        params = params.set('sortBy', filter.sortBy);
      }
      if (filter.sortDirection) {
        params = params.set('sortDirection', filter.sortDirection);
      }
    }

    return this.http
      .get<PagedResponse<OrderSummary>>(`${this.baseUrl}/paged`, { params })
      .pipe(
        map((res) => ({
          data: res.items ?? [],
          totalCount: res.totalCount ?? 0,
          currentPage: res.page ?? page,
          pageSize: res.pageSize ?? pageSize,
          totalPages: res.totalPages ?? 1,
          hasPrevious: res.hasPreviousPage,
          hasNext: res.hasNextPage
        }))
      );
  }

  /**
   * Get a single order by ID with full details
   */
  getOrder(id: number | string): Observable<Order> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map((response) => {
        // API typically returns ApiResponse<Order> { success, data }
        if (response && typeof response === 'object' && 'data' in response) {
          return (response as { data: Order }).data;
        }
        return response as Order;
      })
    );
  }

  /**
   * Get order by order number
   */
  getOrderByNumber(orderNumber: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/number/${orderNumber}`);
  }

  /**
   * Get orders for a specific customer
   */
  getCustomerOrders(customerId: number, page: number = 1, pageSize: number = 10): Observable<PaginatedResult<OrderSummary>> {
    const params = new HttpParams()
      .set('pageNumber', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<PaginatedResult<OrderSummary>>(`${this.baseUrl}/customer/${customerId}`, { params });
  }

  /**
   * Create a new order
   */
  createOrder(order: CreateOrderDto): Observable<Order> {
    return this.http.post<Order>(this.baseUrl, order);
  }

  /**
   * Update an existing order
   */
  updateOrder(id: number, order: UpdateOrderDto): Observable<Order> {
    return this.http.put<Order>(`${this.baseUrl}/${id}`, order);
  }

  /**
   * Update order status
   */
  updateOrderStatus(id: number, statusUpdate: UpdateOrderStatusDto): Observable<Order> {
    return this.http.patch<ApiResponse<Order>>(`${this.baseUrl}/${id}/status`, statusUpdate).pipe(
      map((res) => (res && typeof res === 'object' && 'data' in res ? (res.data as Order) : (res as unknown as Order)))
    );
  }

  /**
   * Update payment status
   */
  updatePaymentStatus(id: number, paymentUpdate: UpdatePaymentStatusDto): Observable<Order> {
    return this.http.patch<ApiResponse<Order>>(`${this.baseUrl}/${id}/payment-status`, paymentUpdate).pipe(
      map((res) => (res && typeof res === 'object' && 'data' in res ? (res.data as Order) : (res as unknown as Order)))
    );
  }

  /**
   * Cancel an order
   */
  cancelOrder(id: number, reason?: string): Observable<Order> {
    const body = (reason ?? '').toString();
    return this.http.patch<ApiResponse<Order>>(`${this.baseUrl}/${id}/cancel`, body).pipe(
      map((res) => (res && typeof res === 'object' && 'data' in res ? (res.data as Order) : (res as unknown as Order)))
    );
  }

  /**
   * Delete an order (soft delete)
   */
  deleteOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get order statistics
   */
  getOrderStats(fromDate?: Date, toDate?: Date): Observable<OrderStats> {
    let params = new HttpParams();
    if (fromDate) {
      params = params.set('fromDate', fromDate.toISOString());
    }
    if (toDate) {
      params = params.set('toDate', toDate.toISOString());
    }
    return this.http.get<{ success: boolean; data: OrderStats }>(`${this.baseUrl}/stats`, { params })
      .pipe(map(response => response.data));
  }

  /**
   * Export orders to CSV/Excel
   */
  exportOrders(filter?: OrderFilter, format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    let params = new HttpParams().set('format', format);

    if (filter) {
      if (filter.searchTerm) {
        params = params.set('searchTerm', filter.searchTerm);
      }
      if (filter.status !== undefined) {
        params = params.set('status', filter.status.toString());
      }
      if (filter.paymentStatus !== undefined) {
        params = params.set('paymentStatus', filter.paymentStatus.toString());
      }
      if (filter.fromDate) {
        params = params.set('fromDate', filter.fromDate.toISOString());
      }
      if (filter.toDate) {
        params = params.set('toDate', filter.toDate.toISOString());
      }
    }

    return this.http.get(`${this.baseUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Add item to order
   */
  addOrderItem(orderId: string, item: { productId: string; quantity: number; batchId?: string }): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/${orderId}/items`, item);
  }

  /**
   * Update order item quantity
   */
  updateOrderItem(orderId: string, itemId: string, quantity: number): Observable<Order> {
    return this.http.patch<Order>(`${this.baseUrl}/${orderId}/items/${itemId}`, { quantity });
  }

  /**
   * Remove item from order
   */
  removeOrderItem(orderId: string, itemId: string): Observable<Order> {
    return this.http.delete<Order>(`${this.baseUrl}/${orderId}/items/${itemId}`);
  }

  /**
   * Add prescription to order
   */
  addPrescription(orderId: string, prescription: FormData): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/${orderId}/prescriptions`, prescription);
  }

  /**
   * Verify prescription
   */
  verifyPrescription(orderId: string, prescriptionId: string, notes?: string): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/${orderId}/prescriptions/${prescriptionId}/verify`, { notes });
  }

  /**
   * Helper method to get available order status options
   */
  getOrderStatusOptions(): { value: OrderStatus; label: string }[] {
    return [
      { value: OrderStatus.Pending, label: 'orders.status.pending' },
      { value: OrderStatus.Confirmed, label: 'orders.status.confirmed' },
      { value: OrderStatus.Processing, label: 'orders.status.processing' },
      { value: OrderStatus.ReadyForShipment, label: 'orders.status.readyForShipment' },
      { value: OrderStatus.Shipped, label: 'orders.status.shipped' },
      { value: OrderStatus.Delivered, label: 'orders.status.delivered' },
      { value: OrderStatus.Cancelled, label: 'orders.status.cancelled' },
      { value: OrderStatus.Returned, label: 'orders.status.returned' }
    ];
  }

  /**
   * Helper method to get available payment status options
   */
  getPaymentStatusOptions(): { value: PaymentStatus; label: string }[] {
    return [
      { value: PaymentStatus.Pending, label: 'orders.paymentStatus.pending' },
      { value: PaymentStatus.PartiallyPaid, label: 'orders.paymentStatus.partiallyPaid' },
      { value: PaymentStatus.Paid, label: 'orders.paymentStatus.paid' },
      { value: PaymentStatus.Refunded, label: 'orders.paymentStatus.refunded' },
      { value: PaymentStatus.Failed, label: 'orders.paymentStatus.failed' }
    ];
  }
}

// Order statistics interface
export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  shippedOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersWithPrescription: number;
}
