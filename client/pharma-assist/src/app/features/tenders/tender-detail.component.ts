import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { TenderService } from '../../core/services/tender.service';
import {
  TenderDetailDto,
  TenderItemDto,
  TenderBidDto,
  TenderDocumentDto,
  tenderStatusLabels,
  tenderStatusColors,
  tenderTypeLabels,
  tenderPriorityLabels,
  tenderPriorityColors,
  bidStatusLabels,
  bidStatusColors
} from '../../core/models/tender.model';

import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog';

@Component({
  selector: 'app-tender-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    DatePipe,
    CurrencyPipe,
    ConfirmDialogComponent
  ],
  template: `
    <div class="tender-detail-page">
      @if (loading()) {
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>{{ 'COMMON.LOADING' | translate }}</p>
        </div>
      } @else if (tender()) {
        <!-- Header -->
        <div class="page-header">
          <div class="header-left">
            <button class="btn-back" (click)="goBack()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <div class="header-content">
              <div class="header-title-row">
                <span class="tender-number">{{ tender()?.tenderNumber }}</span>
                <span class="status-badge" [class]="tenderStatusColors[tender()!.status]">
                  {{ tenderStatusLabels[tender()!.status] | translate }}
                </span>
                <span class="priority-badge" [class]="tenderPriorityColors[tender()!.priority]">
                  {{ tenderPriorityLabels[tender()!.priority] | translate }}
                </span>
              </div>
              <h1 class="page-title">{{ tender()?.title }}</h1>
              <p class="customer-name">{{ tender()?.customerName }}</p>
            </div>
          </div>
          <div class="header-actions">
            @if (tender()?.status === 'Draft') {
              <button class="btn btn-success" (click)="publishTender()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 2L11 13"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z"/>
                </svg>
                {{ 'TENDERS.ACTIONS.PUBLISH' | translate }}
              </button>
              <button class="btn btn-secondary" [routerLink]="['/tenders', tender()?.id, 'edit']">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                {{ 'COMMON.EDIT' | translate }}
              </button>
            }
            @if (tender()?.status === 'Open') {
              <button class="btn btn-warning" (click)="closeTender()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                {{ 'TENDERS.ACTIONS.CLOSE' | translate }}
              </button>
              <button class="btn btn-primary" [routerLink]="['/tenders', tender()?.id, 'bid']">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                {{ 'TENDERS.ACTIONS.ADD_BID' | translate }}
              </button>
            }
            @if (tender()?.status === 'UnderEvaluation' && tender()!.bids.length > 0) {
              <button class="btn btn-success" (click)="showAwardDialog.set(true)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="8" r="7"/>
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
                </svg>
                {{ 'TENDERS.ACTIONS.AWARD' | translate }}
              </button>
            }
            @if (tender()?.status !== 'Cancelled' && tender()?.status !== 'Completed' && tender()?.status !== 'Awarded') {
              <button class="btn btn-danger" (click)="showCancelDialog.set(true)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {{ 'TENDERS.ACTIONS.CANCEL' | translate }}
              </button>
            }
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs-container">
          <div class="tabs">
            <button class="tab" [class.active]="activeTab() === 'details'" (click)="activeTab.set('details')">
              {{ 'TENDERS.TABS.DETAILS' | translate }}
            </button>
            <button class="tab" [class.active]="activeTab() === 'items'" (click)="activeTab.set('items')">
              {{ 'TENDERS.TABS.ITEMS' | translate }}
              <span class="tab-badge">{{ tender()?.items?.length ?? 0 }}</span>
            </button>
            <button class="tab" [class.active]="activeTab() === 'bids'" (click)="activeTab.set('bids')">
              {{ 'TENDERS.TABS.BIDS' | translate }}
              <span class="tab-badge">{{ tender()?.bids?.length ?? 0 }}</span>
            </button>
            <button class="tab" [class.active]="activeTab() === 'documents'" (click)="activeTab.set('documents')">
              {{ 'TENDERS.TABS.DOCUMENTS' | translate }}
              <span class="tab-badge">{{ tender()?.documents?.length ?? 0 }}</span>
            </button>
          </div>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          @switch (activeTab()) {
            @case ('details') {
              <div class="details-grid">
                <div class="detail-card">
                  <h3 class="card-title">{{ 'TENDERS.DETAIL.GENERAL' | translate }}</h3>
                  <div class="detail-row">
                    <span class="label">{{ 'TENDERS.FIELD.TYPE' | translate }}</span>
                    <span class="value">{{ tenderTypeLabels[tender()!.type] | translate }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">{{ 'TENDERS.FIELD.DEADLINE' | translate }}</span>
                    <span class="value" [class.deadline-warning]="isDeadlineSoon()" [class.deadline-passed]="isDeadlinePassed()">
                      {{ tender()?.submissionDeadline | date:'medium' }}
                    </span>
                  </div>
                  @if (tender()?.openingDate) {
                    <div class="detail-row">
                      <span class="label">{{ 'TENDERS.FIELD.OPENING_DATE' | translate }}</span>
                      <span class="value">{{ tender()?.openingDate | date:'medium' }}</span>
                    </div>
                  }
                  @if (tender()?.publishedDate) {
                    <div class="detail-row">
                      <span class="label">{{ 'TENDERS.FIELD.PUBLISHED_DATE' | translate }}</span>
                      <span class="value">{{ tender()?.publishedDate | date:'medium' }}</span>
                    </div>
                  }
                  @if (tender()?.description) {
                    <div class="detail-row full-width">
                      <span class="label">{{ 'TENDERS.FIELD.DESCRIPTION' | translate }}</span>
                      <p class="value description">{{ tender()?.description }}</p>
                    </div>
                  }
                </div>

                <div class="detail-card">
                  <h3 class="card-title">{{ 'TENDERS.DETAIL.FINANCIAL' | translate }}</h3>
                  @if (tender()?.estimatedValue) {
                    <div class="detail-row">
                      <span class="label">{{ 'TENDERS.FIELD.ESTIMATED_VALUE' | translate }}</span>
                      <span class="value">{{ tender()?.estimatedValue | currency:tender()!.currency:'symbol':'1.0-0' }}</span>
                    </div>
                  }
                  @if (tender()?.budget) {
                    <div class="detail-row">
                      <span class="label">{{ 'TENDERS.FIELD.BUDGET' | translate }}</span>
                      <span class="value">{{ tender()?.budget | currency:tender()!.currency:'symbol':'1.0-0' }}</span>
                    </div>
                  }
                  @if (tender()?.bidSecurityAmount) {
                    <div class="detail-row">
                      <span class="label">{{ 'TENDERS.FIELD.BID_SECURITY' | translate }}</span>
                      <span class="value">{{ tender()?.bidSecurityAmount | currency:tender()!.currency:'symbol':'1.0-0' }}</span>
                    </div>
                  }
                  <div class="detail-row">
                    <span class="label">{{ 'TENDERS.FIELD.CURRENCY' | translate }}</span>
                    <span class="value">{{ tender()?.currency }}</span>
                  </div>
                </div>

                <div class="detail-card">
                  <h3 class="card-title">{{ 'TENDERS.DETAIL.CONTRACT' | translate }}</h3>
                  @if (tender()?.contractStartDate) {
                    <div class="detail-row">
                      <span class="label">{{ 'TENDERS.FIELD.CONTRACT_START' | translate }}</span>
                      <span class="value">{{ tender()?.contractStartDate | date:'shortDate' }}</span>
                    </div>
                  }
                  @if (tender()?.contractEndDate) {
                    <div class="detail-row">
                      <span class="label">{{ 'TENDERS.FIELD.CONTRACT_END' | translate }}</span>
                      <span class="value">{{ tender()?.contractEndDate | date:'shortDate' }}</span>
                    </div>
                  }
                  @if (tender()?.deliveryLocation) {
                    <div class="detail-row">
                      <span class="label">{{ 'TENDERS.FIELD.DELIVERY_LOCATION' | translate }}</span>
                      <span class="value">{{ tender()?.deliveryLocation }}</span>
                    </div>
                  }
                  @if (tender()?.deliveryTerms) {
                    <div class="detail-row">
                      <span class="label">{{ 'TENDERS.FIELD.DELIVERY_TERMS' | translate }}</span>
                      <span class="value">{{ tender()?.deliveryTerms }}</span>
                    </div>
                  }
                  @if (tender()?.paymentTerms) {
                    <div class="detail-row">
                      <span class="label">{{ 'TENDERS.FIELD.PAYMENT_TERMS' | translate }}</span>
                      <span class="value">{{ tender()?.paymentTerms }}</span>
                    </div>
                  }
                </div>

                <div class="detail-card">
                  <h3 class="card-title">{{ 'TENDERS.DETAIL.CONTACT' | translate }}</h3>
                  @if (tender()?.contactPerson) {
                    <div class="detail-row">
                      <span class="label">{{ 'TENDERS.FIELD.CONTACT_PERSON' | translate }}</span>
                      <span class="value">{{ tender()?.contactPerson }}</span>
                    </div>
                  }
                  @if (tender()?.contactEmail) {
                    <div class="detail-row">
                      <span class="label">{{ 'TENDERS.FIELD.CONTACT_EMAIL' | translate }}</span>
                      <a class="value" [href]="'mailto:' + tender()?.contactEmail">{{ tender()?.contactEmail }}</a>
                    </div>
                  }
                  @if (tender()?.contactPhone) {
                    <div class="detail-row">
                      <span class="label">{{ 'TENDERS.FIELD.CONTACT_PHONE' | translate }}</span>
                      <a class="value" [href]="'tel:' + tender()?.contactPhone">{{ tender()?.contactPhone }}</a>
                    </div>
                  }
                  @if (tender()?.assignedUserName) {
                    <div class="detail-row">
                      <span class="label">{{ 'TENDERS.FIELD.ASSIGNED_TO' | translate }}</span>
                      <span class="value">{{ tender()?.assignedUserName }}</span>
                    </div>
                  }
                </div>
              </div>
            }

            @case ('items') {
              <div class="items-section">
                @if (tender()!.items.length === 0) {
                  <div class="empty-state">
                    <p>{{ 'TENDERS.ITEMS.EMPTY' | translate }}</p>
                  </div>
                } @else {
                  <table class="items-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{{ 'TENDERS.ITEMS.DESCRIPTION' | translate }}</th>
                        <th>{{ 'TENDERS.ITEMS.PRODUCT' | translate }}</th>
                        <th class="text-right">{{ 'TENDERS.ITEMS.QUANTITY' | translate }}</th>
                        <th class="text-right">{{ 'TENDERS.ITEMS.UNIT_PRICE' | translate }}</th>
                        <th class="text-right">{{ 'TENDERS.ITEMS.TOTAL' | translate }}</th>
                        <th>{{ 'TENDERS.ITEMS.REQUIRED' | translate }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of tender()!.items; track item.id; let i = $index) {
                        <tr>
                          <td>{{ i + 1 }}</td>
                          <td>
                            <div class="item-description">
                              <span class="description">{{ item.description }}</span>
                              @if (item.specification) {
                                <span class="specification">{{ item.specification }}</span>
                              }
                            </div>
                          </td>
                          <td>{{ item.productName ?? '-' }}</td>
                          <td class="text-right">{{ item.quantity }} {{ item.unit }}</td>
                          <td class="text-right">{{ item.estimatedUnitPrice | currency:tender()!.currency:'symbol':'1.2-2' }}</td>
                          <td class="text-right">{{ item.estimatedTotal | currency:tender()!.currency:'symbol':'1.2-2' }}</td>
                          <td>
                            @if (item.isRequired) {
                              <span class="required-badge">{{ 'COMMON.YES' | translate }}</span>
                            } @else {
                              <span class="optional-badge">{{ 'COMMON.NO' | translate }}</span>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colspan="5" class="text-right"><strong>{{ 'TENDERS.ITEMS.TOTAL' | translate }}</strong></td>
                        <td class="text-right"><strong>{{ totalItemsValue() | currency:tender()!.currency:'symbol':'1.2-2' }}</strong></td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                }
              </div>
            }

            @case ('bids') {
              <div class="bids-section">
                @if (tender()!.bids.length === 0) {
                  <div class="empty-state">
                    <p>{{ 'TENDERS.BIDS.EMPTY' | translate }}</p>
                    @if (tender()?.isOpen) {
                      <button class="btn btn-primary" [routerLink]="['/tenders', tender()?.id, 'bid']">
                        {{ 'TENDERS.ACTIONS.ADD_BID' | translate }}
                      </button>
                    }
                  </div>
                } @else {
                  <div class="bids-grid">
                    @for (bid of tender()!.bids; track bid.id) {
                      <div class="bid-card" [class.winning]="bid.isWinningBid">
                        <div class="bid-header">
                          <span class="bid-number">{{ bid.bidNumber }}</span>
                          <span class="bid-status" [class]="bidStatusColors[bid.status]">
                            {{ bidStatusLabels[bid.status] | translate }}
                          </span>
                          @if (bid.isWinningBid) {
                            <span class="winning-badge">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                              </svg>
                              {{ 'TENDERS.BIDS.WINNER' | translate }}
                            </span>
                          }
                        </div>
                        <div class="bid-body">
                          <div class="bid-amount">
                            <span class="amount">{{ bid.finalAmount | currency:bid.currency:'symbol':'1.0-0' }}</span>
                            @if (bid.discountAmount && bid.discountAmount > 0) {
                              <span class="discount">-{{ bid.discountAmount | currency:bid.currency:'symbol':'1.0-0' }}</span>
                            }
                          </div>
                          <div class="bid-details">
                            <div class="detail">
                              <span class="label">{{ 'TENDERS.BIDS.VALIDITY' | translate }}</span>
                              <span class="value">{{ bid.validityDays }} {{ 'COMMON.DAYS' | translate }}</span>
                            </div>
                            @if (bid.deliveryDays) {
                              <div class="detail">
                                <span class="label">{{ 'TENDERS.BIDS.DELIVERY' | translate }}</span>
                                <span class="value">{{ bid.deliveryDays }} {{ 'COMMON.DAYS' | translate }}</span>
                              </div>
                            }
                            @if (bid.warrantyMonths) {
                              <div class="detail">
                                <span class="label">{{ 'TENDERS.BIDS.WARRANTY' | translate }}</span>
                                <span class="value">{{ bid.warrantyMonths }} {{ 'COMMON.MONTHS' | translate }}</span>
                              </div>
                            }
                            @if (bid.evaluationScore) {
                              <div class="detail">
                                <span class="label">{{ 'TENDERS.BIDS.SCORE' | translate }}</span>
                                <span class="value score">{{ bid.evaluationScore | number:'1.1-1' }}</span>
                              </div>
                            }
                          </div>
                          <div class="bid-meta">
                            @if (bid.preparedByName) {
                              <span>{{ 'TENDERS.BIDS.PREPARED_BY' | translate }}: {{ bid.preparedByName }}</span>
                            }
                            @if (bid.submittedDate) {
                              <span>{{ 'TENDERS.BIDS.SUBMITTED' | translate }}: {{ bid.submittedDate | date:'short' }}</span>
                            }
                          </div>
                        </div>
                        <div class="bid-actions">
                          @if (tender()?.status === 'UnderEvaluation' && !bid.isWinningBid) {
                            <button class="btn btn-sm btn-success" (click)="awardToBid(bid.id)">
                              {{ 'TENDERS.ACTIONS.AWARD_THIS' | translate }}
                            </button>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }

            @case ('documents') {
              <div class="documents-section">
                @if (tender()!.documents.length === 0) {
                  <div class="empty-state">
                    <p>{{ 'TENDERS.DOCUMENTS.EMPTY' | translate }}</p>
                  </div>
                } @else {
                  <div class="documents-grid">
                    @for (doc of tender()!.documents; track doc.id) {
                      <div class="document-card">
                        <div class="document-icon">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                        </div>
                        <div class="document-info">
                          <span class="document-name">{{ doc.name }}</span>
                          <span class="document-type">{{ doc.documentType }}</span>
                          @if (doc.description) {
                            <span class="document-description">{{ doc.description }}</span>
                          }
                          <span class="document-meta">
                            {{ doc.uploadedByName }} • {{ doc.createdAt | date:'short' }}
                          </span>
                        </div>
                        <div class="document-actions">
                          <a class="btn-icon" [href]="doc.filePath" target="_blank" download>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="7 10 12 15 17 10"/>
                              <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                          </a>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          }
        </div>
      }

      <!-- Cancel Dialog -->
      <app-confirm-dialog
        [open]="showCancelDialog()"
        [title]="'TENDERS.CANCEL.TITLE' | translate"
        [message]="'TENDERS.CANCEL.MESSAGE' | translate"
        [confirmLabel]="'TENDERS.ACTIONS.CANCEL' | translate"
        [cancelLabel]="'COMMON.CLOSE' | translate"
        type="danger"
        (confirm)="cancelTender()"
        (cancel)="showCancelDialog.set(false)">
      </app-confirm-dialog>

      <!-- Award Dialog -->
      <app-confirm-dialog
        [open]="showAwardDialog()"
        [title]="'TENDERS.AWARD.TITLE' | translate"
        [message]="'TENDERS.AWARD.MESSAGE' | translate"
        [confirmLabel]="'TENDERS.ACTIONS.AWARD' | translate"
        [cancelLabel]="'COMMON.CLOSE' | translate"
        type="info"
        (confirm)="awardSelectedBid()"
        (cancel)="showAwardDialog.set(false)">
      </app-confirm-dialog>
    </div>
  `,
  styles: [`
    .tender-detail-page {
      padding: 1.5rem;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      color: var(--text-secondary);
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border-color);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      gap: 1rem;
    }

    .header-left {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .btn-back {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      background: var(--bg-primary);
      cursor: pointer;
      color: var(--text-secondary);
    }

    .btn-back:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }

    .header-title-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.25rem;
    }

    .tender-number {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .customer-name {
      color: var(--text-secondary);
      margin: 0.25rem 0 0;
    }

    .status-badge, .priority-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-weight: 500;
      cursor: pointer;
      border: none;
      font-size: 0.875rem;
      transition: all 0.15s;
    }

    .btn-primary { background: var(--primary); color: white; }
    .btn-secondary { background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); }
    .btn-success { background: var(--color-success-dark); color: white; }
    .btn-warning { background: #d97706; color: white; }
    .btn-danger { background: #dc2626; color: white; }

    .tabs-container {
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .tabs {
      display: flex;
      gap: 0;
    }

    .tab {
      padding: 0.75rem 1.5rem;
      background: none;
      border: none;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.15s;
    }

    .tab:hover {
      color: var(--text-primary);
    }

    .tab.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }

    .tab-badge {
      margin-left: 0.5rem;
      padding: 0.125rem 0.375rem;
      background: var(--bg-secondary);
      border-radius: 9999px;
      font-size: 0.75rem;
    }

    .tab.active .tab-badge {
      background: var(--primary);
      color: white;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
    }

    .detail-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      padding: 1rem;
    }

    .card-title {
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--text-secondary);
      margin: 0 0 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border-color);
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-row.full-width {
      flex-direction: column;
      gap: 0.5rem;
    }

    .detail-row .label {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .detail-row .value {
      font-weight: 500;
      color: var(--text-primary);
    }

    .detail-row .description {
      margin: 0;
      white-space: pre-wrap;
    }

    .deadline-warning { color: var(--status-pending-text); }
    .deadline-passed { color: var(--color-error-dark); }

    /* Items table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
    }

    .items-table th, .items-table td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    .items-table th {
      background: var(--bg-secondary);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--text-secondary);
    }

    .items-table tfoot td {
      background: var(--bg-secondary);
      font-weight: 600;
    }

    .item-description .description {
      display: block;
      font-weight: 500;
    }

    .item-description .specification {
      display: block;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .text-right { text-align: right; }

    .required-badge {
      padding: 0.125rem 0.375rem;
      background: var(--color-success-bg);
      color: var(--color-success-dark);
      border-radius: 0.25rem;
      font-size: 0.75rem;
    }

    .optional-badge {
      padding: 0.125rem 0.375rem;
      background: var(--bg-secondary);
      color: var(--text-secondary);
      border-radius: 0.25rem;
      font-size: 0.75rem;
    }

    /* Bids */
    .bids-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1rem;
    }

    .bid-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .bid-card.winning {
      border-color: var(--color-success-dark);
      box-shadow: 0 0 0 1px #16a34a;
    }

    .bid-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
    }

    .bid-number {
      font-weight: 600;
    }

    .bid-status {
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .winning-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      margin-left: auto;
      padding: 0.125rem 0.5rem;
      background: var(--color-success-bg);
      color: var(--color-success-dark);
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .bid-body {
      padding: 1rem;
    }

    .bid-amount {
      margin-bottom: 1rem;
    }

    .bid-amount .amount {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .bid-amount .discount {
      margin-left: 0.5rem;
      font-size: 0.875rem;
      color: var(--color-success-dark);
    }

    .bid-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .bid-details .detail {
      display: flex;
      flex-direction: column;
    }

    .bid-details .label {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .bid-details .value {
      font-weight: 500;
    }

    .bid-details .score {
      color: var(--primary);
      font-size: 1.125rem;
    }

    .bid-meta {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .bid-actions {
      padding: 0.75rem 1rem;
      border-top: 1px solid var(--border-color);
      background: var(--bg-secondary);
    }

    .btn-sm {
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
    }

    /* Documents */
    .documents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .document-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
    }

    .document-icon {
      color: var(--text-secondary);
    }

    .document-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .document-name {
      font-weight: 500;
    }

    .document-type {
      font-size: 0.75rem;
      color: var(--primary);
    }

    .document-description {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .document-meta {
      font-size: 0.625rem;
      color: var(--text-tertiary);
    }

    .document-actions .btn-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: 1px solid var(--border-color);
      border-radius: 0.375rem;
      background: var(--bg-primary);
      color: var(--text-secondary);
      text-decoration: none;
    }

    .document-actions .btn-icon:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--text-secondary);
    }

    .empty-state .btn {
      margin-top: 1rem;
    }
  `]
})
export class TenderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tenderService = inject(TenderService);
  private readonly translate = inject(TranslateService);

  // State
  readonly tender = signal<TenderDetailDto | null>(null);
  readonly loading = this.tenderService.loading;
  readonly activeTab = signal<'details' | 'items' | 'bids' | 'documents'>('details');
  readonly showCancelDialog = signal(false);
  readonly showAwardDialog = signal(false);

  private selectedBidId: number | null = null;

  // Labels
  readonly tenderStatusLabels = tenderStatusLabels;
  readonly tenderStatusColors = tenderStatusColors;
  readonly tenderTypeLabels = tenderTypeLabels;
  readonly tenderPriorityLabels = tenderPriorityLabels;
  readonly tenderPriorityColors = tenderPriorityColors;
  readonly bidStatusLabels = bidStatusLabels;
  readonly bidStatusColors = bidStatusColors;

  // Computed
  readonly totalItemsValue = computed(() => {
    const items = this.tender()?.items || [];
    return items.reduce((sum, item) => sum + (item.estimatedTotal || 0), 0);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTender(+id);
    }
  }

  loadTender(id: number): void {
    this.tenderService.getTender(id).subscribe({
      next: (tender) => {
        this.tender.set(tender);
      },
      error: (err) => {
        console.error('Failed to load tender', err);
        this.router.navigate(['/tenders']);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/tenders']);
  }

  isDeadlineSoon(): boolean {
    const tender = this.tender();
    if (!tender?.isOpen) return false;
    const days = this.getDaysRemaining();
    return days > 0 && days <= 7;
  }

  isDeadlinePassed(): boolean {
    const tender = this.tender();
    if (!tender) return false;
    return new Date(tender.submissionDeadline) < new Date();
  }

  getDaysRemaining(): number {
    const tender = this.tender();
    if (!tender) return 0;
    const now = new Date();
    const deadline = new Date(tender.submissionDeadline);
    const diff = deadline.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  publishTender(): void {
    const tender = this.tender();
    if (!tender) return;

    this.tenderService.publishTender(tender.id).subscribe({
      next: (updated) => {
        this.tender.set(updated);
      },
      error: (err) => {
        console.error('Failed to publish tender', err);
      }
    });
  }

  closeTender(): void {
    const tender = this.tender();
    if (!tender) return;

    this.tenderService.closeTender(tender.id).subscribe({
      next: (updated) => {
        this.tender.set(updated);
      },
      error: (err) => {
        console.error('Failed to close tender', err);
      }
    });
  }

  cancelTender(): void {
    const tender = this.tender();
    if (!tender) return;

    this.tenderService.cancelTender(tender.id).subscribe({
      next: (updated) => {
        this.tender.set(updated);
        this.showCancelDialog.set(false);
      },
      error: (err) => {
        console.error('Failed to cancel tender', err);
      }
    });
  }

  awardToBid(bidId: number): void {
    this.selectedBidId = bidId;
    this.showAwardDialog.set(true);
  }

  awardSelectedBid(): void {
    const tender = this.tender();
    if (!tender || !this.selectedBidId) return;

    this.tenderService.awardTender(tender.id, this.selectedBidId).subscribe({
      next: (updated) => {
        this.tender.set(updated);
        this.showAwardDialog.set(false);
        this.selectedBidId = null;
      },
      error: (err) => {
        console.error('Failed to award tender', err);
      }
    });
  }
}
