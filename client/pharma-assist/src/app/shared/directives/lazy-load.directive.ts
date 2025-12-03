import {
  Directive,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  inject,
  OnInit,
  OnDestroy,
  signal,
  effect
} from '@angular/core';

/**
 * Lazy Loading Image Directive
 * Uses Intersection Observer for efficient image loading
 *
 * Usage:
 * <img appLazyLoad [src]="imageSrc" [placeholder]="placeholderSrc" />
 */
@Directive({
  selector: 'img[appLazyLoad]',
  standalone: true,
  host: {
    '[src]': 'currentSrc()',
    '[class.lazy-loading]': 'isLoading()',
    '[class.lazy-loaded]': 'isLoaded()',
    '[class.lazy-error]': 'hasError()',
    '(error)': 'onError()'
  }
})
export class LazyLoadDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef<HTMLImageElement>);
  private observer: IntersectionObserver | null = null;

  // Inputs
  @Input() src: string = '';
  @Input() placeholder: string = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiM5OTkiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+';
  @Input() errorPlaceholder: string = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZlYmVlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiNlNTM5MzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yPC90ZXh0Pjwvc3ZnPg==';
  @Input() threshold: number = 0.1;
  @Input() rootMargin: string = '50px';

  // Outputs
  @Output() imageLoaded = new EventEmitter<void>();
  @Output() imageError = new EventEmitter<void>();

  // State
  currentSrc = signal<string>('');
  isLoading = signal(true);
  isLoaded = signal(false);
  hasError = signal(false);

  ngOnInit() {
    this.currentSrc.set(this.placeholder);
    this.setupObserver();
  }

  ngOnDestroy() {
    this.disconnectObserver();
  }

  private setupObserver() {
    if (!('IntersectionObserver' in window)) {
      // Fallback for browsers without IntersectionObserver
      this.loadImage();
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadImage();
            this.disconnectObserver();
          }
        });
      },
      {
        threshold: this.threshold,
        rootMargin: this.rootMargin
      }
    );

    this.observer.observe(this.el.nativeElement);
  }

  private disconnectObserver() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  private loadImage() {
    if (!this.src) {
      this.hasError.set(true);
      this.isLoading.set(false);
      return;
    }

    // Preload image
    const img = new Image();
    img.onload = () => {
      this.currentSrc.set(this.src);
      this.isLoading.set(false);
      this.isLoaded.set(true);
      this.imageLoaded.emit();
    };
    img.onerror = () => {
      this.onError();
    };
    img.src = this.src;
  }

  onError() {
    this.currentSrc.set(this.errorPlaceholder);
    this.isLoading.set(false);
    this.hasError.set(true);
    this.imageError.emit();
  }
}

/**
 * Lazy Load Container Directive
 * Delays rendering of content until it's near the viewport
 *
 * Usage:
 * <div appLazyContainer (visible)="loadContent()">
 *   @if (contentLoaded) {
 *     <heavy-component />
 *   }
 * </div>
 */
@Directive({
  selector: '[appLazyContainer]',
  standalone: true
})
export class LazyContainerDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef);
  private observer: IntersectionObserver | null = null;

  @Input() threshold: number = 0;
  @Input() rootMargin: string = '100px';
  @Input() once: boolean = true;

  @Output() visible = new EventEmitter<boolean>();

  private isVisible = signal(false);

  ngOnInit() {
    this.setupObserver();
  }

  ngOnDestroy() {
    this.disconnectObserver();
  }

  private setupObserver() {
    if (!('IntersectionObserver' in window)) {
      this.visible.emit(true);
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const wasVisible = this.isVisible();
          this.isVisible.set(entry.isIntersecting);

          if (entry.isIntersecting && !wasVisible) {
            this.visible.emit(true);
            if (this.once) {
              this.disconnectObserver();
            }
          } else if (!entry.isIntersecting && wasVisible && !this.once) {
            this.visible.emit(false);
          }
        });
      },
      {
        threshold: this.threshold,
        rootMargin: this.rootMargin
      }
    );

    this.observer.observe(this.el.nativeElement);
  }

  private disconnectObserver() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
