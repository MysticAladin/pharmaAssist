import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthStateService } from '../../core/state/auth-state.service';
import { UserRole } from '../../core/models/user.model';

@Component({
  selector: 'app-visits-home',
  standalone: true,
  template: ''
})
export class VisitsHomeComponent implements OnInit {
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (this.authState.hasRole(UserRole.SalesRep)) {
      this.router.navigate(['/visits/today']);
      return;
    }

    if (this.authState.hasAnyRole([UserRole.Manager, UserRole.Admin, UserRole.SuperAdmin])) {
      this.router.navigate(['/visits/team']);
      return;
    }

    this.router.navigate(['/dashboard']);
  }
}
