import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RepOrderService } from './rep-order.service';
import { environment } from '../../../environments/environment';

describe('RepOrderService', () => {
  let service: RepOrderService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/orders/rep`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RepOrderService]
    });
    service = TestBed.inject(RepOrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('createOrder', () => {
    it('should create an order successfully', () => {
      const mockOrder = {
        customerId: 1,
        items: [{ productId: 1, quantity: 2, unitPrice: 10 }]
      };
      const mockResponse = { id: 100, orderNumber: 'ORD-100', status: 1 };

      service.createOrder(mockOrder as any).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/create`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockOrder);
      req.flush(mockResponse);
    });
  });

  describe('getMyOrders', () => {
    it('should get orders with default filter', () => {
      const mockResult = { items: [], totalCount: 0, totalRevenue: 0 };

      service.getMyOrders().subscribe(response => {
        expect(response).toEqual(mockResult);
      });

      const req = httpMock.expectOne(`${baseUrl}/my-orders`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResult);
    });

    it('should apply filters to request', () => {
      const filter = {
        customerId: 5,
        status: 2,
        page: 2,
        pageSize: 20
      };
      const mockResult = { items: [], totalCount: 0, totalRevenue: 0 };

      service.getMyOrders(filter).subscribe();

      const req = httpMock.expectOne(r => r.url.includes(`${baseUrl}/my-orders`));
      expect(req.request.params.get('customerId')).toBe('5');
      expect(req.request.params.get('status')).toBe('2');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('pageSize')).toBe('20');
      req.flush(mockResult);
    });
  });

  describe('getMyStats', () => {
    it('should get rep statistics', () => {
      const mockStats = {
        totalOrders: 50,
        totalRevenue: 25000,
        averageOrderValue: 500
      };

      service.getMyStats().subscribe(response => {
        expect(response).toEqual(mockStats);
      });

      const req = httpMock.expectOne(`${baseUrl}/stats`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStats);
    });
  });

  describe('getCustomerPromotions', () => {
    it('should get promotions for a customer', () => {
      const customerId = 10;
      const mockPromotions = [
        { id: 1, code: 'PROMO10', name: 'Test Promo' }
      ];

      service.getCustomerPromotions(customerId).subscribe(response => {
        expect(response).toEqual(mockPromotions);
      });

      const req = httpMock.expectOne(`${baseUrl}/customer/${customerId}/promotions`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPromotions);
    });
  });

  describe('validatePromoCode', () => {
    it('should validate a promo code', () => {
      const request = {
        promoCode: 'SAVE20',
        customerId: 5,
        orderTotal: 100
      };
      const mockResponse = {
        isValid: true,
        promotion: { id: 1, code: 'SAVE20' },
        estimatedDiscount: 20
      };

      service.validatePromoCode(request).subscribe(response => {
        expect(response.isValid).toBe(true);
        expect(response.estimatedDiscount).toBe(20);
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-promo`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should return invalid for bad promo code', () => {
      const request = {
        promoCode: 'INVALID',
        customerId: 5,
        orderTotal: 100
      };
      const mockResponse = {
        isValid: false,
        errorMessage: 'Invalid promotion code'
      };

      service.validatePromoCode(request).subscribe(response => {
        expect(response.isValid).toBe(false);
        expect(response.errorMessage).toBe('Invalid promotion code');
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-promo`);
      req.flush(mockResponse);
    });
  });

  describe('calculatePromotions', () => {
    it('should calculate promotions for cart items', () => {
      const request = {
        customerId: 5,
        items: [
          { productId: 1, categoryId: 1, quantity: 2, unitPrice: 50, lineTotal: 100 }
        ],
        promoCode: 'DISCOUNT10'
      };
      const mockResponse = {
        success: true,
        originalTotal: 100,
        discountTotal: 10,
        finalTotal: 90,
        appliedPromotions: [
          { promotionId: 1, code: 'DISCOUNT10', discountAmount: 10 }
        ]
      };

      service.calculatePromotions(request).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.discountTotal).toBe(10);
        expect(response.finalTotal).toBe(90);
      });

      const req = httpMock.expectOne(`${baseUrl}/calculate-promotions`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('getActivePromotions', () => {
    it('should get all active promotions', () => {
      const mockPromotions = [
        { id: 1, code: 'PROMO1', name: 'Promotion 1' },
        { id: 2, code: 'PROMO2', name: 'Promotion 2' }
      ];

      service.getActivePromotions().subscribe(response => {
        expect(response.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/promotions`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPromotions);
    });

    it('should filter by category', () => {
      const categoryId = 5;
      const mockPromotions = [{ id: 1 }];

      service.getActivePromotions(categoryId).subscribe();

      const req = httpMock.expectOne(r => r.url.includes(`${baseUrl}/promotions`));
      expect(req.request.params.get('categoryId')).toBe('5');
      req.flush(mockPromotions);
    });
  });

  describe('getCustomerRecentOrders', () => {
    it('should get recent orders for customer', () => {
      const customerId = 10;
      const mockOrders = [
        { id: 1, orderNumber: 'ORD-001' },
        { id: 2, orderNumber: 'ORD-002' }
      ];

      service.getCustomerRecentOrders(customerId, 5).subscribe(response => {
        expect(response.length).toBe(2);
      });

      const req = httpMock.expectOne(r =>
        r.url.includes(`${baseUrl}/customer/${customerId}/recent`)
      );
      expect(req.request.params.get('count')).toBe('5');
      req.flush(mockOrders);
    });
  });

  describe('getOrderDetails', () => {
    it('should get order details by id', () => {
      const orderId = 100;
      const mockOrder = {
        id: 100,
        orderNumber: 'ORD-100',
        status: 'Delivered',
        items: []
      };

      service.getOrderDetails(orderId).subscribe(response => {
        expect(response.id).toBe(100);
        expect(response.orderNumber).toBe('ORD-100');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/orders/${orderId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockOrder);
    });
  });
});
