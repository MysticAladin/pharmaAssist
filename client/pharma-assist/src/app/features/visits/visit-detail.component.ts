import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';

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
            </div>

            <div class="map">
              <label class="label">{{ 'visits.map' | translate }}</label>
              @if (mapUrl()) {
                <iframe class="map__frame" [src]="mapUrl()" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
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

              @if (isSalesRep) {
                <div class="actions">
                  <button class="btn btn-primary" [disabled]="saving()" (click)="save()">{{ 'common.save' | translate }}</button>
                  <button class="btn btn-secondary" [disabled]="saving() || visit()!.isCompleted" (click)="complete()">
                    {{ 'visits.complete' | translate }}
                  </button>
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
    .map__frame { width: 100%; height: 220px; border: 1px solid var(--border-light); border-radius: 12px; background: var(--bg-primary); }

    .form { display:grid; gap: 10px; }
    .label { display:block; font-size: 12px; font-weight: 700; }
    .input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-light); background: var(--bg-primary); color: var(--text-primary); }

    .actions { display:flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }

    .muted { font-size: 13px; opacity: 0.75; }
    .error { margin-top: 12px; padding: 10px 12px; border: 1px solid var(--error); border-radius: 10px; color: var(--error); }
  `]
})
export class VisitDetailComponent implements OnInit {
  private readonly visitService = inject(VisitService);
  private readonly reportService = inject(VisitReportService);
  private readonly authState = inject(AuthStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  visit = signal<ExecutedVisit | null>(null);
  mapUrl = signal<SafeResourceUrl | null>(null);

  isSalesRep = this.authState.hasRole(UserRole.SalesRep);

  VisitOutcome = VisitOutcome;
  VisitType = VisitType;

  formOutcome: VisitOutcome | null = null;
  formSummary = '';
  formProducts = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.load(id);
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
        this.mapUrl.set(this.buildMapUrl(v));
        this.loading.set(false);
      },
      error: () => {
        this.visit.set(null);
        this.mapUrl.set(null);
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
      productsDiscussed: this.formProducts
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

  async complete(): Promise<void> {
    if (!this.isSalesRep) return;
    const v = this.visit();
    if (!v || v.isCompleted) return;

    this.saving.set(true);
    this.error.set(null);

    try {
      const coords = await this.getPosition();
      this.visitService.checkOut(v.id, {
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null
      }).subscribe({
        next: (updated) => {
          this.visit.set(updated);
          this.saving.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message ?? 'Complete failed');
          this.saving.set(false);
        }
      });
    } catch {
      this.error.set('Location permission is required to complete the visit');
      this.saving.set(false);
    }
  }

  private getPosition(): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => reject(),
        { enableHighAccuracy: true, timeout: 15000 }
      );
    });
  }

  private buildMapUrl(v: ExecutedVisit): SafeResourceUrl | null {
    const lat = v.checkInLatitude;
    const lon = v.checkInLongitude;
    if (lat == null || lon == null) return null;

    // Small bbox around the point for OSM embed.
    const d = 0.002;
    const left = Number(lon) - d;
    const right = Number(lon) + d;
    const top = Number(lat) + d;
    const bottom = Number(lat) - d;

    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lon}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
