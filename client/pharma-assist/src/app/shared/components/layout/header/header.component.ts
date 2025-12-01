import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { UIStateService } from '../../../../core/state/ui-state.service';
import { AuthStateService } from '../../../../core/state/auth-state.service';
import { AuthService } from '../../../../core/services/auth.service';
import { TranslationService } from '../../../../core/services/translation.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <header class="header">
      <!-- Mobile Menu Toggle -->
      <button
        class="mobile-menu-btn"
        (click)="uiState.toggleMobileSidebar()"
        aria-label="Toggle menu">
        <i class="icon-menu"></i>
      </button>

      <!-- Search -->
      <div class="header-search">
        <i class="icon-search"></i>
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
            <i [class]="uiState.darkMode() ? 'icon-sun' : 'icon-moon'"></i>
          </button>

          <!-- Notifications -->
          <button
            class="action-btn has-badge"
            (click)="toggleNotifications()"
            [attr.aria-label]="'header.notifications' | translate">
            <i class="icon-bell"></i>
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
          <i class="icon-chevron-down"></i>

          <!-- Dropdown -->
          @if (isUserMenuOpen) {
            <div class="user-dropdown">
              <a routerLink="/profile" class="dropdown-item">
                <i class="icon-user"></i>
                {{ 'header.profile' | translate }}
              </a>
              <a routerLink="/settings" class="dropdown-item">
                <i class="icon-settings"></i>
                {{ 'header.settings' | translate }}
              </a>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item text-danger" (click)="logout()">
                <i class="icon-log-out"></i>
                {{ 'header.logout' | translate }}
              </button>
            </div>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 24px;
      background-color: var(--header-bg, #fff);
      border-bottom: 1px solid var(--border-color, #e2e8f0);
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
      background-color: var(--input-bg, #f1f5f9);
      border-radius: 8px;
    }

    .header-search i {
      color: var(--text-muted, #64748b);
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
      color: var(--text-secondary, #475569);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background-color: var(--hover-bg, #f1f5f9);
      color: var(--text-primary);
    }

    .action-btn.has-badge .badge {
      position: absolute;
      top: 6px;
      right: 6px;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      background-color: #ef4444;
      color: #fff;
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
      background-color: var(--primary, #3b82f6);
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
      color: #ef4444;
    }

    .dropdown-item.text-danger i {
      color: #ef4444;
    }

    .dropdown-divider {
      height: 1px;
      background-color: var(--border-color);
      margin: 8px 0;
    }

    /* Dark mode */
    :host-context(.dark) .header {
      background-color: var(--header-bg-dark, #1e293b);
      border-color: var(--border-dark, #334155);
    }

    :host-context(.dark) .header-search {
      background-color: var(--input-bg-dark, #0f172a);
    }

    :host-context(.dark) .search-input {
      color: #f8fafc;
    }

    :host-context(.dark) .user-dropdown {
      background-color: #1e293b;
      border-color: #334155;
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
