import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthStateService } from '../../core/state/auth-state.service';
import { UserRole } from '../../core/models/user.model';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './access-denied-component/access-denied.component.html',
  styleUrl: './access-denied-component/access-denied.component.scss'
})
export class AccessDeniedComponent {
  private authState = inject(AuthStateService);

  homeRoute = computed(() => {
    if (this.authState.hasRole(UserRole.Customer)) {
      return '/portal';
    }
    return '/dashboard';
  });

  homeLabel = computed(() => {
    if (this.authState.hasRole(UserRole.Customer)) {
      return 'Nazad na portal';
    }
    return 'Nazad na kontrolnu ploču';
  });
}
