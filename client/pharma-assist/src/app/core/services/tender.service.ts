import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  TenderDto,
  TenderDetailDto,
  TenderItemDto,
  TenderBidDto,
  TenderDocumentDto,
  CreateTenderDto,
  UpdateTenderDto,
  AddTenderItemDto,
  AddTenderBidDto,
  TenderFilterDto,
  TenderStatsDto
} from '../models/tender.model';
import { IPagedResult } from '../models/common.model';

@Injectable({
  providedIn: 'root'
})
export class TenderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/tenders`;

  // Loading state
  readonly loading = signal(false);
  readonly saving = signal(false);

  // Cached stats
  readonly stats = signal<TenderStatsDto | null>(null);

  /**
   * Get paginated list of tenders with filters
   */
  getTenders(filter?: TenderFilterDto): Observable<IPagedResult<TenderDto>> {
    this.loading.set(true);
    let params = new HttpParams();

    if (filter) {
      if (filter.searchTerm) params = params.set('searchTerm', filter.searchTerm);
      if (filter.status) params = params.set('status', filter.status);
      if (filter.type) params = params.set('type', filter.type);
      if (filter.priority) params = params.set('priority', filter.priority);
      if (filter.customerId) params = params.set('customerId', filter.customerId.toString());
      if (filter.assignedUserId) params = params.set('assignedUserId', filter.assignedUserId);
      if (filter.startDate) params = params.set('startDate', filter.startDate.toISOString());
      if (filter.endDate) params = params.set('endDate', filter.endDate.toISOString());
      if (filter.isOpen !== undefined) params = params.set('isOpen', filter.isOpen.toString());
      if (filter.minValue) params = params.set('minValue', filter.minValue.toString());
      if (filter.maxValue) params = params.set('maxValue', filter.maxValue.toString());
      if (filter.pageNumber) params = params.set('pageNumber', filter.pageNumber.toString());
      if (filter.pageSize) params = params.set('pageSize', filter.pageSize.toString());
      if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
      if (filter.sortDescending !== undefined) params = params.set('sortDescending', filter.sortDescending.toString());
    }

    return this.http.get<IPagedResult<TenderDto>>(this.apiUrl, { params }).pipe(
      map(result => ({
        ...result,
        items: result.items.map((item: TenderDto) => ({
          ...item,
          submissionDeadline: new Date(item.submissionDeadline),
          publishedDate: item.publishedDate ? new Date(item.publishedDate) : undefined,
          createdAt: new Date(item.createdAt)
        }))
      })),
      tap(() => this.loading.set(false)),
      catchError(error => {
        this.loading.set(false);
        throw error;
      })
    );
  }

  /**
   * Get tender details by ID
   */
  getTender(id: number): Observable<TenderDetailDto> {
    this.loading.set(true);
    return this.http.get<TenderDetailDto>(`${this.apiUrl}/${id}`).pipe(
      map(tender => this.mapTenderDates(tender)),
      tap(() => this.loading.set(false)),
      catchError(error => {
        this.loading.set(false);
        throw error;
      })
    );
  }

  /**
   * Create a new tender
   */
  createTender(tender: CreateTenderDto): Observable<TenderDetailDto> {
    this.saving.set(true);
    return this.http.post<TenderDetailDto>(this.apiUrl, tender).pipe(
      map(t => this.mapTenderDates(t)),
      tap(() => this.saving.set(false)),
      catchError(error => {
        this.saving.set(false);
        throw error;
      })
    );
  }

  /**
   * Update an existing tender
   */
  updateTender(id: number, tender: UpdateTenderDto): Observable<TenderDetailDto> {
    this.saving.set(true);
    return this.http.put<TenderDetailDto>(`${this.apiUrl}/${id}`, tender).pipe(
      map(t => this.mapTenderDates(t)),
      tap(() => this.saving.set(false)),
      catchError(error => {
        this.saving.set(false);
        throw error;
      })
    );
  }

  /**
   * Delete a tender
   */
  deleteTender(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Tender Items

  /**
   * Add an item to a tender
   */
  addItem(tenderId: number, item: AddTenderItemDto): Observable<TenderItemDto> {
    this.saving.set(true);
    return this.http.post<TenderItemDto>(`${this.apiUrl}/${tenderId}/items`, item).pipe(
      tap(() => this.saving.set(false)),
      catchError(error => {
        this.saving.set(false);
        throw error;
      })
    );
  }

  /**
   * Update a tender item
   */
  updateItem(tenderId: number, itemId: number, item: AddTenderItemDto): Observable<TenderItemDto> {
    return this.http.put<TenderItemDto>(`${this.apiUrl}/${tenderId}/items/${itemId}`, item);
  }

  /**
   * Remove an item from a tender
   */
  removeItem(tenderId: number, itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${tenderId}/items/${itemId}`);
  }

  // Tender Bids

  /**
   * Add a bid to a tender
   */
  addBid(tenderId: number, bid: AddTenderBidDto): Observable<TenderBidDto> {
    this.saving.set(true);
    return this.http.post<TenderBidDto>(`${this.apiUrl}/${tenderId}/bids`, bid).pipe(
      map(b => this.mapBidDates(b)),
      tap(() => this.saving.set(false)),
      catchError(error => {
        this.saving.set(false);
        throw error;
      })
    );
  }

  /**
   * Update a bid
   */
  updateBid(tenderId: number, bidId: number, bid: AddTenderBidDto): Observable<TenderBidDto> {
    return this.http.put<TenderBidDto>(`${this.apiUrl}/${tenderId}/bids/${bidId}`, bid).pipe(
      map(b => this.mapBidDates(b))
    );
  }

  /**
   * Submit a bid
   */
  submitBid(tenderId: number, bidId: number): Observable<TenderBidDto> {
    return this.http.post<TenderBidDto>(`${this.apiUrl}/${tenderId}/bids/${bidId}/submit`, {}).pipe(
      map(b => this.mapBidDates(b))
    );
  }

  /**
   * Withdraw a bid
   */
  withdrawBid(tenderId: number, bidId: number): Observable<TenderBidDto> {
    return this.http.post<TenderBidDto>(`${this.apiUrl}/${tenderId}/bids/${bidId}/withdraw`, {}).pipe(
      map(b => this.mapBidDates(b))
    );
  }

  /**
   * Delete a bid
   */
  deleteBid(tenderId: number, bidId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${tenderId}/bids/${bidId}`);
  }

  // Tender Documents

  /**
   * Upload a document
   */
  uploadDocument(tenderId: number, file: File, name: string, documentType: string, description?: string): Observable<TenderDocumentDto> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('documentType', documentType);
    if (description) formData.append('description', description);

    return this.http.post<TenderDocumentDto>(`${this.apiUrl}/${tenderId}/documents`, formData).pipe(
      map(doc => ({
        ...doc,
        createdAt: new Date(doc.createdAt)
      }))
    );
  }

  /**
   * Delete a document
   */
  deleteDocument(tenderId: number, documentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${tenderId}/documents/${documentId}`);
  }

  // Workflow Actions

  /**
   * Publish a tender
   */
  publishTender(id: number): Observable<TenderDetailDto> {
    return this.http.post<TenderDetailDto>(`${this.apiUrl}/${id}/publish`, {}).pipe(
      map(t => this.mapTenderDates(t))
    );
  }

  /**
   * Close a tender for submissions
   */
  closeTender(id: number): Observable<TenderDetailDto> {
    return this.http.post<TenderDetailDto>(`${this.apiUrl}/${id}/close`, {}).pipe(
      map(t => this.mapTenderDates(t))
    );
  }

  /**
   * Award a tender to a bid
   */
  awardTender(id: number, bidId: number, notes?: string): Observable<TenderDetailDto> {
    return this.http.post<TenderDetailDto>(`${this.apiUrl}/${id}/award`, { bidId, notes }).pipe(
      map(t => this.mapTenderDates(t))
    );
  }

  /**
   * Cancel a tender
   */
  cancelTender(id: number, reason?: string): Observable<TenderDetailDto> {
    return this.http.post<TenderDetailDto>(`${this.apiUrl}/${id}/cancel`, { reason }).pipe(
      map(t => this.mapTenderDates(t))
    );
  }

  /**
   * Complete a tender
   */
  completeTender(id: number): Observable<TenderDetailDto> {
    return this.http.post<TenderDetailDto>(`${this.apiUrl}/${id}/complete`, {}).pipe(
      map(t => this.mapTenderDates(t))
    );
  }

  // Statistics

  /**
   * Get tender statistics
   */
  getStats(): Observable<TenderStatsDto> {
    return this.http.get<TenderStatsDto>(`${this.apiUrl}/stats`).pipe(
      tap(stats => this.stats.set(stats))
    );
  }

  /**
   * Get tenders assigned to current user
   */
  getMyTenders(pageNumber = 1, pageSize = 20): Observable<IPagedResult<TenderDto>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<IPagedResult<TenderDto>>(`${this.apiUrl}/my`, { params }).pipe(
      map(result => ({
        ...result,
        items: result.items.map((item: TenderDto) => ({
          ...item,
          submissionDeadline: new Date(item.submissionDeadline),
          publishedDate: item.publishedDate ? new Date(item.publishedDate) : undefined,
          createdAt: new Date(item.createdAt)
        }))
      }))
    );
  }

  /**
   * Get open tenders
   */
  getOpenTenders(pageNumber = 1, pageSize = 20): Observable<IPagedResult<TenderDto>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<IPagedResult<TenderDto>>(`${this.apiUrl}/open`, { params }).pipe(
      map(result => ({
        ...result,
        items: result.items.map((item: TenderDto) => ({
          ...item,
          submissionDeadline: new Date(item.submissionDeadline),
          publishedDate: item.publishedDate ? new Date(item.publishedDate) : undefined,
          createdAt: new Date(item.createdAt)
        }))
      }))
    );
  }

  /**
   * Get overdue tenders
   */
  getOverdueTenders(pageNumber = 1, pageSize = 20): Observable<IPagedResult<TenderDto>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<IPagedResult<TenderDto>>(`${this.apiUrl}/overdue`, { params }).pipe(
      map(result => ({
        ...result,
        items: result.items.map((item: TenderDto) => ({
          ...item,
          submissionDeadline: new Date(item.submissionDeadline),
          publishedDate: item.publishedDate ? new Date(item.publishedDate) : undefined,
          createdAt: new Date(item.createdAt)
        }))
      }))
    );
  }

  /**
   * Get tenders by customer
   */
  getTendersByCustomer(customerId: number, pageNumber = 1, pageSize = 20): Observable<IPagedResult<TenderDto>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<IPagedResult<TenderDto>>(`${this.apiUrl}/customer/${customerId}`, { params }).pipe(
      map(result => ({
        ...result,
        items: result.items.map((item: TenderDto) => ({
          ...item,
          submissionDeadline: new Date(item.submissionDeadline),
          publishedDate: item.publishedDate ? new Date(item.publishedDate) : undefined,
          createdAt: new Date(item.createdAt)
        }))
      }))
    );
  }

  // Private helper methods

  private mapTenderDates(tender: TenderDetailDto): TenderDetailDto {
    return {
      ...tender,
      submissionDeadline: new Date(tender.submissionDeadline),
      publishedDate: tender.publishedDate ? new Date(tender.publishedDate) : undefined,
      openingDate: tender.openingDate ? new Date(tender.openingDate) : undefined,
      contractStartDate: tender.contractStartDate ? new Date(tender.contractStartDate) : undefined,
      contractEndDate: tender.contractEndDate ? new Date(tender.contractEndDate) : undefined,
      awardedDate: tender.awardedDate ? new Date(tender.awardedDate) : undefined,
      createdAt: new Date(tender.createdAt),
      bids: tender.bids?.map(b => this.mapBidDates(b)) || [],
      documents: tender.documents?.map(d => ({
        ...d,
        createdAt: new Date(d.createdAt)
      })) || []
    };
  }

  private mapBidDates(bid: TenderBidDto): TenderBidDto {
    return {
      ...bid,
      submittedDate: bid.submittedDate ? new Date(bid.submittedDate) : undefined,
      approvedDate: bid.approvedDate ? new Date(bid.approvedDate) : undefined,
      createdAt: new Date(bid.createdAt)
    };
  }
}

