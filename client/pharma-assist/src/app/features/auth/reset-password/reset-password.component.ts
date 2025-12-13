import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `<div class="card"><h2>Reset lozinke</h2><p>U razvoju...</p></div>`,
  styles: [`.card { padding: 40px; background: var(--surface-primary); border-radius: 16px; }`]
})
export class ResetPasswordComponent {}
