import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResponse } from '../models/customer.model';

// Enums aligned to Domain.Enums
export enum ClaimType {
  Return = 1,
  Exchange = 2,
  Refund = 3,
  Damaged = 4,
  WrongProduct = 5,
  Expired = 6,
  QualityIssue = 7
}

export enum ClaimStatus {
  Submitted = 1,
  UnderReview = 2,
  Approved = 3,
  Rejected = 4,
  AwaitingReturn = 5,
  ReturnReceived = 6,
  Resolved = 7,
  Cancelled = 8
}

export interface ClaimSummary {
  id: number;
  claimNumber: string;
  orderNumber: string;
  orderId: number;
  type: ClaimType;
  typeName: string;
  status: ClaimStatus;
  statusName: string;
  productName: string;
  quantity: number;
  reason: string;
  createdAt: string;
  resolvedAt?: string;
  refundAmount?: number;
}

export interface ClaimTimelineEvent {
  date: string;
  status: ClaimStatus;
  statusName: string;
  description: string;
  updatedBy?: string;
}

export interface ClaimDetail extends ClaimSummary {
  customerId: number;
  customerName: string;
  orderItemId?: number;
  productId?: number;
  productSku?: string;
  batchNumber?: string;
  description?: string;
  resolutionNotes?: string;
  replacementOrderId?: number;
  replacementOrderNumber?: string;
  resolvedBy?: string;
  returnTrackingNumber?: string;
  returnReceivedAt?: string;
  attachmentIds: number[];
  updatedAt?: string;
  timeline: ClaimTimelineEvent[];
}

export interface UpdateClaimStatusRequest {
  status: ClaimStatus;
  notes?: string;
}

export interface ResolveClaimRequest {
  status: ClaimStatus;
  resolutionNotes?: string;
  refundAmount?: number;
  createReplacementOrder: boolean;
}

export interface UpdateReturnTrackingRequest {
  trackingNumber: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClaimsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/claims`;

  getPaged(
    page = 1,
    pageSize = 10,
    opts?: { customerId?: number; status?: ClaimStatus; type?: ClaimType }
  ): Observable<PagedResponse<ClaimSummary>> {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);

    if (opts?.customerId != null) params = params.set('customerId', opts.customerId);
    if (opts?.status != null) params = params.set('status', opts.status);
    if (opts?.type != null) params = params.set('type', opts.type);

    return this.http.get<PagedResponse<ClaimSummary>>(`${this.apiUrl}/paged`, { params });
  }

  getById(id: number): Observable<ApiResponse<ClaimDetail>> {
    return this.http.get<ApiResponse<ClaimDetail>>(`${this.apiUrl}/${id}`);
  }

  updateStatus(id: number, dto: UpdateClaimStatusRequest): Observable<ApiResponse<ClaimDetail>> {
    return this.http.patch<ApiResponse<ClaimDetail>>(`${this.apiUrl}/${id}/status`, dto);
  }

  resolve(id: number, dto: ResolveClaimRequest): Observable<ApiResponse<ClaimDetail>> {
    return this.http.patch<ApiResponse<ClaimDetail>>(`${this.apiUrl}/${id}/resolve`, dto);
  }

  updateReturnTracking(id: number, dto: UpdateReturnTrackingRequest): Observable<ApiResponse<ClaimDetail>> {
    return this.http.patch<ApiResponse<ClaimDetail>>(`${this.apiUrl}/${id}/tracking`, dto);
  }

  markReturnReceived(id: number): Observable<ApiResponse<ClaimDetail>> {
    return this.http.patch<ApiResponse<ClaimDetail>>(`${this.apiUrl}/${id}/return-received`, {});
  }
}
