import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UserService, UserSummary, UserFilters } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { UserRole } from '../../../core/models/user.model';
import { PagedResponse } from '../../../core/models/product.model';
import { PaginationComponent, PageEvent } from '../../../shared/components/pagination/pagination.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { BadgeVariant } from '../../../shared/components/status-badge';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    PaginationComponent,
    StatusBadgeComponent,
    EmptyStateComponent
  ],
  templateUrl: './users-list-component/users-list.component.html',
  styleUrls: ['./users-list-component/users-list.component.scss']
})
export class UsersListComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translateService = inject(TranslateService);

  // State
  users = signal<UserSummary[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  pageSize = signal(20);
  totalItems = signal(0);
  saving = signal(false);
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ 'users.user' | translate }}</th>
                  <th>{{ 'users.email' | translate }}</th>
                  <th>{{ 'users.rolesColumn' | translate }}</th>
                  <th class="text-center">{{ 'common.status' | translate }}</th>
                  <th>{{ 'users.lastLogin' | translate }}</th>
                  <th class="text-center">{{ 'common.actions' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                @for (user of users(); track user.id) {
                  <tr>
                    <td>
                      <div class="user-info">
                        <div class="avatar">
                          {{ getInitials(user) }}
                        </div>
                        <div class="user-details">
                          <span class="user-name">{{ user.fullName }}</span>
                          @if (user.phoneNumber) {
                            <span class="user-phone">{{ user.phoneNumber }}</span>
                          }
                        </div>
                      </div>
                    </td>
                    <td>
                      <a class="email-link" [href]="'mailto:' + user.email">
                        {{ user.email }}
                      </a>
                    </td>
                    <td>
                      <div class="roles-list">
                        @for (role of user.roles; track role) {
                          <span class="role-badge" [class]="getRoleClass(role)">
                            {{ getRoleName(role) | translate }}
                          </span>
                        }
                      </div>
                    </td>
                    <td class="text-center">
                      <app-status-badge
                        [variant]="user.isActive ? 'success' : 'danger'"
                        [label]="(user.isActive ? 'common.active' : 'common.inactive') | translate">
                      </app-status-badge>
                    </td>
                    <td>
                      @if (user.lastLoginAt) {
                        {{ user.lastLoginAt | date:'short' }}
                      } @else {
                        <span class="text-muted">{{ 'users.neverLoggedIn' | translate }}</span>
                      }
                    </td>
                    <td class="text-center">
                      <div class="row-actions">
                        <button
                          class="action-btn"
                          [title]="'common.edit' | translate"
                          (click)="openEditModal(user)">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        @if (user.isActive) {
                          <button
                            class="action-btn action-btn-warning"
                            [title]="'users.deactivate' | translate"
                            (click)="toggleUserStatus(user)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                              <circle cx="9" cy="7" r="4"/>
                              <line x1="17" x2="22" y1="8" y2="13"/>
                              <line x1="22" x2="17" y1="8" y2="13"/>
                            </svg>
                          </button>
                        } @else {
                          <button
                            class="action-btn action-btn-success"
                            [title]="'users.activate' | translate"
                            (click)="toggleUserStatus(user)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                              <circle cx="9" cy="7" r="4"/>
                              <polyline points="16 11 18 13 22 9"/>
                            </svg>
                          </button>
                        }
                        <button
                          class="action-btn"
                          [title]="'users.resetPassword' | translate"
                          (click)="openResetPasswordModal(user)">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="7.5" cy="15.5" r="5.5"/>
                            <path d="m21 2-9.6 9.6"/>
                            <path d="m15.5 7.5 3 3L22 7l-3-3"/>
                          </svg>
                        </button>
                        <button
                          class="action-btn action-btn-danger"
                          [title]="'common.delete' | translate"
                          (click)="deleteUser(user)">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
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
            (pageChange)="onPageChange($event)">
          </app-pagination>
        }
      </section>

      <!-- Create/Edit Modal -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ (editingUser() ? 'users.editUser' : 'users.addUser') | translate }}</h2>
              <button class="btn btn-icon" (click)="closeModal()">
                <i class="icon-x"></i>
              </button>
            </div>
            <div class="modal-body">
              <form (ngSubmit)="saveUser()">
                <div class="form-row">
                  <div class="form-group">
                    <label for="firstName">{{ 'users.firstName' | translate }} *</label>
                    <input
                      type="text"
                      id="firstName"
                      [(ngModel)]="formData.firstName"
                      name="firstName"
                      class="form-control"
                      required>
                  </div>
                  <div class="form-group">
                    <label for="lastName">{{ 'users.lastName' | translate }} *</label>
                    <input
                      type="text"
                      id="lastName"
                      [(ngModel)]="formData.lastName"
                      name="lastName"
                      class="form-control"
                      required>
                  </div>
                </div>

                <div class="form-group">
                  <label for="email">{{ 'users.email' | translate }} *</label>
                  <input
                    type="email"
                    id="email"
                    [(ngModel)]="formData.email"
                    name="email"
                    class="form-control"
                    [disabled]="!!editingUser()"
                    required>
                </div>

                <div class="form-group">
                  <label for="phoneNumber">{{ 'users.phoneNumber' | translate }}</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    [(ngModel)]="formData.phoneNumber"
                    name="phoneNumber"
                    class="form-control">
                </div>

                @if (!editingUser()) {
                  <div class="form-group">
                    <label for="password">{{ 'users.password' | translate }} *</label>
                    <input
                      type="password"
                      id="password"
                      [(ngModel)]="formData.password"
                      name="password"
                      class="form-control"
                      required>
                  </div>
                }

                <div class="form-group">
                  <label>{{ 'users.selectRoles' | translate }} *</label>
                  <div class="roles-checkboxes">
                    @for (role of roles; track role) {
                      <label class="checkbox-label">
                        <input
                          type="checkbox"
                          [checked]="formData.roles.includes(role)"
                          (change)="toggleRole(role)">
                        <span>{{ getRoleName(role) | translate }}</span>
                      </label>
                    }
                  </div>
                </div>

                <div class="form-group checkbox-group">
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      [(ngModel)]="formData.isActive"
                      name="isActive">
                    <span>{{ 'users.isActive' | translate }}</span>
                  </label>
                </div>

                <div class="modal-actions">
                  <button type="button" class="btn btn-secondary" (click)="closeModal()">
                    {{ 'common.cancel' | translate }}
                  </button>
                  <button
                    type="submit"
                    class="btn btn-primary"
                    [disabled]="saving()">
                    @if (saving()) {
                      <span class="spinner-small light"></span>
                    }
                    {{ 'common.save' | translate }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }

      <!-- Reset Password Modal -->
      @if (showResetPasswordModal()) {
        <div class="modal-overlay" (click)="closeResetPasswordModal()">
          <div class="modal-content modal-sm" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ 'users.resetPassword' | translate }}</h2>
              <button class="btn btn-icon" (click)="closeResetPasswordModal()">
                <i class="icon-x"></i>
              </button>
            </div>
            <div class="modal-body">
              <p class="reset-info">
                {{ 'users.resetPasswordInfo' | translate:{ name: resetPasswordUser()?.fullName } }}
              </p>
              <form (ngSubmit)="resetPassword()">
                <div class="form-group">
                  <label for="newPassword">{{ 'users.newPassword' | translate }} *</label>
                  <input
                    type="password"
                    id="newPassword"
                    [(ngModel)]="resetPasswordData.newPassword"
                    name="newPassword"
                    class="form-control"
                    required
                    minlength="8">
                </div>
                <div class="form-group">
                  <label for="confirmPassword">{{ 'users.confirmPassword' | translate }} *</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    [(ngModel)]="resetPasswordData.confirmPassword"
                    name="confirmPassword"
                    class="form-control"
                    required>
                </div>
                <div class="modal-actions">
                  <button type="button" class="btn btn-secondary" (click)="closeResetPasswordModal()">
                    {{ 'common.cancel' | translate }}
                  </button>
                  <button
                    type="submit"
                    class="btn btn-primary"
                    [disabled]="saving()">
                    @if (saving()) {
                      <span class="spinner-small light"></span>
                    }
                    {{ 'users.resetPassword' | translate }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .users-page {
      padding: 1.5rem;
    }

    .page-header {
      margin-bottom: 1.5rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .header-content h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .subtitle {
      margin: 0.25rem 0 0;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    /* Filters */
    .filters-section {
      background: var(--surface);
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .filter-row {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 250px;
    }

    .search-box i {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
    }

    .search-box .form-control {
      padding-left: 40px;
    }

    .form-control, .form-select {
      padding: 0.5rem 0.875rem;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background: var(--surface);
      color: var(--text-primary);
    }

    .form-select {
      min-width: 150px;
    }

    .btn-text {
      background: transparent;
      border: none;
      color: var(--primary);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
      padding: 0.5rem;
    }

    .btn-text:hover {
      text-decoration: underline;
    }

    /* Table */
    .table-section {
      background: var(--surface);
      border-radius: 8px;
      overflow: hidden;
    }

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
      width: 40px;
      height: 40px;
      border: 3px solid var(--border-color);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

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
      background: var(--surface-hover);
      font-weight: 600;
      color: var(--text-secondary);
      font-size: 0.875rem;
      white-space: nowrap;
    }

    .data-table tr:hover {
      background: var(--surface-hover);
    }

    .text-center {
      text-align: center !important;
    }

    .text-muted {
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    /* User Info Cell */
    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .user-details {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: 500;
      color: var(--text-primary);
    }

    .user-phone {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .email-link {
      color: var(--primary);
      text-decoration: none;
    }

    .email-link:hover {
      text-decoration: underline;
    }

    /* Roles */
    .roles-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .role-badge {
      display: inline-flex;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      background: var(--surface-hover);
      color: var(--text-secondary);
    }

    .role-badge.admin {
      background: var(--color-danger-bg);
      color: var(--color-danger);
    }

    .role-badge.manager {
      background: var(--color-warning-bg);
      color: var(--color-warning);
    }

    .role-badge.pharmacist {
      background: var(--color-info-bg);
      color: var(--color-info);
    }

    .role-badge.sales {
      background: var(--color-success-bg);
      color: var(--color-success);
    }

    /* Actions - matching Products page style */
    .row-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      justify-content: center;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        background: var(--surface-hover);
        color: var(--text);
      }

      &.action-btn-danger:hover {
        background: var(--color-error-bg);
        color: var(--color-error-dark);
      }

      &.action-btn-warning:hover {
        background: var(--color-warning-bg);
        color: var(--color-warning-dark);
      }

      &.action-btn-success:hover {
        background: var(--color-success-bg);
        color: var(--color-success-dark);
      }
    }

    .btn-sm {
      font-size: 0.875rem;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      text-decoration: none;
    }

    .btn-primary {
      background: var(--primary);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--primary-dark);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: var(--surface-hover);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
    }

    .btn-secondary:hover {
      background: var(--border-color);
    }

    /* Modal */
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
      padding: 1rem;
    }

    .modal-content {
      background: var(--surface);
      border-radius: 12px;
      width: 100%;
      max-width: 560px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-sm {
      max-width: 400px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .roles-checkboxes {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem 1.5rem;
      padding: 0.75rem;
      background: var(--bg-secondary);
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      cursor: pointer;
      font-size: 0.875rem;
      padding: 0.25rem 0;
    }

    .checkbox-label input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: var(--primary);
      cursor: pointer;
      flex-shrink: 0;
    }

    .checkbox-label span {
      user-select: none;
    }

    .checkbox-group {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .reset-info {
      margin-bottom: 1.5rem;
      color: var(--text-secondary);
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .spinner-small {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid var(--border-color);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .spinner-small.light {
      border-color: rgba(255, 255, 255, 0.3);
      border-top-color: white;
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        align-items: flex-start;
      }

      .filter-row {
        flex-direction: column;
        align-items: stretch;
      }

      .search-box {
        width: 100%;
      }

      .form-select {
        width: 100%;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .roles-checkboxes {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class UsersListComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translateService = inject(TranslateService);

  // State
  users = signal<UserSummary[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  pageSize = signal(20);
  totalItems = signal(0);
  saving = signal(false);

  // Filters
  searchTerm = '';
  selectedRole = '';
  selectedStatus: string | boolean = '';
  private searchTimeout: any;

  // Available roles
  roles: UserRole[] = [
    UserRole.Admin,
    UserRole.Manager,
    UserRole.Pharmacist,
    UserRole.SalesRep,
    UserRole.Warehouse,
    UserRole.Customer
  ];

  // Modal state
  showModal = signal(false);
  editingUser = signal<UserSummary | null>(null);
  formData = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    roles: [] as string[],
    isActive: true
  };

  // Reset password modal
  showResetPasswordModal = signal(false);
  resetPasswordUser = signal<UserSummary | null>(null);
  resetPasswordData = {
    newPassword: '',
    confirmPassword: ''
  };

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);

    const filters: UserFilters = {
      search: this.searchTerm || undefined,
      role: this.selectedRole as UserRole || undefined,
      isActive: this.selectedStatus === '' ? undefined : this.selectedStatus === 'true',
      page: this.currentPage(),
      pageSize: this.pageSize()
    };

    this.userService.getUsers(filters).subscribe({
      next: (response: PagedResponse<UserSummary>) => {
        this.users.set(response.data || []);
        // Handle different property names from API
        const total = response.totalCount ?? (response as any).total ?? (response as any).totalItems ?? 0;
        this.totalItems.set(total);
        this.loading.set(false);
      },
      error: () => {
        this.notificationService.error(
          this.translateService.instant('users.loadError')
        );
        this.loading.set(false);
      }
    });
  }

  onSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      this.loadUsers();
    }, 300);
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadUsers();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedRole = '';
    this.selectedStatus = '';
    this.applyFilters();
  }

  hasFilters(): boolean {
    return !!(this.searchTerm || this.selectedRole || this.selectedStatus !== '');
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.page);
    this.loadUsers();
  }

  getInitials(user: UserSummary): string {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  getRoleName(role: string): string {
    const roleNames: Record<string, string> = {
      SuperAdmin: 'users.roles.superAdmin',
      Admin: 'users.roles.admin',
      Manager: 'users.roles.manager',
      Pharmacist: 'users.roles.pharmacist',
      SalesRep: 'users.roles.salesRep',
      Warehouse: 'users.roles.warehouse',
      Customer: 'users.roles.customer'
    };
    return roleNames[role] || role;
  }

  getRoleClass(role: string): string {
    const classes: Record<string, string> = {
      SuperAdmin: 'admin',
      Admin: 'admin',
      Manager: 'manager',
      Pharmacist: 'pharmacist',
      SalesRep: 'sales',
      Warehouse: 'sales',
      Customer: ''
    };
    return classes[role] || '';
  }

  // Modal methods
  openCreateModal(): void {
    this.editingUser.set(null);
    this.formData = {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      roles: [],
      isActive: true
    };
    this.showModal.set(true);
  }

  openEditModal(user: UserSummary): void {
    this.editingUser.set(user);
    this.formData = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      password: '',
      roles: [...user.roles],
      isActive: user.isActive
    };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingUser.set(null);
  }

  toggleRole(role: string): void {
    const index = this.formData.roles.indexOf(role);
    if (index > -1) {
      this.formData.roles.splice(index, 1);
    } else {
      this.formData.roles.push(role);
    }
  }

  saveUser(): void {
    this.saving.set(true);

    if (this.editingUser()) {
      this.userService.updateUser(this.editingUser()!.id, {
        firstName: this.formData.firstName,
        lastName: this.formData.lastName,
        phoneNumber: this.formData.phoneNumber || undefined,
        roles: this.formData.roles,
        isActive: this.formData.isActive
      }).subscribe({
        next: () => {
          this.notificationService.success(
            this.translateService.instant('users.updateSuccess')
          );
          this.closeModal();
          this.loadUsers();
          this.saving.set(false);
        },
        error: () => {
          this.notificationService.error(
            this.translateService.instant('users.updateError')
          );
          this.saving.set(false);
        }
      });
    } else {
      this.userService.createUser({
        firstName: this.formData.firstName,
        lastName: this.formData.lastName,
        email: this.formData.email,
        phoneNumber: this.formData.phoneNumber || undefined,
        password: this.formData.password,
        roles: this.formData.roles,
        isActive: this.formData.isActive
      }).subscribe({
        next: () => {
          this.notificationService.success(
            this.translateService.instant('users.createSuccess')
          );
          this.closeModal();
          this.loadUsers();
          this.saving.set(false);
        },
        error: () => {
          this.notificationService.error(
            this.translateService.instant('users.createError')
          );
          this.saving.set(false);
        }
      });
    }
  }

  toggleUserStatus(user: UserSummary): void {
    const action = user.isActive ? 'deactivate' : 'activate';
    const observable = user.isActive
      ? this.userService.deactivateUser(user.id)
      : this.userService.activateUser(user.id);

    this.confirmationService.confirm({
      title: this.translateService.instant(`users.confirm${action === 'deactivate' ? 'Deactivate' : 'Activate'}`),
      message: this.translateService.instant(`users.confirm${action === 'deactivate' ? 'Deactivate' : 'Activate'}Message`, { name: user.fullName }),
      variant: action === 'deactivate' ? 'warning' : 'info'
    }).then(confirmed => {
      if (confirmed) {
        observable.subscribe({
          next: () => {
            this.notificationService.success(
              this.translateService.instant(`users.${action}Success`)
            );
            this.loadUsers();
          },
          error: () => {
            this.notificationService.error(
              this.translateService.instant(`users.${action}Error`)
            );
          }
        });
      }
    });
  }

  deleteUser(user: UserSummary): void {
    this.confirmationService.confirm({
      title: this.translateService.instant('users.confirmDelete'),
      message: this.translateService.instant('users.confirmDeleteMessage', { name: user.fullName }),
      variant: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.userService.deleteUser(user.id).subscribe({
          next: () => {
            this.notificationService.success(
              this.translateService.instant('users.deleteSuccess')
            );
            this.loadUsers();
          },
          error: () => {
            this.notificationService.error(
              this.translateService.instant('users.deleteError')
            );
          }
        });
      }
    });
  }

  // Reset password modal
  openResetPasswordModal(user: UserSummary): void {
    this.resetPasswordUser.set(user);
    this.resetPasswordData = {
      newPassword: '',
      confirmPassword: ''
    };
    this.showResetPasswordModal.set(true);
  }

  closeResetPasswordModal(): void {
    this.showResetPasswordModal.set(false);
    this.resetPasswordUser.set(null);
  }

  resetPassword(): void {
    if (this.resetPasswordData.newPassword !== this.resetPasswordData.confirmPassword) {
      this.notificationService.error(
        this.translateService.instant('users.passwordMismatch')
      );
      return;
    }

    this.saving.set(true);

    this.userService.resetUserPassword(this.resetPasswordUser()!.id, this.resetPasswordData).subscribe({
      next: () => {
        this.notificationService.success(
          this.translateService.instant('users.resetPasswordSuccess')
        );
        this.closeResetPasswordModal();
        this.saving.set(false);
      },
      error: () => {
        this.notificationService.error(
          this.translateService.instant('users.resetPasswordError')
        );
        this.saving.set(false);
      }
    });
  }
}
