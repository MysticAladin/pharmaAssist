import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PortalClaimsService, Claim, ClaimStatus, ClaimType } from '../../services/portal-claims.service';
import { KmCurrencyPipe } from '../../../../core/pipes/km-currency.pipe';

@Component({
  selector: 'app-portal-claims',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule, KmCurrencyPipe],
  template: `
    <div class="claims-page">
      <div class="page-header">
        <div>
          <h1>{{ 'portal.claims.title' | translate }}</h1>
          <p class="subtitle">{{ 'portal.claims.subtitle' | translate }}</p>
        </div>
      </div>

      <!-- Status Filter -->
      <div class="filter-bar">
        <div class="filter-tabs">
          <button
            class="tab"
            [class.active]="!statusFilter()"
            (click)="statusFilter.set(undefined)"
          >
            {{ 'portal.claims.all' | translate }}
            <span class="count">{{ totalCount() }}</span>
          </button>
          @for (status of statusOptions; track status.value) {
            <button
              class="tab"
              [class.active]="statusFilter() === status.value"
              (click)="statusFilter.set(status.value)"
            >
              {{ status.label }}
            </button>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
        </div>
      } @else if (filteredClaims().length === 0) {
        <div class="empty-state">
          <span class="icon">📋</span>
          <h3>{{ 'portal.claims.noClaims' | translate }}</h3>
          <p>{{ 'portal.claims.noClaimsDescription' | translate }}</p>
          <a routerLink="/portal/orders" class="btn btn-primary">
            {{ 'portal.orders.viewOrders' | translate }}
          </a>
        </div>
      } @else {
        <div class="claims-list">
          @for (claim of filteredClaims(); track claim.id) {
            <div class="claim-card" (click)="viewClaimDetail(claim)">
              <div class="claim-header">
                <div class="claim-info">
                  <span class="claim-number">{{ claim.claimNumber }}</span>
                  <span class="claim-date">{{ claim.createdAt | date:'mediumDate' }}</span>
                </div>
                <span class="status" [class]="getStatusClass(claim.status)">
                  {{ getStatusName(claim.status) }}
                </span>
              </div>

              <div class="claim-body">
                <div class="order-ref">
                  <span class="label">{{ 'portal.claims.orderReference' | translate }}:</span>
                  <span class="value">{{ claim.orderNumber }}</span>
                </div>
                <div class="claim-type">
                  <span class="label">{{ 'portal.claims.type' | translate }}:</span>
                  <span class="value">{{ getTypeName(claim.type) }}</span>
                </div>
                <div class="claim-reason">
                  <span class="label">{{ 'portal.claims.reason' | translate }}:</span>
                  <span class="value">{{ claim.reason }}</span>
                </div>
              </div>

              @if (claim.refundAmount) {
                <div class="claim-footer">
                  <span class="refund-label">{{ 'portal.claims.refundAmount' | translate }}:</span>
                  <span class="refund-amount">{{ claim.refundAmount | kmCurrency }}</span>
                </div>
              }

              <div class="claim-actions">
                <span class="view-details">{{ 'portal.claims.viewDetails' | translate }} →</span>
              </div>
            </div>
          }
        </div>
      }

      <!-- Claim Detail Modal -->
      @if (selectedClaim()) {
        <div class="modal-overlay" (click)="selectedClaim.set(null)">
          <div class="modal modal-lg" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ 'portal.claims.details' | translate }} - {{ selectedClaim()!.claimNumber }}</h2>
              <button class="modal-close" (click)="selectedClaim.set(null)">×</button>
            </div>
            <div class="modal-body">
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="label">{{ 'portal.claims.status' | translate }}</span>
                  <span class="status" [class]="getStatusClass(selectedClaim()!.status)">
                    {{ getStatusName(selectedClaim()!.status) }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="label">{{ 'portal.claims.submittedDate' | translate }}</span>
                  <span class="value">{{ selectedClaim()!.createdAt | date:'medium' }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">{{ 'portal.claims.orderReference' | translate }}</span>
                  <a [routerLink]="['/portal/orders', selectedClaim()!.orderId]" class="link">
                    {{ selectedClaim()!.orderNumber }}
                  </a>
                </div>
                <div class="detail-item">
                  <span class="label">{{ 'portal.claims.type' | translate }}</span>
                  <span class="value">{{ getTypeName(selectedClaim()!.type) }}</span>
                </div>
              </div>

              <div class="detail-section">
                <h4>{{ 'portal.claims.reason' | translate }}</h4>
                <p>{{ selectedClaim()!.reason }}</p>
              </div>

              @if (selectedClaim()!.description) {
                <div class="detail-section">
                  <h4>{{ 'portal.claims.description' | translate }}</h4>
                  <p>{{ selectedClaim()!.description }}</p>
                </div>
              }

              @if (selectedClaim()!.resolutionNotes) {
                <div class="detail-section resolution">
                  <h4>{{ 'portal.claims.resolution' | translate }}</h4>
                  <p>{{ selectedClaim()!.resolutionNotes }}</p>
                </div>
              }

              @if (selectedClaim()!.refundAmount) {
                <div class="refund-info">
                  <span class="label">{{ 'portal.claims.refundAmount' | translate }}</span>
                  <span class="amount">{{ selectedClaim()!.refundAmount | kmCurrency }}</span>
                </div>
              }
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" (click)="selectedClaim.set(null)">
                {{ 'common.close' | translate }}
              </button>
              <a [routerLink]="['/portal/orders', selectedClaim()!.orderId]" class="btn btn-primary">
                {{ 'portal.claims.viewOrder' | translate }}
              </a>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .claims-page { max-width: 900px; margin: 0 auto; }

    .page-header { margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .subtitle { color: var(--text-secondary); }

    .filter-bar { margin-bottom: 1.5rem; }
    .filter-tabs { display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.5rem; }
    .tab { padding: 0.5rem 1rem; border-radius: 999px; border: 1px solid var(--border-color); background: transparent; cursor: pointer; font-size: 0.875rem; white-space: nowrap; display: flex; align-items: center; gap: 0.5rem; }
    .tab.active { background: var(--primary-color); color: white; border-color: var(--primary-color); }
    .tab:hover:not(.active) { background: var(--bg-secondary); }
    .tab .count { background: var(--bg-secondary); padding: 0.125rem 0.5rem; border-radius: 999px; font-size: 0.75rem; }
    .tab.active .count { background: rgba(255,255,255,0.2); }

    .loading { text-align: center; padding: 4rem; }
    .spinner { width: 40px; height: 40px; border: 3px solid var(--border-color); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state { text-align: center; padding: 4rem 2rem; background: var(--surface-card); border-radius: 12px; }
    .empty-state .icon { font-size: 4rem; display: block; margin-bottom: 1rem; }
    .empty-state h3 { font-size: 1.25rem; margin-bottom: 0.5rem; }
    .empty-state p { color: var(--text-secondary); margin-bottom: 1.5rem; }

    .claims-list { display: flex; flex-direction: column; gap: 1rem; }
    .claim-card { background: var(--surface-card); border-radius: 12px; padding: 1.25rem; cursor: pointer; transition: box-shadow 0.2s, transform 0.2s; }
    .claim-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-2px); }

    .claim-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
    .claim-info { display: flex; flex-direction: column; gap: 0.25rem; }
    .claim-number { font-weight: 600; font-size: 1rem; }
    .claim-date { font-size: 0.75rem; color: var(--text-secondary); }

    .status { padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .status-submitted { background: #fef3c7; color: #92400e; }
    .status-under-review { background: #dbeafe; color: #1e40af; }
    .status-approved { background: #d1fae5; color: #065f46; }
    .status-rejected { background: #fee2e2; color: #991b1b; }
    .status-resolved { background: #e0e7ff; color: #3730a3; }
    .status-closed { background: #f3f4f6; color: #6b7280; }

    .claim-body { display: flex; flex-direction: column; gap: 0.5rem; }
    .claim-body .label { font-size: 0.75rem; color: var(--text-secondary); margin-right: 0.5rem; }
    .claim-body .value { font-size: 0.875rem; }

    .claim-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; margin-top: 1rem; border-top: 1px solid var(--border-color); }
    .refund-label { font-size: 0.875rem; color: var(--text-secondary); }
    .refund-amount { font-weight: 600; color: var(--primary-color); }

    .claim-actions { padding-top: 0.75rem; text-align: right; }
    .view-details { font-size: 0.875rem; color: var(--primary-color); font-weight: 500; }

    .btn { padding: 0.75rem 1.5rem; border-radius: 8px; border: none; cursor: pointer; font-weight: 500; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; }
    .btn-primary { background: var(--primary-color); color: white; }
    .btn-outline { background: transparent; border: 1px solid var(--border-color); color: var(--text-color); }

    /* Modal styles */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: var(--surface-card); border-radius: 12px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; }
    .modal-lg { max-width: 640px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); }
    .modal-header h2 { font-size: 1.25rem; margin: 0; }
    .modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary); }
    .modal-body { padding: 1.5rem; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 0.75rem; }

    .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .detail-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .detail-item .label { font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; }
    .detail-item .value { font-size: 0.875rem; }
    .detail-item .link { color: var(--primary-color); text-decoration: none; }
    .detail-item .link:hover { text-decoration: underline; }

    .detail-section { margin-bottom: 1.5rem; }
    .detail-section h4 { font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-secondary); }
    .detail-section p { margin: 0; line-height: 1.5; }
    .detail-section.resolution { background: #d1fae5; padding: 1rem; border-radius: 8px; }
    .detail-section.resolution h4 { color: #065f46; }

    .refund-info { background: var(--bg-secondary); padding: 1rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
    .refund-info .label { color: var(--text-secondary); }
    .refund-info .amount { font-size: 1.25rem; font-weight: 700; color: var(--primary-color); }

    @media (max-width: 640px) {
      .filter-tabs { flex-wrap: wrap; }
      .detail-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class PortalClaimsComponent implements OnInit {
  private readonly claimsService = inject(PortalClaimsService);

  loading = signal(true);
  claims = signal<Claim[]>([]);
  statusFilter = signal<ClaimStatus | undefined>(undefined);
  selectedClaim = signal<Claim | null>(null);

  statusOptions: { value: ClaimStatus; label: string }[] = [
    { value: ClaimStatus.Submitted, label: 'Podneseno' },
    { value: ClaimStatus.UnderReview, label: 'U pregledu' },
    { value: ClaimStatus.Approved, label: 'Odobreno' },
    { value: ClaimStatus.Rejected, label: 'Odbijeno' },
    { value: ClaimStatus.Resolved, label: 'Riješeno' }
  ];

  totalCount() {
    return this.claims().length;
  }

  filteredClaims() {
    const filter = this.statusFilter();
    if (!filter) return this.claims();
    return this.claims().filter(c => c.status === filter);
  }

  ngOnInit() {
    this.loadClaims();
  }

  loadClaims() {
    this.loading.set(true);
    this.claimsService.getMyClaims().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.claims.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  getStatusClass(status: ClaimStatus): string {
    const statusClasses: Record<number, string> = {
      [ClaimStatus.Submitted]: 'status-submitted',
      [ClaimStatus.UnderReview]: 'status-under-review',
      [ClaimStatus.Approved]: 'status-approved',
      [ClaimStatus.Rejected]: 'status-rejected',
      [ClaimStatus.AwaitingReturn]: 'status-awaiting',
      [ClaimStatus.ReturnReceived]: 'status-received',
      [ClaimStatus.Resolved]: 'status-resolved',
      [ClaimStatus.Cancelled]: 'status-cancelled'
    };
    return statusClasses[status] || 'status-submitted';
  }

  getStatusName(status: ClaimStatus): string {
    return this.claimsService.getStatusDisplayName(status);
  }

  getTypeName(type: number): string {
    const option = this.claimsService.getClaimTypeOptions().find(o => o.value === type);
    return option?.label || 'Nepoznato';
  }

  viewClaimDetail(claim: Claim) {
    this.selectedClaim.set(claim);
  }
}
