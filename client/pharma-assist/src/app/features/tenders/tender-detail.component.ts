import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EuropeanDatePipe } from '../../core/pipes';
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
    CurrencyPipe,
    EuropeanDatePipe,
    ConfirmDialogComponent
  ],
  templateUrl: './tender-detail-component/tender-detail.component.html',
  styleUrls: ['./tender-detail-component/tender-detail.component.scss']
})
export class TenderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tenderService = inject(TenderService);
  private readonly translate = inject(TranslateService);

  readonly tender = signal<TenderDetailDto | null>(null);
  readonly loading = this.tenderService.loading;
  readonly activeTab = signal<'details' | 'items' | 'bids' | 'documents'>('details');
  readonly showCancelDialog = signal(false);
  readonly showAwardDialog = signal(false);

  private selectedBidId: number | null = null;

  readonly tenderStatusLabels = tenderStatusLabels;
  readonly tenderStatusColors = tenderStatusColors;
  readonly tenderTypeLabels = tenderTypeLabels;
  readonly tenderPriorityLabels = tenderPriorityLabels;
  readonly tenderPriorityColors = tenderPriorityColors;
  readonly bidStatusLabels = bidStatusLabels;
  readonly bidStatusColors = bidStatusColors;

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
