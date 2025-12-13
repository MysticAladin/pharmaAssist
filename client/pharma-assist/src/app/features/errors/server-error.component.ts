import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-server-error',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="error-page">
      <div class="error-content">
        <div class="error-icon">
          <i class="icon-alert-triangle"></i>
        </div>
        <h1>Greška na serveru</h1>
        <p>Došlo je do neočekivane greške. Naš tim je obaviješten i radi na rješavanju problema.</p>
        <div class="error-actions">
          <a routerLink="/dashboard" class="btn btn-primary">
            <i class="icon-home"></i>
            Nazad na kontrolnu ploču
          </a>
          <button type="button" class="btn btn-secondary" (click)="refresh()">
            <i class="icon-refresh"></i>
            Pokušaj ponovo
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .error-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--surface-secondary);
      padding: 20px;
    }

    .error-content {
      text-align: center;
      max-width: 400px;
    }

    .error-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      background-color: var(--status-pending-bg);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .error-icon i {
      font-size: 40px;
      color: var(--color-warning);
    }

    h1 {
      font-size: 28px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 12px;
    }

    p {
      font-size: 16px;
      color: var(--text-secondary);
      margin-bottom: 32px;
    }

    .error-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    @media (min-width: 480px) {
      .error-actions {
        flex-direction: row;
        justify-content: center;
      }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
      border: none;
      cursor: pointer;
    }

    .btn-primary {
      background-color: var(--brand-primary);
      color: #fff;
    }

    .btn-primary:hover {
      background-color: var(--brand-primary-dark);
    }

    .btn-secondary {
      background-color: var(--surface-primary);
      color: var(--text-secondary);
      border: 1px solid var(--border-light);
    }

    .btn-secondary:hover {
      background-color: var(--surface-secondary);
      color: var(--text-primary);
    }
  `]
})
export class ServerErrorComponent {
  refresh(): void {
    window.location.reload();
  }
}
