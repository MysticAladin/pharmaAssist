import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResponse } from '../models/product.model';
import {
  StockAdjustment,
  CreateStockAdjustmentRequest,
  StockTransfer,
  CreateStockTransferRequest,
  Location,
  Warehouse,
  StockLevel,
  InventoryStock,
  CreateWarehouseRequest,
  UpdateWarehouseRequest,
  InventoryFilters,
  AdjustmentFilters,
  TransferFilters
} from '../models/inventory.model';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/inventory`;

  // ============ Stock Levels ============

  /**
   * Get stock levels with filters
   */
  getStockLevels(filters: InventoryFilters): Observable<PagedResponse<InventoryStock>> {
    let params = new HttpParams()
      .set('page', filters.page.toString())
      .set('pageSize', filters.pageSize.toString());

    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.locationId) {
      params = params.set('locationId', filters.locationId.toString());
    }
    if (filters.availableOnly) {
      params = params.set('availableOnly', 'true');
    }
    if (filters.lowStockOnly) {
      params = params.set('lowStockOnly', 'true');
    }
    if (filters.expiringSoonOnly) {
      params = params.set('expiringSoonOnly', 'true');
    }

    return this.http.get<PagedResponse<InventoryStock>>(`${this.apiUrl}/stock-levels`, { params });
  }

  /**
   * Get stock level for a specific product
   */
  getProductStockLevel(productId: number): Observable<ApiResponse<StockLevel>> {
    return this.http.get<ApiResponse<StockLevel>>(`${this.apiUrl}/stock-levels/${productId}`);
  }

  /**
   * Get low stock products
   */
  getLowStockProducts(locationId?: number): Observable<ApiResponse<StockLevel[]>> {
    let params = new HttpParams();
    if (locationId) {
      params = params.set('locationId', locationId.toString());
    }
    return this.http.get<ApiResponse<StockLevel[]>>(`${this.apiUrl}/low-stock`, { params });
  }

  /**
   * Get expiring products
   */
  getExpiringProducts(days: number = 30): Observable<ApiResponse<StockLevel[]>> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<ApiResponse<StockLevel[]>>(`${this.apiUrl}/expiring`, { params });
  }

  // ============ Stock Adjustments ============

  /**
   * Get stock adjustments with filters
   */
  getAdjustments(filters: AdjustmentFilters): Observable<PagedResponse<StockAdjustment>> {
    let params = new HttpParams()
      .set('page', filters.page.toString())
      .set('pageSize', filters.pageSize.toString());

    if (filters.productId) {
      params = params.set('productId', filters.productId.toString());
    }
    if (filters.adjustmentType) {
      params = params.set('adjustmentType', filters.adjustmentType);
    }
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }

    return this.http.get<PagedResponse<StockAdjustment>>(`${this.apiUrl}/adjustments`, { params });
  }

  /**
   * Get adjustment by ID
   */
  getAdjustmentById(id: number): Observable<ApiResponse<StockAdjustment>> {
    return this.http.get<ApiResponse<StockAdjustment>>(`${this.apiUrl}/adjustments/${id}`);
  }

  /**
   * Create a stock adjustment
   */
  createAdjustment(adjustment: CreateStockAdjustmentRequest): Observable<ApiResponse<StockAdjustment>> {
    return this.http.post<ApiResponse<StockAdjustment>>(`${this.apiUrl}/adjustments`, adjustment);
  }

  // ============ Stock Transfers ============

  /**
   * Get stock transfers with filters
   */
  getTransfers(filters: TransferFilters): Observable<PagedResponse<StockTransfer>> {
    let params = new HttpParams()
      .set('page', filters.page.toString())
      .set('pageSize', filters.pageSize.toString());

    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.sourceLocationId) {
      params = params.set('sourceLocationId', filters.sourceLocationId.toString());
    }
    if (filters.destinationLocationId) {
      params = params.set('destinationLocationId', filters.destinationLocationId.toString());
    }
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }

    return this.http.get<PagedResponse<StockTransfer>>(`${this.apiUrl}/transfers`, { params });
  }

  /**
   * Get transfer by ID
   */
  getTransferById(id: number): Observable<ApiResponse<StockTransfer>> {
    return this.http.get<ApiResponse<StockTransfer>>(`${this.apiUrl}/transfers/${id}`);
  }

  /**
   * Create a stock transfer
   */
  createTransfer(transfer: CreateStockTransferRequest): Observable<ApiResponse<StockTransfer>> {
    return this.http.post<ApiResponse<StockTransfer>>(`${this.apiUrl}/transfers`, transfer);
  }

  /**
   * Update transfer status
   */
  updateTransferStatus(id: number, status: string, receivedItems?: { itemId: number; receivedQuantity: number }[]): Observable<ApiResponse<StockTransfer>> {
    return this.http.patch<ApiResponse<StockTransfer>>(`${this.apiUrl}/transfers/${id}/status`, {
      status,
      receivedItems
    });
  }

  /**
   * Cancel a transfer
   */
  cancelTransfer(id: number, reason: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/transfers/${id}/cancel`, { reason });
  }

  // ============ Locations ============

  /**
   * Get all locations
   */
  getLocations(): Observable<ApiResponse<Location[]>> {
    return this.http.get<ApiResponse<Location[]>>(`${this.apiUrl}/locations`);
  }

  /**
   * Get location by ID
   */
  getLocationById(id: number): Observable<ApiResponse<Location>> {
    return this.http.get<ApiResponse<Location>>(`${this.apiUrl}/locations/${id}`);
  }

  /**
   * Get active locations
   */
  getActiveLocations(): Observable<ApiResponse<Location[]>> {
    return this.http.get<ApiResponse<Location[]>>(`${this.apiUrl}/locations/active`);
  }

  // ============ Warehouses (Admin) ============

  getWarehouses(activeOnly: boolean = false): Observable<ApiResponse<Warehouse[]>> {
    return this.http.get<ApiResponse<Warehouse[]>>(`${this.apiUrl}/warehouses`, {
      params: new HttpParams().set('activeOnly', String(activeOnly))
    });
  }

  createWarehouse(dto: CreateWarehouseRequest): Observable<ApiResponse<Warehouse>> {
    return this.http.post<ApiResponse<Warehouse>>(`${this.apiUrl}/warehouses`, dto);
  }

  updateWarehouse(id: number, dto: UpdateWarehouseRequest): Observable<ApiResponse<Warehouse>> {
    return this.http.put<ApiResponse<Warehouse>>(`${this.apiUrl}/warehouses/${id}`, dto);
  }

  deleteWarehouse(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/warehouses/${id}`);
  }

  setDefaultWarehouse(id: number): Observable<ApiResponse<boolean>> {
    return this.http.patch<ApiResponse<boolean>>(`${this.apiUrl}/warehouses/${id}/set-default`, {});
  }
}
