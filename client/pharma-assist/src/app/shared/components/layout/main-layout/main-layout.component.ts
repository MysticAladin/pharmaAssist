import { Component, inject, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { NotificationsComponent } from '../notifications/notifications.component';
import { LoadingOverlayComponent } from '../loading-overlay/loading-overlay.component';

import { UIStateService } from '../../../../core/state/ui-state.service';
import { AuthStateService } from '../../../../core/state/auth-state.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    NotificationsComponent,
    LoadingOverlayComponent
  ],
  template: `
    <div class="app-container" [class.sidebar-collapsed]="uiState.sidebarCollapsed()">
      <!-- Loading Overlay -->
      <app-loading-overlay />

      <!-- Notifications Toast Container -->
      <app-notifications />

      <!-- Mobile Sidebar Overlay -->
      @if (uiState.sidebarMobileOpen()) {
        <div
          class="sidebar-overlay"
          (click)="uiState.closeMobileSidebar()">
        </div>
      }

      <!-- Sidebar -->
      <app-sidebar />

      <!-- Main Content Area -->
      <div class="main-wrapper">
        <!-- Header -->
        <app-header />

        <!-- Page Content -->
        <main class="main-content">
          <router-outlet />
        </main>

        <!-- Footer -->
        <app-footer />
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      min-height: 100vh;
      background-color: var(--bg-primary, #f8fafc);
      transition: all 0.3s ease;
    }

    .sidebar-overlay {
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 40;
      backdrop-filter: blur(2px);
    }

    .main-wrapper {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
      margin-left: 260px;
      transition: margin-left 0.3s ease;
    }

    .app-container.sidebar-collapsed .main-wrapper {
      margin-left: 72px;
    }

    .main-content {
      flex: 1;
      padding: 24px;
      overflow-x: hidden;
    }

    /* Dark mode */
    :host-context(.dark) .app-container {
      background-color: var(--bg-primary-dark, #0f172a);
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .main-wrapper {
        margin-left: 0;
      }

      .app-container.sidebar-collapsed .main-wrapper {
        margin-left: 0;
      }
    }

    @media (max-width: 768px) {
      .main-content {
        padding: 16px;
      }
    }
  `]
})
export class MainLayoutComponent {
  readonly uiState = inject(UIStateService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);

  @HostBinding('class.dark')
  get isDarkMode(): boolean {
    return this.uiState.darkMode();
  }

  constructor() {
    // Close mobile sidebar on navigation
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.uiState.closeMobileSidebar();
    });
  }
}
