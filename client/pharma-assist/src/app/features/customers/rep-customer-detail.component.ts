import { Component, OnInit, OnDestroy, inject, signal, computed, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import * as L from 'leaflet';

import { RepCustomerService } from '../../core/services/rep-customer.service';
import {
  RepCustomer,
  RepCustomerCredit,
  RepCustomerOrder,
  RepCustomerVisit,
  CustomerPhoto,
  CustomerPhotoArchive
} from '../../core/models/rep-order.model';

@Component({
  selector: 'app-rep-customer-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div class="customer-detail">
      <header class="header">
        <button class="btn btn-outline" (click)="goBack()">
          ← {{ 'common.back' | translate }}
        </button>
        @if (customer()) {
          <div class="header__info">
            <h1 class="header__title">{{ customer()!.name }}</h1>
            <span class="badge badge--{{ getTierClass() }}">{{ customer()!.tierName }}</span>
          </div>
        }
      </header>

      @if (loading()) {
        <div class="loading">{{ 'common.loading' | translate }}</div>
      } @else if (!customer()) {
        <div class="error">{{ 'customers.notFound' | translate }}</div>
      } @else {
        <!-- Quick Actions -->
        <div class="actions">
          <button class="btn btn-primary" (click)="createOrder()">
            🛒 {{ 'orders.createOrder' | translate }}
          </button>
          <button class="btn btn-secondary" (click)="planVisit()">
            📅 {{ 'visits.planVisit' | translate }}
          </button>
          @if (customer()!.phone) {
            <a class="btn btn-outline" [href]="'tel:' + customer()!.phone">
              📞 {{ customer()!.phone }}
            </a>
          }
          @if (customer()!.email) {
            <a class="btn btn-outline" [href]="'mailto:' + customer()!.email">
              ✉️ {{ customer()!.email }}
            </a>
          }
        </div>

        <!-- Customer Info Card -->
        <div class="card">
          <h3 class="card__title">{{ 'customers.info' | translate }}</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-item__label">{{ 'customers.code' | translate }}</span>
              <span class="info-item__value">{{ customer()!.customerCode }}</span>
            </div>
            <div class="info-item">
              <span class="info-item__label">{{ 'customers.type' | translate }}</span>
              <span class="info-item__value">{{ customer()!.customerTypeName }}</span>
            </div>
            <div class="info-item">
              <span class="info-item__label">{{ 'customers.tier' | translate }}</span>
              <span class="info-item__value">{{ customer()!.tierName }}</span>
            </div>
            @if (customer()!.contactPerson) {
              <div class="info-item">
                <span class="info-item__label">{{ 'customers.contactPerson' | translate }}</span>
                <span class="info-item__value">{{ customer()!.contactPerson }}</span>
              </div>
            }
            @if (customer()!.city) {
              <div class="info-item">
                <span class="info-item__label">{{ 'customers.city' | translate }}</span>
                <span class="info-item__value">{{ customer()!.city }}</span>
              </div>
            }
            @if (customer()!.fullAddress) {
              <div class="info-item info-item--full">
                <span class="info-item__label">{{ 'customers.address' | translate }}</span>
                <span class="info-item__value">{{ customer()!.fullAddress }}</span>
              </div>
            }
            <div class="info-item">
              <span class="info-item__label">{{ 'customers.assignedSince' | translate }}</span>
              <span class="info-item__value">{{ customer()!.assignedAt | date:'mediumDate' }}</span>
            </div>
          </div>
        </div>

        <!-- Location Map -->
        @if (customer()!.latitude != null && customer()!.longitude != null) {
          <div class="card">
            <h3 class="card__title">📍 {{ 'customers.location' | translate }}</h3>
            <div class="detail-map" #detailMapContainer></div>
            @if (customer()!.fullAddress) {
              <p class="map-address">{{ customer()!.fullAddress }}</p>
            }
          </div>
        }

        <!-- Visit Compliance Card -->
        <div class="card" [class.card--warning]="customer()!.isOverdue">
          <h3 class="card__title">{{ 'customers.visitCompliance' | translate }}</h3>
          <div class="compliance-bar">
            <div class="compliance-bar__fill" 
                 [style.width.%]="customer()!.visitCompliancePercent"
                 [class.compliance-bar__fill--low]="customer()!.visitCompliancePercent < 50"
                 [class.compliance-bar__fill--mid]="customer()!.visitCompliancePercent >= 50 && customer()!.visitCompliancePercent < 100"
                 [class.compliance-bar__fill--full]="customer()!.visitCompliancePercent >= 100">
            </div>
          </div>
          <div class="compliance-bar__labels">
            <span>{{ customer()!.completedVisitsThisMonth }} / {{ customer()!.requiredVisitsPerMonth }} {{ 'customers.visitsThisMonth' | translate }}</span>
            <span>{{ customer()!.visitCompliancePercent | number:'1.0-0' }}%</span>
          </div>
          <div class="credit-grid">
            <div class="credit-item">
              <span class="credit-item__label">{{ 'customers.requiredPerMonth' | translate }}</span>
              <span class="credit-item__value">{{ customer()!.requiredVisitsPerMonth }}</span>
            </div>
            <div class="credit-item">
              <span class="credit-item__label">{{ 'customers.completedThisMonth' | translate }}</span>
              <span class="credit-item__value">{{ customer()!.completedVisitsThisMonth }}</span>
            </div>
            <div class="credit-item" [class.credit-item--danger]="customer()!.isOverdue">
              <span class="credit-item__label">{{ 'customers.daysSinceLastVisit' | translate }}</span>
              <span class="credit-item__value">{{ customer()!.daysSinceLastVisit ?? '-' }}</span>
            </div>
          </div>
          @if (customer()!.isOverdue) {
            <div class="credit-warning">
              🕐 {{ 'customers.visitOverdueWarning' | translate }}
            </div>
          }
        </div>

        <!-- Credit Status Card -->
        @if (credit()) {
          <div class="card" [class.card--warning]="credit()!.creditUtilization > 80">
            <h3 class="card__title">{{ 'customers.creditStatus' | translate }}</h3>

            <div class="credit-bar">
              <div class="credit-bar__fill" [style.width.%]="credit()!.creditUtilization"></div>
            </div>
            <div class="credit-bar__labels">
              <span>{{ 'customers.used' | translate }}: {{ credit()!.creditUsed | currency }}</span>
              <span>{{ 'customers.limit' | translate }}: {{ credit()!.creditLimit | currency }}</span>
            </div>

            <div class="credit-grid">
              <div class="credit-item credit-item--highlight">
                <span class="credit-item__label">{{ 'customers.available' | translate }}</span>
                <span class="credit-item__value">{{ credit()!.creditAvailable | currency }}</span>
              </div>
              <div class="credit-item">
                <span class="credit-item__label">{{ 'customers.paymentTerms' | translate }}</span>
                <span class="credit-item__value">{{ credit()!.paymentTermDays }} {{ 'common.days' | translate }}</span>
              </div>
              @if (credit()!.overdueAmount > 0) {
                <div class="credit-item credit-item--danger">
                  <span class="credit-item__label">{{ 'customers.overdue' | translate }}</span>
                  <span class="credit-item__value">{{ credit()!.overdueAmount | currency }}</span>
                </div>
              }
            </div>

            @if (!credit()!.canPlaceOrders) {
              <div class="credit-warning">
                ⚠️ {{ credit()!.creditWarningMessage || ('customers.cannotPlaceOrders' | translate) }}
              </div>
            }
          </div>
        }

        <!-- Recent Orders -->
        <div class="card">
          <h3 class="card__title">{{ 'customers.recentOrders' | translate }}</h3>
          @if (orders().length === 0) {
            <p class="muted">{{ 'customers.noRecentOrders' | translate }}</p>
          } @else {
            <div class="list">
              @for (order of orders(); track order.orderId) {
                <div class="list-item" (click)="viewOrder(order.orderId)">
                  <div class="list-item__main">
                    <span class="list-item__title">{{ order.orderNumber }}</span>
                    <span class="list-item__sub">{{ order.orderDate | date:'short' }}</span>
                  </div>
                  <div class="list-item__right">
                    <span class="list-item__amount">{{ order.totalAmount | currency }}</span>
                    <span class="badge badge--sm badge--{{ getOrderStatusClass(order.statusName) }}">
                      {{ order.statusName }}
                    </span>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Recent Visits -->
        <div class="card">
          <h3 class="card__title">{{ 'customers.recentVisits' | translate }}</h3>
          @if (visits().length === 0) {
            <p class="muted">{{ 'customers.noRecentVisits' | translate }}</p>
          } @else {
            <div class="list">
              @for (visit of visits(); track visit.visitId) {
                <div class="list-item" (click)="viewVisit(visit.visitId)">
                  <div class="list-item__main">
                    <span class="list-item__title">{{ visit.visitDate | date:'mediumDate' }}</span>
                    <span class="list-item__sub">{{ visit.visitTypeName }}</span>
                  </div>
                  <div class="list-item__right">
                    @if (visit.hasOrders) {
                      <span class="list-item__badge">🛒 {{ visit.orderCount }}</span>
                    }
                    <span class="badge badge--sm badge--{{ getOutcomeClass(visit.outcomeName) }}">
                      {{ visit.outcomeName }}
                    </span>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Photo Archive -->
        <div class="card">
          <h3 class="card__title">{{ 'customers.photoArchive' | translate }}</h3>
          @if (photosLoading()) {
            <p class="muted">{{ 'common.loading' | translate }}</p>
          } @else if (photos().length === 0) {
            <p class="muted">{{ 'customers.noPhotos' | translate }}</p>
          } @else {
            <div class="photo-grid">
              @for (photo of photos(); track photo.id) {
                <div class="photo-card" (click)="openPhoto(photo)">
                  <div class="photo-card__image">
                    <img [src]="photo.filePath" [alt]="photo.fileName" loading="lazy" />
                  </div>
                  <div class="photo-card__info">
                    <span class="photo-card__date">{{ photo.visitDate | date:'shortDate' }}</span>
                    <span class="photo-card__size">{{ formatFileSize(photo.fileSize) }}</span>
                  </div>
                </div>
              }
            </div>
            @if (photoArchive()?.totalPhotos && photoArchive()!.totalPhotos > photos().length) {
              <button class="btn btn-outline btn-block" (click)="loadMorePhotos()">
                {{ 'customers.loadMorePhotos' | translate }} ({{ photos().length }}/{{ photoArchive()!.totalPhotos }})
              </button>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .customer-detail {
      display: grid;
      gap: 20px;
      padding: 20px;
      max-width: 900px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;

      &__info {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      &__title {
        font-size: 24px;
        font-weight: 700;
        margin: 0;
      }
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-light);
      border-radius: 16px;
      padding: 20px;

      &--warning {
        border-color: #f59e0b;
      }

      &__title {
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 16px 0;
        color: var(--text-primary);
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .info-item {
      &--full {
        grid-column: 1 / -1;
      }

      &__label {
        display: block;
        font-size: 12px;
        color: var(--text-secondary);
        margin-bottom: 4px;
      }

      &__value {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary);
      }
    }

    .credit-bar {
      height: 8px;
      background: var(--border-light);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;

      &__fill {
        height: 100%;
        background: linear-gradient(90deg, #10b981, #f59e0b, #ef4444);
        border-radius: 4px;
        transition: width 0.3s ease;
      }

      &__labels {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: var(--text-secondary);
        margin-bottom: 16px;
      }
    }

    .detail-map {
      height: 260px;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid var(--border-light);
      z-index: 0;
    }

    .map-address {
      margin: 8px 0 0;
      font-size: 13px;
      color: var(--text-secondary);
    }

    .compliance-bar {
      height: 8px;
      background: var(--border-light);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;

      &__fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s ease;

        &--low { background: #ef4444; }
        &--mid { background: #f59e0b; }
        &--full { background: #10b981; }
      }

      &__labels {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: var(--text-secondary);
        margin-bottom: 16px;
      }
    }

    .credit-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
    }

    .credit-item {
      padding: 12px;
      background: var(--bg-tertiary);
      border-radius: 10px;
      text-align: center;

      &--highlight {
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid #10b981;
      }

      &--danger {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid #ef4444;
      }

      &__label {
        display: block;
        font-size: 12px;
        color: var(--text-secondary);
        margin-bottom: 4px;
      }

      &__value {
        font-size: 18px;
        font-weight: 700;
        color: var(--text-primary);
      }
    }

    .credit-warning {
      margin-top: 16px;
      padding: 12px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid #ef4444;
      border-radius: 10px;
      color: #dc2626;
      font-weight: 500;
    }

    .list {
      display: grid;
      gap: 8px;
    }

    .list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: var(--bg-tertiary);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: var(--border-light);
      }

      &__main {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      &__title {
        font-weight: 600;
        font-size: 14px;
      }

      &__sub {
        font-size: 12px;
        color: var(--text-secondary);
      }

      &__right {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      &__amount {
        font-weight: 600;
        font-size: 14px;
      }

      &__badge {
        font-size: 12px;
      }
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;

      &--sm {
        padding: 2px 8px;
        font-size: 11px;
      }

      &--standard { background: #e5e7eb; color: #374151; }
      &--silver { background: #d1d5db; color: #1f2937; }
      &--gold { background: #fef3c7; color: #b45309; }
      &--platinum { background: #e0e7ff; color: #4338ca; }
      &--success { background: #d1fae5; color: #047857; }
      &--warning { background: #fef3c7; color: #b45309; }
      &--danger { background: #fee2e2; color: #dc2626; }
      &--info { background: #dbeafe; color: #1d4ed8; }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 18px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;

      &-primary {
        background: var(--primary);
        color: white;
        &:hover { filter: brightness(1.1); }
      }

      &-secondary {
        background: var(--bg-tertiary);
        color: var(--text-primary);
        &:hover { background: var(--border-light); }
      }

      &-outline {
        background: transparent;
        border: 1px solid var(--border-light);
        color: var(--text-primary);
        &:hover { background: var(--bg-tertiary); }
      }
    }

    .loading, .error {
      text-align: center;
      padding: 40px;
    }

    .error {
      color: var(--error);
    }

    .muted {
      color: var(--text-secondary);
      font-size: 14px;
    }

    .photo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }

    .photo-card {
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid var(--border-light);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      &__image {
        aspect-ratio: 1;
        overflow: hidden;
        background: var(--bg-tertiary);

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      &__info {
        padding: 6px 8px;
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: var(--text-secondary);
      }
    }

    .btn-block {
      width: 100%;
      justify-content: center;
    }
  `]
})
export class RepCustomerDetailComponent implements OnInit, OnDestroy {
  @ViewChild('detailMapContainer', { static: false }) mapContainer?: ElementRef;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly customerService = inject(RepCustomerService);

  private map: L.Map | null = null;

  loading = signal(true);
  customer = signal<RepCustomer | null>(null);
  credit = signal<RepCustomerCredit | null>(null);
  orders = signal<RepCustomerOrder[]>([]);
  visits = signal<RepCustomerVisit[]>([]);
  photos = signal<CustomerPhoto[]>([]);
  photoArchive = signal<CustomerPhotoArchive | null>(null);
  photosLoading = signal(false);
  private photoPage = 1;

  private customerId = 0;

  ngOnInit(): void {
    this.customerId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadData();
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

  private loadData(): void {
    this.loading.set(true);

    // Load customer details
    this.customerService.getCustomerDetails(this.customerId).subscribe({
      next: (customer) => {
        this.customer.set(customer);
        this.loading.set(false);
        // Init map after view updates if customer has location
        if (customer.latitude != null && customer.longitude != null) {
          setTimeout(() => this.initDetailMap(customer), 0);
        }
      },
      error: () => {
        this.customer.set(null);
        this.loading.set(false);
      }
    });

    // Load credit, orders, and visits in parallel
    this.customerService.getCustomerCredit(this.customerId).subscribe({
      next: (credit) => this.credit.set(credit),
      error: () => this.credit.set(null)
    });

    this.customerService.getCustomerOrders(this.customerId, 5).subscribe({
      next: (orders) => this.orders.set(orders),
      error: () => this.orders.set([])
    });

    this.customerService.getCustomerVisits(this.customerId, 5).subscribe({
      next: (visits) => this.visits.set(visits),
      error: () => this.visits.set([])
    });

    // Load photos
    this.loadPhotos();
  }

  private initDetailMap(customer: RepCustomer): void {
    if (!this.mapContainer?.nativeElement) return;
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    const lat = Number(customer.latitude);
    const lng = Number(customer.longitude);

    const iconDefault = L.icon({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: true,
      scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(this.map);

    const marker = L.marker([lat, lng], { icon: iconDefault }).addTo(this.map);
    marker.bindPopup(`<strong>${customer.name}</strong><br>${customer.fullAddress || customer.city || ''}`).openPopup();

    setTimeout(() => this.map?.invalidateSize(), 100);
  }

  private loadPhotos(): void {
    this.photosLoading.set(true);
    this.customerService.getCustomerPhotos(this.customerId, this.photoPage).subscribe({
      next: (archive) => {
        this.photoArchive.set(archive);
        this.photos.set(archive.photos);
        this.photosLoading.set(false);
      },
      error: () => {
        this.photos.set([]);
        this.photosLoading.set(false);
      }
    });
  }

  loadMorePhotos(): void {
    this.photoPage++;
    this.customerService.getCustomerPhotos(this.customerId, this.photoPage).subscribe({
      next: (archive) => {
        this.photoArchive.set(archive);
        this.photos.update(current => [...current, ...archive.photos]);
      }
    });
  }

  openPhoto(photo: CustomerPhoto): void {
    window.open(photo.filePath, '_blank');
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getTierClass(): string {
    const tier = this.customer()?.tier;
    switch (tier) {
      case 3: return 'platinum';
      case 2: return 'gold';
      case 1: return 'silver';
      default: return 'standard';
    }
  }

  getOrderStatusClass(status: string): string {
    const s = status.toLowerCase();
    if (s.includes('delivered') || s.includes('completed')) return 'success';
    if (s.includes('cancelled') || s.includes('returned')) return 'danger';
    if (s.includes('processing') || s.includes('shipped')) return 'info';
    return 'warning';
  }

  getOutcomeClass(outcome: string): string {
    const o = outcome?.toLowerCase() || '';
    if (o.includes('positive') || o.includes('success')) return 'success';
    if (o.includes('negative') || o.includes('failed')) return 'danger';
    return 'warning';
  }

  createOrder(): void {
    this.router.navigate(['/orders/rep/new'], {
      queryParams: { customerId: this.customerId }
    });
  }

  planVisit(): void {
    this.router.navigate(['/visits/planner'], {
      queryParams: { customerId: this.customerId }
    });
  }

  viewOrder(orderId: number): void {
    this.router.navigate(['/orders', orderId]);
  }

  viewVisit(visitId: number): void {
    this.router.navigate(['/visits', visitId]);
  }
}
