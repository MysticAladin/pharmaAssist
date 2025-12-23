import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './auth-layout-component/auth-layout.component.html',
  styleUrl: './auth-layout-component/auth-layout.component.scss'
})
export class AuthLayoutComponent {
  currentYear = new Date().getFullYear();
}
