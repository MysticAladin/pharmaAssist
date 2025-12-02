import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationToastComponent } from './shared/components/notification-toast';
import { GlobalConfirmDialogComponent } from './shared/global-confirm-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationToastComponent, GlobalConfirmDialogComponent],
  template: `
    <router-outlet></router-outlet>
    <app-notification-toast />
    <app-global-confirm-dialog />
  `,
  styles: []
})
export class AppComponent {
  title = 'PharmaAssist';
}
