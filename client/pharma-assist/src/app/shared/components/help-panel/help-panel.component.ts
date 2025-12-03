import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { HelpService } from '../../../core/services/help.service';

@Component({
  selector: 'app-help-panel',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    @if (helpService.isHelpPanelOpen()) {
      <div class="help-overlay" (click)="helpService.closeHelpPanel()">
        <div class="help-panel" (click)="$event.stopPropagation()">
          <div class="panel-header">
            <h2>{{ 'help.panel.title' | translate }}</h2>
            <button class="close-btn" (click)="helpService.closeHelpPanel()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="panel-content">
            <!-- Quick Actions -->
            <section class="help-section">
              <h3>{{ 'help.panel.quickActions' | translate }}</h3>
              <div class="action-grid">
                <button class="action-card" (click)="startTour('dashboard-tour')">
                  <span class="action-icon">🎯</span>
                  <span class="action-label">{{ 'help.tours.dashboard.name' | translate }}</span>
                </button>
                <button class="action-card" (click)="startTour('products-tour')">
                  <span class="action-icon">💊</span>
                  <span class="action-label">{{ 'help.tours.products.name' | translate }}</span>
                </button>
                <button class="action-card" (click)="showShortcuts()">
                  <span class="action-icon">⌨️</span>
                  <span class="action-label">{{ 'help.panel.keyboardShortcuts' | translate }}</span>
                </button>
                <button class="action-card" (click)="openDocs()">
                  <span class="action-icon">📖</span>
                  <span class="action-label">{{ 'help.panel.documentation' | translate }}</span>
                </button>
              </div>
            </section>

            <!-- Guided Tours -->
            <section class="help-section">
              <h3>{{ 'help.panel.guidedTours' | translate }}</h3>
              <div class="tour-list">
                @for (tour of helpService.availableTours; track tour.id) {
                  <div class="tour-item">
                    <div class="tour-info">
                      <span class="tour-name">{{ tour.name | translate }}</span>
                      <span class="tour-desc">{{ tour.description | translate }}</span>
                    </div>
                    <div class="tour-actions">
                      @if (helpService.completedTours().has(tour.id)) {
                        <span class="completed-badge">✓ {{ 'help.panel.completed' | translate }}</span>
                      }
                      <button class="btn-start" (click)="startTour(tour.id)">
                        {{ helpService.completedTours().has(tour.id) ? ('help.panel.restart' | translate) : ('help.panel.start' | translate) }}
                      </button>
                    </div>
                  </div>
                }
              </div>
            </section>

            <!-- Quick Tips -->
            <section class="help-section">
              <h3>{{ 'help.panel.quickTips' | translate }}</h3>
              <div class="tips-list">
                <div class="tip-item">
                  <span class="tip-icon">💡</span>
                  <span>{{ 'help.tips.commandPalette' | translate }}</span>
                </div>
                <div class="tip-item">
                  <span class="tip-icon">💡</span>
                  <span>{{ 'help.tips.bulkSelect' | translate }}</span>
                </div>
                <div class="tip-item">
                  <span class="tip-icon">💡</span>
                  <span>{{ 'help.tips.darkMode' | translate }}</span>
                </div>
              </div>
            </section>

            <!-- Support -->
            <section class="help-section">
              <h3>{{ 'help.panel.needHelp' | translate }}</h3>
              <div class="support-options">
                <a href="mailto:support@pharmaassist.com" class="support-link">
                  <span class="support-icon">📧</span>
                  <span>{{ 'help.panel.emailSupport' | translate }}</span>
                </a>
                <a href="/docs/faq" class="support-link">
                  <span class="support-icon">❓</span>
                  <span>{{ 'help.panel.faq' | translate }}</span>
                </a>
              </div>
            </section>
          </div>

          <div class="panel-footer">
            <button class="btn-reset" (click)="resetTours()">
              {{ 'help.panel.resetTours' | translate }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .help-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      justify-content: flex-end;
      z-index: 9999;
      animation: fadeIn 0.15s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .help-panel {
      width: 400px;
      max-width: 100%;
      height: 100%;
      background: var(--bg-primary, white);
      box-shadow: -10px 0 40px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      animation: slideIn 0.2s ease-out;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color, #e5e7eb);

      h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
      }
    }

    .close-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      color: var(--text-secondary, #6b7280);
      border-radius: 8px;
      cursor: pointer;

      &:hover {
        background: var(--bg-secondary, #f3f4f6);
        color: var(--text-primary, #111827);
      }
    }

    .panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px 24px;
    }

    .help-section {
      margin-bottom: 24px;

      h3 {
        margin: 0 0 12px;
        font-size: 0.8125rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-secondary, #6b7280);
      }
    }

    .action-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background: var(--bg-secondary, #f9fafb);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        background: var(--primary-light, #eef2ff);
        border-color: var(--primary, #4f46e5);
      }
    }

    .action-icon {
      font-size: 24px;
    }

    .action-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-primary, #111827);
      text-align: center;
    }

    .tour-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .tour-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: var(--bg-secondary, #f9fafb);
      border-radius: 8px;
    }

    .tour-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .tour-name {
      font-weight: 500;
      color: var(--text-primary, #111827);
    }

    .tour-desc {
      font-size: 0.75rem;
      color: var(--text-secondary, #6b7280);
    }

    .tour-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .completed-badge {
      font-size: 0.75rem;
      color: #10b981;
      font-weight: 500;
    }

    .btn-start {
      padding: 6px 12px;
      font-size: 0.75rem;
      font-weight: 500;
      background: var(--primary, #4f46e5);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;

      &:hover {
        background: var(--primary-dark, #4338ca);
      }
    }

    .tips-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .tip-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 0.875rem;
      color: var(--text-secondary, #4b5563);
    }

    .tip-icon {
      flex-shrink: 0;
    }

    .support-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .support-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: var(--bg-secondary, #f9fafb);
      border-radius: 8px;
      text-decoration: none;
      color: var(--text-primary, #111827);
      transition: background 0.15s;

      &:hover {
        background: var(--bg-tertiary, #e5e7eb);
      }
    }

    .support-icon {
      font-size: 18px;
    }

    .panel-footer {
      padding: 16px 24px;
      border-top: 1px solid var(--border-color, #e5e7eb);
    }

    .btn-reset {
      width: 100%;
      padding: 10px;
      font-size: 0.875rem;
      background: transparent;
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 8px;
      color: var(--text-secondary, #6b7280);
      cursor: pointer;

      &:hover {
        background: var(--bg-secondary, #f9fafb);
      }
    }
  `]
})
export class HelpPanelComponent {
  readonly helpService = inject(HelpService);

  startTour(tourId: string): void {
    this.helpService.closeHelpPanel();
    setTimeout(() => this.helpService.startTour(tourId), 300);
  }

  showShortcuts(): void {
    this.helpService.closeHelpPanel();
    // Trigger keyboard shortcuts modal
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '?', shiftKey: true }));
  }

  openDocs(): void {
    window.open('/docs', '_blank');
  }

  resetTours(): void {
    this.helpService.resetAllTours();
  }
}
