import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateRepOrder,
  RepOrderSummary,
  RepOrderFilter,
  RepOrderResult,
  RepOrderStats
} from '../models/rep-order.model';
import {
  PromotionDto,
  PromotionCalculationResult,
  PromoCodeValidationResult,
  ValidatePromoCodeRequest,
  CalculatePromotionsRequest
} from '../../shared/models/promotion.model';

@Injectable({
  providedIn: 'root'
})
export class RepOrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/orders/rep`;

  /**
   * Create a new order as a sales representative
   */
  createOrder(order: CreateRepOrder): Observable<RepOrderSummary> {
    return this.http.post<RepOrderSummary>(`${this.baseUrl}/create`, order);
  }

  /**
   * Get orders created by the current rep with filtering
   */
  getMyOrders(filter: RepOrderFilter = {}): Observable<RepOrderResult> {
    let params = new HttpParams();

    if (filter.customerId) {
      params = params.set('customerId', filter.customerId.toString());
    }
    if (filter.status !== undefined) {
      params = params.set('status', filter.status.toString());
    }
    if (filter.dateFrom) {
      params = params.set('dateFrom', filter.dateFrom.toISOString());
    }
    if (filter.dateTo) {
      params = params.set('dateTo', filter.dateTo.toISOString());
    }
    if (filter.page !== undefined) {
      params = params.set('page', filter.page.toString());
    }
    if (filter.pageSize !== undefined) {
      params = params.set('pageSize', filter.pageSize.toString());
    }

    return this.http.get<RepOrderResult>(`${this.baseUrl}/my-orders`, { params });
  }

  /**
   * Get order statistics for the current rep
   */
  getMyStats(): Observable<RepOrderStats> {
    return this.http.get<RepOrderStats>(`${this.baseUrl}/stats`);
  }

  /**
   * Get recent orders for a customer (for quick re-order)
   */
  getCustomerRecentOrders(customerId: number, count: number = 5): Observable<RepOrderSummary[]> {
    const params = new HttpParams().set('count', count.toString());
    return this.http.get<RepOrderSummary[]>(
      `${this.baseUrl}/customer/${customerId}/recent`,
      { params }
    );
  }

  // ============== PROMOTION METHODS ==============

  /**
   * Get applicable promotions for a customer
   */
  getCustomerPromotions(customerId: number): Observable<PromotionDto[]> {
    return this.http.get<PromotionDto[]>(
      `${this.baseUrl}/customer/${customerId}/promotions`
    );
  }

  /**
   * Validate a promotion code
   */
  validatePromoCode(request: ValidatePromoCodeRequest): Observable<PromoCodeValidationResult> {
    return this.http.post<PromoCodeValidationResult>(
      `${this.baseUrl}/validate-promo`,
      request
    );
  }

  /**
   * Calculate promotions for cart items
   */
  calculatePromotions(request: CalculatePromotionsRequest): Observable<PromotionCalculationResult> {
    return this.http.post<PromotionCalculationResult>(
      `${this.baseUrl}/calculate-promotions`,
      request
    );
  }

  /**
   * Get active promotions for rep to present to customers
   */
  getActivePromotions(categoryId?: number): Observable<PromotionDto[]> {
    let params = new HttpParams();
    if (categoryId !== undefined) {
      params = params.set('categoryId', categoryId.toString());
    }
    return this.http.get<PromotionDto[]>(`${this.baseUrl}/promotions`, { params });
  }

  /**
   * Get order details by ID
   */
  getOrderDetails(orderId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/orders/${orderId}`);
  }
}
