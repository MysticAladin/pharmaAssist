import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div class="auth-container">
      <!-- Left side - Branding -->
      <div class="auth-branding">
        <div class="branding-content">
          <div class="logo-container">
            <div class="logo-icon">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="24" r="22" stroke="currentColor" stroke-width="2" fill="none"/>
                <path d="M24 12v24M12 24h24" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                <circle cx="24" cy="24" r="8" fill="currentColor" opacity="0.3"/>
              </svg>
            </div>
            <span class="logo-text">{{ 'common.appName' | translate }}</span>
          </div>

          <h1 class="branding-title">{{ 'auth.branding.title' | translate }}</h1>
          <p class="branding-subtitle">{{ 'auth.branding.subtitle' | translate }}</p>

          <div class="features-list">
            <div class="feature-item">
              <div class="feature-icon">✓</div>
              <span>{{ 'auth.branding.features.inventory' | translate }}</span>
            </div>
            <div class="feature-item">
              <div class="feature-icon">✓</div>
              <span>{{ 'auth.branding.features.orders' | translate }}</span>
            </div>
            <div class="feature-item">
              <div class="feature-icon">✓</div>
              <span>{{ 'auth.branding.features.reports' | translate }}</span>
            </div>
            <div class="feature-item">
              <div class="feature-icon">✓</div>
              <span>{{ 'auth.branding.features.compliance' | translate }}</span>
            </div>
          </div>
        </div>

        <div class="branding-footer">
          <p>{{ 'auth.branding.copyright' | translate: { year: currentYear } }}</p>
        </div>
      </div>

      <!-- Right side - Auth Form -->
      <div class="auth-form-container">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      min-height: 100vh;
      font-family: var(--font-family);
    }

    /* Left Branding Section */
    .auth-branding {
      flex: 1;
      background: linear-gradient(135deg, var(--primary-700) 0%, var(--primary-500) 50%, var(--primary-400) 100%);
      color: var(--text-light);
      display: flex;
      flex-direction: column;
      padding: 48px;
      position: relative;
      overflow: hidden;
    }

    .auth-branding::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%);
    }

    .branding-content {
      position: relative;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      max-width: 520px;
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 40px;
    }

    .logo-icon {
      width: 56px;
      height: 56px;
      color: var(--text-light);
    }

    .logo-icon svg {
      width: 100%;
      height: 100%;
    }

    .logo-text {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .branding-title {
      font-size: var(--font-size-3xl);
      font-weight: 700;
      margin-bottom: 16px;
      line-height: 1.2;
    }

    .branding-subtitle {
      font-size: var(--font-size-lg);
      line-height: 1.7;
      opacity: 0.9;
      margin-bottom: 48px;
    }

    .features-list {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: var(--font-size-base);
    }

    .feature-icon {
      width: 28px;
      height: 28px;
      background-color: rgba(255, 255, 255, 0.2);
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .branding-footer {
      position: relative;
      font-size: var(--font-size-sm);
      opacity: 0.7;
      margin-top: auto;
      padding-top: 32px;
    }

    .branding-footer p {
      margin: 0;
      color: inherit;
    }

    /* Right Form Section */
    .auth-form-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px;
      background-color: var(--bg-secondary);
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .auth-branding {
        display: none;
      }

      .auth-form-container {
        padding: 24px;
      }
    }
  `]
})
export class AuthLayoutComponent {
  currentYear = new Date().getFullYear();
}
