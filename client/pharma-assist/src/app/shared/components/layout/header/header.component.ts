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
  templateUrl: './header-component/header.component.html',
  styleUrls: ['./header-component/header.component.scss']
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
