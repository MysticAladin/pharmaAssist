import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { EuropeanDatePipe } from '../../core/pipes';

import { TenderService } from '../../core/services/tender.service';
import {
  TenderDto,
  tenderStatusLabels,
  tenderStatusColors,
  tenderPriorityLabels,
  tenderPriorityColors
} from '../../core/models/tender.model';

import { EmptyStateComponent } from '../../shared/components/empty-state';
import { PaginationComponent, PageEvent } from '../../shared/components/pagination';

@Component({
  selector: 'app-my-tenders',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    DatePipe,
    CurrencyPipe,
    EuropeanDatePipe,
    EmptyStateComponent,
    PaginationComponent
  ],
  templateUrl: './my-tenders-component/my-tenders.component.html',
  styleUrls: ['./my-tenders-component/my-tenders.component.scss']
})
export class MyTendersComponent implements OnInit {
  private readonly tenderService = inject(TenderService);

  readonly tenders = signal<TenderDto[]>([]);
  readonly totalItems = signal(0);
  readonly loading = this.tenderService.loading;

  currentPage = 1;
  pageSize = 12;

  readonly tenderStatusLabels = tenderStatusLabels;
  readonly tenderStatusColors = tenderStatusColors;
  readonly tenderPriorityLabels = tenderPriorityLabels;
  readonly tenderPriorityColors = tenderPriorityColors;

  ngOnInit(): void {
    this.loadTenders();
  }

  loadTenders(): void {
    this.tenderService.getMyTenders(this.currentPage, this.pageSize).subscribe({
      next: (result) => {
        this.tenders.set(result.items);
        this.totalItems.set(result.totalCount);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.page;
    this.loadTenders();
  }

  isDeadlineSoon(tender: TenderDto): boolean {
    if (!tender.isOpen) return false;
    const now = new Date();
    const deadline = new Date(tender.submissionDeadline);
    const diff = deadline.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 && days <= 7;
  }
}
