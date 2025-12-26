import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PortalPromotion {
  id: number;
  code: string;
  name: string;
  description?: string;
  termsAndConditions?: string;

  type: number;
  typeName: string;
  value: number;

  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;

  startDate: string;
  endDate: string;

  isActive: boolean;
  requiresCode: boolean;

  appliesToAllProducts: boolean;
  productIds?: number[] | null;
  categoryIds?: number[] | null;
}

@Injectable({
  providedIn: 'root'
})
export class PortalPromotionsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/pricing`;

  getAvailablePromotions(): Observable<PortalPromotion[]> {
    return this.http.get<PortalPromotion[]>(`${this.apiUrl}/promotions/available`);
  }
}
