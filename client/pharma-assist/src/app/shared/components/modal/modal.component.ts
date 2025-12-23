import { Component, Input, Output, EventEmitter, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './modal-component/modal.component.html',
  styleUrls: ['./modal-component/modal.component.scss']
})
export class ModalComponent {
  @Input() title = '';
  @Input('isOpen') set isOpenInput(value: boolean) { this.isOpen.set(value); }
  @Input() set open(value: boolean) { this.isOpen.set(value); }
  @Input('size') set modalSize(value: 'sm' | 'md' | 'lg' | 'xl' | 'small' | 'medium' | 'large') {
    // Map alternative size names
    const sizeMap: Record<string, 'sm' | 'md' | 'lg' | 'xl'> = { small: 'sm', medium: 'md', large: 'lg' };
    this.size.set(sizeMap[value as string] || (value as 'sm' | 'md' | 'lg' | 'xl'));
  }
  @Input() set closeOnOverlay(value: boolean) { this.closeOnOverlayClick.set(value); }
  @Input() set closeOnEscape(value: boolean) { this.closeOnEsc.set(value); }
  @Input() set hasCloseButton(value: boolean) { this.showCloseButton.set(value); }
  @Input() set hasFooter(value: boolean) { this.showFooter.set(value); }

  @Output() openChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();
  @Output() closeModal = new EventEmitter<void>();

  isOpen = signal(false);
  size = signal<'sm' | 'md' | 'lg' | 'xl'>('md');
  closeOnOverlayClick = signal(true);
  closeOnEsc = signal(true);
  showCloseButton = signal(true);
  showFooter = signal(true);

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen() && this.closeOnEsc()) {
      this.close();
    }
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && this.closeOnOverlayClick()) {
      this.close();
    }
  }

  close(): void {
    this.isOpen.set(false);
    this.openChange.emit(false);
    this.closed.emit();
    this.closeModal.emit();
  }
}
