import { Injectable, signal, computed } from '@angular/core';
import { Subject } from 'rxjs';

export type ConfirmVariant = 'danger' | 'warning' | 'info';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

export interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  private readonly _state = signal<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'common.confirm',
    cancelText: 'common.cancel',
    variant: 'danger'
  });

  private confirmSubject = new Subject<boolean>();

  readonly state = computed(() => this._state());
  readonly isOpen = computed(() => this._state().isOpen);

  /**
   * Opens a confirmation dialog and returns a promise that resolves to true if confirmed,
   * false if cancelled.
   */
  confirm(options: ConfirmOptions): Promise<boolean> {
    this._state.set({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText || 'common.confirm',
      cancelText: options.cancelText || 'common.cancel',
      variant: options.variant || 'danger'
    });

    return new Promise((resolve) => {
      const subscription = this.confirmSubject.subscribe((result) => {
        subscription.unsubscribe();
        resolve(result);
      });
    });
  }

  /**
   * Shorthand for a delete confirmation dialog
   */
  confirmDelete(itemName?: string): Promise<boolean> {
    return this.confirm({
      title: 'common.confirmDelete',
      message: itemName
        ? `common.confirmDeleteMessage`
        : 'common.confirmMessage',
      confirmText: 'common.delete',
      variant: 'danger'
    });
  }

  /**
   * Called when user clicks the confirm button
   */
  handleConfirm(): void {
    this._state.update(s => ({ ...s, isOpen: false }));
    this.confirmSubject.next(true);
  }

  /**
   * Called when user clicks cancel or closes the dialog
   */
  handleCancel(): void {
    this._state.update(s => ({ ...s, isOpen: false }));
    this.confirmSubject.next(false);
  }
}
