import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { PrescriptionService, PrescriptionStats } from '../../core/services/prescription.service';
import {
  PrescriptionSummary,
  PrescriptionStatus,
  PrescriptionPriority,
  PrescriptionFilter,
  getPrescriptionStatusLabel,
  getPrescriptionStatusColor,
  getPriorityLabel,
  getPriorityColor
} from '../../core/models/prescription.model';
import { NotificationService } from '../../core/services/notification.service';

import { SearchInputComponent } from '../../shared/components/search-input';
import { StatusBadgeComponent } from '../../shared/components/status-badge';
import { EmptyStateComponent } from '../../shared/components/empty-state';
import { PaginationComponent, PageEvent } from '../../shared/components/pagination';

@Component({
  selector: 'app-prescriptions-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    DatePipe,
    SearchInputComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    PaginationComponent
  ],
  template: `
    <div class="prescriptions-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">{{ 'prescriptions.title' | translate }}</h1>
          <p class="page-subtitle">{{ 'prescriptions.subtitle' | translate }}</p>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-row">
        <div class="stat-card" [class.active]="activeTab() === 'pending'" (click)="setTab('pending')">
          <div class="stat-icon pending">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats()?.pending || 0 }}</span>
            <span class="stat-label">{{ 'prescriptions.stats.pending' | translate }}</span>
          </div>
        </div>
        <div class="stat-card" [class.active]="activeTab() === 'review'" (click)="setTab('review')">
          <div class="stat-icon review">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats()?.underReview || 0 }}</span>
            <span class="stat-label">{{ 'prescriptions.stats.underReview' | translate }}</span>
          </div>
        </div>
        <div class="stat-card" [class.active]="activeTab() === 'approved'" (click)="setTab('approved')">
          <div class="stat-icon approved">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats()?.approved || 0 }}</span>
            <span class="stat-label">{{ 'prescriptions.stats.approved' | translate }}</span>
          </div>
        </div>
        <div class="stat-card" [class.active]="activeTab() === 'dispensed'" (click)="setTab('dispensed')">
          <div class="stat-icon dispensed">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats()?.dispensed || 0 }}</span>
            <span class="stat-label">{{ 'prescriptions.stats.dispensed' | translate }}</span>
          </div>
        </div>
      </div>

      <!-- Urgent Alert -->
      @if (stats()?.urgentCount && stats()!.urgentCount > 0) {
        <div class="urgent-alert">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>{{ stats()!.urgentCount }} {{ 'prescriptions.urgentAlert' | translate }}</span>
          @if (stats()?.controlledCount && stats()!.controlledCount > 0) {
            <span class="controlled-badge">{{ stats()!.controlledCount }} {{ 'prescriptions.controlled' | translate }}</span>
          }
        </div>
      }

      <!-- Filters Bar -->
      <div class="filters-bar">
        <app-search-input
          [placeholder]="'prescriptions.searchPlaceholder'"
          (search)="onSearch($event)"
        ></app-search-input>

        <div class="filter-group">
          <select class="filter-select" [ngModel]="filter().priority" (ngModelChange)="onPriorityChange($event)">
            <option [ngValue]="undefined">{{ 'prescriptions.allPriorities' | translate }}</option>
            <option [ngValue]="0">{{ 'prescriptions.priority.normal' | translate }}</option>
            <option [ngValue]="1">{{ 'prescriptions.priority.urgent' | translate }}</option>
            <option [ngValue]="2">{{ 'prescriptions.priority.emergency' | translate }}</option>
          </select>

          <label class="filter-checkbox">
            <input type="checkbox" [ngModel]="filter().isControlled" (ngModelChange)="onControlledChange($event)">
            <span>{{ 'prescriptions.controlledOnly' | translate }}</span>
          </label>
        </div>
      </div>

      <!-- Prescriptions List -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>{{ 'common.loading' | translate }}</p>
        </div>
      } @else if (prescriptions().length === 0) {
        <app-empty-state
          [title]="'prescriptions.empty.title'"
          [description]="'prescriptions.empty.description'"
          icon="file-text"
        ></app-empty-state>
      } @else {
        <div class="prescriptions-list">
          @for (rx of prescriptions(); track rx.id) {
            <div class="prescription-card" [class.urgent]="rx.priority === 1" [class.emergency]="rx.priority === 2" (click)="viewPrescription(rx)">
              <div class="card-header">
                <div class="rx-number">
                  <span class="number">{{ rx.prescriptionNumber }}</span>
                  @if (rx.isControlled) {
                    <span class="controlled-tag">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      {{ 'prescriptions.controlled' | translate }}
                    </span>
                  }
                </div>
                <div class="rx-badges">
                  @if (rx.priority !== 0) {
                    <app-status-badge [variant]="getPriorityColor(rx.priority)" [label]="getPriorityLabel(rx.priority) | translate"></app-status-badge>
                  }
                  <app-status-badge [variant]="getStatusColor(rx.status)" [label]="getStatusLabel(rx.status) | translate"></app-status-badge>
                </div>
              </div>

              <div class="card-body">
                <div class="info-row">
                  <div class="info-item">
                    <span class="label">{{ 'prescriptions.patient' | translate }}</span>
                    <span class="value">{{ rx.patientName }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">{{ 'prescriptions.doctor' | translate }}</span>
                    <span class="value">{{ rx.doctorName }}</span>
                  </div>
                </div>
                <div class="info-row">
                  <div class="info-item">
                    <span class="label">{{ 'prescriptions.customer' | translate }}</span>
                    <span class="value">{{ rx.customerName }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">{{ 'prescriptions.items' | translate }}</span>
                    <span class="value">{{ rx.itemCount }} {{ 'prescriptions.medications' | translate }}</span>
                  </div>
                </div>
              </div>

              <div class="card-footer">
                <div class="dates">
                  <span class="date">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    {{ rx.issueDate | date:'mediumDate' }}
                  </span>
                  <span class="date expiry" [class.expired]="isExpired(rx.expiryDate)">
                    {{ 'prescriptions.expires' | translate }}: {{ rx.expiryDate | date:'mediumDate' }}
                  </span>
                </div>
                <div class="actions">
                  @if (rx.status === 0 || rx.status === 1) {
                    <button class="btn-action approve" (click)="reviewPrescription(rx, true, $event)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {{ 'prescriptions.approve' | translate }}
                    </button>
                    <button class="btn-action reject" (click)="reviewPrescription(rx, false, $event)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                      {{ 'prescriptions.reject' | translate }}
                    </button>
                  }
                  @if (rx.status === 2) {
                    <button class="btn-action dispense" (click)="dispensePrescription(rx, $event)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                      {{ 'prescriptions.dispense' | translate }}
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Pagination -->
        <app-pagination
          [page]="filter().page"
          [size]="filter().pageSize"
          [totalItems]="totalCount()"
          (pageChange)="onPageChange($event)"
        ></app-pagination>
      }
    </div>
  `,
  styles: [`
    :host{--c1:#1a1a2e;--c2:#6b7280;--c3:#e5e7eb;--c4:#f3f4f6;--c5:#0aaaaa;--c6:#dc2626;--c7:#f59e0b;--c8:#3b82f6}
    .prescriptions-page{padding:1.5rem;max-width:1400px;margin:0 auto}
    .page-header{margin-bottom:1.5rem}
    .page-title{font-size:1.5rem;font-weight:600;color:var(--c1);margin:0 0 .25rem}
    .page-subtitle{color:var(--c2);margin:0;font-size:.9rem}

    .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem}
    @media(max-width:900px){.stats-row{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:500px){.stats-row{grid-template-columns:1fr}}
    .stat-card{display:flex;align-items:center;gap:1rem;padding:1rem 1.25rem;background:#fff;border:1px solid var(--c3);border-radius:12px;cursor:pointer;transition:all .2s}
    .stat-card:hover,.stat-card.active{border-color:var(--c5);box-shadow:0 4px 12px rgba(13,148,136,.1)}
    .stat-card.active{background:linear-gradient(135deg,rgba(13,148,136,.05),rgba(13,148,136,.02))}
    .stat-icon{width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center}
    .stat-icon.pending{background:#fef3c7;color:#d97706}
    .stat-icon.review{background:#dbeafe;color:#2563eb}
    .stat-icon.approved{background:#d1fae5;color:#059669}
    .stat-icon.dispensed{background:#f0fdf4;color:#16a34a}
    .stat-value{font-size:1.5rem;font-weight:700;color:var(--c1);display:block}
    .stat-label{font-size:.8rem;color:var(--c2)}

    .urgent-alert{display:flex;align-items:center;gap:.75rem;padding:1rem 1.25rem;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;color:#dc2626;font-weight:500;margin-bottom:1.5rem}
    .urgent-alert svg{flex-shrink:0}
    .controlled-badge{margin-left:auto;background:#dc2626;color:#fff;padding:.25rem .75rem;border-radius:20px;font-size:.75rem}

    .filters-bar{display:flex;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap;align-items:center}
    .filter-group{display:flex;gap:.75rem;align-items:center;flex-wrap:wrap}
    .filter-select{padding:.5rem 2rem .5rem .75rem;border:1px solid var(--c3);border-radius:8px;font-size:.875rem;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236b7280' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E") no-repeat right .75rem center;appearance:none;cursor:pointer}
    .filter-checkbox{display:flex;align-items:center;gap:.5rem;font-size:.875rem;color:var(--c2);cursor:pointer}
    .filter-checkbox input{width:16px;height:16px;accent-color:var(--c5)}

    .loading-state{display:flex;flex-direction:column;align-items:center;padding:4rem 2rem;color:var(--c2)}
    .spinner{width:40px;height:40px;border:3px solid var(--c3);border-top-color:var(--c5);border-radius:50%;animation:spin .8s linear infinite;margin-bottom:1rem}
    @keyframes spin{to{transform:rotate(360deg)}}

    .prescriptions-list{display:flex;flex-direction:column;gap:1rem;margin-bottom:1.5rem}
    .prescription-card{background:#fff;border:1px solid var(--c3);border-radius:12px;overflow:hidden;cursor:pointer;transition:all .2s}
    .prescription-card:hover{border-color:var(--c5);box-shadow:0 4px 16px rgba(0,0,0,.08)}
    .prescription-card.urgent{border-left:4px solid var(--c7)}
    .prescription-card.emergency{border-left:4px solid var(--c6)}

    .card-header{display:flex;justify-content:space-between;align-items:center;padding:1rem 1.25rem;background:var(--c4);border-bottom:1px solid var(--c3)}
    .rx-number{display:flex;align-items:center;gap:.75rem}
    .rx-number .number{font-weight:600;color:var(--c1);font-size:1rem}
    .controlled-tag{display:inline-flex;align-items:center;gap:.25rem;padding:.25rem .5rem;background:#fef2f2;color:#dc2626;font-size:.7rem;font-weight:500;border-radius:4px}
    .rx-badges{display:flex;gap:.5rem}

    .card-body{padding:1rem 1.25rem}
    .info-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:.75rem}
    .info-row:last-child{margin-bottom:0}
    .info-item .label{display:block;font-size:.75rem;color:var(--c2);margin-bottom:.125rem}
    .info-item .value{font-size:.875rem;color:var(--c1);font-weight:500}

    .card-footer{display:flex;justify-content:space-between;align-items:center;padding:.75rem 1.25rem;background:var(--c4);border-top:1px solid var(--c3)}
    .dates{display:flex;gap:1.5rem}
    .date{display:flex;align-items:center;gap:.375rem;font-size:.8rem;color:var(--c2)}
    .date.expiry.expired{color:var(--c6)}
    .actions{display:flex;gap:.5rem}
    .btn-action{display:inline-flex;align-items:center;gap:.375rem;padding:.5rem .875rem;border:none;border-radius:6px;font-size:.8rem;font-weight:500;cursor:pointer;transition:all .2s}
    .btn-action.approve{background:#d1fae5;color:#059669}
    .btn-action.approve:hover{background:#a7f3d0}
    .btn-action.reject{background:#fee2e2;color:#dc2626}
    .btn-action.reject:hover{background:#fecaca}
    .btn-action.dispense{background:#dbeafe;color:#2563eb}
    .btn-action.dispense:hover{background:#bfdbfe}

    @media(max-width:600px){
      .info-row{grid-template-columns:1fr}
      .card-footer{flex-direction:column;gap:.75rem;align-items:stretch}
      .dates{flex-wrap:wrap}
      .actions{justify-content:flex-end}
    }
  `]
})
export class PrescriptionsListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly prescriptionService = inject(PrescriptionService);
  private readonly notificationService = inject(NotificationService);

  loading = signal(false);
  prescriptions = signal<PrescriptionSummary[]>([]);
  stats = signal<PrescriptionStats | null>(null);
  totalCount = signal(0);
  activeTab = signal<'all' | 'pending' | 'review' | 'approved' | 'dispensed'>('all');

  filter = signal<PrescriptionFilter>({
    page: 1,
    pageSize: 10
  });

  ngOnInit(): void {
    this.loadStats();
    this.loadPrescriptions();
  }

  private loadStats(): void {
    this.prescriptionService.getStats().subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => {
        // Mock data for demo
        this.stats.set({
          pending: 7,
          underReview: 3,
          approved: 12,
          rejected: 2,
          dispensed: 45,
          urgentCount: 2,
          controlledCount: 1
        });
      }
    });
  }

  private loadPrescriptions(): void {
    this.loading.set(true);
    this.prescriptionService.getAll(this.filter()).subscribe({
      next: (result) => {
        this.prescriptions.set(result.items);
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
      },
      error: () => {
        // Mock data for demo
        this.prescriptions.set(this.getMockPrescriptions());
        this.totalCount.set(15);
        this.loading.set(false);
      }
    });
  }

  setTab(tab: 'all' | 'pending' | 'review' | 'approved' | 'dispensed'): void {
    this.activeTab.set(tab);
    const statusMap: Record<string, PrescriptionStatus | undefined> = {
      'all': undefined,
      'pending': PrescriptionStatus.Pending,
      'review': PrescriptionStatus.UnderReview,
      'approved': PrescriptionStatus.Approved,
      'dispensed': PrescriptionStatus.Dispensed
    };
    this.filter.update(f => ({ ...f, status: statusMap[tab], page: 1 }));
    this.loadPrescriptions();
  }

  onSearch(term: string): void {
    this.filter.update(f => ({ ...f, searchTerm: term, page: 1 }));
    this.loadPrescriptions();
  }

  onPriorityChange(priority: PrescriptionPriority | undefined): void {
    this.filter.update(f => ({ ...f, priority, page: 1 }));
    this.loadPrescriptions();
  }

  onControlledChange(isControlled: boolean): void {
    this.filter.update(f => ({ ...f, isControlled: isControlled || undefined, page: 1 }));
    this.loadPrescriptions();
  }

  onPageChange(event: PageEvent): void {
    this.filter.update(f => ({ ...f, page: event.page, pageSize: event.pageSize }));
    this.loadPrescriptions();
  }

  viewPrescription(rx: PrescriptionSummary): void {
    this.router.navigate(['/orders/prescriptions', rx.id]);
  }

  reviewPrescription(rx: PrescriptionSummary, approved: boolean, event: Event): void {
    event.stopPropagation();
    // TODO: Open review modal
    const action = approved ? 'approved' : 'rejected';
    this.notificationService.success(
      `Prescription ${action}`,
      `${rx.prescriptionNumber} has been ${action}`
    );
  }

  dispensePrescription(rx: PrescriptionSummary, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/orders/prescriptions', rx.id, 'dispense']);
  }

  isExpired(date: Date): boolean {
    return new Date(date) < new Date();
  }

  getStatusLabel = getPrescriptionStatusLabel;
  getStatusColor = getPrescriptionStatusColor;
  getPriorityLabel = getPriorityLabel;
  getPriorityColor = getPriorityColor;

  private getMockPrescriptions(): PrescriptionSummary[] {
    return [
      { id: '1', prescriptionNumber: 'RX-2024-001', customerName: 'Apoteka Centar', patientName: 'Mira Hadžić', doctorName: 'Dr. Selma Kovač', issueDate: new Date('2024-12-01'), expiryDate: new Date('2024-12-31'), status: PrescriptionStatus.Pending, priority: PrescriptionPriority.Urgent, isControlled: true, itemCount: 2, createdAt: new Date() },
      { id: '2', prescriptionNumber: 'RX-2024-002', customerName: 'Farmacija Plus', patientName: 'Amir Begović', doctorName: 'Dr. Emir Jahić', issueDate: new Date('2024-12-02'), expiryDate: new Date('2025-01-02'), status: PrescriptionStatus.Pending, priority: PrescriptionPriority.Normal, isControlled: false, itemCount: 3, createdAt: new Date() },
      { id: '3', prescriptionNumber: 'RX-2024-003', customerName: 'Zdravlje d.o.o.', patientName: 'Lejla Muratović', doctorName: 'Dr. Alma Hodžić', issueDate: new Date('2024-11-28'), expiryDate: new Date('2024-12-28'), status: PrescriptionStatus.Approved, priority: PrescriptionPriority.Normal, isControlled: false, itemCount: 1, createdAt: new Date() },
      { id: '4', prescriptionNumber: 'RX-2024-004', customerName: 'Apoteka Baščaršija', patientName: 'Kenan Delić', doctorName: 'Dr. Nedim Imamović', issueDate: new Date('2024-11-25'), expiryDate: new Date('2024-12-25'), status: PrescriptionStatus.Dispensed, priority: PrescriptionPriority.Normal, isControlled: false, itemCount: 2, createdAt: new Date() },
    ];
  }
}
