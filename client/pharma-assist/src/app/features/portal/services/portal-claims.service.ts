import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from './portal-orders.service';

export interface Claim {
  id: number;
  claimNumber: string;
  orderNumber: string;
  orderId: number;
  type: ClaimType;
  typeName: string;
  status: ClaimStatus;
  statusName: string;
  productName: string;
  productSku?: string;
  quantity: number;
  reason: string;
  description?: string;
  createdAt: string;
  resolvedAt?: string;
  refundAmount?: number;
  resolutionNotes?: string;
  returnTrackingNumber?: string;
  returnReceivedAt?: string;
  timeline?: ClaimTimelineEvent[];
}

export interface ClaimTimelineEvent {
  date: string;
  status: ClaimStatus;
  statusName: string;
  description: string;
  updatedBy?: string;
}

export interface CreateClaimRequest {
  orderId: number;
  orderItemId: number;
  type: ClaimType;
  reason: string;
  description?: string;
  quantity: number;
  attachmentIds?: number[];
}

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

@Injectable({
  providedIn: 'root'
})
export class PortalClaimsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/portal`;

  /**
   * Get all claims for the current customer
   */
  getMyClaims(): Observable<ApiResponse<Claim[]>> {
    return this.http.get<ApiResponse<Claim[]>>(`${this.apiUrl}/claims`);
  }

  /**
   * Get claim by ID
   */
  getClaimById(id: number): Observable<ApiResponse<Claim>> {
    return this.http.get<ApiResponse<Claim>>(`${this.apiUrl}/claims/${id}`);
  }

  /**
   * Get claims for a specific order
   */
  getOrderClaims(orderId: number): Observable<ApiResponse<Claim[]>> {
    return this.http.get<ApiResponse<Claim[]>>(`${this.apiUrl}/orders/${orderId}/claims`);
  }

  /**
   * Submit a new claim
   */
  submitClaim(request: CreateClaimRequest): Observable<ApiResponse<Claim>> {
    return this.http.post<ApiResponse<Claim>>(`${this.apiUrl}/claims`, request);
  }

  /**
   * Cancel a claim
   */
  cancelClaim(claimId: number, reason: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/claims/${claimId}/cancel`, { reason });
  }

  /**
   * Update return tracking number
   */
  updateReturnTracking(claimId: number, trackingNumber: string): Observable<ApiResponse<Claim>> {
    return this.http.patch<ApiResponse<Claim>>(`${this.apiUrl}/claims/${claimId}/tracking`, { trackingNumber });
  }

  /**
   * Get claim type display name
   */
  getTypeDisplayName(type: ClaimType): string {
    const typeNames: Record<ClaimType, string> = {
      [ClaimType.Return]: 'Povrat proizvoda',
      [ClaimType.Exchange]: 'Zamjena proizvoda',
      [ClaimType.Refund]: 'Povrat novca',
      [ClaimType.Damaged]: 'Oštećen proizvod',
      [ClaimType.WrongProduct]: 'Pogrešan proizvod',
      [ClaimType.Expired]: 'Istekli rok',
      [ClaimType.QualityIssue]: 'Problem s kvalitetom'
    };
    return typeNames[type] || 'Nepoznato';
  }

  /**
   * Get claim status display name
   */
  getStatusDisplayName(status: ClaimStatus): string {
    const statusNames: Record<ClaimStatus, string> = {
      [ClaimStatus.Submitted]: 'Podneseno',
      [ClaimStatus.UnderReview]: 'U pregledu',
      [ClaimStatus.Approved]: 'Odobreno',
      [ClaimStatus.Rejected]: 'Odbijeno',
      [ClaimStatus.AwaitingReturn]: 'Čeka se povrat',
      [ClaimStatus.ReturnReceived]: 'Povrat primljen',
      [ClaimStatus.Resolved]: 'Riješeno',
      [ClaimStatus.Cancelled]: 'Otkazano'
    };
    return statusNames[status] || 'Nepoznato';
  }

  /**
   * Check if claim can be cancelled
   */
  canCancelClaim(status: ClaimStatus): boolean {
    return status === ClaimStatus.Submitted || status === ClaimStatus.UnderReview;
  }

  /**
   * Check if tracking can be updated
   */
  canUpdateTracking(status: ClaimStatus): boolean {
    return status === ClaimStatus.Approved || status === ClaimStatus.AwaitingReturn;
  }

  /**
   * Get claim type options for dropdown
   */
  getClaimTypeOptions(): { value: ClaimType; label: string }[] {
    return [
      { value: ClaimType.Return, label: 'Povrat proizvoda' },
      { value: ClaimType.Exchange, label: 'Zamjena proizvoda' },
      { value: ClaimType.Refund, label: 'Povrat novca' },
      { value: ClaimType.Damaged, label: 'Oštećen proizvod' },
      { value: ClaimType.WrongProduct, label: 'Pogrešan proizvod' },
      { value: ClaimType.Expired, label: 'Istekli rok' },
      { value: ClaimType.QualityIssue, label: 'Problem s kvalitetom' }
    ];
  }
}
