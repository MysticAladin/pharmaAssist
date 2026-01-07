import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SalesRepService } from '../../../core/services/sales-rep.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import {
  SalesRepresentativeSummary,
  SalesRepQuery,
  RepresentativeType,
  RepresentativeStatus,
  PagedSalesReps
} from '../../../core/models/sales-rep.model';
import { PaginationComponent, PageEvent } from '../../../shared/components/pagination/pagination.component';
import { StatusBadgeComponent, BadgeVariant } from '../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SearchInputComponent } from '../../../shared/components/search-input';

@Component({
  selector: 'app-sales-reps-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    SearchInputComponent,
    PaginationComponent,
    StatusBadgeComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="sales-reps-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">{{ 'salesReps.title' | translate }}</h1>
          <p class="page-subtitle">{{ 'salesReps.subtitle' | translate }}</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          {{ 'salesReps.addNew' | translate }}
        </button>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-row">
          <app-search-input
            [placeholder]="'salesReps.searchPlaceholder'"
            [initialValue]="searchTerm"
            (searchChange)="onSearchTermChange($event)"
          ></app-search-input>

          <select class="filter-select" [(ngModel)]="selectedRepType" (change)="applyFilters()">
            <option value="">{{ 'salesReps.allTypes' | translate }}</option>
            <option [value]="RepresentativeType.Commercial">{{ 'salesReps.typeCommercial' | translate }}</option>
            <option [value]="RepresentativeType.Medical">{{ 'salesReps.typeMedical' | translate }}</option>
          </select>

          <select class="filter-select" [(ngModel)]="selectedStatus" (change)="applyFilters()">
            <option value="">{{ 'salesReps.allStatuses' | translate }}</option>
            <option [value]="RepresentativeStatus.Active">{{ 'salesReps.statusActive' | translate }}</option>
            <option [value]="RepresentativeStatus.Inactive">{{ 'salesReps.statusInactive' | translate }}</option>
            <option [value]="RepresentativeStatus.OnLeave">{{ 'salesReps.statusOnLeave' | translate }}</option>
            <option [value]="RepresentativeStatus.Terminated">{{ 'salesReps.statusTerminated' | translate }}</option>
          </select>

          @if (hasFilters()) {
            <button class="btn btn-ghost" (click)="clearFilters()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
              {{ 'common.clearFilters' | translate }}
            </button>
          }
        </div>
      </div>

      <!-- Stats Summary -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-value">{{ stats().total }}</span>
          <span class="stat-label">{{ 'salesReps.totalReps' | translate }}</span>
        </div>
        <div class="stat-card commercial">
          <span class="stat-value">{{ stats().commercial }}</span>
          <span class="stat-label">{{ 'salesReps.commercialReps' | translate }}</span>
        </div>
        <div class="stat-card medical">
          <span class="stat-value">{{ stats().medical }}</span>
          <span class="stat-label">{{ 'salesReps.medicalReps' | translate }}</span>
        </div>
        <div class="stat-card active">
          <span class="stat-value">{{ stats().active }}</span>
          <span class="stat-label">{{ 'salesReps.activeReps' | translate }}</span>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>{{ 'common.loading' | translate }}</p>
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && salesReps().length === 0) {
        <app-empty-state
          icon="people"
          [title]="'salesReps.noRepsFound'"
          [description]="hasFilters() ? 'salesReps.noRepsWithFilters' : 'salesReps.noRepsYet'"
        >
          @if (!hasFilters()) {
            <button class="btn btn-primary" (click)="openCreateModal()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              {{ 'salesReps.addFirstRep' | translate }}
            </button>
          }
        </app-empty-state>
      }

      <!-- Table -->
      @if (!loading() && salesReps().length > 0) {
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th (click)="sortBy('employeeCode')" class="sortable">
                  {{ 'salesReps.employeeCode' | translate }}
                  @if (currentSort === 'employeeCode') {
                    <i class="material-icons sort-icon">{{ sortDescending ? 'arrow_downward' : 'arrow_upward' }}</i>
                  }
                </th>
                <th (click)="sortBy('name')" class="sortable">
                  {{ 'salesReps.name' | translate }}
                  @if (currentSort === 'name') {
                    <i class="material-icons sort-icon">{{ sortDescending ? 'arrow_downward' : 'arrow_upward' }}</i>
                  }
                </th>
                <th>{{ 'salesReps.email' | translate }}</th>
                <th (click)="sortBy('repType')" class="sortable">
                  {{ 'salesReps.type' | translate }}
                  @if (currentSort === 'repType') {
                    <i class="material-icons sort-icon">{{ sortDescending ? 'arrow_downward' : 'arrow_upward' }}</i>
                  }
                </th>
                <th>{{ 'salesReps.manager' | translate }}</th>
                <th>{{ 'salesReps.territory' | translate }}</th>
                <th>{{ 'salesReps.customers' | translate }}</th>
                <th (click)="sortBy('status')" class="sortable">
                  {{ 'salesReps.status' | translate }}
                  @if (currentSort === 'status') {
                    <i class="material-icons sort-icon">{{ sortDescending ? 'arrow_downward' : 'arrow_upward' }}</i>
                  }
                </th>
                <th>{{ 'common.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (rep of salesReps(); track rep.id) {
                <tr>
                  <td class="code-cell">{{ rep.employeeCode }}</td>
                  <td class="name-cell">
                    <div class="user-info">
                      <div class="avatar" [class.commercial]="rep.repType === RepresentativeType.Commercial" [class.medical]="rep.repType === RepresentativeType.Medical">
                        {{ getInitials(rep.fullName) }}
                      </div>
                      <span>{{ rep.fullName }}</span>
                    </div>
                  </td>
                  <td>{{ rep.email }}</td>
                  <td>
                    <span class="type-badge" [class.commercial]="rep.repType === RepresentativeType.Commercial" [class.medical]="rep.repType === RepresentativeType.Medical">
                      {{ rep.repTypeName }}
                    </span>
                  </td>
                  <td>{{ rep.primaryManagerName || '-' }}</td>
                  <td class="territory-cell">{{ rep.territoryDescription || '-' }}</td>
                  <td class="centered">{{ rep.assignedCustomersCount }}</td>
                  <td>
                    <app-status-badge
                      [label]="rep.statusName"
                      [variant]="getStatusVariant(rep.status)"
                    ></app-status-badge>
                  </td>
                  <td class="actions-cell">
                    <button class="btn btn-icon" (click)="viewRep(rep)" [title]="'common.view' | translate">
                      <i class="material-icons">visibility</i>
                    </button>
                    <button class="btn btn-icon" (click)="editRep(rep)" [title]="'common.edit' | translate">
                      <i class="material-icons">edit</i>
                    </button>
                    <button class="btn btn-icon danger" (click)="deleteRep(rep)" [title]="'common.delete' | translate">
                      <i class="material-icons">delete</i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <app-pagination
          [page]="currentPage()"
          [size]="pageSize()"
          [totalItems]="totalItems()"
          (pageChange)="onPageChange($event)"
        ></app-pagination>
      }

      <!-- Create/Edit Modal -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-content large" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editingRep() ? ('salesReps.editRep' | translate) : ('salesReps.createRep' | translate) }}</h2>
              <button class="btn btn-icon" (click)="closeModal()">
                <i class="icon-x"></i>
              </button>
            </div>
            <div class="modal-body">
              <form (ngSubmit)="saveRep()">
                <div class="form-row">
                  <div class="form-group">
                    <label>{{ 'salesReps.userId' | translate }} *</label>
                    <select [(ngModel)]="formData.userId" name="userId" required [disabled]="!!editingRep()">
                      <option value="">{{ 'salesReps.selectUser' | translate }}</option>
                      @for (user of availableUsers(); track user.id) {
                        <option [value]="user.id">{{ user.firstName }} {{ user.lastName }} ({{ user.email }})</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label>{{ 'salesReps.employeeCode' | translate }} *</label>
                    <input type="text" [(ngModel)]="formData.employeeCode" name="employeeCode" required [disabled]="!!editingRep()" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>{{ 'salesReps.type' | translate }} *</label>
                    <select [(ngModel)]="formData.repType" name="repType" required>
                      <option [value]="RepresentativeType.Commercial">{{ 'salesReps.typeCommercial' | translate }}</option>
                      <option [value]="RepresentativeType.Medical">{{ 'salesReps.typeMedical' | translate }}</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>{{ 'salesReps.status' | translate }}</label>
                    <select [(ngModel)]="formData.status" name="status" [disabled]="!editingRep()">
                      <option [value]="RepresentativeStatus.Active">{{ 'salesReps.statusActive' | translate }}</option>
                      <option [value]="RepresentativeStatus.Inactive">{{ 'salesReps.statusInactive' | translate }}</option>
                      <option [value]="RepresentativeStatus.OnLeave">{{ 'salesReps.statusOnLeave' | translate }}</option>
                      <option [value]="RepresentativeStatus.Terminated">{{ 'salesReps.statusTerminated' | translate }}</option>
                    </select>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>{{ 'salesReps.mobile' | translate }}</label>
                    <input type="tel" [(ngModel)]="formData.mobile" name="mobile" />
                  </div>
                  <div class="form-group">
                    <label>{{ 'salesReps.hireDate' | translate }} *</label>
                    <div class="date-input-wrapper">
                      <input
                        type="text"
                        [(ngModel)]="formData.hireDateDisplay"
                        name="hireDateDisplay"
                        placeholder="dd.MM.yyyy"
                        class="form-control date-input"
                        readonly
                        required
                      />
                      <input
                        type="date"
                        class="hidden-date-picker"
                        [ngModel]="formData.hireDate"
                        (ngModelChange)="onHireDateChange($event)"
                        name="hireDate"
                        #hireDatePicker
                      />
                      <button type="button" class="calendar-icon" (click)="hireDatePicker.showPicker()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div class="form-group full-width">
                  <label>{{ 'salesReps.territory' | translate }}</label>
                  <textarea [(ngModel)]="formData.territoryDescription" name="territoryDescription" rows="2"
                    [placeholder]="'salesReps.territoryPlaceholder' | translate"></textarea>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" (click)="closeModal()">{{ 'common.cancel' | translate }}</button>
              <button class="btn btn-primary" (click)="saveRep()" [disabled]="saving()">
                @if (saving()) {
                  <span class="spinner-sm"></span>
                }
                {{ editingRep() ? ('common.save' | translate) : ('common.create' | translate) }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- View Details Modal -->
      @if (showDetailsModal()) {
        <div class="modal-overlay" (click)="closeDetailsModal()">
          <div class="modal-content large" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ 'salesReps.repDetails' | translate }}</h2>
              <button class="btn btn-icon" (click)="closeDetailsModal()">
                <i class="icon-x"></i>
              </button>
            </div>
            <div class="modal-body">
              @if (selectedRep()) {
                <div class="details-grid">
                  <div class="detail-section">
                    <h3>{{ 'salesReps.basicInfo' | translate }}</h3>
                    <div class="detail-row">
                      <span class="label">{{ 'salesReps.name' | translate }}:</span>
                      <span class="value">{{ selectedRep()!.fullName }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">{{ 'salesReps.employeeCode' | translate }}:</span>
                      <span class="value">{{ selectedRep()!.employeeCode }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">{{ 'salesReps.email' | translate }}:</span>
                      <span class="value">{{ selectedRep()!.email }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">{{ 'salesReps.type' | translate }}:</span>
                      <span class="value">{{ selectedRep()!.repTypeName }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">{{ 'salesReps.status' | translate }}:</span>
                      <app-status-badge [label]="selectedRep()!.statusName" [variant]="getStatusVariant(selectedRep()!.status)"></app-status-badge>
                    </div>
                  </div>
                  <div class="detail-section">
                    <h3>{{ 'salesReps.assignments' | translate }}</h3>
                    <div class="detail-row">
                      <span class="label">{{ 'salesReps.manager' | translate }}:</span>
                      <span class="value">{{ selectedRep()!.primaryManagerName || '-' }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">{{ 'salesReps.territory' | translate }}:</span>
                      <span class="value">{{ selectedRep()!.territoryDescription || '-' }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">{{ 'salesReps.customers' | translate }}:</span>
                      <span class="value">{{ selectedRep()!.assignedCustomersCount }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" (click)="closeDetailsModal()">{{ 'common.close' | translate }}</button>
              <button class="btn btn-primary" (click)="editFromDetails()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                {{ 'common.edit' | translate }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sales-reps-container {
      padding: 24px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .header-content {
      flex: 1;
      min-width: 0;
    }

    .page-title {
      font-size: var(--font-size-2xl, 1.5rem);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.25rem 0;
    }

    .page-subtitle {
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--text-secondary);
      margin: 0;
    }

    .filters-section {
      background: var(--surface);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .filters-row {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;

      app-search-input {
        flex: 1;
        min-width: 250px;
      }

      .form-select {
        min-width: 150px;
      }
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: var(--surface);
      border-radius: 8px;
      padding: 16px;
      text-align: center;
      border-left: 4px solid var(--border);

      &.commercial {
        border-left-color: #3b82f6;
      }

      &.medical {
        border-left-color: #8b5cf6;
      }

      &.active {
        border-left-color: #10b981;
      }

      .stat-value {
        display: block;
        font-size: 24px;
        font-weight: 700;
        color: var(--text-primary);
      }

      .stat-label {
        display: block;
        font-size: 12px;
        color: var(--text-secondary);
        margin-top: 4px;
      }
    }

    .table-container {
      background: var(--surface);
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 16px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;

      th, td {
        padding: 12px 16px;
        text-align: left;
        border-bottom: 1px solid var(--border);
      }

      th {
        background: var(--surface-secondary);
        font-weight: 600;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-secondary);

        &.sortable {
          cursor: pointer;
          user-select: none;

          &:hover {
            background: var(--surface-hover);
          }
        }

        .sort-icon {
          font-size: 16px;
          vertical-align: middle;
          margin-left: 4px;
        }
      }

      td {
        font-size: 14px;
      }

      tbody tr:hover {
        background: var(--surface-hover);
      }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;

      .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--primary-light);
        color: var(--primary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;

        &.commercial {
          background: #dbeafe;
          color: #3b82f6;
        }

        &.medical {
          background: #ede9fe;
          color: #8b5cf6;
        }
      }
    }

    .type-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;

      &.commercial {
        background: #dbeafe;
        color: #1d4ed8;
      }

      &.medical {
        background: #ede9fe;
        color: #7c3aed;
      }
    }

    .territory-cell {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .centered {
      text-align: center;
    }

    .actions-cell {
      display: flex;
      gap: 4px;
    }

    .btn-icon {
      padding: 6px;
      border-radius: 4px;

      &.danger:hover {
        background: var(--error-light);
        color: var(--error);
      }

      .material-icons {
        font-size: 18px;
      }
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px;
      color: var(--text-secondary);
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: var(--surface);
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;

      &.large {
        max-width: 700px;
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border);

      h2 {
        margin: 0;
        font-size: 20px;
      }
    }

    .modal-body {
      padding: 24px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid var(--border);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-group {
      &.full-width {
        grid-column: 1 / -1;
      }

      label {
        display: block;
        margin-bottom: 6px;
        font-weight: 500;
        font-size: 14px;
      }

      input, select, textarea {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--border);
        border-radius: 6px;
        font-size: 14px;
        background: var(--background);

        &:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 2px var(--primary-light);
        }

        &:disabled {
          background: var(--surface-secondary);
          cursor: not-allowed;
        }
      }
    }

    .date-input-wrapper {
      position: relative;

      .hidden-date-picker {
        position: absolute;
        opacity: 0;
        pointer-events: none;
        width: 0;
        height: 0;
      }

      .date-input {
        padding-right: 2.5rem;
        cursor: pointer;
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
        color: var(--neutral-500, #6b7280);
        transition: color 0.2s;

        &:hover {
          color: var(--primary);
        }

        svg {
          width: 16px;
          height: 16px;
        }
      }
    }

    .filter-select {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border-color, var(--border));
      border-radius: 8px;
      background: white;
      font-size: 14px;
      color: var(--text-primary);
      cursor: pointer;
      transition: border-color 0.2s;
      min-width: 160px;

      &:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
      }

      &:hover {
        border-color: var(--primary);
      }
    }

    .btn-ghost {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      font-size: 14px;
      transition: all 0.2s;

      &:hover {
        background: var(--surface-hover, rgba(0,0,0,0.05));
        color: var(--text-primary);
      }

      svg {
        flex-shrink: 0;
      }
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }

    .detail-section {
      h3 {
        margin: 0 0 16px;
        font-size: 16px;
        color: var(--text-secondary);
        border-bottom: 1px solid var(--border);
        padding-bottom: 8px;
      }
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--border-light);

      .label {
        color: var(--text-secondary);
      }

      .value {
        font-weight: 500;
      }
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner-sm {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      display: inline-block;
      margin-right: 8px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class SalesRepsListComponent implements OnInit {
  private readonly salesRepService = inject(SalesRepService);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translateService = inject(TranslateService);

  // Expose enums to template
  RepresentativeType = RepresentativeType;
  RepresentativeStatus = RepresentativeStatus;

  // State
  salesReps = signal<SalesRepresentativeSummary[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  pageSize = signal(20);
  totalItems = signal(0);
  saving = signal(false);

  // Stats
  stats = signal({ total: 0, commercial: 0, medical: 0, active: 0 });

  // Filters
  searchTerm = '';
  selectedRepType: RepresentativeType | '' = '';
  selectedStatus: RepresentativeStatus | '' = '';
  currentSort = 'name';
  sortDescending = false;
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  // Modal state
  showModal = signal(false);
  editingRep = signal<SalesRepresentativeSummary | null>(null);
  formData = {
    userId: '',
    employeeCode: '',
    repType: RepresentativeType.Commercial,
    status: RepresentativeStatus.Active,
    mobile: '',
    hireDate: '',
    hireDateDisplay: '',
    territoryDescription: ''
  };

  // Details modal
  showDetailsModal = signal(false);
  selectedRep = signal<SalesRepresentativeSummary | null>(null);

  // Available users for assignment
  availableUsers = signal<any[]>([]);

  ngOnInit(): void {
    this.loadSalesReps();
    this.loadAvailableUsers();
  }

  loadSalesReps(): void {
    this.loading.set(true);

    const query: SalesRepQuery = {
      search: this.searchTerm || undefined,
      repType: this.selectedRepType || undefined,
      status: this.selectedStatus || undefined,
      pageNumber: this.currentPage(),
      pageSize: this.pageSize(),
      sortBy: this.currentSort,
      sortDescending: this.sortDescending
    };

    this.salesRepService.getAll(query).subscribe({
      next: (response: PagedSalesReps) => {
        this.salesReps.set(response.items || []);
        this.totalItems.set(response.totalCount);
        this.loading.set(false);
        this.updateStats(response.items || []);
      },
      error: () => {
        this.notificationService.error(
          this.translateService.instant('salesReps.loadError')
        );
        this.loading.set(false);
      }
    });
  }

  loadAvailableUsers(): void {
    // TODO: Load users without sales rep assignment
    // For now, this would need a user service call
  }

  updateStats(reps: SalesRepresentativeSummary[]): void {
    this.stats.set({
      total: this.totalItems(),
      commercial: reps.filter(r => r.repType === RepresentativeType.Commercial).length,
      medical: reps.filter(r => r.repType === RepresentativeType.Medical).length,
      active: reps.filter(r => r.status === RepresentativeStatus.Active).length
    });
  }

  onSearchTermChange(term: string): void {
    this.searchTerm = term;
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      this.loadSalesReps();
    }, 300);
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadSalesReps();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedRepType = '';
    this.selectedStatus = '';
    this.applyFilters();
  }

  hasFilters(): boolean {
    return !!(this.searchTerm || this.selectedRepType || this.selectedStatus);
  }

  sortBy(column: string): void {
    if (this.currentSort === column) {
      this.sortDescending = !this.sortDescending;
    } else {
      this.currentSort = column;
      this.sortDescending = false;
    }
    this.loadSalesReps();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.page);
    this.loadSalesReps();
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getStatusVariant(status: RepresentativeStatus): BadgeVariant {
    switch (status) {
      case RepresentativeStatus.Active:
        return 'success';
      case RepresentativeStatus.Inactive:
        return 'neutral';
      case RepresentativeStatus.OnLeave:
        return 'warning';
      case RepresentativeStatus.Terminated:
        return 'danger';
      default:
        return 'neutral';
    }
  }

  openCreateModal(): void {
    this.editingRep.set(null);
    const today = new Date();
    const isoDate = today.toISOString().split('T')[0];
    this.formData = {
      userId: '',
      employeeCode: '',
      repType: RepresentativeType.Commercial,
      status: RepresentativeStatus.Active,
      mobile: '',
      hireDate: isoDate,
      hireDateDisplay: this.formatDateForDisplay(isoDate),
      territoryDescription: ''
    };
    this.showModal.set(true);
  }

  editRep(rep: SalesRepresentativeSummary): void {
    this.editingRep.set(rep);
    // Load full details for editing
    this.salesRepService.getById(rep.id).subscribe({
      next: (fullRep) => {
        const isoDate = fullRep.hireDate.split('T')[0];
        this.formData = {
          userId: fullRep.userId,
          employeeCode: fullRep.employeeCode,
          repType: fullRep.repType,
          status: fullRep.status,
          mobile: fullRep.mobile || '',
          hireDate: isoDate,
          hireDateDisplay: this.formatDateForDisplay(isoDate),
          territoryDescription: fullRep.territoryDescription || ''
        };
        this.showModal.set(true);
      },
      error: () => {
        this.notificationService.error(this.translateService.instant('salesReps.loadError'));
      }
    });
  }

  viewRep(rep: SalesRepresentativeSummary): void {
    this.selectedRep.set(rep);
    this.showDetailsModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingRep.set(null);
  }

  closeDetailsModal(): void {
    this.showDetailsModal.set(false);
    this.selectedRep.set(null);
  }

  editFromDetails(): void {
    if (this.selectedRep()) {
      this.closeDetailsModal();
      this.editRep(this.selectedRep()!);
    }
  }

  saveRep(): void {
    this.saving.set(true);

    if (this.editingRep()) {
      // Update
      const updateData = {
        repType: Number(this.formData.repType),
        status: Number(this.formData.status),
        mobile: this.formData.mobile || undefined,
        hireDate: this.formData.hireDate,
        territoryDescription: this.formData.territoryDescription || undefined
      };

      this.salesRepService.update(this.editingRep()!.id, updateData).subscribe({
        next: () => {
          this.notificationService.success(this.translateService.instant('salesReps.updateSuccess'));
          this.closeModal();
          this.loadSalesReps();
          this.saving.set(false);
        },
        error: () => {
          this.notificationService.error(this.translateService.instant('salesReps.updateError'));
          this.saving.set(false);
        }
      });
    } else {
      // Create
      const createData = {
        userId: this.formData.userId,
        employeeCode: this.formData.employeeCode,
        repType: Number(this.formData.repType),
        mobile: this.formData.mobile || undefined,
        hireDate: this.formData.hireDate,
        territoryDescription: this.formData.territoryDescription || undefined,
        managerIds: [],
        primaryManagerId: undefined
      };

      this.salesRepService.create(createData).subscribe({
        next: () => {
          this.notificationService.success(this.translateService.instant('salesReps.createSuccess'));
          this.closeModal();
          this.loadSalesReps();
          this.saving.set(false);
        },
        error: (err) => {
          this.notificationService.error(err.error?.message || this.translateService.instant('salesReps.createError'));
          this.saving.set(false);
        }
      });
    }
  }

  async deleteRep(rep: SalesRepresentativeSummary): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: this.translateService.instant('salesReps.deleteTitle'),
      message: this.translateService.instant('salesReps.deleteMessage', { name: rep.fullName }),
      confirmText: this.translateService.instant('common.delete'),
      cancelText: this.translateService.instant('common.cancel'),
      variant: 'danger'
    });

    if (confirmed) {
      this.salesRepService.delete(rep.id).subscribe({
        next: () => {
          this.notificationService.success(this.translateService.instant('salesReps.deleteSuccess'));
          this.loadSalesReps();
        },
        error: () => {
          this.notificationService.error(this.translateService.instant('salesReps.deleteError'));
        }
      });
    }
  }

  /**
   * Format ISO date string (yyyy-MM-dd) to European format (dd.MM.yyyy)
   */
  formatDateForDisplay(isoDate: string): string {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}.${month}.${year}`;
  }

  /**
   * Handle date picker change and update both hireDate and hireDateDisplay
   */
  onHireDateChange(isoDate: string): void {
    this.formData.hireDate = isoDate;
    this.formData.hireDateDisplay = this.formatDateForDisplay(isoDate);
  }
}
