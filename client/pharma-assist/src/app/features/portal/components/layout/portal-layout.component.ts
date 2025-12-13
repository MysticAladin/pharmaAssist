import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthStateService } from '../../../../core/state/auth-state.service';
import { CartService } from '../../services/cart.service';
import { KmCurrencyPipe } from '../../../../core/pipes/km-currency.pipe';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-portal-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, TranslateModule, FormsModule, KmCurrencyPipe],
  template: `
    <div class="portal-layout">
      <!-- Top Header -->
      <header class="portal-header">
        <div class="header-container">
          <!-- Logo -->
          <a routerLink="/portal" class="logo">
            <span class="logo-icon">💊</span>
            <span class="logo-text">PharmaAssist</span>
          </a>

          <!-- Search Bar -->
          <div class="search-container">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input
                type="text"
                [placeholder]="'portal.search.placeholder' | translate"
                [(ngModel)]="searchQuery"
                (keyup.enter)="onSearch()"
                class="search-input"
              />
              @if (searchQuery()) {
                <button class="clear-btn" (click)="searchQuery.set('')">✕</button>
              }
            </div>
          </div>

          <!-- Right Actions -->
          <div class="header-actions">
            <!-- Language Toggle -->
            <button class="action-btn" (click)="toggleLanguage()" [title]="'common.language' | translate">
              {{ currentLanguage() === 'en' ? 'BA' : 'EN' }}
            </button>

            <!-- Cart -->
            <a routerLink="/portal/cart" class="cart-btn">
              <span class="cart-icon">🛒</span>
              @if (cartItemCount() > 0) {
                <span class="cart-badge">{{ cartItemCount() }}</span>
              }
              <span class="cart-total">{{ cartTotal() | kmCurrency }}</span>
            </a>

            <!-- User Menu -->
            <div class="user-menu">
              <button class="user-btn" (click)="toggleUserMenu()">
                <span class="user-avatar">{{ userInitials() }}</span>
                <span class="user-name">{{ userName() }}</span>
                <span class="chevron">▼</span>
              </button>

              @if (showUserMenu()) {
                <div class="user-dropdown">
                  <a routerLink="/portal/account" class="dropdown-item" (click)="showUserMenu.set(false)">
                    <span>👤</span> {{ 'portal.account.title' | translate }}
                  </a>
                  <a routerLink="/portal/orders" class="dropdown-item" (click)="showUserMenu.set(false)">
                    <span>📦</span> {{ 'portal.orders.title' | translate }}
                  </a>
                  <a routerLink="/portal/claims" class="dropdown-item" (click)="showUserMenu.set(false)">
                    <span>📋</span> {{ 'portal.claims.title' | translate }}
                  </a>
                  <a routerLink="/portal/favorites" class="dropdown-item" (click)="showUserMenu.set(false)">
                    <span>❤️</span> {{ 'portal.favorites.title' | translate }}
                  </a>
                  <div class="dropdown-divider"></div>
                  <button class="dropdown-item logout" (click)="logout()">
                    <span>🚪</span> {{ 'auth.logout' | translate }}
                  </button>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Category Navigation -->
        <nav class="category-nav">
          <div class="nav-container">
            <a routerLink="/portal/catalog" [class.active]="isAllProductsActive()" class="nav-item">
              {{ 'portal.catalog.all' | translate }}
            </a>
            <a routerLink="/portal/catalog" [queryParams]="{category: 'medications'}" [class.active]="isMedicationsActive()" class="nav-item">
              💊 {{ 'portal.categories.medications' | translate }}
            </a>
            <a routerLink="/portal/catalog" [queryParams]="{category: 'medical-supplies'}" [class.active]="isMedicalSuppliesActive()" class="nav-item">
              🩹 {{ 'portal.categories.medicalSupplies' | translate }}
            </a>
            <a routerLink="/portal/catalog" [queryParams]="{category: 'equipment'}" [class.active]="isEquipmentActive()" class="nav-item">
              🔬 {{ 'portal.categories.equipment' | translate }}
            </a>
            <a routerLink="/portal/quick-order" class="nav-item highlight">
              ⚡ {{ 'portal.quickOrder.title' | translate }}
            </a>
          </div>
        </nav>
      </header>

      <!-- Main Content -->
      <main class="portal-content">
        <router-outlet />
      </main>

      <!-- Footer -->
      <footer class="portal-footer">
        <div class="footer-container">
          <div class="footer-section">
            <h4>{{ 'portal.footer.contact' | translate }}</h4>
            <a href="mailto:orders@pharmaassist.ba" class="contact-link">
              <span class="contact-icon">📧</span> orders&#64;pharmaassist.ba
            </a>
            <a href="tel:+38733123456" class="contact-link">
              <span class="contact-icon">📞</span> +387 33 123 456
            </a>
            <a href="https://maps.google.com/?q=Sarajevo,Bosnia+and+Herzegovina" target="_blank" rel="noopener" class="contact-link">
              <span class="contact-icon">📍</span> Zmaja od Bosne 8, 71000 Sarajevo
            </a>
          </div>
          <div class="footer-section">
            <h4>{{ 'portal.footer.quickLinks' | translate }}</h4>
            <a routerLink="/portal/catalog">{{ 'portal.catalog.title' | translate }}</a>
            <a routerLink="/portal/orders">{{ 'portal.orders.title' | translate }}</a>
            <a routerLink="/portal/account">{{ 'portal.account.title' | translate }}</a>
          </div>
          <div class="footer-section">
            <h4>{{ 'portal.footer.support' | translate }}</h4>
            <a href="#">{{ 'portal.footer.faq' | translate }}</a>
            <a href="#">{{ 'portal.footer.terms' | translate }}</a>
            <a href="#">{{ 'portal.footer.privacy' | translate }}</a>
          </div>
          <div class="footer-section">
            <h4>{{ 'portal.footer.workingHours' | translate }}</h4>
            <p>{{ 'portal.footer.weekdays' | translate }}: 08:00 - 17:00</p>
            <p>{{ 'portal.footer.saturday' | translate }}: 09:00 - 13:00</p>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; {{ currentYear }} PharmaAssist. {{ 'portal.footer.rights' | translate }}</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .portal-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--surface-ground, #f8f9fa);
    }

    .portal-layout.dark {
      --surface-ground: #1a1a2e;
      --surface-card: #16213e;
      --text-color: #e4e4e4;
      --text-secondary: #a0a0a0;
      --primary-color: #4f9cff;
      --border-color: #2d3748;
    }

    /* Header */
    .portal-header {
      background: var(--surface-card, white);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1rem 2rem;
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      color: var(--text-color, #333);
      font-weight: 700;
      font-size: 1.25rem;
    }

    .logo-icon {
      font-size: 1.5rem;
    }

    /* Search */
    .search-container {
      flex: 1;
      max-width: 600px;
    }

    .search-box {
      display: flex;
      align-items: center;
      background: var(--surface-ground);
      border-radius: 8px;
      padding: 0.5rem 1rem;
      border: 2px solid transparent;
      transition: border-color 0.2s;
    }

    .search-box:focus-within {
      border-color: var(--primary-color);
    }

    .search-icon {
      margin-right: 0.5rem;
    }

    .search-input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 1rem;
      color: var(--text-color, #333);
      outline: none;
    }

    .clear-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-secondary, #666);
      padding: 0.25rem;
    }

    /* Header Actions */
    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .action-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 8px;
      transition: background-color 0.2s;
    }

    .action-btn:hover {
      background: var(--surface-ground);
    }

    .cart-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--primary-color);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      position: relative;
    }

    .cart-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: var(--color-error);
      color: white;
      font-size: 0.75rem;
      min-width: 20px;
      height: 20px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .cart-total {
      font-size: 0.875rem;
    }

    /* User Menu */
    .user-menu {
      position: relative;
    }

    .user-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 8px;
      color: var(--text-color, #333);
    }

    .user-btn:hover {
      background: var(--surface-ground);
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      background: var(--primary-color);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .chevron {
      font-size: 0.625rem;
      color: var(--text-secondary, #666);
    }

    .user-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      background: var(--surface-card, white);
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      min-width: 200px;
      padding: 0.5rem;
      margin-top: 0.5rem;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      text-decoration: none;
      color: var(--text-color, #333);
      border-radius: 6px;
      transition: background-color 0.2s;
      width: 100%;
      border: none;
      background: none;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .dropdown-item:hover {
      background: var(--surface-ground);
    }

    .dropdown-item.logout {
      color: var(--color-error);
    }

    .dropdown-divider {
      height: 1px;
      background: var(--border-color);
      margin: 0.5rem 0;
    }

    /* Category Nav */
    .category-nav {
      background: var(--surface-ground);
      border-top: 1px solid var(--border-color);
    }

    .nav-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 2rem;
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
    }

    .nav-item {
      padding: 0.75rem 1rem;
      text-decoration: none;
      color: var(--text-color, #333);
      font-size: 0.875rem;
      white-space: nowrap;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }

    .nav-item:hover,
    .nav-item.active {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
    }

    .nav-item.highlight {
      background: var(--primary-color);
      color: white;
      border-radius: 6px;
      border-bottom: none;
    }

    .nav-item.highlight:hover {
      background: var(--brand-primary-dark);
      color: white;
    }

    /* Content */
    .portal-content {
      flex: 1;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
      padding: 2rem;
    }

    /* Footer */
    .portal-footer {
      background: var(--surface-card, white);
      border-top: 1px solid var(--border-color);
      margin-top: auto;
    }

    .footer-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 3rem 2rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
    }

    .footer-section h4 {
      font-weight: 600;
      margin-bottom: 1rem;
      color: var(--text-color, #333);
    }

    .footer-section p,
    .footer-section a {
      color: var(--text-secondary, #666);
      font-size: 0.875rem;
      line-height: 2;
      text-decoration: none;
      display: block;
    }

    .footer-section a:hover {
      color: var(--primary-color);
    }

    .contact-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: color 0.2s;
    }

    .contact-link:hover {
      color: var(--primary-color);
    }

    .contact-icon {
      font-size: 1rem;
    }

    .footer-bottom {
      text-align: center;
      padding: 1.5rem 2rem;
      border-top: 1px solid var(--border-color);
      color: var(--text-secondary, #666);
      font-size: 0.875rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header-container {
        flex-wrap: wrap;
        padding: 1rem;
        gap: 1rem;
      }

      .search-container {
        order: 3;
        width: 100%;
        max-width: none;
      }

      .user-name {
        display: none;
      }

      .cart-total {
        display: none;
      }

      .portal-content {
        padding: 1rem;
      }
    }
  `]
})
export class PortalLayoutComponent {
  private authStateService = inject(AuthStateService);
  private cartService = inject(CartService);
  private translateService = inject(TranslateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Track current URL reactively using router events
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    )
  );

  activeCategory = computed(() => {
    const url = this.currentUrl() || '';
    if (!url.includes('/portal/catalog')) return null;

    const match = url.match(/[?&]category=([^&]+)/);
    return match ? match[1] : null;
  });

  isAllProductsActive = computed(() => {
    const url = this.currentUrl() || '';
    return url.includes('/portal/catalog') && !url.includes('category=');
  });

  isMedicationsActive = computed(() => {
    const url = this.currentUrl() || '';
    return url.includes('/portal/catalog') && url.includes('category=medications');
  });

  isMedicalSuppliesActive = computed(() => {
    const url = this.currentUrl() || '';
    return url.includes('/portal/catalog') && url.includes('category=medical-supplies');
  });

  isEquipmentActive = computed(() => {
    const url = this.currentUrl() || '';
    return url.includes('/portal/catalog') && url.includes('category=equipment');
  });

  searchQuery = signal('');
  showUserMenu = signal(false);
  currentYear = new Date().getFullYear();

  currentLanguage = signal(this.translateService.currentLang || 'en');

  cartItemCount = computed(() => this.cartService.itemCount());
  cartTotal = computed(() => this.cartService.total());

  userName = computed(() => {
    const user = this.authStateService.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });

  userInitials = computed(() => {
    const user = this.authStateService.currentUser();
    if (!user) return '?';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  });

  onSearch(): void {
    const query = this.searchQuery();
    if (query.trim()) {
      this.router.navigate(['/portal/catalog'], {
        queryParams: { search: query }
      });
    }
  }

  toggleUserMenu(): void {
    this.showUserMenu.update(v => !v);
  }

  toggleLanguage(): void {
    const newLang = this.currentLanguage() === 'en' ? 'bs' : 'en';
    this.translateService.use(newLang);
    this.currentLanguage.set(newLang);
  }

  logout(): void {
    this.showUserMenu.set(false);
    this.authStateService.logout();
    this.router.navigate(['/auth/login']);
  }
}
