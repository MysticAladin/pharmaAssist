import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="error-page">
      <div class="error-content">
        <div class="error-icon">
          <i class="icon-lock"></i>
        </div>
        <h1>Pristup odbijen</h1>
        <p>Nemate dozvolu za pristup ovoj stranici.</p>
        <div class="error-actions">
          <a routerLink="/dashboard" class="btn btn-primary">
            <i class="icon-home"></i>
            Nazad na kontrolnu ploču
          </a>
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
      background-color: #f8fafc;
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
      background-color: #fef2f2;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .error-icon i {
      font-size: 40px;
      color: #ef4444;
    }

    h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 12px;
    }

    p {
      font-size: 16px;
      color: #64748b;
      margin-bottom: 32px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background-color: #3b82f6;
      color: #fff;
    }

    .btn-primary:hover {
      background-color: #2563eb;
    }
  `]
})
export class AccessDeniedComponent {}
