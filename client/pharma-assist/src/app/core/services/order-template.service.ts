import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  OrderTemplate,
  CreateOrderTemplateRequest,
  CreateTemplateFromOrderRequest,
  UpdateOrderTemplateRequest,
  CreateOrderFromTemplateRequest
} from '../../shared/models/order-template.model';
import { RepOrderSummary } from '../models/rep-order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderTemplateService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/orders/templates`;

  /**
   * Get all templates for a specific customer
   */
  getTemplatesForCustomer(customerId: number): Observable<OrderTemplate[]> {
    return this.http.get<OrderTemplate[]>(`${this.baseUrl}/customer/${customerId}`);
  }

  /**
   * Get all templates created by the current rep
   */
  getMyTemplates(): Observable<OrderTemplate[]> {
    return this.http.get<OrderTemplate[]>(`${this.baseUrl}/my-templates`);
  }

  /**
   * Get a specific template by ID
   */
  getTemplate(templateId: number): Observable<OrderTemplate> {
    return this.http.get<OrderTemplate>(`${this.baseUrl}/${templateId}`);
  }

  /**
   * Create a new order template
   */
  createTemplate(request: CreateOrderTemplateRequest): Observable<OrderTemplate> {
    return this.http.post<OrderTemplate>(this.baseUrl, request);
  }

  /**
   * Create a template from an existing order
   */
  createTemplateFromOrder(request: CreateTemplateFromOrderRequest): Observable<OrderTemplate> {
    return this.http.post<OrderTemplate>(`${this.baseUrl}/from-order`, request);
  }

  /**
   * Update an existing template
   */
  updateTemplate(templateId: number, request: UpdateOrderTemplateRequest): Observable<OrderTemplate> {
    return this.http.put<OrderTemplate>(`${this.baseUrl}/${templateId}`, request);
  }

  /**
   * Delete a template
   */
  deleteTemplate(templateId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${templateId}`);
  }

  /**
   * Create an order from a template (quick re-order)
   */
  createOrderFromTemplate(request: CreateOrderFromTemplateRequest): Observable<RepOrderSummary> {
    return this.http.post<RepOrderSummary>(`${this.baseUrl}/reorder`, request);
  }

  /**
   * Get suggested templates based on order history
   */
  getSuggestedTemplates(customerId: number): Observable<OrderTemplate[]> {
    return this.http.get<OrderTemplate[]>(`${this.baseUrl}/suggested/${customerId}`);
  }
}
