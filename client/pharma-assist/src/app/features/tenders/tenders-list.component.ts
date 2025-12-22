import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { TenderService } from '../../core/services/tender.service';
import {
  TenderDto,
  TenderFilterDto,
  TenderStatus,
  TenderType,
  TenderPriority,
  tenderStatusLabels,
  tenderStatusColors,
  tenderTypeLabels,
  tenderPriorityLabels,
  tenderPriorityColors
} from '../../core/models/tender.model';
import { IPagedResult } from '../../core/models/common.model';

import { SearchInputComponent } from '../../shared/components/search-input';
import { EmptyStateComponent } from '../../shared/components/empty-state';
import { PaginationComponent, PageEvent } from '../../shared/components/pagination';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog';

@Component({
  selector: 'app-tenders-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslateModule,
    DatePipe,
    CurrencyPipe,
    SearchInputComponent,
    EmptyStateComponent,
    PaginationComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './tenders-list-component/tenders-list.component.html',
  styleUrls: ['./tenders-list-component/tenders-list.component.scss']
})
export class TendersListComponent implements OnInit {
  protected readonly router = inject(Router);
  private readonly tenderService = inject(TenderService);
  private readonly translate = inject(TranslateService);

  // State
  readonly tenders = signal<TenderDto[]>([]);
  readonly totalItems = signal(0);
  readonly stats = signal(this.tenderService.stats());
  readonly loading = this.tenderService.loading;
  readonly showDeleteDialog = signal(false);

  // Filters
  searchTerm = '';
  selectedStatus: TenderStatus | null = null;
  selectedType: TenderType | null = null;
  selectedPriority: TenderPriority | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 20;

  // Sorting
  sortField = 'submissionDeadline';
  sortDescending = false;

  // Delete
  private tenderToDelete: TenderDto | null = null;

  // Constants
  readonly statuses: TenderStatus[] = ['Draft', 'Published', 'Open', 'UnderEvaluation', 'Awarded', 'Cancelled', 'Expired', 'Completed'];
  readonly types: TenderType[] = ['OpenTender', 'RestrictedTender', 'NegotiatedProcurement', 'FrameworkAgreement', 'QuoteRequest'];
  readonly priorities: TenderPriority[] = ['Low', 'Medium', 'High', 'Critical'];
  readonly tenderStatusLabels = tenderStatusLabels;
  readonly tenderStatusColors = tenderStatusColors;
  readonly tenderTypeLabels = tenderTypeLabels;
  readonly tenderPriorityLabels = tenderPriorityLabels;
  readonly tenderPriorityColors = tenderPriorityColors;

  ngOnInit(): void {
    this.loadTenders();
    this.loadStats();
  }

  loadTenders(): void {
    const filter: TenderFilterDto = {
      searchTerm: this.searchTerm || undefined,
      status: this.selectedStatus || undefined,
      type: this.selectedType || undefined,
      priority: this.selectedPriority || undefined,
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
      sortBy: this.sortField,
      sortDescending: this.sortDescending
    };

    this.tenderService.getTenders(filter).subscribe({
      next: (result) => {
        this.tenders.set(result.items);
        this.totalItems.set(result.totalCount);
      },
      error: (err) => {
        console.error('Failed to load tenders', err);
      }
    });
  }

  loadStats(): void {
    this.tenderService.getStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
      }
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
    this.loadTenders();
  }

  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDescending = !this.sortDescending;
    } else {
      this.sortField = field;
      this.sortDescending = false;
    }
    this.loadTenders();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.page;
    this.pageSize = event.pageSize;
    this.loadTenders();
  }

  isDeadlineSoon(tender: TenderDto): boolean {
    if (!tender.isOpen) return false;
    const days = this.getDaysRemaining(tender);
    return days > 0 && days <= 7;
  }

  isDeadlinePassed(tender: TenderDto): boolean {
    return new Date(tender.submissionDeadline) < new Date();
  }

  getDaysRemaining(tender: TenderDto): number {
    const now = new Date();
    const deadline = new Date(tender.submissionDeadline);
    const diff = deadline.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  confirmDelete(tender: TenderDto): void {
    this.tenderToDelete = tender;
    this.showDeleteDialog.set(true);
  }

  deleteTender(): void {
    if (!this.tenderToDelete) return;

    this.tenderService.deleteTender(this.tenderToDelete.id).subscribe({
      next: () => {
        this.showDeleteDialog.set(false);
        this.tenderToDelete = null;
        this.loadTenders();
        this.loadStats();
      },
      error: (err) => {
        console.error('Failed to delete tender', err);
      }
    });
  }
}
