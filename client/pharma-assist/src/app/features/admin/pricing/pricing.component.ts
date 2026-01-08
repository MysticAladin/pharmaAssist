import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  PricingService,
  PriceRule,
  Promotion,
  CreatePriceRuleRequest,
  CreatePromotionRequest,
  DiscountType,
  PriceRuleScope,
  CustomerTier,
  PromotionType
} from '../../../core/services/pricing.service';
import { CustomerService, Customer } from '../../../core/services/customer.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { EuropeanDatePipe } from '../../../core/pipes';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    StatusBadgeComponent,
    EmptyStateComponent,
    EuropeanDatePipe
  ],
  template: `
    <div class="pricing-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <h1 class="page-title">{{ 'pricing.title' | translate }}</h1>
          <p class="page-subtitle">{{ 'pricing.subtitle' | translate }}</p>
        </div>
      </header>

      <!-- Tabs -->
      <div class="pa-tabs">
        <button
          class="pa-tab"
          [class.active]="activeTab() === 'rules'"
          (click)="setActiveTab('rules')">
          <i class="icon-tag"></i>
          {{ 'pricing.priceRules' | translate }}
        </button>
        <button
          class="pa-tab"
          [class.active]="activeTab() === 'promotions'"
          (click)="setActiveTab('promotions')">
          <i class="icon-percent"></i>
          {{ 'pricing.promotions' | translate }}
        </button>
        <button
          class="pa-tab"
          [class.active]="activeTab() === 'tiers'"
          (click)="setActiveTab('tiers')">
          <i class="icon-award"></i>
          {{ 'pricing.customerTiers' | translate }}
        </button>
      </div>

      <!-- Price Rules Tab -->
      @if (activeTab() === 'rules') {
        <section class="content-section">
          <div class="section-header">
            <h2>{{ 'pricing.priceRules' | translate }}</h2>
            <button class="btn btn-primary" (click)="openRuleModal()">
              <i class="icon-plus"></i>
              {{ 'pricing.addRule' | translate }}
            </button>
          </div>

          @if (loadingRules()) {
            <div class="loading-container">
              <div class="spinner"></div>
              <span>{{ 'common.loading' | translate }}</span>
            </div>
          } @else if (priceRules().length === 0) {
            <app-empty-state
              icon="tag"
              [title]="'pricing.noRules' | translate"
              [description]="'pricing.noRulesDescription' | translate">
            </app-empty-state>
          } @else {
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>{{ 'pricing.name' | translate }}</th>
                    <th>{{ 'pricing.type' | translate }}</th>
                    <th>{{ 'pricing.scope' | translate }}</th>
                    <th>{{ 'pricing.discount' | translate }}</th>
                    <th>{{ 'pricing.tier' | translate }}</th>
                    <th>{{ 'pricing.priority' | translate }}</th>
                    <th class="text-center">{{ 'common.status' | translate }}</th>
                    <th class="text-center">{{ 'common.actions' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (rule of priceRules(); track rule.id) {
                    <tr>
                      <td>
                        <div class="rule-info">
                          <span class="rule-name">{{ rule.name }}</span>
                          @if (rule.description) {
                            <span class="rule-desc">{{ rule.description }}</span>
                          }
                        </div>
                      </td>
                      <td>{{ pricingService.getDiscountTypeName(rule.discountType) | translate }}</td>
                      <td>{{ pricingService.getScopeName(rule.scope) | translate }}</td>
                      <td>
                        @if (rule.discountType === DiscountType.Percentage) {
                          {{ rule.discountValue }}%
                        } @else {
                          {{ rule.discountValue | currency:'BAM':'symbol':'1.2-2' }}
                        }
                      </td>
                      <td>
                        @if (rule.customerTier !== undefined && rule.customerTier !== null) {
                          <span class="tier-badge tier-{{ getTierClass(rule.customerTier) }}">
                            {{ pricingService.getTierName(rule.customerTier) | translate }}
                          </span>
                        } @else {
                          <span class="text-muted">{{ 'pricing.allTiers' | translate }}</span>
                        }
                      </td>
                      <td>{{ rule.priority }}</td>
                      <td class="text-center">
                        <app-status-badge
                          [variant]="rule.isActive ? 'success' : 'danger'"
                          [label]="(rule.isActive ? 'common.active' : 'common.inactive') | translate">
                        </app-status-badge>
                      </td>
                      <td class="text-center">
                        <div class="action-buttons">
                          <button class="btn btn-icon btn-sm" (click)="editRule(rule)" [title]="'common.edit' | translate">
                            <i class="icon-edit"></i>
                          </button>
                          <button class="btn btn-icon btn-sm danger" (click)="deleteRule(rule)" [title]="'common.delete' | translate">
                            <i class="icon-trash-2"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>
      }

      <!-- Promotions Tab -->
      @if (activeTab() === 'promotions') {
        <section class="content-section">
          <div class="section-header">
            <h2>{{ 'pricing.promotions' | translate }}</h2>
            <button class="btn btn-primary" (click)="openPromotionModal()">
              <i class="icon-plus"></i>
              {{ 'pricing.addPromotion' | translate }}
            </button>
          </div>

          @if (loadingPromotions()) {
            <div class="loading-container">
              <div class="spinner"></div>
              <span>{{ 'common.loading' | translate }}</span>
            </div>
          } @else if (promotions().length === 0) {
            <app-empty-state
              icon="percent"
              [title]="'pricing.noPromotions' | translate"
              [description]="'pricing.noPromotionsDescription' | translate">
            </app-empty-state>
          } @else {
            <div class="cards-grid">
              @for (promo of promotions(); track promo.id) {
                <div class="promo-card" [class.inactive]="!promo.isActive">
                  <div class="promo-header">
                    <div class="promo-type">
                      {{ pricingService.getPromotionTypeName(promo.promotionType) | translate }}
                    </div>
                    <app-status-badge
                      [variant]="promo.isActive ? 'success' : 'danger'"
                      [label]="(promo.isActive ? 'common.active' : 'common.inactive') | translate">
                    </app-status-badge>
                  </div>
                  <h3 class="promo-name">{{ promo.name }}</h3>
                  @if (promo.code) {
                    <div class="promo-code">
                      <i class="icon-gift"></i>
                      <code>{{ promo.code }}</code>
                    </div>
                  }
                  <div class="promo-value">
                    @if (promo.promotionType === PromotionType.Percentage) {
                      {{ promo.discountValue }}% {{ 'pricing.off' | translate }}
                    } @else if (promo.promotionType === PromotionType.FreeShipping) {
                      {{ 'pricing.freeShipping' | translate }}
                    } @else {
                      {{ promo.discountValue | currency:'BAM':'symbol':'1.2-2' }} {{ 'pricing.off' | translate }}
                    }
                  </div>
                  <div class="promo-dates">
                    <i class="icon-calendar"></i>
                    {{ promo.startDate | europeanDate }} - {{ promo.endDate | europeanDate }}
                  </div>
                  <div class="promo-usage">
                    <span>{{ 'pricing.usage' | translate }}: {{ promo.currentUsageCount }}</span>
                    @if (promo.usageLimit) {
                      <span>/ {{ promo.usageLimit }}</span>
                    }
                  </div>
                  <div class="promo-actions">
                    <button class="btn btn-sm" (click)="editPromotion(promo)">
                      <i class="icon-edit"></i>
                      {{ 'common.edit' | translate }}
                    </button>
                    <button class="btn btn-sm danger" (click)="deletePromotion(promo)">
                      <i class="icon-trash-2"></i>
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </section>
      }

      <!-- Tiers Tab -->
      @if (activeTab() === 'tiers') {
        <section class="content-section">
          <div class="section-header">
            <h2>{{ 'pricing.customerTiers' | translate }}</h2>
          </div>

          <div class="tiers-grid">
            <!-- Tier A - Premium -->
            <div class="tier-card tier-a">
              <div class="tier-badge">A</div>
              <h3>{{ 'pricing.tiers.premium' | translate }}</h3>
              <div class="tier-discount">15% {{ 'pricing.discount' | translate }}</div>
              <ul class="tier-benefits">
                <li><i class="icon-check"></i> {{ 'pricing.tierBenefits.prioritySupport' | translate }}</li>
                <li><i class="icon-check"></i> {{ 'pricing.tierBenefits.extendedCredit' | translate }}</li>
                <li><i class="icon-check"></i> {{ 'pricing.tierBenefits.freeDelivery' | translate }}</li>
                <li><i class="icon-check"></i> {{ 'pricing.tierBenefits.exclusiveProducts' | translate }}</li>
              </ul>
            </div>

            <!-- Tier B - Standard -->
            <div class="tier-card tier-b">
              <div class="tier-badge">B</div>
              <h3>{{ 'pricing.tiers.standard' | translate }}</h3>
              <div class="tier-discount">10% {{ 'pricing.discount' | translate }}</div>
              <ul class="tier-benefits">
                <li><i class="icon-check"></i> {{ 'pricing.tierBenefits.standardSupport' | translate }}</li>
                <li><i class="icon-check"></i> {{ 'pricing.tierBenefits.standardCredit' | translate }}</li>
                <li><i class="icon-check"></i> {{ 'pricing.tierBenefits.reducedDelivery' | translate }}</li>
              </ul>
            </div>

            <!-- Tier C - Basic -->
            <div class="tier-card tier-c">
              <div class="tier-badge">C</div>
              <h3>{{ 'pricing.tiers.basic' | translate }}</h3>
              <div class="tier-discount">5% {{ 'pricing.discount' | translate }}</div>
              <ul class="tier-benefits">
                <li><i class="icon-check"></i> {{ 'pricing.tierBenefits.basicSupport' | translate }}</li>
                <li><i class="icon-check"></i> {{ 'pricing.tierBenefits.basicCredit' | translate }}</li>
              </ul>
            </div>
          </div>
        </section>
      }

      <!-- Rule Modal -->
      @if (showRuleModal()) {
        <div class="modal-backdrop" (click)="closeRuleModal()"></div>
        <div class="modal">
          <div class="modal-header">
            <h2>{{ (editingRule() ? 'pricing.editRule' : 'pricing.addRule') | translate }}</h2>
            <button class="btn btn-icon" (click)="closeRuleModal()">
              <i class="icon-x"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>{{ 'pricing.name' | translate }} *</label>
              <input type="text" class="form-control" [(ngModel)]="ruleForm.name" required>
            </div>
            <div class="form-group">
              <label>{{ 'pricing.description' | translate }}</label>
              <textarea class="form-control" [(ngModel)]="ruleForm.description" rows="2"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ 'pricing.discountType' | translate }} *</label>
                <select class="form-select" [(ngModel)]="ruleForm.discountType">
                  <option [value]="DiscountType.Percentage">{{ 'pricing.discountTypes.percentage' | translate }}</option>
                  <option [value]="DiscountType.FixedAmount">{{ 'pricing.discountTypes.fixedAmount' | translate }}</option>
                  <option [value]="DiscountType.FixedPrice">{{ 'pricing.discountTypes.fixedPrice' | translate }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>{{ 'pricing.discountValue' | translate }} *</label>
                <input type="number" class="form-control" [(ngModel)]="ruleForm.discountValue" min="0" step="0.01">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ 'pricing.scope' | translate }} *</label>
                <select class="form-select" [(ngModel)]="ruleForm.scope">
                  <option [value]="PriceRuleScope.Global">{{ 'pricing.scopes.global' | translate }}</option>
                  <option [value]="PriceRuleScope.Category">{{ 'pricing.scopes.category' | translate }}</option>
                  <option [value]="PriceRuleScope.Manufacturer">{{ 'pricing.scopes.manufacturer' | translate }}</option>
                  <option [value]="PriceRuleScope.Product">{{ 'pricing.scopes.product' | translate }}</option>
                  <option [value]="PriceRuleScope.Customer">{{ 'pricing.scopes.customer' | translate }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>{{ 'pricing.tier' | translate }}</label>
                <select class="form-select" [(ngModel)]="ruleForm.customerTier">
                  <option [ngValue]="null">{{ 'pricing.allTiers' | translate }}</option>
                  <option [value]="CustomerTier.A">{{ 'pricing.tiers.premium' | translate }} (A)</option>
                  <option [value]="CustomerTier.B">{{ 'pricing.tiers.standard' | translate }} (B)</option>
                  <option [value]="CustomerTier.C">{{ 'pricing.tiers.basic' | translate }} (C)</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ 'pricing.priority' | translate }}</label>
                <input type="number" class="form-control" [(ngModel)]="ruleForm.priority" min="0">
              </div>
              <div class="form-group">
                <label>{{ 'pricing.minQuantity' | translate }}</label>
                <input type="number" class="form-control" [(ngModel)]="ruleForm.minimumQuantity" min="1">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ 'pricing.startDate' | translate }}</label>
                <div class="date-input-wrapper">
                  <input
                    type="text"
                    class="form-control date-filter"
                    inputmode="numeric"
                    placeholder="dd.MM.yyyy"
                    [ngModel]="ruleStartDateText"
                    (ngModelChange)="ruleStartDateText = $event"
                    (blur)="onRuleStartDateBlur()"
                  />
                  <input
                    type="date"
                    class="hidden-date-picker"
                    [value]="toIsoDate(ruleForm.startDate)"
                    (change)="onNativeRuleStartDateChange($event)"
                    #ruleStartDatePicker
                  />
                  <button type="button" class="calendar-icon" (click)="ruleStartDatePicker.showPicker()">
                    <i class="icon-calendar"></i>
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label>{{ 'pricing.endDate' | translate }}</label>
                <div class="date-input-wrapper">
                  <input
                    type="text"
                    class="form-control date-filter"
                    inputmode="numeric"
                    placeholder="dd.MM.yyyy"
                    [ngModel]="ruleEndDateText"
                    (ngModelChange)="ruleEndDateText = $event"
                    (blur)="onRuleEndDateBlur()"
                  />
                  <input
                    type="date"
                    class="hidden-date-picker"
                    [value]="toIsoDate(ruleForm.endDate)"
                    (change)="onNativeRuleEndDateChange($event)"
                    #ruleEndDatePicker
                  />
                  <button type="button" class="calendar-icon" (click)="ruleEndDatePicker.showPicker()">
                    <i class="icon-calendar"></i>
                  </button>
                </div>
              </div>
            </div>
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="ruleForm.isActive">
                {{ 'pricing.isActive' | translate }}
              </label>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="ruleForm.canStack">
                {{ 'pricing.canStack' | translate }}
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn" (click)="closeRuleModal()">{{ 'common.cancel' | translate }}</button>
            <button class="btn btn-primary" (click)="saveRule()" [disabled]="savingRule()">
              @if (savingRule()) {
                <span class="spinner-sm"></span>
              }
              {{ 'common.save' | translate }}
            </button>
          </div>
        </div>
      }

      <!-- Promotion Modal -->
      @if (showPromotionModal()) {
        <div class="modal-backdrop" (click)="closePromotionModal()"></div>
        <div class="modal modal-lg">
          <div class="modal-header">
            <h2>{{ (editingPromotion() ? 'pricing.editPromotion' : 'pricing.addPromotion') | translate }}</h2>
            <button class="btn btn-icon" (click)="closePromotionModal()">
              <i class="icon-x"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group flex-2">
                <label>{{ 'pricing.name' | translate }} *</label>
                <input type="text" class="form-control" [(ngModel)]="promotionForm.name" required>
              </div>
              <div class="form-group flex-1">
                <label>{{ 'pricing.code' | translate }}</label>
                <input type="text" class="form-control" [(ngModel)]="promotionForm.code" placeholder="SUMMER2025">
              </div>
            </div>
            <div class="form-group">
              <label>{{ 'pricing.description' | translate }}</label>
              <textarea class="form-control" [(ngModel)]="promotionForm.description" rows="2"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ 'pricing.promotionType' | translate }} *</label>
                <select class="form-select" [(ngModel)]="promotionForm.promotionType">
                  <option [value]="PromotionType.Percentage">{{ 'pricing.promotionTypes.percentage' | translate }}</option>
                  <option [value]="PromotionType.FixedAmount">{{ 'pricing.promotionTypes.fixedAmount' | translate }}</option>
                  <option [value]="PromotionType.FreeShipping">{{ 'pricing.promotionTypes.freeShipping' | translate }}</option>
                  <option [value]="PromotionType.BuyOneGetOne">{{ 'pricing.promotionTypes.bogo' | translate }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>{{ 'pricing.discountValue' | translate }} *</label>
                <input type="number" class="form-control" [(ngModel)]="promotionForm.discountValue" min="0" step="0.01">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ 'pricing.minOrderValue' | translate }}</label>
                <input type="number" class="form-control" [(ngModel)]="promotionForm.minimumOrderValue" min="0" step="0.01">
              </div>
              <div class="form-group">
                <label>{{ 'pricing.maxDiscount' | translate }}</label>
                <input type="number" class="form-control" [(ngModel)]="promotionForm.maximumDiscountAmount" min="0" step="0.01">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ 'pricing.usageLimit' | translate }}</label>
                <input type="number" class="form-control" [(ngModel)]="promotionForm.usageLimit" min="0">
              </div>
              <div class="form-group">
                <label>{{ 'pricing.usageLimitPerCustomer' | translate }}</label>
                <input type="number" class="form-control" [(ngModel)]="promotionForm.usageLimitPerCustomer" min="0">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ 'pricing.startDate' | translate }} *</label>
                <div class="date-input-wrapper">
                  <input
                    type="text"
                    class="form-control date-filter"
                    inputmode="numeric"
                    placeholder="dd.MM.yyyy"
                    [ngModel]="promotionStartDateText"
                    (ngModelChange)="promotionStartDateText = $event"
                    (blur)="onPromotionStartDateBlur()"
                    required
                  />
                  <input
                    type="date"
                    class="hidden-date-picker"
                    [value]="toIsoDate(promotionForm.startDate)"
                    (change)="onNativePromotionStartDateChange($event)"
                    #promotionStartDatePicker
                  />
                  <button type="button" class="calendar-icon" (click)="promotionStartDatePicker.showPicker()">
                    <i class="icon-calendar"></i>
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label>{{ 'pricing.endDate' | translate }} *</label>
                <div class="date-input-wrapper">
                  <input
                    type="text"
                    class="form-control date-filter"
                    inputmode="numeric"
                    placeholder="dd.MM.yyyy"
                    [ngModel]="promotionEndDateText"
                    (ngModelChange)="promotionEndDateText = $event"
                    (blur)="onPromotionEndDateBlur()"
                    required
                  />
                  <input
                    type="date"
                    class="hidden-date-picker"
                    [value]="toIsoDate(promotionForm.endDate)"
                    (change)="onNativePromotionEndDateChange($event)"
                    #promotionEndDatePicker
                  />
                  <button type="button" class="calendar-icon" (click)="promotionEndDatePicker.showPicker()">
                    <i class="icon-calendar"></i>
                  </button>
                </div>
              </div>
            </div>
            <!-- Customer Targeting -->
            <div class="form-section">
              <h3 class="section-title">{{ 'pricing.customerTargeting' | translate }}</h3>
              <div class="form-row">
                <div class="form-group flex-2">
                  <label>{{ 'pricing.targetCustomer' | translate }}</label>
                  <select class="form-select" [(ngModel)]="promotionForm.customerId">
                    <option [ngValue]="undefined">{{ 'pricing.allCustomers' | translate }}</option>
                    @for (customer of customers(); track customer.id) {
                      <option [ngValue]="customer.id">{{ customer.name }}</option>
                    }
                  </select>
                </div>
                <div class="form-group flex-1 align-bottom">
                  @if (promotionForm.customerId) {
                    <label class="checkbox-label">
                      <input type="checkbox" [(ngModel)]="promotionForm.applyToChildCustomers">
                      {{ 'pricing.applyToChildBranches' | translate }}
                    </label>
                  }
                </div>
              </div>
            </div>
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="promotionForm.isActive">
                {{ 'pricing.isActive' | translate }}
              </label>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="promotionForm.appliesToAllProducts">
                {{ 'pricing.appliesToAllProducts' | translate }}
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn" (click)="closePromotionModal()">{{ 'common.cancel' | translate }}</button>
            <button class="btn btn-primary" (click)="savePromotion()" [disabled]="savingPromotion()">
              @if (savingPromotion()) {
                <span class="spinner-sm"></span>
              }
              {{ 'common.save' | translate }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .pricing-page {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .header-content {
      flex: 1;
      min-width: 0;
    }

    .page-title {
      font-size: var(--font-size-2xl);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.25rem 0;
    }

    .page-subtitle {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin: 0;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
      }
    }

    .content-section {
      background: var(--bg-primary);
      border-radius: 0.75rem;
      border: 1px solid var(--border-color);
      padding: 1.5rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .section-header h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
    }

    /* Table styles */
    .table-container {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th,
    .data-table td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    .data-table th {
      font-weight: 600;
      color: var(--text-secondary);
      font-size: 0.875rem;
      background: var(--bg-secondary);
    }

    .rule-info {
      display: flex;
      flex-direction: column;
    }

    .rule-name {
      font-weight: 500;
    }

    .rule-desc {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .tier-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .tier-a { background: var(--status-pending-bg); color: var(--color-warning-text); }
    .tier-b { background: var(--status-processing-bg); color: var(--color-info-text); }
    .tier-c { background: #f3e8ff; color: #7c3aed; }

    .action-buttons {
      display: flex;
      gap: 0.25rem;
      justify-content: center;
    }

    /* Cards grid for promotions */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }

    .promo-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 0.75rem;
      padding: 1.25rem;
      transition: all 0.2s;
    }

    .promo-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .promo-card.inactive {
      opacity: 0.6;
    }

    .promo-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .promo-type {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--text-secondary);
    }

    .promo-name {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 0.5rem;
    }

    .promo-code {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--bg-primary);
      padding: 0.5rem 0.75rem;
      border-radius: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .promo-code code {
      font-family: monospace;
      font-weight: 600;
      color: var(--primary-color);
    }

    .promo-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--success-color);
      margin-bottom: 0.75rem;
    }

    .promo-dates,
    .promo-usage {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
    }

    .promo-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    /* Tiers grid */
    .tiers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .tier-card {
      background: var(--bg-secondary);
      border: 2px solid var(--border-color);
      border-radius: 1rem;
      padding: 2rem;
      text-align: center;
      transition: all 0.3s;
    }

    .tier-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }

    .tier-card .tier-badge {
      width: 3rem;
      height: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 auto 1rem;
    }

    .tier-card.tier-a { border-color: var(--color-warning); }
    .tier-card.tier-a .tier-badge { background: var(--status-pending-bg); color: var(--color-warning-text); }

    .tier-card.tier-b { border-color: var(--brand-primary); }
    .tier-card.tier-b .tier-badge { background: var(--status-processing-bg); color: var(--color-info-text); }

    .tier-card.tier-c { border-color: var(--accent-purple); }
    .tier-card.tier-c .tier-badge { background: #f3e8ff; color: #7c3aed; }

    .tier-card h3 {
      font-size: 1.25rem;
      margin: 0 0 0.5rem;
    }

    .tier-discount {
      font-size: 2rem;
      font-weight: 700;
      color: var(--success-color);
      margin-bottom: 1.5rem;
    }

    .tier-benefits {
      list-style: none;
      padding: 0;
      margin: 0;
      text-align: left;
    }

    .tier-benefits li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border-color);
    }

    .tier-benefits li:last-child {
      border-bottom: none;
    }

    .tier-benefits i {
      color: var(--success-color);
    }

    /* Modal styles */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
    }

    .modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--bg-primary);
      border-radius: 1rem;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      z-index: 1001;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    }

    .modal.modal-lg {
      max-width: 800px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .modal-header h2 {
      font-size: 1.25rem;
      margin: 0;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.25rem 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .form-control,
    .form-select {
      width: 100%;
      padding: 0.625rem 0.875rem;
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      font-size: 0.9375rem;
      background: var(--bg-primary);
      color: var(--text-primary);
    }

    .form-control:focus,
    .form-select:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-row .flex-2 {
      grid-column: span 2;
    }

    @media (max-width: 640px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }

    .checkbox-group {
      display: flex;
      gap: 1.5rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      margin-bottom: 0;
    }

    .checkbox-label input[type="checkbox"] {
      width: 1.125rem;
      height: 1.125rem;
      accent-color: var(--primary-color);
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      font-weight: 500;
      cursor: pointer;
      background: var(--bg-primary);
      color: var(--text-primary);
      transition: all 0.2s;
    }

    .btn:hover {
      background: var(--bg-secondary);
    }

    .btn-primary {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: white;
    }

    .btn-primary:hover {
      background: var(--primary-hover);
    }

    .btn.btn-primary:hover {
      background: var(--primary-hover);
      border-color: var(--primary-hover);
    }

    /* EU date input with native picker */
    .date-input-wrapper {
      position: relative;
    }

    .hidden-date-picker {
      position: absolute;
      opacity: 0;
      pointer-events: none;
      width: 0;
      height: 0;
    }

    .calendar-icon {
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      transition: color 0.15s;
    }

    .calendar-icon:hover {
      color: var(--primary-color);
    }

    .form-control.date-filter {
      padding-right: 2.5rem;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
    }

    .btn-icon {
      padding: 0.5rem;
      border: none;
      background: transparent;
    }

    .btn-icon.danger:hover {
      color: var(--danger-color);
    }

    .btn.danger {
      color: var(--danger-color);
      border-color: var(--danger-color);
    }

    .btn.danger:hover {
      background: var(--danger-color);
      color: white;
    }

    /* Loading */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 1rem;
      color: var(--text-secondary);
    }

    .spinner {
      width: 2rem;
      height: 2rem;
      border: 3px solid var(--border-color);
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .spinner-sm {
      width: 1rem;
      height: 1rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .text-center { text-align: center; }
    .text-muted { color: var(--text-secondary); }
  `]
})
export class PricingComponent implements OnInit {
  readonly pricingService = inject(PricingService);
  private readonly customerService = inject(CustomerService);
  private readonly notification = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly translate = inject(TranslateService);

  // Expose enums to template
  readonly DiscountType = DiscountType;
  readonly PriceRuleScope = PriceRuleScope;
  readonly CustomerTier = CustomerTier;
  readonly PromotionType = PromotionType;

  // State
  activeTab = signal<'rules' | 'promotions' | 'tiers'>('rules');
  loadingRules = signal(false);
  loadingPromotions = signal(false);
  priceRules = signal<PriceRule[]>([]);
  promotions = signal<Promotion[]>([]);
  customers = signal<Customer[]>([]);

  // Rule modal
  showRuleModal = signal(false);
  editingRule = signal<PriceRule | null>(null);
  savingRule = signal(false);
  ruleForm: CreatePriceRuleRequest = this.getEmptyRuleForm();
  ruleStartDateText = '';
  ruleEndDateText = '';

  // Promotion modal
  showPromotionModal = signal(false);
  editingPromotion = signal<Promotion | null>(null);
  savingPromotion = signal(false);
  promotionForm: CreatePromotionRequest = this.getEmptyPromotionForm();
  promotionStartDateText = '';
  promotionEndDateText = '';

  ngOnInit() {
    this.loadRules();
    this.loadPromotions();
    this.loadCustomers();
  }

  setActiveTab(tab: 'rules' | 'promotions' | 'tiers') {
    this.activeTab.set(tab);
  }

  // === Customers ===

  loadCustomers() {
    this.customerService.getAll().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.customers.set(res.data);
        }
      }
    });
  }

  // === Rules ===

  loadRules() {
    this.loadingRules.set(true);
    this.pricingService.getPriceRules().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.priceRules.set(res.data);
        }
        this.loadingRules.set(false);
      },
      error: () => {
        this.loadingRules.set(false);
        this.notification.error(this.translate.instant('pricing.loadError'));
      }
    });
  }

  openRuleModal(rule?: PriceRule) {
    if (rule) {
      this.editingRule.set(rule);
      this.ruleForm = { ...rule };
    } else {
      this.editingRule.set(null);
      this.ruleForm = this.getEmptyRuleForm();
    }
    this.ruleStartDateText = this.isoToEuDate(this.toIsoDate(this.ruleForm.startDate));
    this.ruleEndDateText = this.isoToEuDate(this.toIsoDate(this.ruleForm.endDate));
    this.showRuleModal.set(true);
  }

  closeRuleModal() {
    this.showRuleModal.set(false);
    this.editingRule.set(null);
    this.ruleStartDateText = '';
    this.ruleEndDateText = '';
  }

  editRule(rule: PriceRule) {
    this.openRuleModal(rule);
  }

  saveRule() {
    this.normalizeRuleDates();
    if (!this.ruleForm.name || this.ruleForm.discountValue === undefined) {
      this.notification.warning(this.translate.instant('common.fillRequired'));
      return;
    }

    this.savingRule.set(true);
    const editing = this.editingRule();

    const request$ = editing
      ? this.pricingService.updatePriceRule(editing.id, this.ruleForm)
      : this.pricingService.createPriceRule(this.ruleForm);

    request$.subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success(this.translate.instant(editing ? 'pricing.ruleUpdated' : 'pricing.ruleCreated'));
          this.closeRuleModal();
          this.loadRules();
        }
        this.savingRule.set(false);
      },
      error: () => {
        this.savingRule.set(false);
        this.notification.error(this.translate.instant('common.saveError'));
      }
    });
  }

  async deleteRule(rule: PriceRule) {
    const confirmed = await this.confirmation.confirm({
      title: this.translate.instant('pricing.deleteRule'),
      message: this.translate.instant('pricing.deleteRuleConfirm', { name: rule.name }),
      confirmText: this.translate.instant('common.delete'),
      cancelText: this.translate.instant('common.cancel'),
      variant: 'danger'
    });

    if (confirmed) {
      this.pricingService.deletePriceRule(rule.id).subscribe({
        next: () => {
          this.notification.success(this.translate.instant('pricing.ruleDeleted'));
          this.loadRules();
        },
        error: () => {
          this.notification.error(this.translate.instant('common.deleteError'));
        }
      });
    }
  }

  // === Promotions ===

  loadPromotions() {
    this.loadingPromotions.set(true);
    this.pricingService.getPromotions().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.promotions.set(res.data);
        }
        this.loadingPromotions.set(false);
      },
      error: () => {
        this.loadingPromotions.set(false);
        this.notification.error(this.translate.instant('pricing.loadError'));
      }
    });
  }

  openPromotionModal(promo?: Promotion) {
    if (promo) {
      this.editingPromotion.set(promo);
      this.promotionForm = { ...promo } as CreatePromotionRequest;
    } else {
      this.editingPromotion.set(null);
      this.promotionForm = this.getEmptyPromotionForm();
    }
    this.promotionStartDateText = this.isoToEuDate(this.toIsoDate(this.promotionForm.startDate));
    this.promotionEndDateText = this.isoToEuDate(this.toIsoDate(this.promotionForm.endDate));
    this.showPromotionModal.set(true);
  }

  closePromotionModal() {
    this.showPromotionModal.set(false);
    this.editingPromotion.set(null);
    this.promotionStartDateText = '';
    this.promotionEndDateText = '';
  }

  editPromotion(promo: Promotion) {
    this.openPromotionModal(promo);
  }

  savePromotion() {
    this.normalizePromotionDates();
    if (!this.promotionForm.name || !this.promotionForm.startDate || !this.promotionForm.endDate) {
      this.notification.warning(this.translate.instant('common.fillRequired'));
      return;
    }

    this.savingPromotion.set(true);
    const editing = this.editingPromotion();

    const request$ = editing
      ? this.pricingService.updatePromotion(editing.id, this.promotionForm)
      : this.pricingService.createPromotion(this.promotionForm);

    request$.subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success(this.translate.instant(editing ? 'pricing.promotionUpdated' : 'pricing.promotionCreated'));
          this.closePromotionModal();
          this.loadPromotions();
        }
        this.savingPromotion.set(false);
      },
      error: () => {
        this.savingPromotion.set(false);
        this.notification.error(this.translate.instant('common.saveError'));
      }
    });
  }

  async deletePromotion(promo: Promotion) {
    const confirmed = await this.confirmation.confirm({
      title: this.translate.instant('pricing.deletePromotion'),
      message: this.translate.instant('pricing.deletePromotionConfirm', { name: promo.name }),
      confirmText: this.translate.instant('common.delete'),
      cancelText: this.translate.instant('common.cancel'),
      variant: 'danger'
    });

    if (confirmed) {
      this.pricingService.deletePromotion(promo.id).subscribe({
        next: () => {
          this.notification.success(this.translate.instant('pricing.promotionDeleted'));
          this.loadPromotions();
        },
        error: () => {
          this.notification.error(this.translate.instant('common.deleteError'));
        }
      });
    }
  }

  // === Helpers ===

  getTierClass(tier: CustomerTier): string {
    const classes: Record<CustomerTier, string> = {
      [CustomerTier.A]: 'a',
      [CustomerTier.B]: 'b',
      [CustomerTier.C]: 'c'
    };
    return classes[tier] || '';
  }

  private getEmptyRuleForm(): CreatePriceRuleRequest {
    return {
      name: '',
      description: '',
      discountType: DiscountType.Percentage,
      discountValue: 0,
      scope: PriceRuleScope.Global,
      priority: 0,
      minimumQuantity: 1,
      isActive: true,
      canStack: false
    };
  }

  private getEmptyPromotionForm(): CreatePromotionRequest {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const todayIso = this.dateToIso(today);
    const nextMonthIso = this.dateToIso(nextMonth);

    return {
      name: '',
      description: '',
      code: '',
      promotionType: PromotionType.Percentage,
      discountValue: 0,
      minimumOrderValue: 0,
      startDate: todayIso as any,
      endDate: nextMonthIso as any,
      isActive: true,
      appliesToAllProducts: true,
      customerId: undefined,
      applyToChildCustomers: false
    };
  }

  onNativeRuleStartDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.ruleForm.startDate = (input.value || undefined) as any;
    this.ruleStartDateText = this.isoToEuDate(input.value);
  }

  onNativeRuleEndDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.ruleForm.endDate = (input.value || undefined) as any;
    this.ruleEndDateText = this.isoToEuDate(input.value);
  }

  onRuleStartDateBlur(): void {
    const trimmed = (this.ruleStartDateText ?? '').trim();
    if (!trimmed) {
      this.ruleForm.startDate = undefined;
      this.ruleStartDateText = '';
      return;
    }
    const iso = this.euToIsoDate(trimmed);
    this.ruleForm.startDate = (iso || undefined) as any;
    if (iso) this.ruleStartDateText = this.isoToEuDate(iso);
  }

  onRuleEndDateBlur(): void {
    const trimmed = (this.ruleEndDateText ?? '').trim();
    if (!trimmed) {
      this.ruleForm.endDate = undefined;
      this.ruleEndDateText = '';
      return;
    }
    const iso = this.euToIsoDate(trimmed);
    this.ruleForm.endDate = (iso || undefined) as any;
    if (iso) this.ruleEndDateText = this.isoToEuDate(iso);
  }

  onNativePromotionStartDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.promotionForm.startDate = (input.value || undefined) as any;
    this.promotionStartDateText = this.isoToEuDate(input.value);
  }

  onNativePromotionEndDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.promotionForm.endDate = (input.value || undefined) as any;
    this.promotionEndDateText = this.isoToEuDate(input.value);
  }

  onPromotionStartDateBlur(): void {
    const trimmed = (this.promotionStartDateText ?? '').trim();
    if (!trimmed) {
      this.promotionForm.startDate = undefined as any;
      this.promotionStartDateText = '';
      return;
    }
    const iso = this.euToIsoDate(trimmed);
    this.promotionForm.startDate = (iso || undefined) as any;
    if (iso) this.promotionStartDateText = this.isoToEuDate(iso);
  }

  onPromotionEndDateBlur(): void {
    const trimmed = (this.promotionEndDateText ?? '').trim();
    if (!trimmed) {
      this.promotionForm.endDate = undefined as any;
      this.promotionEndDateText = '';
      return;
    }
    const iso = this.euToIsoDate(trimmed);
    this.promotionForm.endDate = (iso || undefined) as any;
    if (iso) this.promotionEndDateText = this.isoToEuDate(iso);
  }

  private normalizeRuleDates(): void {
    this.onRuleStartDateBlur();
    this.onRuleEndDateBlur();
  }

  private normalizePromotionDates(): void {
    this.onPromotionStartDateBlur();
    this.onPromotionEndDateBlur();
  }

  toIsoDate(value: unknown): string {
    if (!value) return '';
    if (typeof value === 'string') {
      const m = value.match(/^\d{4}-\d{2}-\d{2}$/);
      if (m) return value;
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? '' : this.dateToIso(d);
    }
    if (value instanceof Date) return this.dateToIso(value);
    return '';
  }

  private dateToIso(date: Date): string {
    const yyyy = String(date.getFullYear());
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private isoToEuDate(value: string): string {
    if (!value) return '';
    const m = value.match(/^\d{4}-\d{2}-\d{2}$/);
    if (m) {
      const [y, mo, d] = value.split('-');
      return `${d}.${mo}.${y}`;
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    return `${dd}.${mm}.${yyyy}`;
  }

  private euToIsoDate(value: string | null | undefined): string | null {
    const v = (value ?? '').trim();
    if (!v) return null;

    const match = v.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
    if (!match) return null;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null;

    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null;
    }

    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }
}
