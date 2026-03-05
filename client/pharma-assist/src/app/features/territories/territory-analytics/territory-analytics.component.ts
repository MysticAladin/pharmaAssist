import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TerritoryService } from '../../../core/services/territory.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  TerritoryPerformance, VisitFrequency, FieldWorkMetrics, InstitutionAnalytics,
  AnalyticsFilters
} from '../../../core/models/territory.model';

@Component({
  selector: 'app-territory-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './territory-analytics.component.html'
})
export class TerritoryAnalyticsComponent {
  private readonly territoryService = inject(TerritoryService);
  private readonly notification = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  // State
  loading = signal(false);
  activeTab = signal<'comparison' | 'visits' | 'fieldwork' | 'institutions'>('comparison');

  // Data
  territoryComparison = signal<TerritoryPerformance[]>([]);
  visitFrequency = signal<VisitFrequency[]>([]);
  fieldWorkMetrics = signal<FieldWorkMetrics[]>([]);
  institutionAnalytics = signal<InstitutionAnalytics[]>([]);

  // Filters
  filters = signal<AnalyticsFilters>({
    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().substring(0, 10),
    toDate: new Date().toISOString().substring(0, 10)
  });

  constructor() {
    this.loadComparison();
  }

  setTab(tab: 'comparison' | 'visits' | 'fieldwork' | 'institutions'): void {
    this.activeTab.set(tab);
    switch (tab) {
      case 'comparison': this.loadComparison(); break;
      case 'visits': this.loadVisitFrequency(); break;
      case 'fieldwork': this.loadFieldWork(); break;
      case 'institutions': this.loadInstitutions(); break;
    }
  }

  loadComparison(): void {
    this.loading.set(true);
    this.territoryService.compareTerritoryPerformance(undefined, this.filters()).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.territoryComparison.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('territories.analyticsLoadError'));
        this.loading.set(false);
      }
    });
  }

  loadVisitFrequency(): void {
    this.loading.set(true);
    this.territoryService.getVisitFrequency(this.filters()).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.visitFrequency.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('territories.analyticsLoadError'));
        this.loading.set(false);
      }
    });
  }

  loadFieldWork(): void {
    this.loading.set(true);
    this.territoryService.getFieldWorkMetrics(this.filters()).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.fieldWorkMetrics.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('territories.analyticsLoadError'));
        this.loading.set(false);
      }
    });
  }

  loadInstitutions(): void {
    this.loading.set(true);
    this.territoryService.getInstitutionAnalytics(this.filters()).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.institutionAnalytics.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('territories.analyticsLoadError'));
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    const tab = this.activeTab();
    this.setTab(tab);
  }
}
