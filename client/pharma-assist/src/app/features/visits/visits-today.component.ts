import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { VisitService } from '../../core/services/visit.service';
import { PlannedVisitSummary, ExecutedVisitSummary } from '../../core/models/visit.model';

@Component({
  selector: 'app-visits-today',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div class="visits">
      <div class="visits__header">
        <h1 class="visits__title">{{ 'visits.todayTitle' | translate }}</h1>
        <button class="btn btn-primary" (click)="goCheckIn()">{{ 'visits.adHocCheckIn' | translate }}</button>
      </div>

      <section class="card">
        <div class="card-header">
          <h2>{{ 'visits.plannedToday' | translate }}</h2>
        </div>

        <div class="card-content">
          @if (loading()) {
            <div class="muted">{{ 'common.loading' | translate }}</div>
          } @else if (planned().length === 0) {
            <div class="muted">{{ 'visits.noPlanned' | translate }}</div>
          } @else {
            <div class="list">
              @for (pv of planned(); track pv.plannedVisitId) {
                <div class="list__row">
                  <div class="list__main">
                    <div class="list__title">{{ pv.customerName }}</div>
                    <div class="list__meta">
                      {{ pv.plannedTime ? pv.plannedTime : '' }}
                      @if (pv.objective) { · {{ pv.objective }} }
                    </div>
                  </div>

                  <div class="list__actions">
                    @if (pv.hasExecutedVisit && pv.executedVisitId) {
                      <button class="btn btn-secondary" (click)="openVisit(pv.executedVisitId)">
                        {{ 'visits.open' | translate }}
                      </button>
                    } @else {
                      <button class="btn btn-primary" (click)="checkInPlanned(pv.plannedVisitId)">
                        {{ 'visits.start' | translate }}
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </section>

      <section class="card">
        <div class="card-header">
          <h2>{{ 'visits.executedToday' | translate }}</h2>
        </div>

        <div class="card-content">
          @if (loading()) {
            <div class="muted">{{ 'common.loading' | translate }}</div>
          } @else if (executed().length === 0) {
            <div class="muted">{{ 'visits.noExecuted' | translate }}</div>
          } @else {
            <div class="list">
              @for (ev of executed(); track ev.id) {
                <div class="list__row" (click)="openVisit(ev.id)">
                  <div class="list__main">
                    <div class="list__title">{{ ev.customerName }}</div>
                    <div class="list__meta">
                      {{ ev.checkInTime }}
                      @if (ev.isCompleted) { · {{ 'visits.completed' | translate }} }
                      @else { · {{ 'visits.inProgress' | translate }} }
                    </div>
                  </div>
                  <div class="list__actions">
                    <button class="btn btn-secondary">{{ 'visits.open' | translate }}</button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </section>

      @if (error()) {
        <div class="error">{{ error() }}</div>
      }
    </div>
  `,
  styles: [`
    .visits { display: grid; gap: 16px; max-width: 720px; }
    .visits__header { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
    .visits__title { font-size: 20px; font-weight: 700; margin: 0; }

    .list { display: grid; gap: 10px; }
    .list__row { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding: 10px 0; border-bottom: 1px solid var(--border-light); }
    .list__row:last-child { border-bottom: 0; }
    .list__main { min-width: 0; }
    .list__title { font-weight: 700; }
    .list__meta { font-size: 12px; opacity: 0.8; }
    .list__actions { display:flex; gap: 8px; }

    .muted { font-size: 13px; opacity: 0.75; }
    .error { padding: 10px 12px; border: 1px solid var(--error); border-radius: 10px; color: var(--error); }
  `]
})
export class VisitsTodayComponent implements OnInit {
  private readonly visitService = inject(VisitService);
  private readonly router = inject(Router);

  loading = signal(true);
  planned = signal<PlannedVisitSummary[]>([]);
  executed = signal<ExecutedVisitSummary[]>([]);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    let plannedDone = false;
    let executedDone = false;

    this.visitService.getTodayPlanned().subscribe({
      next: (data) => {
        this.planned.set(data);
      },
      error: () => {
        this.error.set('Failed to load planned visits');
      },
      complete: () => {
        plannedDone = true;
        if (plannedDone && executedDone) this.loading.set(false);
      }
    });

    this.visitService.getTodayExecuted().subscribe({
      next: (data) => {
        this.executed.set(data);
      },
      error: () => {
        this.error.set('Failed to load executed visits');
      },
      complete: () => {
        executedDone = true;
        if (plannedDone && executedDone) this.loading.set(false);
      }
    });
  }

  goCheckIn(): void {
    this.router.navigate(['/visits/check-in']);
  }

  openVisit(id: number): void {
    this.router.navigate(['/visits', id]);
  }

  async checkInPlanned(plannedVisitId: number): Promise<void> {
    this.error.set(null);

    try {
      const coords = await this.getPosition();
      this.visitService.checkIn({
        plannedVisitId,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        address: null
      }).subscribe({
        next: (visit) => this.openVisit(visit.id),
        error: (err) => {
          this.error.set(err?.error?.message ?? 'Check-in failed');
        }
      });
    } catch {
      this.error.set('Location permission is required to check in');
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
}
