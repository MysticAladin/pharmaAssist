import { Component, inject, HostBinding, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { NotificationsComponent } from '../notifications/notifications.component';
import { LoadingOverlayComponent } from '../loading-overlay/loading-overlay.component';
import { KeyboardShortcutsHelpComponent } from '../../keyboard-shortcuts-help/keyboard-shortcuts-help.component';
import { CommandPaletteComponent } from '../../command-palette/command-palette.component';
import { TourOverlayComponent } from '../../tour-overlay/tour-overlay.component';
import { HelpPanelComponent } from '../../help-panel/help-panel.component';

import { UIStateService } from '../../../../core/state/ui-state.service';
import { AuthStateService } from '../../../../core/state/auth-state.service';
import { KeyboardService, setCommandPaletteService } from '../../../../core/services/keyboard.service';
import { CommandPaletteService } from '../../../../core/services/command-palette.service';
import { HelpService } from '../../../../core/services/help.service';

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
    LoadingOverlayComponent,
    KeyboardShortcutsHelpComponent,
    CommandPaletteComponent,
    TourOverlayComponent,
    HelpPanelComponent
  ],
  template: `
    <div class="app-container" [class.sidebar-collapsed]="uiState.sidebarCollapsed()">
      <!-- Loading Overlay -->
      <app-loading-overlay />

      <!-- Notifications Toast Container -->
      <app-notifications />

      <!-- Keyboard Shortcuts Help -->
      <app-keyboard-shortcuts-help />

      <!-- Command Palette -->
      <app-command-palette />

      <!-- Tour Overlay -->
      <app-tour-overlay />

      <!-- Help Panel -->
      <app-help-panel />

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
export class MainLayoutComponent implements OnInit {
  readonly uiState = inject(UIStateService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly keyboardService = inject(KeyboardService);
  private readonly commandPaletteService = inject(CommandPaletteService);

  @HostBinding('class.dark')
  get isDarkMode(): boolean {
    return this.uiState.darkMode();
  }

  ngOnInit(): void {
    // Connect command palette service to keyboard service
    setCommandPaletteService(this.commandPaletteService);
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
