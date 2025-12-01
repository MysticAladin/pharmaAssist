import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="register-card">
      <h2>Registracija</h2>
      <p>Registracija je u razvoju...</p>
      <a routerLink="/auth/login">Nazad na prijavu</a>
    </div>
  `,
  styles: [`
    .register-card {
      padding: 40px;
      background: #fff;
      border-radius: 16px;
      max-width: 420px;
      width: 100%;
    }
  `]
})
export class RegisterComponent {}
