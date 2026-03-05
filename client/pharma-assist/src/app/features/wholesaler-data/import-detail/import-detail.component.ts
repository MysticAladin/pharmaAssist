import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { WholesalerDataService } from '../../../core/services/wholesaler-data.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  WholesalerDataImportDetail,
  WholesalerSalesRecord,
  IMPORT_STATUS_LABELS,
  IMPORT_STATUS_VARIANTS
} from '../../../core/models/wholesaler.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-import-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    StatusBadgeComponent
  ],
  templateUrl: './import-detail.component.html'
})
export class ImportDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly wholesalerService = inject(WholesalerDataService);
  private readonly notification = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  importData = signal<WholesalerDataImportDetail | null>(null);
  loading = signal(true);
  activeTab = signal<'sales' | 'stock' | 'unmatched'>('sales');
  unmatchedRecords = signal<WholesalerSalesRecord[]>([]);

  statusLabels = IMPORT_STATUS_LABELS;
  statusVariants = IMPORT_STATUS_VARIANTS;

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.loadImport(id);
  }

  private loadImport(id: number): void {
    this.loading.set(true);
    this.wholesalerService.getImportById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.importData.set(response.data);
        } else {
          this.notification.error(this.translate.instant('wholesalerData.loadError'));
          this.router.navigate(['/wholesaler-data']);
        }
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('wholesalerData.loadError'));
        this.loading.set(false);
        this.router.navigate(['/wholesaler-data']);
      }
    });
  }

  loadUnmatched(): void {
    const data = this.importData();
    if (!data) return;

    this.wholesalerService.getUnmatchedRecords(data.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.unmatchedRecords.set(response.data);
        }
      }
    });
  }

  switchTab(tab: 'sales' | 'stock' | 'unmatched'): void {
    this.activeTab.set(tab);
    if (tab === 'unmatched' && this.unmatchedRecords().length === 0) {
      this.loadUnmatched();
    }
  }

  getMatchPercent(): number {
    const data = this.importData();
    if (!data) return 0;
    const total = data.matchedProductCount + data.unmatchedProductCount;
    if (total === 0) return 0;
    return Math.round((data.matchedProductCount / total) * 100);
  }
}
