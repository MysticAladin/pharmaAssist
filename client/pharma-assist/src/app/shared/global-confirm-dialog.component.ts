import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ConfirmationService } from '../core/services/confirmation.service';
import { ModalComponent } from './components/modal';

@Component({
  selector: 'app-global-confirm-dialog',
  standalone: true,
  imports: [CommonModule, TranslateModule, ModalComponent],
  templateUrl: './global-confirm-dialog-component/global-confirm-dialog.component.html',
  styleUrls: ['./global-confirm-dialog-component/global-confirm-dialog.component.scss']
})
export class GlobalConfirmDialogComponent {
  private readonly confirmationService = inject(ConfirmationService);

  state = this.confirmationService.state;

  onOpenChange(isOpen: boolean): void {
    if (!isOpen) {
      this.onCancel();
    }
  }

  onConfirm(): void {
    this.confirmationService.handleConfirm();
  }

  onCancel(): void {
    this.confirmationService.handleCancel();
  }
}
