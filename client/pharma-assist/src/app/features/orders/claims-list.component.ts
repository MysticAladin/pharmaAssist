import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ClaimsService, ClaimStatus, ClaimSummary } from '../../core/services/claims.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { EuropeanDatePipe } from '../../core/pipes';

import { StatusBadgeComponent } from '../../shared/components/status-badge';
import { EmptyStateComponent } from '../../shared/components/empty-state';
import { PaginationComponent, PageEvent } from '../../shared/components/pagination';

@Component({
  selector: 'app-claims-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    EuropeanDatePipe,
    StatusBadgeComponent,
    EmptyStateComponent,
    PaginationComponent
  ],
  templateUrl: './claims-list/claims-list.component.html',
  styleUrls: ['./claims-list/claims-list.component.scss']
})
export class ClaimsListComponent {
  private readonly claimsService = inject(ClaimsService);
  private readonly notification = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly translate = inject(TranslateService);

  readonly ClaimStatus = ClaimStatus;

  loading = signal(false);
  items = signal<ClaimSummary[]>([]);

  currentPage = signal(1);
  totalItems = signal(0);
  pageSize = 10;

  selectedStatus = signal<ClaimStatus | null>(null);

  statusOptions = [
    { value: null, label: 'common.all' },
    { value: ClaimStatus.Submitted, label: 'portal.claims.statuses.submitted' },
    { value: ClaimStatus.UnderReview, label: 'portal.claims.statuses.underReview' },
    { value: ClaimStatus.Approved, label: 'portal.claims.statuses.approved' },
    { value: ClaimStatus.Rejected, label: 'portal.claims.statuses.rejected' },
    { value: ClaimStatus.AwaitingReturn, label: 'portal.claims.statuses.awaitingReturn' },
    { value: ClaimStatus.ReturnReceived, label: 'portal.claims.statuses.returnReceived' },
    { value: ClaimStatus.Resolved, label: 'portal.claims.statuses.resolved' },
    { value: ClaimStatus.Cancelled, label: 'portal.claims.statuses.cancelled' }
  ];

  constructor() {
    this.load();
  }

  load(page = this.currentPage()): void {
    this.loading.set(true);
    this.currentPage.set(page);

    const status = this.selectedStatus();

    this.claimsService.getPaged(page, this.pageSize, { status: status ?? undefined }).subscribe({
      next: (res) => {
        this.items.set(res.items ?? []);
        this.totalItems.set(res.totalCount ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notification.error(this.translate.instant('orders.claims.loadError'));
      }
    });
  }

  onPageChange(evt: PageEvent) {
    this.pageSize = evt.pageSize;
    this.load(evt.page);
  }

  onStatusChange(event: Event) {
    const value = (event.target as HTMLSelectElement | null)?.value ?? '';
    const parsed = value ? Number(value) : null;
    this.selectedStatus.set((parsed as ClaimStatus) ?? null);
    this.load(1);
  }

  getStatusVariant(status: ClaimStatus): 'success' | 'warning' | 'danger' | 'info' {
    switch (status) {
      case ClaimStatus.Resolved:
      case ClaimStatus.ReturnReceived:
        return 'success';
      case ClaimStatus.Rejected:
      case ClaimStatus.Cancelled:
        return 'danger';
      case ClaimStatus.Submitted:
      case ClaimStatus.UnderReview:
      case ClaimStatus.AwaitingReturn:
        return 'warning';
      default:
        return 'info';
    }
  }

  canApprove(item: ClaimSummary): boolean {
    return item.status === ClaimStatus.Submitted || item.status === ClaimStatus.UnderReview;
  }

  canReject(item: ClaimSummary): boolean {
    return item.status === ClaimStatus.Submitted || item.status === ClaimStatus.UnderReview;
  }

  async approve(item: ClaimSummary) {
    const ok = await this.confirmation.confirm({
      title: 'orders.claims.confirmApproveTitle',
      message: 'orders.claims.confirmApproveMessage',
      confirmText: 'common.approve',
      cancelText: 'common.cancel',
      variant: 'info'
    });
    if (!ok) return;

    const notes = prompt(this.translate.instant('orders.claims.enterNotePrompt'));
    if (notes == null) return;
    if (!notes.trim()) {
      this.notification.error(this.translate.instant('orders.claims.noteRequired'));
      return;
    }

    this.claimsService.updateStatus(item.id, { status: ClaimStatus.Approved, notes: notes.trim() }).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success(this.translate.instant('orders.claims.approved'));
          this.load();
        } else {
          this.notification.error(res.message || this.translate.instant('orders.claims.actionError'));
        }
      },
      error: () => this.notification.error(this.translate.instant('orders.claims.actionError'))
    });
  }

  async reject(item: ClaimSummary) {
    const ok = await this.confirmation.confirm({
      title: 'orders.claims.confirmRejectTitle',
      message: 'orders.claims.confirmRejectMessage',
      confirmText: 'common.reject',
      cancelText: 'common.cancel',
      variant: 'danger'
    });
    if (!ok) return;

    const notes = prompt(this.translate.instant('orders.claims.enterNotePrompt'));
    if (notes == null) return;
    if (!notes.trim()) {
      this.notification.error(this.translate.instant('orders.claims.noteRequired'));
      return;
    }

    this.claimsService.updateStatus(item.id, { status: ClaimStatus.Rejected, notes: notes.trim() }).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success(this.translate.instant('orders.claims.rejected'));
          this.load();
        } else {
          this.notification.error(res.message || this.translate.instant('orders.claims.actionError'));
        }
      },
      error: () => this.notification.error(this.translate.instant('orders.claims.actionError'))
    });
  }
}
