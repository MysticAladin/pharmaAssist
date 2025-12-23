import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-server-error',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './server-error-component/server-error.component.html',
  styleUrl: './server-error-component/server-error.component.scss'
})
export class ServerErrorComponent {
  refresh(): void {
    window.location.reload();
  }
}
