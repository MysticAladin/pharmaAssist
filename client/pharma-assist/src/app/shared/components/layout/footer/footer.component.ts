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
          <span class="footer-link" (click)="showComingSoon('Privatnost')">Privatnost</span>
          <span class="separator">•</span>
          <span class="footer-link" (click)="showComingSoon('Uslovi korištenja')">Uslovi korištenja</span>
          <span class="separator">•</span>
          <a href="mailto:podrska@pharmaassist.ba" class="footer-link">Podrška</a>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      padding: 16px 24px;
      background-color: var(--footer-bg, #fff);
      border-top: 1px solid var(--border-color);
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
      color: var(--text-muted);
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
      cursor: pointer;
    }

    .footer-link:hover {
      color: var(--primary);
    }

    .separator {
      color: var(--text-muted);
    }

    /* Dark mode */
    :host-context(.dark) .footer {
      background-color: var(--footer-bg-dark);
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

  showComingSoon(page: string): void {
    alert(`${page} stranica je u pripremi.`);
  }
}
