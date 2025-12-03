import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { UIStateService } from '../../../core/state/ui-state.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, TranslateModule],
  template: `
    <div class="register-card">
      <div class="register-header">
        <h2 class="register-title">{{ 'auth.register.title' | translate }}</h2>
        <p class="register-subtitle">{{ 'auth.register.subtitle' | translate }}</p>
      </div>

      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register-form">
        <!-- Name Row -->
        <div class="form-row">
          <!-- First Name -->
          <div class="form-group">
            <label for="firstName" class="form-label">{{ 'auth.register.firstName' | translate }}</label>
            <div class="input-wrapper">
              <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input
                type="text"
                id="firstName"
                formControlName="firstName"
                class="form-input"
                [placeholder]="'auth.register.firstNamePlaceholder' | translate"
                [class.error]="isFieldInvalid('firstName')">
            </div>
            @if (isFieldInvalid('firstName')) {
              <span class="error-message">{{ 'auth.register.errors.firstNameRequired' | translate }}</span>
            }
          </div>

          <!-- Last Name -->
          <div class="form-group">
            <label for="lastName" class="form-label">{{ 'auth.register.lastName' | translate }}</label>
            <div class="input-wrapper">
              <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input
                type="text"
                id="lastName"
                formControlName="lastName"
                class="form-input"
                [placeholder]="'auth.register.lastNamePlaceholder' | translate"
                [class.error]="isFieldInvalid('lastName')">
            </div>
            @if (isFieldInvalid('lastName')) {
              <span class="error-message">{{ 'auth.register.errors.lastNameRequired' | translate }}</span>
            }
          </div>
        </div>

        <!-- Email -->
        <div class="form-group">
          <label for="email" class="form-label">{{ 'auth.register.email' | translate }}</label>
          <div class="input-wrapper">
            <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            <input
              type="email"
              id="email"
              formControlName="email"
              class="form-input"
              [placeholder]="'auth.register.emailPlaceholder' | translate"
              [class.error]="isFieldInvalid('email')">
          </div>
          @if (isFieldInvalid('email')) {
            <span class="error-message">
              @if (registerForm.get('email')?.errors?.['required']) {
                {{ 'auth.register.errors.emailRequired' | translate }}
              } @else if (registerForm.get('email')?.errors?.['email']) {
                {{ 'auth.register.errors.emailInvalid' | translate }}
              }
            </span>
          }
        </div>

        <!-- Phone Number (optional) -->
        <div class="form-group">
          <label for="phoneNumber" class="form-label">
            {{ 'auth.register.phoneNumber' | translate }}
            <span class="optional">{{ 'common.optional' | translate }}</span>
          </label>
          <div class="input-wrapper">
            <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <input
              type="tel"
              id="phoneNumber"
              formControlName="phoneNumber"
              class="form-input"
              [placeholder]="'auth.register.phoneNumberPlaceholder' | translate">
          </div>
        </div>

        <!-- Password -->
        <div class="form-group">
          <label for="password" class="form-label">{{ 'auth.register.password' | translate }}</label>
          <div class="input-wrapper">
            <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input
              [type]="showPassword() ? 'text' : 'password'"
              id="password"
              formControlName="password"
              class="form-input"
              [placeholder]="'auth.register.passwordPlaceholder' | translate"
              [class.error]="isFieldInvalid('password')">
            <button
              type="button"
              class="toggle-password"
              (click)="showPassword.set(!showPassword())"
              [attr.aria-label]="(showPassword() ? 'auth.login.hidePassword' : 'auth.login.showPassword') | translate">
              @if (showPassword()) {
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                  <line x1="2" x2="22" y1="2" y2="22"/>
                </svg>
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              }
            </button>
          </div>
          @if (isFieldInvalid('password')) {
            <span class="error-message">
              @if (registerForm.get('password')?.errors?.['required']) {
                {{ 'auth.register.errors.passwordRequired' | translate }}
              } @else if (registerForm.get('password')?.errors?.['minlength']) {
                {{ 'auth.register.errors.passwordMinLength' | translate }}
              } @else if (registerForm.get('password')?.errors?.['pattern']) {
                {{ 'auth.register.errors.passwordPattern' | translate }}
              }
            </span>
          }
          <div class="password-requirements">
            <span class="req" [class.met]="passwordMeetsLength()">
              <i [class.icon-check]="passwordMeetsLength()" [class.icon-circle]="!passwordMeetsLength()"></i>
              {{ 'auth.register.passwordRequirements.minLength' | translate }}
            </span>
            <span class="req" [class.met]="passwordHasUppercase()">
              <i [class.icon-check]="passwordHasUppercase()" [class.icon-circle]="!passwordHasUppercase()"></i>
              {{ 'auth.register.passwordRequirements.uppercase' | translate }}
            </span>
            <span class="req" [class.met]="passwordHasNumber()">
              <i [class.icon-check]="passwordHasNumber()" [class.icon-circle]="!passwordHasNumber()"></i>
              {{ 'auth.register.passwordRequirements.number' | translate }}
            </span>
            <span class="req" [class.met]="passwordHasSpecial()">
              <i [class.icon-check]="passwordHasSpecial()" [class.icon-circle]="!passwordHasSpecial()"></i>
              {{ 'auth.register.passwordRequirements.special' | translate }}
            </span>
          </div>
        </div>

        <!-- Confirm Password -->
        <div class="form-group">
          <label for="confirmPassword" class="form-label">{{ 'auth.register.confirmPassword' | translate }}</label>
          <div class="input-wrapper">
            <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input
              [type]="showConfirmPassword() ? 'text' : 'password'"
              id="confirmPassword"
              formControlName="confirmPassword"
              class="form-input"
              [placeholder]="'auth.register.confirmPasswordPlaceholder' | translate"
              [class.error]="isFieldInvalid('confirmPassword')">
            <button
              type="button"
              class="toggle-password"
              (click)="showConfirmPassword.set(!showConfirmPassword())"
              [attr.aria-label]="(showConfirmPassword() ? 'auth.login.hidePassword' : 'auth.login.showPassword') | translate">
              @if (showConfirmPassword()) {
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                  <line x1="2" x2="22" y1="2" y2="22"/>
                </svg>
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              }
            </button>
          </div>
          @if (isFieldInvalid('confirmPassword')) {
            <span class="error-message">
              @if (registerForm.get('confirmPassword')?.errors?.['required']) {
                {{ 'auth.register.errors.confirmPasswordRequired' | translate }}
              } @else if (registerForm.get('confirmPassword')?.errors?.['passwordMismatch']) {
                {{ 'auth.register.errors.passwordMismatch' | translate }}
              }
            </span>
          }
        </div>

        <!-- Terms and Conditions -->
        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" formControlName="acceptTerms">
            <span class="checkbox-text">
              {{ 'auth.register.termsPrefix' | translate }}
              <a href="/terms" target="_blank" class="link">{{ 'auth.register.termsOfService' | translate }}</a>
              {{ 'auth.register.termsAnd' | translate }}
              <a href="/privacy" target="_blank" class="link">{{ 'auth.register.privacyPolicy' | translate }}</a>
            </span>
          </label>
          @if (isFieldInvalid('acceptTerms')) {
            <span class="error-message">{{ 'auth.register.errors.acceptTermsRequired' | translate }}</span>
          }
        </div>

        <!-- Error Message -->
        @if (error()) {
          <div class="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" x2="12" y1="8" y2="12"/>
              <line x1="12" x2="12.01" y1="16" y2="16"/>
            </svg>
            <span>{{ error() }}</span>
          </div>
        }

        <!-- Submit Button -->
        <button
          type="submit"
          class="btn btn-primary btn-block"
          [disabled]="isLoading() || registerForm.invalid">
          @if (isLoading()) {
            <span class="spinner"></span>
            {{ 'auth.register.submitting' | translate }}
          } @else {
            {{ 'auth.register.submit' | translate }}
          }
        </button>
      </form>

      <div class="register-footer">
        <p>
          {{ 'auth.register.hasAccount' | translate }}
          <a routerLink="/auth/login" class="link">{{ 'auth.register.signIn' | translate }}</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .register-card {
      width: 100%;
      min-width: 500px;
      max-width: 560px;
      background-color: var(--bg-primary);
      border-radius: var(--radius-xl);
      padding: 40px 48px;
      box-shadow: var(--shadow-lg);
    }

    .register-header {
      text-align: center;
      margin-bottom: 28px;
    }

    .register-title {
      font-size: var(--font-size-2xl);
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 8px;
    }

    .register-subtitle {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin-bottom: 0;
    }

    .register-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 0;
    }

    .form-label {
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .optional {
      font-weight: 400;
      color: var(--text-muted);
      font-size: 12px;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 14px;
      font-size: 18px;
      color: var(--text-muted);
    }

    .form-input {
      width: 100%;
      padding: 11px 14px 11px 44px;
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      font-family: var(--font-family);
      color: var(--text-primary);
      transition: all var(--transition-fast);
      background-color: var(--bg-primary);
    }

    .form-input:focus {
      outline: none;
      border-color: var(--primary-500);
      box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15);
    }

    .form-input.error {
      border-color: var(--error);
    }

    .form-input.error:focus {
      box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.15);
    }

    .toggle-password {
      position: absolute;
      right: 14px;
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      color: var(--text-muted);
    }

    .toggle-password:hover {
      color: var(--text-secondary);
    }

    .error-message {
      font-size: 13px;
      color: var(--error);
    }

    .password-requirements {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 16px;
      margin-top: 8px;
    }

    .password-requirements .req {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--text-muted);
    }

    .password-requirements .req.met {
      color: var(--success);
    }

    .password-requirements .req i {
      font-size: 12px;
    }

    .checkbox-group {
      flex-direction: row;
    }

    .checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      cursor: pointer;
    }

    .checkbox-label input {
      width: 18px;
      height: 18px;
      margin-top: 2px;
      accent-color: var(--primary-600);
      flex-shrink: 0;
    }

    .checkbox-text {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
    }

    .alert-error {
      background-color: #ffebee;
      color: #c62828;
      border: 1px solid #ef9a9a;
    }

    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 14px 20px;
      border-radius: var(--radius-md);
      font-size: 15px;
      font-weight: 600;
      font-family: var(--font-family);
      cursor: pointer;
      transition: all var(--transition-fast);
      border: none;
    }

    .btn-primary {
      background-color: var(--primary-600);
      color: var(--text-light);
    }

    .btn-primary:hover:not(:disabled) {
      background-color: var(--primary-700);
    }

    .btn-primary:disabled {
      background-color: var(--neutral-400);
      cursor: not-allowed;
    }

    .btn-block {
      width: 100%;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid var(--text-light);
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .register-footer {
      text-align: center;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid var(--border-light);
    }

    .register-footer p {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin-bottom: 0;
    }

    .link {
      color: var(--primary-600);
      text-decoration: none;
      font-weight: 500;
    }

    .link:hover {
      color: var(--primary-700);
      text-decoration: underline;
    }

    @media (max-width: 600px) {
      .register-card {
        min-width: unset;
        padding: 32px 24px;
      }

      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly uiState = inject(UIStateService);
  private readonly router = inject(Router);
  private readonly translateService = inject(TranslateService);

  showPassword = signal(false);
  showConfirmPassword = signal(false);
  isLoading = signal(false);
  error = signal<string | null>(null);

  registerForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
    ]],
    confirmPassword: ['', [Validators.required]],
    acceptTerms: [false, [Validators.requiredTrue]]
  }, {
    validators: this.passwordMatchValidator
  });

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  passwordMeetsLength(): boolean {
    const password = this.registerForm.get('password')?.value || '';
    return password.length >= 8;
  }

  passwordHasUppercase(): boolean {
    const password = this.registerForm.get('password')?.value || '';
    return /[A-Z]/.test(password);
  }

  passwordHasNumber(): boolean {
    const password = this.registerForm.get('password')?.value || '';
    return /\d/.test(password);
  }

  passwordHasSpecial(): boolean {
    const password = this.registerForm.get('password')?.value || '';
    return /[!@#$%^&*(),.?":{}|<>]/.test(password);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    const formValue = this.registerForm.value;
    const request = {
      email: formValue.email,
      password: formValue.password,
      confirmPassword: formValue.confirmPassword,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      phoneNumber: formValue.phoneNumber || undefined
    };

    this.authService.register(request).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.succeeded) {
          this.router.navigate(['/dashboard']);
          this.uiState.showSuccess(
            this.translateService.instant('auth.register.success.title'),
            this.translateService.instant('auth.register.success.message')
          );
        } else {
          this.error.set(response.message || this.translateService.instant('auth.register.errors.genericError'));
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        if (err.status === 409) {
          this.error.set(this.translateService.instant('auth.register.errors.emailExists'));
        } else if (err.error?.message) {
          this.error.set(err.error.message);
        } else {
          this.error.set(this.translateService.instant('auth.register.errors.genericError'));
        }
      }
    });
  }
}
