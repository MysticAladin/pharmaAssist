import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { VisitService } from '../../core/services/visit.service';
import { PlannedVisitSummary, ExecutedVisitSummary } from '../../core/models/visit.model';
import { EuropeanDatePipe } from '../../core/pipes/european-date.pipe';

@Component({
  selector: 'app-visits-today',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, EuropeanDatePipe],
  templateUrl: './visits-today-component/visits-today.component.html',
  styleUrls: ['./visits-today-component/visits-today.component.scss']
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
