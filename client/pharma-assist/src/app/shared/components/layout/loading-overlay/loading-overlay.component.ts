import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UIStateService } from '../../../../core/state/ui-state.service';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (uiState.globalLoading()) {
      <div class="loading-overlay">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <span class="loading-text">Učitavanje...</span>
        </div>
      </div>
    }
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      inset: 0;
      background-color: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e2e8f0;
      border-top-color: var(--brand-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .loading-text {
      font-size: 14px;
      font-weight: 500;
      color: #475569;
    }

    /* Dark mode */
    :host-context(.dark) .loading-overlay {
      background-color: rgba(15, 23, 42, 0.8);
    }

    :host-context(.dark) .spinner {
      border-color: var(--surface-dark-elevated);
      border-top-color: var(--brand-primary);
    }

    :host-context(.dark) .loading-text {
      color: var(--text-muted);
    }
  `]
})
export class LoadingOverlayComponent {
  readonly uiState = inject(UIStateService);
}
