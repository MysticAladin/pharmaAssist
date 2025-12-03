import { Component, inject, OnInit, signal, computed, EventEmitter, Output, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UserService, UserSummary, CreateUserRequest, UpdateUserRequest } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  template: `
    @if (isOpen()) {
      <div class="modal-backdrop" (click)="close()"></div>
      <div class="modal">
        <div class="modal-content">
          <header class="modal-header">
            <h2>{{ (editMode() ? 'users.editUser' : 'users.addUser') | translate }}</h2>
            <button class="btn-close" (click)="close()">
              <i class="icon-x"></i>
            </button>
          </header>

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="modal-body">
              <div class="form-row">
                <div class="form-group">
                  <label for="firstName" class="required">{{ 'users.firstName' | translate }}</label>
                  <input
                    type="text"
                    id="firstName"
                    formControlName="firstName"
                    class="form-control"
                    [class.is-invalid]="isFieldInvalid('firstName')">
                  @if (isFieldInvalid('firstName')) {
                    <span class="invalid-feedback">{{ 'validation.required' | translate }}</span>
                  }
                </div>

                <div class="form-group">
                  <label for="lastName" class="required">{{ 'users.lastName' | translate }}</label>
                  <input
                    type="text"
                    id="lastName"
                    formControlName="lastName"
                    class="form-control"
                    [class.is-invalid]="isFieldInvalid('lastName')">
                  @if (isFieldInvalid('lastName')) {
                    <span class="invalid-feedback">{{ 'validation.required' | translate }}</span>
                  }
                </div>
              </div>

              <div class="form-group">
                <label for="email" class="required">{{ 'users.email' | translate }}</label>
                <input
                  type="email"
                  id="email"
                  formControlName="email"
                  class="form-control"
                  [class.is-invalid]="isFieldInvalid('email')"
                  [readonly]="editMode()">
                @if (isFieldInvalid('email')) {
                  @if (form.get('email')?.errors?.['required']) {
                    <span class="invalid-feedback">{{ 'validation.required' | translate }}</span>
                  } @else if (form.get('email')?.errors?.['email']) {
                    <span class="invalid-feedback">{{ 'validation.email' | translate }}</span>
                  }
                }
              </div>

              <div class="form-group">
                <label for="phoneNumber">{{ 'users.phone' | translate }}</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  formControlName="phoneNumber"
                  class="form-control"
                  [placeholder]="'+387 61 234 567'">
              </div>

              @if (!editMode()) {
                <div class="form-row">
                  <div class="form-group">
                    <label for="password" class="required">{{ 'auth.password' | translate }}</label>
                    <div class="password-input">
                      <input
                        [type]="showPassword() ? 'text' : 'password'"
                        id="password"
                        formControlName="password"
                        class="form-control"
                        [class.is-invalid]="isFieldInvalid('password')">
                      <button
                        type="button"
                        class="toggle-password"
                        (click)="showPassword.set(!showPassword())">
                        <i [class]="showPassword() ? 'icon-eye-off' : 'icon-eye'"></i>
                      </button>
                    </div>
                    @if (isFieldInvalid('password')) {
                      @if (form.get('password')?.errors?.['required']) {
                        <span class="invalid-feedback">{{ 'validation.required' | translate }}</span>
                      } @else if (form.get('password')?.errors?.['minlength']) {
                        <span class="invalid-feedback">{{ 'validation.minLength' | translate: {min: 8} }}</span>
                      } @else if (form.get('password')?.errors?.['pattern']) {
                        <span class="invalid-feedback">{{ 'register.passwordRequirements' | translate }}</span>
                      }
                    }
                  </div>

                  <div class="form-group">
                    <label for="confirmPassword" class="required">{{ 'register.confirmPassword' | translate }}</label>
                    <div class="password-input">
                      <input
                        [type]="showConfirmPassword() ? 'text' : 'password'"
                        id="confirmPassword"
                        formControlName="confirmPassword"
                        class="form-control"
                        [class.is-invalid]="isFieldInvalid('confirmPassword')">
                      <button
                        type="button"
                        class="toggle-password"
                        (click)="showConfirmPassword.set(!showConfirmPassword())">
                        <i [class]="showConfirmPassword() ? 'icon-eye-off' : 'icon-eye'"></i>
                      </button>
                    </div>
                    @if (isFieldInvalid('confirmPassword')) {
                      @if (form.get('confirmPassword')?.errors?.['required']) {
                        <span class="invalid-feedback">{{ 'validation.required' | translate }}</span>
                      } @else if (form.get('confirmPassword')?.errors?.['passwordMismatch']) {
                        <span class="invalid-feedback">{{ 'register.passwordMismatch' | translate }}</span>
                      }
                    }
                  </div>
                </div>
              }

              <div class="form-group">
                <label class="required">{{ 'users.roles' | translate }}</label>
                <div class="roles-grid">
                  @for (role of availableRoles; track role.value) {
                    <label class="role-checkbox">
                      <input
                        type="checkbox"
                        [checked]="isRoleSelected(role.value)"
                        (change)="toggleRole(role.value)"
                        [disabled]="role.value === 'SuperAdmin' && !isSuperAdmin()">
                      <span class="checkmark"></span>
                      <span class="role-info">
                        <span class="role-name">{{ role.label | translate }}</span>
                        <span class="role-description">{{ role.description | translate }}</span>
                      </span>
                    </label>
                  }
                </div>
                @if (selectedRoles().length === 0 && submitted()) {
                  <span class="invalid-feedback d-block">{{ 'users.rolesRequired' | translate }}</span>
                }
              </div>

              <div class="form-group">
                <label class="toggle-switch">
                  <input type="checkbox" formControlName="isActive">
                  <span class="slider"></span>
                  <span class="toggle-label">{{ 'users.userActive' | translate }}</span>
                </label>
                <p class="form-hint">{{ 'users.userActiveHint' | translate }}</p>
              </div>
            </div>

            <footer class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="close()">
                {{ 'common.cancel' | translate }}
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="saving()">
                @if (saving()) {
                  <span class="spinner-sm"></span>
                }
                {{ (editMode() ? 'common.save' : 'common.create') | translate }}
              </button>
            </footer>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
    }

    .modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1001;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      display: flex;
    }

    .modal-content {
      background: var(--card-bg);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      width: 100%;
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-color);

      h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
      }

      .btn-close {
        background: none;
        border: none;
        padding: 0.5rem;
        cursor: pointer;
        color: var(--text-muted);
        border-radius: var(--radius);

        &:hover {
          background: var(--hover-bg);
          color: var(--text-primary);
        }
      }
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.25rem 1.5rem;
      border-top: 1px solid var(--border-color);
      background: var(--bg-secondary);
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      margin-bottom: 1.25rem;

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--text-primary);

        &.required::after {
          content: ' *';
          color: var(--danger);
        }
      }
    }

    .form-control {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      font-size: 0.875rem;
      background: var(--input-bg);
      color: var(--text-primary);
      transition: border-color 0.2s, box-shadow 0.2s;

      &:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px var(--primary-light);
      }

      &.is-invalid {
        border-color: var(--danger);
      }

      &[readonly] {
        background: var(--bg-secondary);
        cursor: not-allowed;
      }
    }

    .invalid-feedback {
      display: block;
      color: var(--danger);
      font-size: 0.75rem;
      margin-top: 0.25rem;

      &.d-block {
        display: block !important;
      }
    }

    .password-input {
      position: relative;

      .toggle-password {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 0.25rem;

        &:hover {
          color: var(--text-primary);
        }
      }

      .form-control {
        padding-right: 2.5rem;
      }
    }

    .roles-grid {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .role-checkbox {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: var(--primary);
        background: var(--hover-bg);
      }

      input[type="checkbox"] {
        display: none;

        &:checked + .checkmark {
          background: var(--primary);
          border-color: var(--primary);

          &::after {
            display: block;
          }
        }

        &:disabled + .checkmark {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .checkmark {
        width: 20px;
        height: 20px;
        min-width: 20px;
        border: 2px solid var(--border-color);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 2px;
        transition: all 0.2s;

        &::after {
          content: '';
          display: none;
          width: 5px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
      }

      .role-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .role-name {
        font-weight: 500;
        color: var(--text-primary);
      }

      .role-description {
        font-size: 0.75rem;
        color: var(--text-muted);
      }
    }

    .toggle-switch {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;

      input[type="checkbox"] {
        display: none;

        &:checked + .slider {
          background: var(--primary);

          &::before {
            transform: translateX(20px);
          }
        }
      }

      .slider {
        position: relative;
        width: 44px;
        height: 24px;
        background: var(--border-color);
        border-radius: 12px;
        transition: all 0.2s;

        &::before {
          content: '';
          position: absolute;
          width: 18px;
          height: 18px;
          left: 3px;
          top: 3px;
          background: white;
          border-radius: 50%;
          transition: all 0.2s;
        }
      }

      .toggle-label {
        font-weight: 500;
        color: var(--text-primary);
      }
    }

    .form-hint {
      margin: 0.25rem 0 0;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .spinner-sm {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 0.5rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: var(--radius);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;

      &.btn-primary {
        background: var(--primary);
        color: white;
        border: none;

        &:hover:not(:disabled) {
          background: var(--primary-dark);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      &.btn-secondary {
        background: var(--bg-secondary);
        color: var(--text-primary);
        border: 1px solid var(--border-color);

        &:hover {
          background: var(--hover-bg);
        }
      }
    }

    @media (max-width: 600px) {
      .modal {
        max-width: calc(100% - 2rem);
        margin: 1rem;
      }

      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class UserFormComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);

  @Input() user: UserSummary | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  form!: FormGroup;
  isOpen = signal(false);
  editMode = signal(false);
  saving = signal(false);
  submitted = signal(false);
  selectedRoles = signal<string[]>([]);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  readonly availableRoles = [
    { value: 'SuperAdmin', label: 'users.roles.superAdmin', description: 'users.roleDescriptions.superAdmin' },
    { value: 'Admin', label: 'users.roles.admin', description: 'users.roleDescriptions.admin' },
    { value: 'Manager', label: 'users.roles.manager', description: 'users.roleDescriptions.manager' },
    { value: 'Pharmacist', label: 'users.roles.pharmacist', description: 'users.roleDescriptions.pharmacist' },
    { value: 'SalesRep', label: 'users.roles.salesRep', description: 'users.roleDescriptions.salesRep' },
    { value: 'Warehouse', label: 'users.roles.warehouse', description: 'users.roleDescriptions.warehouse' },
    { value: 'Customer', label: 'users.roles.customer', description: 'users.roleDescriptions.customer' }
  ];

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.form) {
      this.populateForm();
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      password: [''],
      confirmPassword: [''],
      isActive: [true]
    });

    // Add password matching validator for confirmPassword
    this.form.get('confirmPassword')?.setValidators([
      this.passwordMatchValidator.bind(this)
    ]);
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = this.form?.get('password')?.value;
    const confirmPassword = control.value;

    if (!this.editMode() && password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  open(user?: UserSummary): void {
    this.user = user || null;
    this.editMode.set(!!user);
    this.submitted.set(false);
    this.isOpen.set(true);

    if (!this.editMode()) {
      // For new users, password is required
      const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      this.form.get('password')?.setValidators([
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(passwordPattern)
      ]);
      this.form.get('confirmPassword')?.setValidators([
        Validators.required,
        this.passwordMatchValidator.bind(this)
      ]);
    } else {
      // For existing users, password is optional
      this.form.get('password')?.clearValidators();
      this.form.get('confirmPassword')?.clearValidators();
    }

    this.form.get('password')?.updateValueAndValidity();
    this.form.get('confirmPassword')?.updateValueAndValidity();

    this.populateForm();
  }

  close(): void {
    this.isOpen.set(false);
    this.form.reset({ isActive: true });
    this.selectedRoles.set([]);
    this.closed.emit();
  }

  private populateForm(): void {
    if (this.user) {
      this.form.patchValue({
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        email: this.user.email,
        phoneNumber: this.user.phoneNumber || '',
        isActive: this.user.isActive
      });
      this.selectedRoles.set([...this.user.roles]);
    } else {
      this.form.reset({ isActive: true });
      this.selectedRoles.set([]);
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.touched || this.submitted()));
  }

  isRoleSelected(role: string): boolean {
    return this.selectedRoles().includes(role);
  }

  toggleRole(role: string): void {
    const roles = [...this.selectedRoles()];
    const index = roles.indexOf(role);

    if (index === -1) {
      roles.push(role);
    } else {
      roles.splice(index, 1);
    }

    this.selectedRoles.set(roles);
  }

  isSuperAdmin(): boolean {
    // In a real app, check current user's role
    return true;
  }

  onSubmit(): void {
    this.submitted.set(true);

    if (this.form.invalid || this.selectedRoles().length === 0) {
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    this.saving.set(true);

    if (this.editMode() && this.user) {
      this.updateUser();
    } else {
      this.createUser();
    }
  }

  private createUser(): void {
    const request: CreateUserRequest = {
      firstName: this.form.value.firstName,
      lastName: this.form.value.lastName,
      email: this.form.value.email,
      phoneNumber: this.form.value.phoneNumber || null,
      password: this.form.value.password,
      roles: this.selectedRoles(),
      isActive: this.form.value.isActive
    };

    this.userService.createUser(request).subscribe({
      next: () => {
        this.notificationService.success(
          this.translateService.instant('users.notifications.createSuccess')
        );
        this.saving.set(false);
        this.saved.emit();
        this.close();
      },
      error: (error) => {
        this.saving.set(false);
        this.notificationService.error(
          error.error?.message || this.translateService.instant('users.notifications.createError')
        );
      }
    });
  }

  private updateUser(): void {
    if (!this.user) return;

    const request: UpdateUserRequest = {
      firstName: this.form.value.firstName,
      lastName: this.form.value.lastName,
      phoneNumber: this.form.value.phoneNumber || null,
      roles: this.selectedRoles(),
      isActive: this.form.value.isActive
    };

    this.userService.updateUser(this.user.id, request).subscribe({
      next: () => {
        this.notificationService.success(
          this.translateService.instant('users.notifications.updateSuccess')
        );
        this.saving.set(false);
        this.saved.emit();
        this.close();
      },
      error: (error) => {
        this.saving.set(false);
        this.notificationService.error(
          error.error?.message || this.translateService.instant('users.notifications.updateError')
        );
      }
    });
  }
}
