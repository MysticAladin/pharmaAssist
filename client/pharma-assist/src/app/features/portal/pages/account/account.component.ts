import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthStateService } from '../../../../core/state/auth-state.service';

interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  companyName: string;
  vatNumber: string;
  addresses: Address[];
}

interface Address {
  id: number;
  label: string;
  street: string;
  city: string;
  postalCode: string;
  canton: string;
  country: string;
  isDefault: boolean;
}

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule],
  template: `
    <div class="account-page">
      <h1>{{ 'portal.account.title' | translate }}</h1>

      <div class="account-content">
        <nav class="account-nav">
          <button [class.active]="activeTab() === 'profile'" (click)="activeTab.set('profile')">
            <span class="icon">👤</span> {{ 'portal.account.profile' | translate }}
          </button>
          <button [class.active]="activeTab() === 'addresses'" (click)="activeTab.set('addresses')">
            <span class="icon">📍</span> {{ 'portal.account.addresses' | translate }}
          </button>
          <button [class.active]="activeTab() === 'security'" (click)="activeTab.set('security')">
            <span class="icon">🔒</span> {{ 'portal.account.security' | translate }}
          </button>
          <button [class.active]="activeTab() === 'preferences'" (click)="activeTab.set('preferences')">
            <span class="icon">⚙️</span> {{ 'portal.account.preferences' | translate }}
          </button>
        </nav>

        <div class="tab-content">
          @switch (activeTab()) {
            @case ('profile') {
              <div class="section">
                <h2>{{ 'portal.account.profileInfo' | translate }}</h2>
                <div class="form-grid">
                  <div class="form-group">
                    <label>{{ 'portal.account.firstName' | translate }}</label>
                    <input type="text" [(ngModel)]="profile.firstName" />
                  </div>
                  <div class="form-group">
                    <label>{{ 'portal.account.lastName' | translate }}</label>
                    <input type="text" [(ngModel)]="profile.lastName" />
                  </div>
                  <div class="form-group">
                    <label>{{ 'portal.account.email' | translate }}</label>
                    <input type="email" [(ngModel)]="profile.email" />
                  </div>
                  <div class="form-group">
                    <label>{{ 'portal.account.phone' | translate }}</label>
                    <input type="tel" [(ngModel)]="profile.phone" />
                  </div>
                </div>
                <h3>{{ 'portal.account.companyInfo' | translate }}</h3>
                <div class="form-grid">
                  <div class="form-group full-width">
                    <label>{{ 'portal.account.companyName' | translate }}</label>
                    <input type="text" [(ngModel)]="profile.companyName" />
                  </div>
                  <div class="form-group">
                    <label>{{ 'portal.account.vatNumber' | translate }}</label>
                    <input type="text" [(ngModel)]="profile.vatNumber" />
                  </div>
                </div>
                <button class="btn btn-primary" (click)="saveProfile()">{{ 'common.save' | translate }}</button>
              </div>
            }
            @case ('addresses') {
              <div class="section">
                <div class="section-header">
                  <h2>{{ 'portal.account.savedAddresses' | translate }}</h2>
                  <button class="btn btn-secondary" (click)="addAddress()">+ {{ 'portal.account.addAddress' | translate }}</button>
                </div>
                <div class="addresses-grid">
                  @for (address of profile.addresses; track address.id) {
                    <div class="address-card" [class.default]="address.isDefault">
                      @if (address.isDefault) {
                        <span class="default-badge">{{ 'portal.account.default' | translate }}</span>
                      }
                      <h4>{{ address.label }}</h4>
                      <p>{{ address.street }}<br>{{ address.postalCode }} {{ address.city }}<br>{{ address.country }}</p>
                      <div class="address-actions">
                        <button (click)="editAddress(address)">{{ 'common.edit' | translate }}</button>
                        @if (!address.isDefault) {
                          <button (click)="setDefaultAddress(address)">{{ 'portal.account.setDefault' | translate }}</button>
                          <button class="danger" (click)="deleteAddress(address)">{{ 'common.delete' | translate }}</button>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
            @case ('security') {
              <div class="section">
                <h2>{{ 'portal.account.changePassword' | translate }}</h2>
                <div class="form-group">
                  <label>{{ 'portal.account.currentPassword' | translate }}</label>
                  <input type="password" [(ngModel)]="security.currentPassword" />
                </div>
                <div class="form-group">
                  <label>{{ 'portal.account.newPassword' | translate }}</label>
                  <input type="password" [(ngModel)]="security.newPassword" />
                </div>
                <div class="form-group">
                  <label>{{ 'portal.account.confirmPassword' | translate }}</label>
                  <input type="password" [(ngModel)]="security.confirmPassword" />
                </div>
                <button class="btn btn-primary" (click)="changePassword()">{{ 'portal.account.updatePassword' | translate }}</button>
              </div>
            }
            @case ('preferences') {
              <div class="section">
                <h2>{{ 'portal.account.notificationPrefs' | translate }}</h2>
                <div class="preference-row">
                  <label>
                    <input type="checkbox" [(ngModel)]="preferences.emailOrders" />
                    {{ 'portal.account.emailOrderUpdates' | translate }}
                  </label>
                </div>
                <div class="preference-row">
                  <label>
                    <input type="checkbox" [(ngModel)]="preferences.emailPromotions" />
                    {{ 'portal.account.emailPromotions' | translate }}
                  </label>
                </div>
                <div class="preference-row">
                  <label>
                    <input type="checkbox" [(ngModel)]="preferences.emailNewProducts" />
                    {{ 'portal.account.emailNewProducts' | translate }}
                  </label>
                </div>
                <h2>{{ 'portal.account.displayPrefs' | translate }}</h2>
                <div class="form-group">
                  <label>{{ 'portal.account.defaultView' | translate }}</label>
                  <select [(ngModel)]="preferences.defaultView">
                    <option value="grid">{{ 'portal.catalog.gridView' | translate }}</option>
                    <option value="list">{{ 'portal.catalog.listView' | translate }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>{{ 'portal.account.itemsPerPage' | translate }}</label>
                  <select [(ngModel)]="preferences.itemsPerPage">
                    <option [value]="12">12</option>
                    <option [value]="24">24</option>
                    <option [value]="48">48</option>
                  </select>
                </div>
                <button class="btn btn-primary" (click)="savePreferences()">{{ 'common.save' | translate }}</button>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .account-page { max-width: 1000px; margin: 0 auto; }
    h1 { font-size: 1.75rem; margin-bottom: 2rem; }

    .account-content { display: grid; grid-template-columns: 240px 1fr; gap: 2rem; }

    .account-nav { display: flex; flex-direction: column; gap: 0.5rem; }
    .account-nav button { display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.25rem; border: none; background: var(--surface-card); border-radius: 8px; text-align: left; cursor: pointer; font-weight: 500; transition: all 0.2s; }
    .account-nav button:hover { background: var(--surface-hover); }
    .account-nav button.active { background: var(--primary-color); color: white; }
    .account-nav button .icon { font-size: 1.25rem; }

    .tab-content { background: var(--surface-card); border-radius: 12px; padding: 2rem; }
    .section h2 { font-size: 1.25rem; margin-bottom: 1.5rem; }
    .section h3 { font-size: 1rem; margin: 2rem 0 1rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color); }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .section-header h2 { margin-bottom: 0; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
    .form-group { }
    .form-group.full-width { grid-column: span 2; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem; }
    .form-group input, .form-group select { width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; }

    .addresses-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .address-card { background: var(--surface-ground); border-radius: 8px; padding: 1.25rem; position: relative; }
    .address-card.default { border: 2px solid var(--primary-color); }
    .default-badge { position: absolute; top: 0.75rem; right: 0.75rem; background: var(--primary-color); color: white; font-size: 0.625rem; padding: 0.25rem 0.5rem; border-radius: 4px; text-transform: uppercase; font-weight: 600; }
    .address-card h4 { margin-bottom: 0.5rem; }
    .address-card p { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1rem; }
    .address-actions { display: flex; gap: 0.5rem; }
    .address-actions button { padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); background: transparent; border-radius: 6px; cursor: pointer; font-size: 0.75rem; }
    .address-actions button.danger { color: var(--color-error-dark); border-color: #fecaca; }

    .preference-row { margin-bottom: 1rem; }
    .preference-row label { display: flex; align-items: center; gap: 0.75rem; cursor: pointer; }
    .preference-row input[type="checkbox"] { width: 18px; height: 18px; }

    .btn { padding: 0.75rem 1.5rem; border-radius: 8px; border: none; cursor: pointer; font-weight: 500; }
    .btn-primary { background: var(--primary-color); color: white; }
    .btn-secondary { background: var(--surface-ground); color: var(--text-color); border: 1px solid var(--border-color); }

    @media (max-width: 768px) {
      .account-content { grid-template-columns: 1fr; }
      .account-nav { flex-direction: row; overflow-x: auto; gap: 0.25rem; }
      .account-nav button { white-space: nowrap; padding: 0.75rem 1rem; }
      .form-grid { grid-template-columns: 1fr; }
      .form-group.full-width { grid-column: span 1; }
    }
  `]
})
export class AccountComponent implements OnInit {
  private authStateService = inject(AuthStateService);

  activeTab = signal<'profile' | 'addresses' | 'security' | 'preferences'>('profile');

  profile: UserProfile = {
    id: 0,
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    companyName: '',
    vatNumber: '',
    addresses: []
  };

  security = { currentPassword: '', newPassword: '', confirmPassword: '' };
  preferences = { emailOrders: true, emailPromotions: false, emailNewProducts: true, defaultView: 'grid', itemsPerPage: 24 };

  ngOnInit() {
    // Load profile data from state
    const user = this.authStateService.currentUser();
    if (user) {
      this.profile = {
        id: 1,
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: '+387 33 123 456',
        companyName: 'Apoteka Centar',
        vatNumber: 'BA123456789',
        addresses: [
          { id: 1, label: 'Main Office', street: 'Ferhadija 12', city: 'Sarajevo', postalCode: '71000', canton: 'Sarajevo', country: 'Bosnia and Herzegovina', isDefault: true },
          { id: 2, label: 'Warehouse', street: 'Industrijska 5', city: 'Sarajevo', postalCode: '71000', canton: 'Sarajevo', country: 'Bosnia and Herzegovina', isDefault: false }
        ]
      };
    }
  }

  saveProfile() {
    console.log('Saving profile:', this.profile);
    // API call to save
  }

  addAddress() {
    // Open modal or navigate to add address form
  }

  editAddress(address: Address) {
    console.log('Edit address:', address);
  }

  setDefaultAddress(address: Address) {
    this.profile.addresses.forEach(a => a.isDefault = false);
    address.isDefault = true;
  }

  deleteAddress(address: Address) {
    this.profile.addresses = this.profile.addresses.filter(a => a.id !== address.id);
  }

  changePassword() {
    if (this.security.newPassword !== this.security.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    console.log('Changing password');
    // API call
  }

  savePreferences() {
    console.log('Saving preferences:', this.preferences);
    localStorage.setItem('portal_preferences', JSON.stringify(this.preferences));
  }
}
