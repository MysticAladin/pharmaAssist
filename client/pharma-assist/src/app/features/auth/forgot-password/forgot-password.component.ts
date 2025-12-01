import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="forgot-card">
      <h2>Zaboravljena lozinka</h2>
      <p>Funkcionalnost je u razvoju...</p>
      <a routerLink="/auth/login">Nazad na prijavu</a>
    </div>
  `,
  styles: [`
    .forgot-card {
      padding: 40px;
      background: #fff;
      border-radius: 16px;
      max-width: 420px;
      width: 100%;
    }
  `]
})
export class ForgotPasswordComponent {}
