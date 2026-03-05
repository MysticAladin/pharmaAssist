import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { WholesalerDataService } from '../../../core/services/wholesaler-data.service';
import { NotificationService } from '../../../core/services/notification.service';
import { WholesalerStockSummary } from '../../../core/models/wholesaler.model';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-stock-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    EmptyStateComponent
  ],
  templateUrl: './stock-overview.component.html'
})
export class StockOverviewComponent {
  private readonly wholesalerService = inject(WholesalerDataService);
  private readonly notification = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  stockSummary = signal<WholesalerStockSummary[]>([]);
  loading = signal(false);

  constructor() {
    this.loadStock();
  }

  loadStock(): void {
    this.loading.set(true);
    this.wholesalerService.getStockSummary().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.stockSummary.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('wholesalerData.stockLoadError'));
        this.loading.set(false);
      }
    });
  }
}
