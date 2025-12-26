import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { concatMap, finalize, from, tap } from 'rxjs';
import { KmCurrencyPipe } from '../../../../core/pipes/km-currency.pipe';
import { CartService } from '../../services/cart.service';
import { CatalogService } from '../../services/catalog.service';
import { PortalPromotion, PortalPromotionsService } from '../../services/portal-promotions.service';

@Component({
  selector: 'app-portal-promotions',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, KmCurrencyPipe],
  template: `
    <div class="promotions-page">
      <div class="page-header">
        <h1>Actions & Promotions</h1>
        <p class="subtitle">Available offers for your account.</p>
      </div>

      <div class="card">
        @if (loading()) {
          <div class="hint">{{ 'common.loading' | translate }}</div>
        } @else if (error()) {
          <div class="error">{{ error() }}</div>
        } @else if (promotions().length === 0) {
          <div class="hint">No active promotions right now.</div>
        } @else {
          <div class="list">
            @for (p of promotions(); track p.id) {
              <div class="promo">
                <div class="promo-head">
                  <div class="title">
                    <div class="name">{{ p.name }}</div>
                    @if (p.description) {
                      <div class="desc">{{ p.description }}</div>
                    }
                  </div>

                  <div class="badge">
                    @if (p.type === 1) {
                      <span class="pill">{{ p.value }}%</span>
                    } @else if (p.type === 2) {
                      <span class="pill">{{ p.value | kmCurrency }}</span>
                    } @else {
                      <span class="pill">{{ p.typeName }}</span>
                    }
                  </div>
                </div>

                <div class="meta">
                  <div class="row">
                    <span class="k">Valid:</span>
                    <span class="v">{{ p.startDate | date:'shortDate' }} – {{ p.endDate | date:'shortDate' }}</span>
                  </div>
                  @if (p.minimumOrderAmount) {
                    <div class="row">
                      <span class="k">Min order:</span>
                      <span class="v">{{ p.minimumOrderAmount | kmCurrency }}</span>
                    </div>
                  }
                  @if (p.requiresCode && p.code) {
                    <div class="row">
                      <span class="k">Code:</span>
                      <span class="v code">{{ p.code }}</span>
                    </div>
                  }
                </div>

                @if (addErrorPromoId() === p.id) {
                  <div class="error">{{ addError() }}</div>
                }

                <div class="actions">
                  @if (hasProducts(p)) {
                    <button
                      type="button"
                      class="btn btn-primary"
                      (click)="addProducts(p)"
                      [disabled]="addingPromotionId() === p.id">
                      {{ addingPromotionId() === p.id ? 'Adding…' : ('Add products to order') }}
                    </button>
                  }

                  @if (p.productIds?.length) {
                    <div class="note">Includes {{ p.productIds?.length ?? 0 }} product(s).</div>
                  } @else if (p.appliesToAllProducts) {
                    <div class="note">Applies to all products.</div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .promotions-page {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .page-header h1 {
      margin: 0;
      font-size: 1.5rem;
      color: var(--text-color, #333);
    }

    .subtitle {
      margin: 0.25rem 0 0;
      color: var(--text-secondary, #666);
    }

    .card {
      background: var(--surface-card, #fff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 12px;
      padding: 1rem;
    }

    .hint {
      color: var(--text-secondary, #666);
      font-size: 0.95rem;
    }

    .error {
      margin-top: 0.75rem;
      color: var(--color-error, #b91c1c);
      font-size: 0.9rem;
    }

    .list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .promo {
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 12px;
      padding: 0.875rem;
      background: var(--surface-card, #fff);
    }

    .promo-head {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: flex-start;
    }

    .name {
      font-weight: 700;
      color: var(--text-color, #333);
    }

    .desc {
      margin-top: 0.25rem;
      color: var(--text-secondary, #666);
      font-size: 0.9rem;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.5rem;
      border-radius: 999px;
      background: var(--surface-ground, #f3f4f6);
      border: 1px solid var(--border-color, #e5e7eb);
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--text-color, #333);
      white-space: nowrap;
    }

    .meta {
      margin-top: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.9rem;
    }

    .row {
      display: flex;
      gap: 0.5rem;
    }

    .k {
      width: 90px;
      color: var(--text-secondary, #666);
    }

    .v {
      color: var(--text-color, #333);
    }

    .v.code {
      font-weight: 700;
    }

    .actions {
      margin-top: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .note {
      color: var(--text-secondary, #666);
      font-size: 0.85rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border-radius: 10px;
      border: 1px solid transparent;
      cursor: pointer;
      font-weight: 600;
    }

    .btn-primary {
      background: var(--primary-color);
      color: var(--surface-card, #fff);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class PortalPromotionsComponent implements OnInit {
  private promotionsService = inject(PortalPromotionsService);
  private catalogService = inject(CatalogService);
  private cartService = inject(CartService);

  promotions = signal<PortalPromotion[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  addingPromotionId = signal<number | null>(null);
  addError = signal<string | null>(null);
  addErrorPromoId = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.promotionsService.getAvailablePromotions()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (promos) => this.promotions.set(promos ?? []),
        error: () => this.error.set('Failed to load promotions.')
      });
  }

  hasProducts(p: PortalPromotion): boolean {
    return (p.productIds?.length ?? 0) > 0;
  }

  addProducts(p: PortalPromotion): void {
    const ids = (p.productIds ?? []).filter((x): x is number => typeof x === 'number' && Number.isFinite(x));
    if (ids.length === 0) return;

    this.addingPromotionId.set(p.id);
    this.addError.set(null);
    this.addErrorPromoId.set(null);

    from(ids)
      .pipe(
        concatMap((id) => this.catalogService.getProduct(String(id)).pipe(
          tap(product => this.cartService.addItem(product, 1))
        )),
        finalize(() => this.addingPromotionId.set(null))
      )
      .subscribe({
        error: () => {
          this.addErrorPromoId.set(p.id);
          this.addError.set('Failed to add some promotion products to the order.');
        }
      });
  }
}
