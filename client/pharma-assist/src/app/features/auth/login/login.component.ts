import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { UIStateService } from '../../../core/state/ui-state.service';
import { AuthStateService } from '../../../core/state/auth-state.service';
import { ILoginRequest, ILoginResponse, UserRole } from '../../../core/models/user.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, TranslateModule],
  template: `
    <div class="login-card">
      <div class="login-header">
        <h2 class="login-title">{{ 'auth.login.title' | translate }}</h2>
        <p class="login-subtitle">{{ 'auth.login.subtitle' | translate }}</p>
      </div>

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
        <!-- Email -->
        <div class="form-group">
          <label for="email" class="form-label">{{ 'auth.login.email' | translate }}</label>
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
              [placeholder]="'auth.login.emailPlaceholder' | translate"
              [class.error]="isFieldInvalid('email')">
          </div>
          @if (isFieldInvalid('email')) {
            <span class="error-message">
              @if (loginForm.get('email')?.errors?.['required']) {
                {{ 'auth.login.errors.emailRequired' | translate }}
              } @else if (loginForm.get('email')?.errors?.['email']) {
                {{ 'auth.login.errors.emailInvalid' | translate }}
              }
            </span>
          }
        </div>

        <!-- Password -->
        <div class="form-group">
          <div class="label-row">
            <label for="password" class="form-label">{{ 'auth.login.password' | translate }}</label>
            <a routerLink="/auth/forgot-password" class="forgot-link">{{ 'auth.login.forgotPassword' | translate }}</a>
          </div>
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
              [placeholder]="'auth.login.passwordPlaceholder' | translate"
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
            <span class="error-message">{{ 'auth.login.errors.passwordRequired' | translate }}</span>
          }
        </div>

        <!-- Remember Me -->
        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" formControlName="rememberMe">
            <span class="checkbox-text">{{ 'auth.login.rememberMe' | translate }}</span>
          </label>
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
          [disabled]="isLoading() || loginForm.invalid">
          @if (isLoading()) {
            <span class="spinner"></span>
            {{ 'auth.login.submitting' | translate }}
          } @else {
            {{ 'auth.login.submit' | translate }}
          }
        </button>
      </form>

      <div class="login-footer">
        <p>
          {{ 'auth.login.noAccount' | translate }}
          <a routerLink="/auth/register" class="link">{{ 'auth.login.register' | translate }}</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .login-card {
      width: 100%;
      min-width: 450px;
      background-color: var(--bg-primary);
      border-radius: var(--radius-xl);
      padding: 48px;
      box-shadow: var(--shadow-lg);
    }

    .login-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .login-title {
      font-size: var(--font-size-2xl);
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 8px;
    }

    .login-subtitle {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin-bottom: 0;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 0;
    }

    .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .form-label {
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--text-primary);
    }

    .forgot-link {
      font-size: 13px;
      color: var(--primary-600);
      text-decoration: none;
    }

    .forgot-link:hover {
      color: var(--primary-700);
      text-decoration: underline;
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
      padding: 12px 14px 12px 44px;
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

    .checkbox-group {
      flex-direction: row;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }

    .checkbox-label input {
      width: 18px;
      height: 18px;
      accent-color: var(--primary-600);
    }

    .checkbox-text {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
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

    .login-footer {
      text-align: center;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid var(--border-light);
    }

    .login-footer p {
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
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly authState = inject(AuthStateService);
  private readonly uiState = inject(UIStateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  showPassword = signal(false);
  isLoading = signal(false);
  error = signal<string | null>(null);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [false]
  });

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    this.authService.login(this.loginForm.value as ILoginRequest).subscribe({
      next: (response: ILoginResponse) => {
        this.isLoading.set(false);
        if (response.succeeded) {
          // Determine redirect URL based on user role from response
          const returnUrl = this.route.snapshot.queryParams['returnUrl'];
          let targetUrl = returnUrl || '/dashboard';

          // Check roles directly from response to avoid timing issues with state
          const userRoles = response.user?.roles ?? [];
          const isCustomer = userRoles.includes(UserRole.Customer);
          const isAdminOrManager = userRoles.includes(UserRole.Admin) || userRoles.includes(UserRole.Manager);

          // If no explicit return URL, redirect customers to portal
          if (!returnUrl && isCustomer && !isAdminOrManager) {
            targetUrl = '/portal';
          }

          this.router.navigateByUrl(targetUrl);
          this.uiState.showSuccess('Dobro došli!', 'Uspješno ste se prijavili.');
        } else {
          this.error.set(response.message || 'Prijava nije uspjela');
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        if (err.status === 401) {
          this.error.set('Pogrešan email ili lozinka');
        } else if (err.status === 403) {
          this.error.set('Vaš račun je blokiran. Kontaktirajte podršku.');
        } else {
          this.error.set('Greška pri prijavi. Molimo pokušajte ponovo.');
        }
      }
    });
  }
}
