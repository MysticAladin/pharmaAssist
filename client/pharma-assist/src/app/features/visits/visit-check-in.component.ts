import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { AuthStateService } from '../../core/state/auth-state.service';
import { SalesRepService } from '../../core/services/sales-rep.service';
import { VisitService } from '../../core/services/visit.service';
import { CustomerAssignment, SalesRepresentative } from '../../core/models/sales-rep.model';

@Component({
  selector: 'app-visit-check-in',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule],
  template: `
    <div class="checkin">
      <div class="checkin__header">
        <button class="btn" (click)="back()">{{ 'common.back' | translate }}</button>
        <h1 class="checkin__title">{{ 'visits.adHocCheckIn' | translate }}</h1>
      </div>

      <div class="card">
        <div class="card-content">
          <label class="label">{{ 'visits.searchCustomer' | translate }}</label>
          <input class="input" [(ngModel)]="search" placeholder="{{ 'common.search' | translate }}" />

          @if (loading()) {
            <div class="muted">{{ 'common.loading' | translate }}</div>
          } @else if (filtered().length === 0) {
            <div class="muted">{{ 'visits.noAssignedCustomers' | translate }}</div>
          } @else {
            <div class="list">
              @for (c of filtered(); track c.customerId) {
                <button class="list__row" (click)="checkIn(c.customerId)">
                  <div class="list__main">
                    <div class="list__title">{{ c.customerName }}</div>
                    <div class="list__meta">{{ c.city ?? '' }}</div>
                  </div>
                  <div class="list__action">{{ 'visits.checkIn' | translate }}</div>
                </button>
              }
            </div>
          }

          @if (error()) {
            <div class="error">{{ error() }}</div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .checkin { display:grid; gap: 16px; max-width: 720px; }
    .checkin__header { display:flex; align-items:center; gap: 12px; flex-wrap: wrap; }
    .checkin__title { margin: 0; font-size: 18px; font-weight: 700; }

    .label { display:block; font-size: 12px; font-weight: 700; margin-bottom: 6px; }
    .input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-light); background: var(--bg-primary); color: var(--text-primary); }

    .list { display:grid; gap: 10px; margin-top: 12px; }
    .list__row { width: 100%; text-align: left; display:flex; align-items:center; justify-content:space-between; gap: 12px; padding: 12px; border-radius: 12px; border: 1px solid var(--border-light); background: var(--bg-secondary); cursor: pointer; }
    .list__title { font-weight: 700; }
    .list__meta { font-size: 12px; opacity: 0.8; }
    .list__action { font-weight: 700; }

    .muted { font-size: 13px; opacity: 0.75; margin-top: 12px; }
    .error { margin-top: 12px; padding: 10px 12px; border: 1px solid var(--error); border-radius: 10px; color: var(--error); }
  `]
})
export class VisitCheckInComponent implements OnInit {
  private readonly authState = inject(AuthStateService);
  private readonly salesRepService = inject(SalesRepService);
  private readonly visitService = inject(VisitService);
  private readonly router = inject(Router);

  loading = signal(true);
  error = signal<string | null>(null);

  rep = signal<SalesRepresentative | null>(null);
  assignments = signal<CustomerAssignment[]>([]);

  search = '';
  filtered = computed(() => {
    const term = this.search.trim().toLowerCase();
    const items = this.assignments();
    if (!term) return items;
    return items.filter(c =>
      c.customerName.toLowerCase().includes(term) ||
      c.customerCode.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.loadAssignedCustomers();
  }

  back(): void {
    this.router.navigate(['/visits']);
  }

  private loadAssignedCustomers(): void {
    this.loading.set(true);
    this.error.set(null);

    const user = this.authState.getUser();
    if (!user?.id) {
      this.error.set('Not authenticated');
      this.loading.set(false);
      return;
    }

    this.salesRepService.getByUserId(user.id).subscribe({
      next: (rep) => {
        this.rep.set(rep);
        this.salesRepService.getCustomerAssignments(rep.id).subscribe({
          next: (items) => {
            this.assignments.set(items);
            this.loading.set(false);
          },
          error: () => {
            this.error.set('Failed to load assigned customers');
            this.loading.set(false);
          }
        });
      },
      error: () => {
        this.error.set('Sales representative profile not found');
        this.loading.set(false);
      }
    });
  }

  async checkIn(customerId: number): Promise<void> {
    this.error.set(null);

    try {
      const coords = await this.getPosition();
      this.visitService.checkIn({
        customerId,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        address: null
      }).subscribe({
        next: (visit) => this.router.navigate(['/visits', visit.id]),
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
