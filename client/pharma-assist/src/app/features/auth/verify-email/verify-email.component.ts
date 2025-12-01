import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `<div class="card"><h2>Verifikacija emaila</h2><p>U razvoju...</p></div>`,
  styles: [`.card { padding: 40px; background: #fff; border-radius: 16px; }`]
})
export class VerifyEmailComponent {}
