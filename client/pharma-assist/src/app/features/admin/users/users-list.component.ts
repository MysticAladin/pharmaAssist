import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EuropeanDatePipe } from '../../../core/pipes';
import { UserService, UserSummary, UserFilters } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { UserRole } from '../../../core/models/user.model';
import { PagedResponse } from '../../../core/models/product.model';
import { PaginationComponent, PageEvent } from '../../../shared/components/pagination/pagination.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { BadgeVariant } from '../../../shared/components/status-badge';
import { SearchInputComponent } from '../../../shared/components/search-input';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    EuropeanDatePipe,
    SearchInputComponent,
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

  onSearchTermChange(term: string): void {
    this.searchTerm = term;
    this.onSearchChange();
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
