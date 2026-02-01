import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { RepCustomerService } from '../../core/services/rep-customer.service';
import {
  RepCustomer,
  RepCustomerFilter,
  RepCustomerStats
} from '../../core/models/rep-order.model';
import { CustomerTier, CustomerType } from '../../core/models/customer.model';

@Component({
  selector: 'app-rep-customers',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule],
  template: `
    <div class="rep-customers">
      <header class="header">
        <h1 class="header__title">{{ 'customers.myCustomers' | translate }}</h1>
        <p class="header__subtitle">{{ 'customers.myCustomersDesc' | translate }}</p>
      </header>

      <!-- Stats Cards -->
      @if (stats()) {
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-card__value">{{ stats()!.totalCustomers }}</span>
            <span class="stat-card__label">{{ 'customers.stats.total' | translate }}</span>
          </div>
          <div class="stat-card stat-card--warning" [class.active]="filter.needsVisit">
            <button class="stat-card__btn" (click)="toggleNeedsVisit()">
              <span class="stat-card__value">{{ stats()!.customersNeedingVisit }}</span>
              <span class="stat-card__label">{{ 'customers.stats.needsVisit' | translate }}</span>
            </button>
          </div>
          <div class="stat-card stat-card--danger" [class.active]="filter.hasCreditWarning">
            <button class="stat-card__btn" (click)="toggleCreditWarning()">
              <span class="stat-card__value">{{ stats()!.customersWithCreditWarning }}</span>
              <span class="stat-card__label">{{ 'customers.stats.creditWarning' | translate }}</span>
            </button>
          </div>
          <div class="stat-card stat-card--success">
            <span class="stat-card__value">{{ stats()!.customersVisitedThisWeek }}</span>
            <span class="stat-card__label">{{ 'customers.stats.visitedThisWeek' | translate }}</span>
          </div>
        </div>
      }

      <!-- Filters -->
      <div class="filters">
        <div class="filters__search">
          <input
            type="text"
            class="input"
            [placeholder]="'customers.searchPlaceholder' | translate"
            [(ngModel)]="filter.search"
            (input)="onSearchChange()"
          />
        </div>

        <div class="filters__selects">
          <select class="input" [(ngModel)]="filter.customerType" (change)="applyFilters()">
            <option [ngValue]="undefined">{{ 'customers.allTypes' | translate }}</option>
            <option [ngValue]="CustomerType.Pharmacy">{{ 'customers.types.pharmacy' | translate }}</option>
            <option [ngValue]="CustomerType.Hospital">{{ 'customers.types.hospital' | translate }}</option>
            <option [ngValue]="CustomerType.Clinic">{{ 'customers.types.clinic' | translate }}</option>
            <option [ngValue]="CustomerType.Wholesale">{{ 'customers.types.wholesale' | translate }}</option>
            <option [ngValue]="CustomerType.Retail">{{ 'customers.types.retail' | translate }}</option>
          </select>

          <select class="input" [(ngModel)]="filter.tier" (change)="applyFilters()">
            <option [ngValue]="undefined">{{ 'customers.allTiers' | translate }}</option>
            <option [ngValue]="CustomerTier.A">{{ 'customers.tiers.premium' | translate }}</option>
            <option [ngValue]="CustomerTier.B">{{ 'customers.tiers.standard' | translate }}</option>
            <option [ngValue]="CustomerTier.C">{{ 'customers.tiers.basic' | translate }}</option>
          </select>
        </div>

        @if (hasActiveFilters()) {
          <button class="btn btn-outline" (click)="clearFilters()">
            {{ 'common.clearFilters' | translate }}
          </button>
        }
      </div>

      <!-- Customer List -->
      @if (loading()) {
        <div class="loading">{{ 'common.loading' | translate }}</div>
      } @else if (customers().length === 0) {
        <div class="empty">
          <div class="empty__icon">👥</div>
          <h3 class="empty__title">{{ 'customers.noCustomers' | translate }}</h3>
          <p class="empty__desc">{{ 'customers.noCustomersDesc' | translate }}</p>
        </div>
      } @else {
        <div class="customer-list">
          @for (customer of customers(); track customer.id) {
            <div class="customer-card" (click)="viewCustomer(customer)">
              <div class="customer-card__header">
                <div class="customer-card__name">{{ customer.name }}</div>
                <div class="customer-card__badges">
                  <span class="badge badge--{{ getTierClass(customer.tier) }}">
                    {{ customer.tierName }}
                  </span>
                  @if (customer.creditWarning) {
                    <span class="badge badge--danger">⚠️ {{ 'customers.creditWarning' | translate }}</span>
                  }
                </div>
              </div>

              <div class="customer-card__body">
                <div class="customer-card__info">
                  <div class="customer-card__row">
                    <span class="label">{{ 'customers.code' | translate }}:</span>
                    <span class="value">{{ customer.customerCode }}</span>
                  </div>
                  <div class="customer-card__row">
                    <span class="label">{{ 'customers.type' | translate }}:</span>
                    <span class="value">{{ customer.customerTypeName }}</span>
                  </div>
                  @if (customer.city) {
                    <div class="customer-card__row">
                      <span class="label">{{ 'customers.city' | translate }}:</span>
                      <span class="value">{{ customer.city }}</span>
                    </div>
                  }
                  @if (customer.phone) {
                    <div class="customer-card__row">
                      <span class="label">{{ 'customers.phone' | translate }}:</span>
                      <span class="value">{{ customer.phone }}</span>
                    </div>
                  }
                </div>

                <div class="customer-card__metrics">
                  <div class="metric">
                    <span class="metric__label">{{ 'customers.creditAvailable' | translate }}</span>
                    <span class="metric__value" [class.warning]="customer.creditWarning">
                      {{ customer.creditAvailable | currency }}
                    </span>
                  </div>
                  <div class="metric">
                    <span class="metric__label">{{ 'customers.lastVisit' | translate }}</span>
                    <span class="metric__value">
                      {{ customer.lastVisitDate ? (customer.lastVisitDate | date:'shortDate') : '-' }}
                    </span>
                  </div>
                  <div class="metric">
                    <span class="metric__label">{{ 'customers.lastOrder' | translate }}</span>
                    <span class="metric__value">
                      {{ customer.lastOrderDate ? (customer.lastOrderDate | date:'shortDate') : '-' }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="customer-card__actions">
                <button class="btn btn-sm btn-primary" (click)="createOrder(customer, $event)">
                  🛒 {{ 'orders.createOrder' | translate }}
                </button>
                <button class="btn btn-sm btn-outline" (click)="planVisit(customer, $event)">
                  📅 {{ 'visits.planVisit' | translate }}
                </button>
                @if (customer.phone) {
                  <a class="btn btn-sm btn-secondary" [href]="'tel:' + customer.phone" (click)="$event.stopPropagation()">
                    📞 {{ 'customers.call' | translate }}
                  </a>
                }
              </div>
            </div>
          }
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="pagination">
            <button
              class="btn btn-sm"
              [disabled]="currentPage() <= 1"
              (click)="goToPage(currentPage() - 1)"
            >
              {{ 'common.previous' | translate }}
            </button>
            <span class="pagination__info">
              {{ currentPage() }} / {{ totalPages() }}
            </span>
            <button
              class="btn btn-sm"
              [disabled]="currentPage() >= totalPages()"
              (click)="goToPage(currentPage() + 1)"
            >
              {{ 'common.next' | translate }}
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .rep-customers {
      display: grid;
      gap: 20px;
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      &__title {
        font-size: 24px;
        font-weight: 700;
        margin: 0 0 8px 0;
        color: var(--text-primary);
      }
      &__subtitle {
        font-size: 14px;
        color: var(--text-secondary);
        margin: 0;
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
    }

    .stat-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-light);
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      transition: all 0.2s ease;

      &.active {
        border-color: var(--primary);
        background: rgba(var(--primary-rgb), 0.08);
      }

      &--warning { border-left: 4px solid #f59e0b; }
      &--danger { border-left: 4px solid #ef4444; }
      &--success { border-left: 4px solid #10b981; }

      &__btn {
        all: unset;
        cursor: pointer;
        display: block;
        width: 100%;
      }

      &__value {
        display: block;
        font-size: 28px;
        font-weight: 700;
        color: var(--text-primary);
      }

      &__label {
        display: block;
        font-size: 12px;
        color: var(--text-secondary);
        margin-top: 4px;
      }
    }

    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;

      &__search {
        flex: 1;
        min-width: 200px;
      }

      &__selects {
        display: flex;
        gap: 8px;
      }
    }

    .input {
      width: 100%;
      padding: 10px 14px;
      border-radius: 10px;
      border: 1px solid var(--border-light);
      background: var(--bg-primary);
      color: var(--text-primary);
      font-size: 14px;

      &:focus {
        outline: none;
        border-color: var(--primary);
      }
    }

    select.input {
      min-width: 140px;
      cursor: pointer;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: var(--text-secondary);
    }

    .empty {
      text-align: center;
      padding: 60px 20px;
      background: var(--bg-secondary);
      border-radius: 16px;

      &__icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      &__title {
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 8px 0;
      }

      &__desc {
        font-size: 14px;
        color: var(--text-secondary);
        margin: 0;
      }
    }

    .customer-list {
      display: grid;
      gap: 16px;
    }

    .customer-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-light);
      border-radius: 16px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--primary);
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      }

      &__header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
        flex-wrap: wrap;
        gap: 8px;
      }

      &__name {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
      }

      &__badges {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      &__body {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 16px;

        @media (max-width: 600px) {
          grid-template-columns: 1fr;
        }
      }

      &__info {
        display: grid;
        gap: 6px;
      }

      &__row {
        display: flex;
        gap: 8px;
        font-size: 13px;

        .label {
          color: var(--text-secondary);
        }
        .value {
          color: var(--text-primary);
          font-weight: 500;
        }
      }

      &__metrics {
        display: grid;
        gap: 8px;
      }

      &__actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        padding-top: 16px;
        border-top: 1px solid var(--border-light);
      }
    }

    .metric {
      display: flex;
      justify-content: space-between;
      font-size: 13px;

      &__label {
        color: var(--text-secondary);
      }

      &__value {
        font-weight: 600;
        color: var(--text-primary);

        &.warning {
          color: #f59e0b;
        }
      }
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;

      &--premium { background: #fef3c7; color: #b45309; }
      &--standard { background: #d1d5db; color: #1f2937; }
      &--basic { background: #e5e7eb; color: #374151; }
      &--danger { background: #fee2e2; color: #dc2626; }
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

      &-sm {
        padding: 6px 12px;
        font-size: 13px;
      }

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

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      padding: 20px;

      &__info {
        font-size: 14px;
        color: var(--text-secondary);
      }
    }
  `]
})
export class RepCustomersComponent implements OnInit {
  private readonly customerService = inject(RepCustomerService);
  private readonly router = inject(Router);

  // Expose enums to template
  CustomerType = CustomerType;
  CustomerTier = CustomerTier;

  // State
  loading = signal(true);
  customers = signal<RepCustomer[]>([]);
  stats = signal<RepCustomerStats | null>(null);
  currentPage = signal(1);
  totalPages = signal(1);
  totalCount = signal(0);

  // Filters
  filter: RepCustomerFilter = {
    page: 1,
    pageSize: 20
  };

  private searchTimeout: any;

  ngOnInit(): void {
    this.loadStats();
    this.loadCustomers();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.filter.search ||
      this.filter.customerType !== undefined ||
      this.filter.tier !== undefined ||
      this.filter.needsVisit ||
      this.filter.hasCreditWarning
    );
  }

  clearFilters(): void {
    this.filter = {
      page: 1,
      pageSize: 20
    };
    this.loadCustomers();
  }

  toggleNeedsVisit(): void {
    this.filter.needsVisit = !this.filter.needsVisit;
    if (!this.filter.needsVisit) delete this.filter.needsVisit;
    this.filter.page = 1;
    this.loadCustomers();
  }

  toggleCreditWarning(): void {
    this.filter.hasCreditWarning = !this.filter.hasCreditWarning;
    if (!this.filter.hasCreditWarning) delete this.filter.hasCreditWarning;
    this.filter.page = 1;
    this.loadCustomers();
  }

  onSearchChange(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.filter.page = 1;
      this.loadCustomers();
    }, 300);
  }

  applyFilters(): void {
    this.filter.page = 1;
    this.loadCustomers();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.filter.page = page;
    this.loadCustomers();
  }

  private loadStats(): void {
    this.customerService.getMyCustomerStats().subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => this.stats.set(null)
    });
  }

  private loadCustomers(): void {
    this.loading.set(true);

    this.customerService.getMyCustomers(this.filter).subscribe({
      next: (result) => {
        this.customers.set(result.customers);
        this.currentPage.set(result.page);
        this.totalPages.set(result.totalPages);
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
      },
      error: () => {
        this.customers.set([]);
        this.loading.set(false);
      }
    });
  }

  getTierClass(tier: CustomerTier): string {
    switch (tier) {
      case CustomerTier.A: return 'premium';
      case CustomerTier.B: return 'standard';
      case CustomerTier.C: return 'basic';
      default: return 'standard';
    }
  }

  viewCustomer(customer: RepCustomer): void {
    this.router.navigate(['/customers/rep', customer.id]);
  }

  createOrder(customer: RepCustomer, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/orders/rep/new'], {
      queryParams: { customerId: customer.id }
    });
  }

  planVisit(customer: RepCustomer, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/visits/planner'], {
      queryParams: { customerId: customer.id }
    });
  }
}
