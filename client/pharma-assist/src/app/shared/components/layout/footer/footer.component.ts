import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-left">
          <span>© {{ currentYear }} PharmaAssist d.o.o. Sva prava zadržana.</span>
        </div>
        <div class="footer-right">
          <a href="/privacy" class="footer-link">Privatnost</a>
          <span class="separator">•</span>
          <a href="/terms" class="footer-link">Uslovi korištenja</a>
          <span class="separator">•</span>
          <a href="/support" class="footer-link">Podrška</a>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      padding: 16px 24px;
      background-color: var(--footer-bg, #fff);
      border-top: 1px solid var(--border-color, #e2e8f0);
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .footer-left {
      font-size: 13px;
      color: var(--text-muted, #64748b);
    }

    .footer-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .footer-link {
      font-size: 13px;
      color: var(--text-muted);
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .footer-link:hover {
      color: var(--primary, #3b82f6);
    }

    .separator {
      color: var(--text-muted);
    }

    /* Dark mode */
    :host-context(.dark) .footer {
      background-color: var(--footer-bg-dark, #1e293b);
      border-color: var(--border-dark, #334155);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .footer {
        padding: 12px 16px;
      }

      .footer-content {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
