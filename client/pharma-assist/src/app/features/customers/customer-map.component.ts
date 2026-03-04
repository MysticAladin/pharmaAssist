import { Component, OnInit, OnDestroy, inject, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import * as L from 'leaflet';

import { RepCustomerService } from '../../core/services/rep-customer.service';
import { RepCustomer } from '../../core/models/rep-order.model';
import { CustomerTier } from '../../core/models/customer.model';

@Component({
  selector: 'app-customer-map',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div class="map-page">
      <header class="header">
        <div class="header__left">
          <button class="btn btn-outline" (click)="goBack()">← {{ 'common.back' | translate }}</button>
          <h1 class="header__title">{{ 'customers.customerMap' | translate }}</h1>
        </div>
        <div class="header__legend">
          <span class="legend-item legend-item--overdue">
            <span class="legend-dot legend-dot--overdue"></span>
            {{ 'customers.overdue' | translate }}
          </span>
          <span class="legend-item legend-item--warning">
            <span class="legend-dot legend-dot--warning"></span>
            {{ 'customers.needsVisitSoon' | translate }}
          </span>
          <span class="legend-item legend-item--ok">
            <span class="legend-dot legend-dot--ok"></span>
            {{ 'customers.visitedRecently' | translate }}
          </span>
        </div>
      </header>

      @if (loading()) {
        <div class="loading">{{ 'common.loading' | translate }}</div>
      } @else if (noLocationCount() > 0) {
        <div class="info-bar">
          ⚠️ {{ noLocationCount() }} {{ 'customers.customersNoLocation' | translate }}
        </div>
      }

      <div class="map-container" #mapContainer></div>

      <!-- Summary footer -->
      <div class="map-footer">
        <span class="map-footer__stat">
          📍 {{ mappedCount() }} {{ 'customers.onMap' | translate }}
        </span>
        <span class="map-footer__stat map-footer__stat--overdue">
          🕐 {{ overdueCount() }} {{ 'customers.overdue' | translate }}
        </span>
        <span class="map-footer__stat map-footer__stat--ok">
          ✅ {{ okCount() }} {{ 'customers.onTrack' | translate }}
        </span>
      </div>
    </div>
  `,
  styles: [`
    .map-page {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 64px);
      padding: 12px;
      gap: 8px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;

      &__left {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      &__title {
        font-size: 20px;
        font-weight: 700;
        margin: 0;
        color: var(--text-primary);
      }

      &__legend {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
      }
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--text-secondary);
    }

    .legend-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);

      &--overdue { background: #ef4444; }
      &--warning { background: #f59e0b; }
      &--ok { background: #10b981; }
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: var(--text-secondary);
    }

    .info-bar {
      padding: 8px 16px;
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      font-size: 13px;
      color: #92400e;
    }

    .map-container {
      flex: 1;
      border-radius: 12px;
      border: 1px solid var(--border-light);
      overflow: hidden;
      min-height: 400px;
      z-index: 0;
    }

    .map-footer {
      display: flex;
      gap: 24px;
      padding: 8px 0;
      flex-wrap: wrap;

      &__stat {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-secondary);

        &--overdue { color: #ef4444; }
        &--ok { color: #10b981; }
      }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-outline {
      background: transparent;
      border: 1px solid var(--border-light);
      color: var(--text-primary);
      &:hover { background: var(--bg-tertiary); }
    }
  `]
})
export class CustomerMapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  private readonly customerService = inject(RepCustomerService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  private map: L.Map | null = null;
  private markers: L.Marker[] = [];

  loading = signal(true);
  mappedCount = signal(0);
  noLocationCount = signal(0);
  overdueCount = signal(0);
  okCount = signal(0);

  private allCustomers: RepCustomer[] = [];

  ngOnInit(): void {
    this.loadAllCustomers();
  }

  ngAfterViewInit(): void {
    // Map init happens after data loads
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  goBack(): void {
    this.router.navigate(['/customers/rep']);
  }

  private loadAllCustomers(): void {
    this.loading.set(true);

    // Load a large page to get all customers with coordinates
    this.customerService.getMyCustomers({ pageSize: 500 }).subscribe({
      next: (result) => {
        this.allCustomers = result.customers;
        const withLocation = this.allCustomers.filter(c => c.latitude != null && c.longitude != null);
        const withoutLocation = this.allCustomers.filter(c => c.latitude == null || c.longitude == null);

        this.mappedCount.set(withLocation.length);
        this.noLocationCount.set(withoutLocation.length);
        this.overdueCount.set(withLocation.filter(c => c.isOverdue).length);
        this.okCount.set(withLocation.filter(c => !c.isOverdue).length);

        this.loading.set(false);
        // Init map after data
        setTimeout(() => this.initMap(withLocation), 0);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private initMap(customers: RepCustomer[]): void {
    if (!this.mapContainer?.nativeElement) return;

    // Clean up existing map
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    // Default center: Bosnia & Herzegovina
    const defaultCenter: L.LatLngExpression = [43.9159, 17.6791];
    const defaultZoom = 8;

    this.map = L.map(this.mapContainer.nativeElement, {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: true,
      scrollWheelZoom: true
    });

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(this.map);

    // Add markers
    this.markers = [];
    const bounds: L.LatLngExpression[] = [];

    for (const customer of customers) {
      const lat = Number(customer.latitude);
      const lng = Number(customer.longitude);
      if (isNaN(lat) || isNaN(lng)) continue;

      const marker = this.createMarker(customer, lat, lng);
      marker.addTo(this.map);
      this.markers.push(marker);
      bounds.push([lat, lng]);
    }

    // Fit bounds to show all markers
    if (bounds.length > 0) {
      const latLngBounds = L.latLngBounds(bounds);
      this.map.fitBounds(latLngBounds, { padding: [40, 40], maxZoom: 14 });
    }

    // Force map recalculate size
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);
  }

  private createMarker(customer: RepCustomer, lat: number, lng: number): L.Marker {
    const color = this.getMarkerColor(customer);
    const size = this.getMarkerSize(customer.tier);

    const icon = L.divIcon({
      className: 'customer-marker',
      html: `<div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${color};
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size * 0.4}px;
        font-weight: 700;
        color: white;
        cursor: pointer;
      ">${this.getTierLabel(customer.tier)}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -(size / 2 + 4)]
    });

    const marker = L.marker([lat, lng], { icon });

    // Build popup content
    const compliance = customer.visitCompliancePercent;
    const complianceColor = compliance >= 100 ? '#10b981' : compliance >= 50 ? '#f59e0b' : '#ef4444';
    const lastVisit = customer.lastVisitDate
      ? new Date(customer.lastVisitDate).toLocaleDateString()
      : '-';

    const popupHtml = `
      <div style="min-width: 200px; font-family: inherit;">
        <div style="font-size: 15px; font-weight: 700; margin-bottom: 6px;">
          ${this.escapeHtml(customer.name)}
        </div>
        <div style="display: flex; gap: 6px; margin-bottom: 8px;">
          <span style="padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;
            background: ${this.getTierBgColor(customer.tier)}; color: ${this.getTierTextColor(customer.tier)};">
            ${customer.tierName}
          </span>
          <span style="padding: 2px 8px; border-radius: 12px; font-size: 11px; background: #f3f4f6; color: #374151;">
            ${customer.customerTypeName}
          </span>
        </div>
        <div style="font-size: 12px; color: #6b7280; line-height: 1.6;">
          ${customer.city ? `<div>📍 ${this.escapeHtml(customer.city)}</div>` : ''}
          <div>📅 ${this.translate.instant('customers.lastVisit')}: ${lastVisit}
            ${customer.daysSinceLastVisit != null ? `(${customer.daysSinceLastVisit}d)` : ''}</div>
          <div style="color: ${complianceColor}; font-weight: 600;">
            📊 ${customer.completedVisitsThisMonth}/${customer.requiredVisitsPerMonth}
            (${compliance.toFixed(0)}%)
          </div>
          ${customer.isOverdue ? `<div style="color: #ef4444; font-weight: 600;">🕐 ${this.translate.instant('customers.overdue')}</div>` : ''}
        </div>
        <div style="margin-top: 8px; display: flex; gap: 6px;">
          <button onclick="window.__customerMapNavigate(${customer.id})"
            style="padding: 4px 12px; border-radius: 8px; font-size: 12px; font-weight: 600;
              background: #3b82f6; color: white; border: none; cursor: pointer;">
            ${this.translate.instant('common.details')}
          </button>
          ${customer.phone ? `<a href="tel:${customer.phone}"
            style="padding: 4px 12px; border-radius: 8px; font-size: 12px; font-weight: 600;
              background: #f3f4f6; color: #374151; border: none; cursor: pointer; text-decoration: none;">
            📞 ${this.translate.instant('customers.call')}
          </a>` : ''}
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml, { maxWidth: 280 });

    return marker;
  }

  private getMarkerColor(customer: RepCustomer): string {
    if (customer.isOverdue) return '#ef4444';             // Red - overdue
    if (customer.visitCompliancePercent < 80) return '#f59e0b';  // Orange - needs visit soon
    return '#10b981';                                     // Green - on track
  }

  private getMarkerSize(tier: CustomerTier): number {
    switch (tier) {
      case CustomerTier.A: return 36;  // Premium - largest
      case CustomerTier.B: return 28;  // Standard
      case CustomerTier.C: return 22;  // Basic - smallest
      default: return 28;
    }
  }

  private getTierLabel(tier: CustomerTier): string {
    switch (tier) {
      case CustomerTier.A: return 'A';
      case CustomerTier.B: return 'B';
      case CustomerTier.C: return 'C';
      default: return '?';
    }
  }

  private getTierBgColor(tier: CustomerTier): string {
    switch (tier) {
      case CustomerTier.A: return '#fef3c7';
      case CustomerTier.B: return '#d1d5db';
      case CustomerTier.C: return '#e5e7eb';
      default: return '#e5e7eb';
    }
  }

  private getTierTextColor(tier: CustomerTier): string {
    switch (tier) {
      case CustomerTier.A: return '#b45309';
      case CustomerTier.B: return '#1f2937';
      case CustomerTier.C: return '#374151';
      default: return '#374151';
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Register global navigation handler for popup buttons
  constructor() {
    (window as any).__customerMapNavigate = (customerId: number) => {
      this.router.navigate(['/customers/rep', customerId]);
    };
  }
}
