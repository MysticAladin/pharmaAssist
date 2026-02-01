import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { SalesRepService } from '../../../core/services/sales-rep.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { UserService, UserSummary } from '../../../core/services/user.service';
import { CustomerService, CustomerSummary } from '../../../core/services/customer.service';
import { UserRole } from '../../../core/models/user.model';
import {
  SalesRepresentativeSummary,
  SalesRepQuery,
  RepresentativeType,
  RepresentativeStatus,
  PagedSalesReps,
  CustomerAssignment,
  RepHierarchy
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

      <!-- View Toggle -->
      <div class="view-toggle">
        <button
          class="toggle-btn"
          [class.active]="viewMode() === 'table'"
          (click)="setViewMode('table')"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="3" y1="15" x2="21" y2="15"/>
            <line x1="9" y1="3" x2="9" y2="21"/>
          </svg>
          {{ 'salesReps.tableView' | translate }}
        </button>
        <button
          class="toggle-btn"
          [class.active]="viewMode() === 'hierarchy'"
          (click)="setViewMode('hierarchy')"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="5" r="3"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="6" y1="12" x2="18" y2="12"/>
            <line x1="6" y1="12" x2="6" y2="16"/>
            <line x1="18" y1="12" x2="18" y2="16"/>
            <circle cx="6" cy="19" r="3"/>
            <circle cx="18" cy="19" r="3"/>
          </svg>
          {{ 'salesReps.hierarchyView' | translate }}
        </button>
      </div>

      <!-- Loading State -->
      @if (loading() || loadingHierarchy()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>{{ 'common.loading' | translate }}</p>
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && !loadingHierarchy() && salesReps().length === 0 && viewMode() === 'table') {
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

      <!-- Table View -->
      @if (!loading() && salesReps().length > 0 && viewMode() === 'table') {
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th (click)="sortBy('employeeCode')" class="sortable">
                  {{ 'salesReps.employeeCode' | translate }}
                  @if (currentSort === 'employeeCode') {
                    <svg class="sort-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      @if (sortDescending) {
                        <path d="M12 5v14M5 12l7 7 7-7"/>
                      } @else {
                        <path d="M12 19V5M5 12l7-7 7 7"/>
                      }
                    </svg>
                  }
                </th>
                <th (click)="sortBy('name')" class="sortable">
                  {{ 'salesReps.name' | translate }}
                  @if (currentSort === 'name') {
                    <svg class="sort-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      @if (sortDescending) {
                        <path d="M12 5v14M5 12l7 7 7-7"/>
                      } @else {
                        <path d="M12 19V5M5 12l7-7 7 7"/>
                      }
                    </svg>
                  }
                </th>
                <th>{{ 'salesReps.email' | translate }}</th>
                <th (click)="sortBy('repType')" class="sortable">
                  {{ 'salesReps.type' | translate }}
                  @if (currentSort === 'repType') {
                    <svg class="sort-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      @if (sortDescending) {
                        <path d="M12 5v14M5 12l7 7 7-7"/>
                      } @else {
                        <path d="M12 19V5M5 12l7-7 7 7"/>
                      }
                    </svg>
                  }
                </th>
                <th>{{ 'salesReps.manager' | translate }}</th>
                <th>{{ 'salesReps.territory' | translate }}</th>
                <th>{{ 'salesReps.customers' | translate }}</th>
                <th (click)="sortBy('status')" class="sortable">
                  {{ 'salesReps.status' | translate }}
                  @if (currentSort === 'status') {
                    <svg class="sort-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      @if (sortDescending) {
                        <path d="M12 5v14M5 12l7 7 7-7"/>
                      } @else {
                        <path d="M12 19V5M5 12l7-7 7 7"/>
                      }
                    </svg>
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
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>
                    <button class="btn btn-icon" (click)="openCustomerAssignmentModal(rep)" [title]="'salesReps.manageCustomers' | translate">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    </button>
                    <button class="btn btn-icon" (click)="editRep(rep)" [title]="'common.edit' | translate">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button class="btn btn-icon danger" (click)="deleteRep(rep)" [title]="'common.delete' | translate">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
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

      <!-- Hierarchy View -->
      @if (!loading() && !loadingHierarchy() && viewMode() === 'hierarchy') {
        <div class="hierarchy-container">
          @if (hierarchyData().length === 0) {
            <app-empty-state
              icon="account_tree"
              [title]="'salesReps.noHierarchyData'"
              [description]="'salesReps.noManagersAssigned'"
            ></app-empty-state>
          } @else {
            <div class="hierarchy-grid">
              @for (manager of hierarchyData(); track manager.managerUserId) {
                <div class="manager-card">
                  <div class="manager-header">
                    <div class="manager-avatar">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    </div>
                    <div class="manager-info">
                      <h3 class="manager-name">{{ manager.managerName }}</h3>
                      <span class="manager-email">{{ manager.managerEmail }}</span>
                      <span class="team-count">{{ manager.teamMembers.length }} {{ 'salesReps.teamMembers' | translate }}</span>
                    </div>
                  </div>
                  <div class="team-members">
                    @if (manager.teamMembers.length === 0) {
                      <p class="no-members">{{ 'salesReps.noTeamMembers' | translate }}</p>
                    } @else {
                      @for (member of manager.teamMembers; track member.id) {
                        <div class="team-member" (click)="viewRep(member)">
                          <div class="member-avatar" [class.commercial]="member.repType === RepresentativeType.Commercial" [class.medical]="member.repType === RepresentativeType.Medical">
                            {{ getInitials(member.fullName) }}
                          </div>
                          <div class="member-info">
                            <span class="member-name">{{ member.fullName }}</span>
                            <span class="member-code">{{ member.employeeCode }}</span>
                          </div>
                          <span class="member-type" [class.commercial]="member.repType === RepresentativeType.Commercial" [class.medical]="member.repType === RepresentativeType.Medical">
                            {{ member.repTypeName }}
                          </span>
                          <app-status-badge
                            [label]="member.statusName"
                            [variant]="getStatusVariant(member.status)"
                          ></app-status-badge>
                        </div>
                      }
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Unassigned Reps Section -->
            @if (unassignedReps().length > 0) {
              <div class="unassigned-section">
                <h3 class="section-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <line x1="17" y1="8" x2="23" y2="14"/>
                    <line x1="23" y1="8" x2="17" y2="14"/>
                  </svg>
                  {{ 'salesReps.unassignedReps' | translate }}
                  <span class="count-badge">{{ unassignedReps().length }}</span>
                </h3>
                <div class="unassigned-grid">
                  @for (rep of unassignedReps(); track rep.id) {
                    <div class="unassigned-card" (click)="editRep(rep)">
                      <div class="member-avatar" [class.commercial]="rep.repType === RepresentativeType.Commercial" [class.medical]="rep.repType === RepresentativeType.Medical">
                        {{ getInitials(rep.fullName) }}
                      </div>
                      <div class="member-info">
                        <span class="member-name">{{ rep.fullName }}</span>
                        <span class="member-code">{{ rep.employeeCode }}</span>
                      </div>
                      <span class="member-type" [class.commercial]="rep.repType === RepresentativeType.Commercial" [class.medical]="rep.repType === RepresentativeType.Medical">
                        {{ rep.repTypeName }}
                      </span>
                      <button class="btn btn-sm btn-outline" (click)="$event.stopPropagation(); editRep(rep)">
                        {{ 'salesReps.assignManager' | translate }}
                      </button>
                    </div>
                  }
                </div>
              </div>
            }
          }
        </div>
      }

      <!-- Create/Edit Modal -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-content large" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editingRep() ? ('salesReps.editRep' | translate) : ('salesReps.createRep' | translate) }}</h2>
              <button class="btn btn-icon" (click)="closeModal()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <form (ngSubmit)="saveRep()">
                <div class="form-group full-width">
                  <label>{{ 'salesReps.userId' | translate }} *</label>
                  <select [(ngModel)]="formData.userId" name="userId" required [disabled]="!!editingRep()">
                    <option value="">{{ 'salesReps.selectUser' | translate }}</option>
                    @for (user of availableUsers(); track user.id) {
                      <option [value]="user.id">{{ user.firstName }} {{ user.lastName }} ({{ user.email }})</option>
                    }
                  </select>
                </div>
                <div class="form-group full-width">
                  <label>{{ 'salesReps.supervisors' | translate }}</label>
                  <div class="checkbox-list">
                    @for (supervisor of availableSupervisors(); track supervisor.id) {
                      <label class="checkbox-label">
                        <input
                          type="checkbox"
                          [checked]="formData.selectedManagerUserIds.includes(supervisor.id)"
                          (change)="toggleSupervisor(supervisor.id, $event)"
                        />
                        <span>{{ supervisor.fullName }} ({{ supervisor.roles.join(', ') }})</span>
                      </label>
                    }
                    @if (availableSupervisors().length === 0) {
                      <p class="no-supervisors-hint">{{ 'salesReps.noSupervisorsAvailable' | translate }}</p>
                    }
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>{{ 'salesReps.primaryManager' | translate }}</label>
                    <select [(ngModel)]="formData.primaryManagerUserId" name="primaryManagerUserId" [disabled]="formData.selectedManagerUserIds.length === 0">
                      <option [ngValue]="null">{{ 'salesReps.selectPrimaryManager' | translate }}</option>
                      @for (managerUserId of formData.selectedManagerUserIds; track managerUserId) {
                        <option [ngValue]="managerUserId">{{ getSupervisorName(managerUserId) }}</option>
                      }
                    </select>
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
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

      <!-- Customer Assignment Modal -->
      @if (showCustomerAssignmentModal()) {
        <div class="modal-overlay" (click)="closeCustomerAssignmentModal()">
          <div class="modal-content xlarge" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ 'salesReps.manageCustomers' | translate }} - {{ customerAssignmentRep()?.fullName }}</h2>
              <button class="btn btn-icon" (click)="closeCustomerAssignmentModal()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              @if (loadingCustomers()) {
                <div class="loading-state">
                  <span class="spinner"></span>
                  <p>{{ 'common.loading' | translate }}</p>
                </div>
              } @else {
                <div class="customer-assignment-container">
                  <!-- Search -->
                  <div class="customer-search">
                    <input
                      type="text"
                      [placeholder]="'salesReps.searchCustomers' | translate"
                      [ngModel]="customerSearchTerm()"
                      (ngModelChange)="customerSearchTerm.set($event)"
                      class="form-control"
                    />
                    <span class="selected-count">
                      {{ 'salesReps.selectedCustomers' | translate }}: {{ selectedCustomerIds().size }}
                    </span>
                  </div>

                  <!-- Customer List -->
                  <div class="customer-list">
                    @for (customer of filteredCustomers(); track customer.id) {
                      <label class="customer-item" [class.selected]="selectedCustomerIds().has(customer.id)">
                        <input
                          type="checkbox"
                          [checked]="selectedCustomerIds().has(customer.id)"
                          (change)="toggleCustomerSelection(customer.id)"
                        />
                        <div class="customer-info">
                          <span class="customer-name">{{ customer.name }}</span>
                          <span class="customer-code">{{ customer.customerCode }}</span>
                          @if (customer.city) {
                            <span class="customer-city">{{ customer.city }}</span>
                          }
                        </div>
                      </label>
                    }
                    @if (filteredCustomers().length === 0) {
                      <div class="no-customers">
                        {{ 'salesReps.noCustomersFound' | translate }}
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" (click)="closeCustomerAssignmentModal()">{{ 'common.cancel' | translate }}</button>
              <button class="btn btn-primary" (click)="saveCustomerAssignments()" [disabled]="savingCustomers()">
                @if (savingCustomers()) {
                  <span class="spinner-sm"></span>
                }
                {{ 'common.save' | translate }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sales-reps-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
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
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      margin-bottom: 1.5rem;
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

    .checkbox-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 180px;
      overflow-y: auto;
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--background);
    }

    .checkbox-label {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      padding: 4px 0;
      font-size: 14px;

      input[type="checkbox"] {
        width: 16px;
        height: 16px;
        cursor: pointer;
        accent-color: var(--primary);
        flex-shrink: 0;
      }

      span {
        font-weight: 400;
        color: var(--text-primary);
      }
    }

    .no-supervisors-hint {
      color: var(--text-secondary);
      font-size: 14px;
      font-style: italic;
      margin: 0;
      text-align: center;
      padding: 8px;
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

    /* Customer Assignment Modal */
    .modal-content.xlarge {
      max-width: 800px;
      max-height: 90vh;
    }

    .customer-assignment-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .customer-search {
      display: flex;
      gap: 16px;
      align-items: center;

      input {
        flex: 1;
      }

      .selected-count {
        white-space: nowrap;
        color: var(--text-secondary);
        font-size: 14px;
      }
    }

    .customer-list {
      max-height: 400px;
      overflow-y: auto;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px;
    }

    .customer-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: var(--bg-hover);
      }

      &.selected {
        background: var(--primary-light, rgba(59, 130, 246, 0.1));
      }

      input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }
    }

    .customer-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .customer-name {
      font-weight: 500;
      color: var(--text-primary);
    }

    .customer-code {
      font-size: 12px;
      color: var(--text-secondary);
    }

    .customer-city {
      font-size: 12px;
      color: var(--text-tertiary);
    }

    .no-customers {
      text-align: center;
      padding: 32px;
      color: var(--text-secondary);
    }

    /* View Toggle */
    .view-toggle {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
      padding: 4px;
      background: var(--surface);
      border-radius: 8px;
      width: fit-content;
    }

    .toggle-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;

      svg {
        flex-shrink: 0;
      }

      &:hover:not(.active) {
        background: var(--surface-hover);
        color: var(--text-primary);
      }

      &.active {
        background: var(--primary);
        color: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
    }

    /* Hierarchy View */
    .hierarchy-container {
      margin-top: 16px;
    }

    .hierarchy-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 24px;
    }

    .manager-card {
      background: var(--surface);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border: 1px solid var(--border);
    }

    .manager-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark, #2563eb) 100%);
      color: white;
    }

    .manager-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 28px;
      }
    }

    .manager-info {
      flex: 1;
      min-width: 0;
    }

    .manager-name {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 4px;
    }

    .manager-email {
      font-size: 13px;
      opacity: 0.9;
      display: block;
    }

    .team-count {
      font-size: 12px;
      opacity: 0.8;
      display: block;
      margin-top: 4px;
    }

    .team-members {
      padding: 12px;
    }

    .team-member {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: var(--surface-hover);
      }
    }

    .member-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
      color: white;
      background: #6b7280;

      &.commercial {
        background: #3b82f6;
      }

      &.medical {
        background: #8b5cf6;
      }
    }

    .member-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .member-name {
      font-weight: 500;
      color: var(--text-primary);
    }

    .member-code {
      font-size: 12px;
      color: var(--text-secondary);
    }

    .member-type {
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 12px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;

      &.commercial {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
      }

      &.medical {
        background: rgba(139, 92, 246, 0.1);
        color: #8b5cf6;
      }
    }

    .no-members {
      text-align: center;
      padding: 24px;
      color: var(--text-tertiary);
      font-style: italic;
    }

    /* Unassigned Section */
    .unassigned-section {
      margin-top: 32px;
      padding: 20px;
      background: var(--surface);
      border-radius: 12px;
      border: 2px dashed var(--border);
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px;
      font-size: 16px;
      color: var(--text-secondary);

      i {
        font-size: 20px;
        color: var(--warning, #f59e0b);
      }

      .count-badge {
        background: var(--warning, #f59e0b);
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }
    }

    .unassigned-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 12px;
    }

    .unassigned-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--background);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid var(--border);

      &:hover {
        background: var(--surface-hover);
        border-color: var(--primary);
      }

      .btn {
        margin-left: auto;
        white-space: nowrap;
      }
    }
  `]
})
export class SalesRepsListComponent implements OnInit {
  private readonly salesRepService = inject(SalesRepService);
  private readonly userService = inject(UserService);
  private readonly customerService = inject(CustomerService);
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
  formData: {
    userId: string;
    employeeCode: string;
    repType: RepresentativeType;
    status: RepresentativeStatus;
    mobile: string;
    hireDate: string;
    hireDateDisplay: string;
    territoryDescription: string;
    selectedManagerUserIds: string[];
    primaryManagerUserId: string | null;
  } = {
    userId: '',
    employeeCode: '',
    repType: RepresentativeType.Commercial,
    status: RepresentativeStatus.Active,
    mobile: '',
    hireDate: '',
    hireDateDisplay: '',
    territoryDescription: '',
    selectedManagerUserIds: [],
    primaryManagerUserId: null
  };

  // Details modal
  showDetailsModal = signal(false);
  selectedRep = signal<SalesRepresentativeSummary | null>(null);

  // Customer Assignment modal
  showCustomerAssignmentModal = signal(false);
  customerAssignmentRep = signal<SalesRepresentativeSummary | null>(null);
  allCustomers = signal<CustomerSummary[]>([]);
  currentAssignments = signal<CustomerAssignment[]>([]);
  selectedCustomerIds = signal<Set<number>>(new Set());
  customerSearchTerm = signal('');
  loadingCustomers = signal(false);
  savingCustomers = signal(false);

  // Hierarchy view state
  viewMode = signal<'table' | 'hierarchy'>('table');
  hierarchyData = signal<RepHierarchy[]>([]);
  unassignedReps = signal<SalesRepresentativeSummary[]>([]);
  loadingHierarchy = signal(false);

  // Available users for assignment - users with SalesRep role
  availableUsers = signal<UserSummary[]>([]);
  // Available supervisors - users with Manager/Admin roles
  availableSupervisors = signal<UserSummary[]>([]);

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
    // Load users with SalesRep role for the main dropdown (for creating new reps)
    // Load users with Manager/Admin roles as potential supervisors
    forkJoin({
      salesRepUsers: this.userService.getUsers({ role: UserRole.SalesRep, isActive: true, pageSize: 500 }),
      managers: this.userService.getUsers({ role: UserRole.Manager, isActive: true, pageSize: 500 }),
      admins: this.userService.getUsers({ role: UserRole.Admin, isActive: true, pageSize: 500 })
    }).subscribe({
      next: (results) => {
        // Users who have SalesRep role for the "user account" dropdown
        this.availableUsers.set(results.salesRepUsers.data || []);
        // Combine managers and admins as potential supervisors, dedupe by ID
        const supervisorMap = new Map<string, UserSummary>();
        [...(results.managers.data || []), ...(results.admins.data || [])]
          .forEach(user => supervisorMap.set(user.id, user));
        this.availableSupervisors.set(Array.from(supervisorMap.values()));
      },
      error: () => {
        this.notificationService.error(
          this.translateService.instant('salesReps.loadUsersError')
        );
      }
    });
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
      territoryDescription: '',
      selectedManagerUserIds: [],
      primaryManagerUserId: null
    };
    this.showModal.set(true);
  }

  editRep(rep: SalesRepresentativeSummary): void {
    this.editingRep.set(rep);
    // Load full details for editing
    this.salesRepService.getById(rep.id).subscribe({
      next: (fullRep) => {
        const isoDate = fullRep.hireDate.split('T')[0];
        // Extract manager user IDs from manager assignments
        const managerUserIds = fullRep.managers?.map(m => m.managerUserId) || [];
        const primaryManager = fullRep.managers?.find(m => m.isPrimary);
        this.formData = {
          userId: fullRep.userId,
          employeeCode: fullRep.employeeCode,
          repType: fullRep.repType,
          status: fullRep.status,
          mobile: fullRep.mobile || '',
          hireDate: isoDate,
          hireDateDisplay: this.formatDateForDisplay(isoDate),
          territoryDescription: fullRep.territoryDescription || '',
          selectedManagerUserIds: managerUserIds,
          primaryManagerUserId: primaryManager?.managerUserId || null
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

      // First update the rep, then update manager assignments if changed
      this.salesRepService.update(this.editingRep()!.id, updateData).subscribe({
        next: () => {
          // Update manager assignments
          const managerAssignments = {
            managerUserIds: this.formData.selectedManagerUserIds,
            primaryManagerUserId: this.formData.primaryManagerUserId || undefined
          };
          this.salesRepService.updateManagerAssignments(this.editingRep()!.id, managerAssignments).subscribe({
            next: () => {
              this.notificationService.success(this.translateService.instant('salesReps.updateSuccess'));
              this.closeModal();
              this.loadSalesReps();
              this.saving.set(false);
            },
            error: () => {
              this.notificationService.error(this.translateService.instant('salesReps.updateManagersError'));
              this.saving.set(false);
            }
          });
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
        managerUserIds: this.formData.selectedManagerUserIds,
        primaryManagerUserId: this.formData.primaryManagerUserId || undefined
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

  /**
   * Toggle supervisor selection in the checkbox list
   */
  toggleSupervisor(supervisorUserId: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      if (!this.formData.selectedManagerUserIds.includes(supervisorUserId)) {
        this.formData.selectedManagerUserIds = [...this.formData.selectedManagerUserIds, supervisorUserId];
      }
    } else {
      this.formData.selectedManagerUserIds = this.formData.selectedManagerUserIds.filter(id => id !== supervisorUserId);
      // If the removed supervisor was the primary manager, clear it
      if (this.formData.primaryManagerUserId === supervisorUserId) {
        this.formData.primaryManagerUserId = null;
      }
    }
  }

  /**
   * Get supervisor name by user ID for the primary manager dropdown
   */
  getSupervisorName(managerUserId: string): string {
    const supervisor = this.availableSupervisors().find(s => s.id === managerUserId);
    return supervisor ? supervisor.fullName : managerUserId;
  }

  // ========================================
  // Customer Assignment Modal Methods
  // ========================================

  /**
   * Open customer assignment modal for a sales rep
   */
  openCustomerAssignmentModal(rep: SalesRepresentativeSummary): void {
    this.customerAssignmentRep.set(rep);
    this.showCustomerAssignmentModal.set(true);
    this.loadingCustomers.set(true);
    this.customerSearchTerm.set('');

    // Load all customers and current assignments in parallel
    forkJoin({
      customers: this.customerService.getAll(),
      assignments: this.salesRepService.getCustomerAssignments(rep.id)
    }).subscribe({
      next: ({ customers, assignments }) => {
        this.allCustomers.set(customers.data || []);
        this.currentAssignments.set(assignments);
        // Pre-select currently assigned customers
        const assignedIds = new Set(assignments.filter(a => a.isActive).map(a => a.customerId));
        this.selectedCustomerIds.set(assignedIds);
        this.loadingCustomers.set(false);
      },
      error: () => {
        this.notificationService.error(this.translateService.instant('salesReps.loadCustomersError'));
        this.loadingCustomers.set(false);
      }
    });
  }

  /**
   * Close customer assignment modal
   */
  closeCustomerAssignmentModal(): void {
    this.showCustomerAssignmentModal.set(false);
    this.customerAssignmentRep.set(null);
    this.allCustomers.set([]);
    this.currentAssignments.set([]);
    this.selectedCustomerIds.set(new Set());
  }

  /**
   * Get filtered customers based on search term
   */
  filteredCustomers(): CustomerSummary[] {
    const searchLower = this.customerSearchTerm().toLowerCase().trim();
    if (!searchLower) {
      return this.allCustomers();
    }
    return this.allCustomers().filter(c =>
      (c.name?.toLowerCase().includes(searchLower)) ||
      (c.customerCode?.toLowerCase().includes(searchLower)) ||
      (c.city?.toLowerCase().includes(searchLower))
    );
  }

  /**
   * Toggle customer selection
   */
  toggleCustomerSelection(customerId: number): void {
    const current = new Set(this.selectedCustomerIds());
    if (current.has(customerId)) {
      current.delete(customerId);
    } else {
      current.add(customerId);
    }
    this.selectedCustomerIds.set(current);
  }

  /**
   * Save customer assignments
   */
  saveCustomerAssignments(): void {
    const rep = this.customerAssignmentRep();
    if (!rep) return;

    this.savingCustomers.set(true);

    const currentlyAssignedIds = new Set(
      this.currentAssignments().filter(a => a.isActive).map(a => a.customerId)
    );
    const newSelectedIds = this.selectedCustomerIds();

    // Find customers to add (in newSelected but not in current)
    const toAdd = [...newSelectedIds].filter(id => !currentlyAssignedIds.has(id));
    // Find customers to remove (in current but not in newSelected)
    const toRemove = [...currentlyAssignedIds].filter(id => !newSelectedIds.has(id));

    const operations: Promise<void>[] = [];

    if (toAdd.length > 0) {
      operations.push(
        new Promise((resolve, reject) => {
          this.salesRepService.assignCustomers(rep.id, { customerIds: toAdd }).subscribe({
            next: () => resolve(),
            error: (err) => reject(err)
          });
        })
      );
    }

    if (toRemove.length > 0) {
      operations.push(
        new Promise((resolve, reject) => {
          this.salesRepService.removeCustomerAssignments(rep.id, toRemove).subscribe({
            next: () => resolve(),
            error: (err) => reject(err)
          });
        })
      );
    }

    if (operations.length === 0) {
      this.closeCustomerAssignmentModal();
      this.savingCustomers.set(false);
      return;
    }

    Promise.all(operations)
      .then(() => {
        this.notificationService.success(this.translateService.instant('salesReps.customerAssignmentSuccess'));
        this.closeCustomerAssignmentModal();
        this.loadSalesReps(); // Refresh to update customer counts
      })
      .catch(() => {
        this.notificationService.error(this.translateService.instant('salesReps.customerAssignmentError'));
      })
      .finally(() => {
        this.savingCustomers.set(false);
      });
  }

  // View mode methods
  setViewMode(mode: 'table' | 'hierarchy'): void {
    if (this.viewMode() === mode) return;

    this.viewMode.set(mode);

    if (mode === 'hierarchy') {
      this.loadHierarchy();
    }
  }

  loadHierarchy(): void {
    this.loadingHierarchy.set(true);

    // Load hierarchy data and all reps to find unassigned ones
    forkJoin({
      hierarchy: this.salesRepService.getHierarchy(),
      allReps: this.salesRepService.getAll({ pageSize: 1000 }) // Get all reps
    }).subscribe({
      next: ({ hierarchy, allReps }) => {
        this.hierarchyData.set(hierarchy);

        // Find reps that are not assigned to any manager
        const assignedRepIds = new Set<number>();
        hierarchy.forEach(manager => {
          manager.teamMembers.forEach(member => {
            assignedRepIds.add(member.id);
          });
        });

        const unassigned = allReps.items.filter(rep => !assignedRepIds.has(rep.id));
        this.unassignedReps.set(unassigned);

        this.loadingHierarchy.set(false);
      },
      error: () => {
        this.notificationService.error(
          this.translateService.instant('salesReps.loadHierarchyError')
        );
        this.loadingHierarchy.set(false);
      }
    });
  }
}
