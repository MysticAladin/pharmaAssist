import { Component, OnInit, OnDestroy, inject, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import * as L from 'leaflet';

import { VisitService } from '../../core/services/visit.service';
import { VisitReportService } from '../../core/services/visit-report.service';
import { AuthStateService } from '../../core/state/auth-state.service';
import { UserRole } from '../../core/models/user.model';
import { ExecutedVisit, VisitOutcome, VisitType } from '../../core/models/visit.model';

@Component({
  selector: 'app-visit-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule],
  template: `
    <div class="detail">
      <div class="detail__header">
        <button class="btn" (click)="back()">{{ 'common.back' | translate }}</button>
        <h1 class="detail__title">{{ visit()?.customerName ?? ('visits.visit' | translate) }}</h1>
      </div>

      <div class="card">
        <div class="card-content">
          @if (loading()) {
            <div class="muted">{{ 'common.loading' | translate }}</div>
          } @else if (!visit()) {
            <div class="error">{{ 'visits.notFound' | translate }}</div>
          } @else {
            <div class="meta">
              <div><strong>{{ 'visits.checkInTime' | translate }}:</strong> {{ visit()!.checkInTime }}</div>
              @if (visit()!.checkInAddress) {
                <div><strong>{{ 'visits.checkInAddress' | translate }}:</strong> {{ visit()!.checkInAddress }}</div>
              }
              @if (visit()!.checkInLatitude != null && visit()!.checkInLongitude != null) {
                <div>
                  <strong>{{ 'visits.coordinates' | translate }}:</strong>
                  {{ visit()!.checkInLatitude }}, {{ visit()!.checkInLongitude }}
                </div>
              }
              <div>
                <strong>{{ 'visits.type' | translate }}:</strong>
                {{ visit()!.visitType === VisitType.Planned ? ('visits.planned' | translate) : ('visits.adHoc' | translate) }}
              </div>
              <div>
                <strong>{{ 'visits.status' | translate }}:</strong>
                @if (visit()!.isCompleted) { {{ 'visits.completed' | translate }} } @else { {{ 'visits.inProgress' | translate }} }
              </div>
              @if (visit()!.checkOutTime) {
                <div><strong>{{ 'visits.checkOutTime' | translate }}:</strong> {{ visit()!.checkOutTime }}</div>
                <div><strong>{{ 'visits.duration' | translate }}:</strong> {{ getVisitDuration() }}</div>
              }

              <!-- Location Verification Badge -->
              <div class="location-badge" [class]="getLocationBadgeClass()">
                <span class="location-badge__icon">{{ getLocationIcon() }}</span>
                <span class="location-badge__text">
                  {{ getLocationStatusText() | translate }}
                  @if (visit()!.distanceFromCustomerMeters != null) {
                    <span class="location-badge__distance">
                      ({{ formatDistance(visit()!.distanceFromCustomerMeters!) }})
                    </span>
                  }
                </span>
              </div>
            </div>

            <div class="map">
              <label class="label">{{ 'visits.map' | translate }}</label>
              @if (hasCoordinates()) {
                <div #mapContainer class="map__container"></div>
              } @else {
                <div class="muted">{{ 'visits.noCoordinates' | translate }}</div>
              }
            </div>

            <div class="form">
              <label class="label">{{ 'visits.outcome' | translate }}</label>
              <select class="input" [(ngModel)]="formOutcome" [disabled]="!isSalesRep">
                <option [ngValue]="null">-</option>
                <option [ngValue]="VisitOutcome.Positive">{{ 'visits.outcomePositive' | translate }}</option>
                <option [ngValue]="VisitOutcome.Neutral">{{ 'visits.outcomeNeutral' | translate }}</option>
                <option [ngValue]="VisitOutcome.Negative">{{ 'visits.outcomeNegative' | translate }}</option>
              </select>

              <label class="label">{{ 'visits.summary' | translate }}</label>
              <textarea class="input" rows="4" [(ngModel)]="formSummary" [disabled]="!isSalesRep"></textarea>

              <label class="label">{{ 'visits.productsDiscussed' | translate }}</label>
              <textarea class="input" rows="3" [(ngModel)]="formProducts" [disabled]="!isSalesRep"></textarea>

              <!-- Visit Notes Section -->
              <div class="notes-section">
                <h3 class="notes-title">{{ 'visits.notes' | translate }}</h3>
                
                <label class="label">{{ 'visits.generalComment' | translate }}</label>
                <textarea class="input" rows="3" [(ngModel)]="formGeneralComment" [disabled]="!isSalesRep"
                  placeholder="{{ 'visits.generalCommentPlaceholder' | translate }}"></textarea>

                <label class="label">{{ 'visits.agreedDeals' | translate }}</label>
                <textarea class="input" rows="3" [(ngModel)]="formAgreedDeals" [disabled]="!isSalesRep"
                  placeholder="{{ 'visits.agreedDealsPlaceholder' | translate }}"></textarea>

                <label class="label">{{ 'visits.competitionNotes' | translate }}</label>
                <textarea class="input" rows="3" [(ngModel)]="formCompetitionNotes" [disabled]="!isSalesRep"
                  placeholder="{{ 'visits.competitionNotesPlaceholder' | translate }}"></textarea>
              </div>

              @if (isSalesRep) {
                <div class="actions">
                  <button class="btn btn-primary" [disabled]="saving()" (click)="save()">{{ 'common.save' | translate }}</button>
                  <button class="btn btn-success" (click)="createOrder()">
                    🛒 {{ 'orders.createOrder' | translate }}
                  </button>
                  @if (!visit()!.checkOutTime) {
                    <button class="btn btn-outline" [disabled]="saving()" (click)="endVisit()">
                      {{ 'visits.endVisit' | translate }}
                    </button>
                  }
                  @if (!visit()!.isCompleted) {
                    <button class="btn btn-secondary" [disabled]="saving()" (click)="complete()">
                      {{ 'visits.complete' | translate }}
                    </button>
                  }
                </div>
              }
            </div>

            @if (error()) {
              <div class="error">{{ error() }}</div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .detail { display:grid; gap: 16px; max-width: 720px; }
    .detail__header { display:flex; align-items:center; gap: 12px; flex-wrap: wrap; }
    .detail__title { margin: 0; font-size: 18px; font-weight: 700; }

    .meta { display:grid; gap: 6px; font-size: 13px; margin-bottom: 12px; }

    .map { display:grid; gap: 8px; margin: 12px 0; }
    .map__container { width: 100%; height: 300px; border: 1px solid var(--border-light); border-radius: 12px; background: var(--bg-primary); z-index: 0; }

    .form { display:grid; gap: 10px; }
    .label { display:block; font-size: 12px; font-weight: 700; }
    .input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-light); background: var(--bg-primary); color: var(--text-primary); }

    .actions { display:flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }

    .muted { font-size: 13px; opacity: 0.75; }
    .error { margin-top: 12px; padding: 10px 12px; border: 1px solid var(--error); border-radius: 10px; color: var(--error); }

    .location-badge { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 10px; font-size: 13px; font-weight: 600; margin-top: 8px; }
    .location-badge__icon { font-size: 16px; }
    .location-badge__distance { font-weight: 400; opacity: 0.85; }
    .location-badge--valid { background: rgba(34, 197, 94, 0.12); color: #16a34a; border: 1px solid rgba(34, 197, 94, 0.3); }
    .location-badge--warning { background: rgba(234, 179, 8, 0.12); color: #ca8a04; border: 1px solid rgba(234, 179, 8, 0.3); }
    .location-badge--alert { background: rgba(239, 68, 68, 0.12); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.3); }
    .location-badge--unknown { background: rgba(107, 114, 128, 0.12); color: #6b7280; border: 1px solid rgba(107, 114, 128, 0.3); }

    .notes-section { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-light); }
    .notes-title { margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: var(--text-primary); }
  `]
})
export class VisitDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly visitService = inject(VisitService);
  private readonly reportService = inject(VisitReportService);
  private readonly authState = inject(AuthStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;
  private map: L.Map | null = null;

  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  visit = signal<ExecutedVisit | null>(null);

  isSalesRep = this.authState.hasRole(UserRole.SalesRep);

  VisitOutcome = VisitOutcome;
  VisitType = VisitType;

  formOutcome: VisitOutcome | null = null;
  formSummary = '';
  formProducts = '';
  // Visit notes
  formGeneralComment = '';
  formAgreedDeals = '';
  formCompetitionNotes = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.load(id);
  }

  ngAfterViewInit(): void {
    // Map will be initialized after visit data is loaded
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  hasCoordinates(): boolean {
    const v = this.visit();
    return v != null && v.checkInLatitude != null && v.checkInLongitude != null;
  }

  private initMap(): void {
    const v = this.visit();
    if (!v || v.checkInLatitude == null || v.checkInLongitude == null) return;
    if (!this.mapContainer?.nativeElement) return;

    // Clean up existing map
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    const lat = Number(v.checkInLatitude);
    const lon = Number(v.checkInLongitude);

    // Fix Leaflet default icon path issue
    const iconDefault = L.icon({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // Initialize map
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [lat, lon],
      zoom: 16,
      zoomControl: true,
      scrollWheelZoom: true
    });

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(this.map);

    // Add marker for check-in location
    const marker = L.marker([lat, lon], { icon: iconDefault }).addTo(this.map);
    marker.bindPopup(`
      <strong>${v.customerName}</strong><br>
      ${v.checkInAddress || 'Check-in location'}
    `).openPopup();

    // Force map to recalculate size after a short delay
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);
  }

  back(): void {
    this.router.navigate(['/visits']);
  }

  private load(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    const source$ = this.isSalesRep
      ? this.visitService.getExecuted(id)
      : this.reportService.getExecutedVisit(id);

    source$.subscribe({
      next: (v) => {
        this.visit.set(v);
        this.formOutcome = v.outcome ?? null;
        this.formSummary = v.summary ?? '';
        this.formProducts = v.productsDiscussed ?? '';
        // Load visit notes
        this.formGeneralComment = v.generalComment ?? '';
        this.formAgreedDeals = v.agreedDeals ?? '';
        this.formCompetitionNotes = v.competitionNotes ?? '';
        this.loading.set(false);
        // Initialize map after view updates
        setTimeout(() => this.initMap(), 0);
      },
      error: () => {
        this.visit.set(null);
        this.loading.set(false);
      }
    });
  }

  save(): void {
    if (!this.isSalesRep) return;
    const v = this.visit();
    if (!v) return;

    this.saving.set(true);
    this.error.set(null);

    this.visitService.updateExecuted(v.id, {
      outcome: this.formOutcome,
      summary: this.formSummary,
      productsDiscussed: this.formProducts,
      generalComment: this.formGeneralComment,
      agreedDeals: this.formAgreedDeals,
      competitionNotes: this.formCompetitionNotes
    }).subscribe({
      next: (updated) => {
        this.visit.set(updated);
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Save failed');
        this.saving.set(false);
      }
    });
  }

  endVisit(): void {
    if (!this.isSalesRep) return;
    const v = this.visit();
    if (!v || v.checkOutTime) return;

    this.saving.set(true);
    this.error.set(null);

    // End visit without requiring location - just capture the time
    this.visitService.checkOut(v.id, {
      latitude: null,
      longitude: null
    }).subscribe({
      next: (updated) => {
        this.visit.set(updated);
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to end visit');
        this.saving.set(false);
      }
    });
  }

  complete(): void {
    if (!this.isSalesRep) return;
    const v = this.visit();
    if (!v || v.isCompleted) return;

    this.saving.set(true);
    this.error.set(null);

    // First save the form data, then check out if not already done
    this.visitService.updateExecuted(v.id, {
      outcome: this.formOutcome,
      summary: this.formSummary,
      productsDiscussed: this.formProducts
    }).subscribe({
      next: (updated) => {
        // If not checked out yet, do so now
        if (!updated.checkOutTime) {
          this.visitService.checkOut(v.id, { latitude: null, longitude: null }).subscribe({
            next: (final) => {
              this.visit.set(final);
              this.saving.set(false);
            },
            error: (err) => {
              this.error.set(err?.error?.message ?? 'Complete failed');
              this.saving.set(false);
            }
          });
        } else {
          this.visit.set(updated);
          this.saving.set(false);
        }
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Save failed');
        this.saving.set(false);
      }
    });
  }

  createOrder(): void {
    const v = this.visit();
    if (!v) return;

    // Navigate to order creation with customer and visit context
    this.router.navigate(['/orders/rep/new'], {
      queryParams: {
        customerId: v.customerId,
        visitId: v.id
      }
    });
  }

  // Location verification badge helpers
  getLocationBadgeClass(): string {
    const v = this.visit();
    if (!v || v.distanceFromCustomerMeters == null) {
      return 'location-badge--unknown';
    }
    const distance = v.distanceFromCustomerMeters;
    if (distance < 100) {
      return 'location-badge--valid';
    } else if (distance < 500) {
      return 'location-badge--warning';
    } else {
      return 'location-badge--alert';
    }
  }

  getLocationIcon(): string {
    const v = this.visit();
    if (!v || v.distanceFromCustomerMeters == null) {
      return '❓';
    }
    const distance = v.distanceFromCustomerMeters;
    if (distance < 100) {
      return '✅';
    } else if (distance < 500) {
      return '⚠️';
    } else {
      return '🚨';
    }
  }

  getLocationStatusText(): string {
    const v = this.visit();
    if (!v || v.distanceFromCustomerMeters == null) {
      return 'visits.locationUnknown';
    }
    const distance = v.distanceFromCustomerMeters;
    if (distance < 100) {
      return 'visits.locationValid';
    } else if (distance < 500) {
      return 'visits.locationWarning';
    } else {
      return 'visits.locationAlert';
    }
  }

  getVisitDuration(): string {
    const v = this.visit();
    if (!v || !v.checkOutTime) return '-';

    const checkIn = new Date(v.checkInTime);
    const checkOut = new Date(v.checkOutTime);
    const diffMs = checkOut.getTime() - checkIn.getTime();

    if (diffMs < 0) return '-';

    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  formatDistance(meters: number): string {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  }
}
