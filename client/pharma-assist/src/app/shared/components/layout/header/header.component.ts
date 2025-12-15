import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { UIStateService } from '../../../../core/state/ui-state.service';
import { AuthStateService } from '../../../../core/state/auth-state.service';
import { AuthService } from '../../../../core/services/auth.service';
import { TranslationService } from '../../../../core/services/translation.service';
import { NotificationPanelComponent } from '../../../components/notification-panel/notification-panel.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, NotificationPanelComponent],
  template: `
    <header class="header">
      <!-- Mobile Menu Toggle -->
      <button
        class="mobile-menu-btn"
        (click)="uiState.toggleMobileSidebar()"
        aria-label="Toggle menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      <!-- Search -->
      <div class="header-search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          [placeholder]="'header.search' | translate"
          class="search-input">
      </div>

      <!-- Right Section -->
      <div class="header-right">
        <!-- Quick Actions -->
        <div class="header-actions">
          <!-- Language Toggle -->
          <button
            class="action-btn"
            (click)="translationService.toggleLanguage()"
            [attr.aria-label]="'header.language' | translate">
            <span class="lang-flag">{{ translationService.getCurrentLanguageOption().flag }}</span>
          </button>

          <!-- Theme Toggle -->
          <button
            class="action-btn"
            (click)="uiState.toggleDarkMode()"
            [attr.aria-label]="uiState.darkMode() ? ('header.lightMode' | translate) : ('header.darkMode' | translate)">
            @if (uiState.darkMode()) {
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            } @else {
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            }
          </button>

          <!-- Notifications -->
          <button
            class="action-btn has-badge"
            (click)="toggleNotifications()"
            [attr.aria-label]="'header.notifications' | translate">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span class="badge">3</span>
          </button>
        </div>

        <!-- User Menu -->
        <div class="user-menu" (click)="toggleUserMenu()">
          <div class="user-avatar">
            @if (currentUser()?.avatar) {
              <img [src]="currentUser()?.avatar" [alt]="currentUser()?.firstName">
            } @else {
              <span class="avatar-initials">{{ getInitials() }}</span>
            }
          </div>
          <div class="user-info">
            <span class="user-name">{{ currentUser()?.firstName }} {{ currentUser()?.lastName }}</span>
            <span class="user-role">{{ getUserRole() | titlecase }}</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>

          <!-- Dropdown -->
          @if (isUserMenuOpen) {
            <div class="user-dropdown">
              <a routerLink="/profile" class="dropdown-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                {{ 'header.profile' | translate }}
              </a>
              <a routerLink="/settings" class="dropdown-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                {{ 'header.settings' | translate }}
              </a>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item text-danger" (click)="logout()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                {{ 'header.logout' | translate }}
              </button>
            </div>
          }
        </div>
      </div>
    </header>

    <!-- Notification Panel -->
    <app-notification-panel
      [isOpen]="isNotificationsOpen"
      (closed)="isNotificationsOpen = false">
    </app-notification-panel>
  `,
  styles: [`
    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 24px;
      background-color: var(--header-bg, #fff);
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 30;
    }

    .mobile-menu-btn {
      display: none;
      background: none;
      border: none;
      font-size: 24px;
      color: var(--text-primary);
      cursor: pointer;
      padding: 8px;
    }

    /* Search */
    .header-search {
      flex: 1;
      max-width: 400px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 16px;
      background-color: var(--input-bg);
      border-radius: 8px;
    }

    .header-search i {
      color: var(--text-muted);
    }

    .search-input {
      flex: 1;
      border: none;
      background: none;
      font-size: 14px;
      color: var(--text-primary);
      outline: none;
    }

    .search-input::placeholder {
      color: var(--text-muted);
    }

    /* Right Section */
    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-left: auto;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .action-btn {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: none;
      border: none;
      border-radius: 8px;
      font-size: 20px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background-color: var(--hover-bg);
      color: var(--text-primary);
    }

    .action-btn.has-badge .badge {
      position: absolute;
      top: 6px;
      right: 6px;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      background-color: var(--color-error);
      color: var(--text-on-primary);
      font-size: 10px;
      font-weight: 600;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .lang-flag {
      font-size: 18px;
      line-height: 1;
    }

    /* User Menu */
    .user-menu {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .user-menu:hover {
      background-color: var(--hover-bg);
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .user-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-initials {
      color: #fff;
      font-size: 14px;
      font-weight: 600;
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .user-role {
      font-size: 12px;
      color: var(--text-muted);
    }

    /* Dropdown */
    .user-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      min-width: 200px;
      background-color: var(--dropdown-bg, #fff);
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      border: 1px solid var(--border-color);
      padding: 8px;
      z-index: 50;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 8px;
      color: var(--text-primary);
      text-decoration: none;
      font-size: 14px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
    }

    .dropdown-item:hover {
      background-color: var(--hover-bg);
    }

    .dropdown-item i {
      font-size: 18px;
      color: var(--text-muted);
    }

    .dropdown-item.text-danger {
      color: var(--color-error);
    }

    .dropdown-item.text-danger i {
      color: var(--color-error);
    }

    .dropdown-divider {
      height: 1px;
      background-color: var(--border-color);
      margin: 8px 0;
    }

    /* Dark mode */
    :host-context(.dark) .header {
      background-color: var(--header-bg-dark);
      border-color: var(--border-dark, #334155);
    }

    :host-context(.dark) .header-search {
      background-color: var(--input-bg-dark, #0f172a);
    }

    :host-context(.dark) .search-input {
      color: var(--neutral-50);
    }

    :host-context(.dark) .user-dropdown {
      background-color: var(--surface-dark);
      border-color: var(--surface-dark-elevated);
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .mobile-menu-btn {
        display: flex;
      }

      .user-info {
        display: none;
      }

      .header-search {
        display: none;
      }
    }

    @media (max-width: 768px) {
      .header {
        padding: 12px 16px;
      }
    }
  `]
})
export class HeaderComponent {
  readonly uiState = inject(UIStateService);
  readonly authState = inject(AuthStateService);
  readonly translationService = inject(TranslationService);
  private readonly authService = inject(AuthService);

  isUserMenuOpen = false;
  isNotificationsOpen = false;

  currentUser = this.authState.user;

  getInitials(): string {
    const user = this.currentUser();
    if (!user) return '??';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '??';
  }

  getUserRole(): string {
    const user = this.currentUser();
    if (!user || !user.roles || user.roles.length === 0) return '';
    return user.roles[0]; // Return primary role
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
    if (this.isUserMenuOpen) {
      this.isNotificationsOpen = false;
    }
  }

  toggleNotifications(): void {
    this.isNotificationsOpen = !this.isNotificationsOpen;
    if (this.isNotificationsOpen) {
      this.isUserMenuOpen = false;
    }
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        // Router navigation is handled by auth service
      },
      error: () => {
        // Silent logout on error
        this.authService.silentLogout();
      }
    });
  }
}
