import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResponse } from '../models/product.model';

// Enums
export enum DiscountType {
  Percentage = 0,
  FixedAmount = 1,
  FixedPrice = 2
}

export enum PriceRuleScope {
  Global = 0,
  Category = 1,
  Manufacturer = 2,
  Product = 3,
  Customer = 4
}

export enum CustomerTier {
  A = 0,
  B = 1,
  C = 2
}

export enum PromotionType {
  Percentage = 0,
  FixedAmount = 1,
  FreeShipping = 2,
  BuyOneGetOne = 3,
  BuyXGetY = 4,
  BundleDeal = 5
}

// Interfaces
export interface PriceRule {
  id: number;
  name: string;
  description?: string;
  customerTier?: CustomerTier;
  discountType: DiscountType;
  discountValue: number;
  scope: PriceRuleScope;
  scopeId?: number;
  priority: number;
  minimumQuantity: number;
  maximumQuantity?: number;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  canStack: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreatePriceRuleRequest {
  name: string;
  description?: string;
  customerTier?: CustomerTier;
  discountType: DiscountType;
  discountValue: number;
  scope: PriceRuleScope;
  scopeId?: number;
  priority: number;
  minimumQuantity?: number;
  maximumQuantity?: number;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  canStack?: boolean;
}

export interface Promotion {
  id: number;
  name: string;
  description?: string;
  code?: string;
  promotionType: PromotionType;
  discountValue: number;
  minimumOrderValue: number;
  maximumDiscountAmount?: number;
  usageLimit?: number;
  usageLimitPerCustomer?: number;
  currentUsageCount: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  appliesToAllProducts: boolean;
  // Customer-specific targeting
  customerId?: number;
  customerName?: string;
  applyToChildCustomers: boolean;
  createdAt: Date;
}

export interface CreatePromotionRequest {
  name: string;
  description?: string;
  code?: string;
  promotionType: PromotionType;
  discountValue: number;
  minimumOrderValue?: number;
  maximumDiscountAmount?: number;
  usageLimit?: number;
  usageLimitPerCustomer?: number;
  startDate: Date;
  endDate: Date;
  isActive?: boolean;
  appliesToAllProducts?: boolean;
  // Customer-specific targeting
  customerId?: number;
  applyToChildCustomers?: boolean;
  productIds?: number[];
  categoryIds?: number[];
}

export interface PriceCalculationRequest {
  productId: number;
  quantity: number;
  customerId?: number;
  promotionCode?: string;
}

export interface PriceCalculationResult {
  productId: number;
  originalPrice: number;
  finalPrice: number;
  totalDiscount: number;
  discountPercentage: number;
  appliedRules: string[];
  appliedPromotion?: string;
}

export interface TierInfo {
  tier: CustomerTier;
  tierName: string;
  discountPercentage: number;
  benefits: string[];
}

@Injectable({
  providedIn: 'root'
})
export class PricingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/pricing`;

  // === Price Rules ===

  getPriceRules(activeOnly: boolean = false): Observable<ApiResponse<PriceRule[]>> {
    const params = new HttpParams().set('activeOnly', activeOnly.toString());
    return this.http.get<ApiResponse<PriceRule[]>>(`${this.apiUrl}/rules`, { params });
  }

  getPriceRule(id: number): Observable<ApiResponse<PriceRule>> {
    return this.http.get<ApiResponse<PriceRule>>(`${this.apiUrl}/rules/${id}`);
  }

  createPriceRule(request: CreatePriceRuleRequest): Observable<ApiResponse<PriceRule>> {
    return this.http.post<ApiResponse<PriceRule>>(`${this.apiUrl}/rules`, request);
  }

  updatePriceRule(id: number, request: CreatePriceRuleRequest): Observable<ApiResponse<PriceRule>> {
    return this.http.put<ApiResponse<PriceRule>>(`${this.apiUrl}/rules/${id}`, request);
  }

  deletePriceRule(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/rules/${id}`);
  }

  getRulesForCustomer(customerId: number): Observable<ApiResponse<PriceRule[]>> {
    return this.http.get<ApiResponse<PriceRule[]>>(`${this.apiUrl}/rules/customer/${customerId}`);
  }

  getRulesForProduct(productId: number): Observable<ApiResponse<PriceRule[]>> {
    return this.http.get<ApiResponse<PriceRule[]>>(`${this.apiUrl}/rules/product/${productId}`);
  }

  // === Promotions ===

  getPromotions(activeOnly: boolean = false): Observable<ApiResponse<Promotion[]>> {
    const params = new HttpParams().set('activeOnly', activeOnly.toString());
    return this.http.get<ApiResponse<Promotion[]>>(`${this.apiUrl}/promotions`, { params });
  }

  getPromotion(id: number): Observable<ApiResponse<Promotion>> {
    return this.http.get<ApiResponse<Promotion>>(`${this.apiUrl}/promotions/${id}`);
  }

  createPromotion(request: CreatePromotionRequest): Observable<ApiResponse<Promotion>> {
    return this.http.post<ApiResponse<Promotion>>(`${this.apiUrl}/promotions`, request);
  }

  updatePromotion(id: number, request: CreatePromotionRequest): Observable<ApiResponse<Promotion>> {
    return this.http.put<ApiResponse<Promotion>>(`${this.apiUrl}/promotions/${id}`, request);
  }

  deletePromotion(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/promotions/${id}`);
  }

  validatePromotionCode(code: string, customerId?: number, orderValue?: number): Observable<ApiResponse<{ valid: boolean; promotion?: Promotion; message?: string }>> {
    let params = new HttpParams().set('code', code);
    if (customerId) params = params.set('customerId', customerId.toString());
    if (orderValue) params = params.set('orderValue', orderValue.toString());
    return this.http.post<ApiResponse<{ valid: boolean; promotion?: Promotion; message?: string }>>(`${this.apiUrl}/promotions/validate`, null, { params });
  }

  getAvailablePromotions(customerId: number): Observable<ApiResponse<Promotion[]>> {
    return this.http.get<ApiResponse<Promotion[]>>(`${this.apiUrl}/promotions/available/${customerId}`);
  }

  // === Price Calculation ===

  calculatePrice(request: PriceCalculationRequest): Observable<ApiResponse<PriceCalculationResult>> {
    return this.http.post<ApiResponse<PriceCalculationResult>>(`${this.apiUrl}/calculate`, request);
  }

  calculatePrices(requests: PriceCalculationRequest[]): Observable<ApiResponse<PriceCalculationResult[]>> {
    return this.http.post<ApiResponse<PriceCalculationResult[]>>(`${this.apiUrl}/calculate/batch`, requests);
  }

  // === Tiers ===

  getTiers(): Observable<ApiResponse<TierInfo[]>> {
    return this.http.get<ApiResponse<TierInfo[]>>(`${this.apiUrl}/tiers`);
  }

  getTierInfo(tier: CustomerTier): Observable<ApiResponse<TierInfo>> {
    return this.http.get<ApiResponse<TierInfo>>(`${this.apiUrl}/tiers/${tier}`);
  }

  // === Helpers ===

  getDiscountTypeName(type: DiscountType): string {
    const names: Record<DiscountType, string> = {
      [DiscountType.Percentage]: 'pricing.discountTypes.percentage',
      [DiscountType.FixedAmount]: 'pricing.discountTypes.fixedAmount',
      [DiscountType.FixedPrice]: 'pricing.discountTypes.fixedPrice'
    };
    return names[type] || 'common.unknown';
  }

  getScopeName(scope: PriceRuleScope): string {
    const names: Record<PriceRuleScope, string> = {
      [PriceRuleScope.Global]: 'pricing.scopes.global',
      [PriceRuleScope.Category]: 'pricing.scopes.category',
      [PriceRuleScope.Manufacturer]: 'pricing.scopes.manufacturer',
      [PriceRuleScope.Product]: 'pricing.scopes.product',
      [PriceRuleScope.Customer]: 'pricing.scopes.customer'
    };
    return names[scope] || 'common.unknown';
  }

  getTierName(tier: CustomerTier): string {
    const names: Record<CustomerTier, string> = {
      [CustomerTier.A]: 'pricing.tiers.premium',
      [CustomerTier.B]: 'pricing.tiers.standard',
      [CustomerTier.C]: 'pricing.tiers.basic'
    };
    return names[tier] || 'common.unknown';
  }

  getPromotionTypeName(type: PromotionType): string {
    const names: Record<PromotionType, string> = {
      [PromotionType.Percentage]: 'pricing.promotionTypes.percentage',
      [PromotionType.FixedAmount]: 'pricing.promotionTypes.fixedAmount',
      [PromotionType.FreeShipping]: 'pricing.promotionTypes.freeShipping',
      [PromotionType.BuyOneGetOne]: 'pricing.promotionTypes.bogo',
      [PromotionType.BuyXGetY]: 'pricing.promotionTypes.buyXGetY',
      [PromotionType.BundleDeal]: 'pricing.promotionTypes.bundleDeal'
    };
    return names[type] || 'common.unknown';
  }
}
