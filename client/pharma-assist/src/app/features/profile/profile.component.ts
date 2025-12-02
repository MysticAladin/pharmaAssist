import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthStateService } from '../../core/state/auth-state.service';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  department: string;
  avatar?: string;
}

interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="profile-page">
      <div class="page-header">
        <h1 class="page-title">{{ 'profile.title' | translate }}</h1>
        <p class="page-subtitle">{{ 'profile.subtitle' | translate }}</p>
      </div>

      <div class="profile-layout">
        <!-- Profile Card -->
        <div class="profile-card">
          <div class="avatar-section">
            <div class="avatar">
              @if (profile.avatar) {
                <img [src]="profile.avatar" [alt]="profile.firstName">
              } @else {
                <span class="avatar-initials">{{ getInitials() }}</span>
              }
            </div>
            <button class="btn-change-avatar" (click)="triggerFileInput()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              {{ 'profile.changePhoto' | translate }}
            </button>
            <input type="file" #fileInput accept="image/*" (change)="onFileSelected($event)" style="display: none">
          </div>
          <div class="profile-info">
            <h2>{{ profile.firstName }} {{ profile.lastName }}</h2>
            <p class="role">{{ getUserRole() }}</p>
            <p class="email">{{ profile.email }}</p>
          </div>
        </div>

        <!-- Edit Forms -->
        <div class="edit-sections">
          <!-- Personal Information -->
          <div class="edit-card">
            <div class="card-header">
              <h3>{{ 'profile.personalInfo' | translate }}</h3>
              <p>{{ 'profile.personalInfoDesc' | translate }}</p>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ 'profile.firstName' | translate }}</label>
                <input type="text" class="input" [(ngModel)]="profile.firstName">
              </div>
              <div class="form-group">
                <label>{{ 'profile.lastName' | translate }}</label>
                <input type="text" class="input" [(ngModel)]="profile.lastName">
              </div>
              <div class="form-group">
                <label>{{ 'profile.email' | translate }}</label>
                <input type="email" class="input" [(ngModel)]="profile.email" disabled>
                <span class="input-hint">{{ 'profile.emailHint' | translate }}</span>
              </div>
              <div class="form-group">
                <label>{{ 'profile.phone' | translate }}</label>
                <input type="tel" class="input" [(ngModel)]="profile.phone" placeholder="+387 XX XXX XXX">
              </div>
              <div class="form-group">
                <label>{{ 'profile.jobTitle' | translate }}</label>
                <input type="text" class="input" [(ngModel)]="profile.jobTitle" placeholder="e.g., Pharmacist">
              </div>
              <div class="form-group">
                <label>{{ 'profile.department' | translate }}</label>
                <input type="text" class="input" [(ngModel)]="profile.department" placeholder="e.g., Sales">
              </div>
            </div>
            <div class="card-actions">
              <button class="btn-primary" (click)="saveProfile()" [disabled]="savingProfile()">
                @if (savingProfile()) {
                  <span class="spinner"></span>
                }
                {{ 'profile.saveChanges' | translate }}
              </button>
            </div>
          </div>

          <!-- Change Password -->
          <div class="edit-card">
            <div class="card-header">
              <h3>{{ 'profile.changePassword' | translate }}</h3>
              <p>{{ 'profile.changePasswordDesc' | translate }}</p>
            </div>
            <div class="form-grid single-column">
              <div class="form-group">
                <label>{{ 'profile.currentPassword' | translate }}</label>
                <input type="password" class="input" [(ngModel)]="passwords.currentPassword">
              </div>
              <div class="form-group">
                <label>{{ 'profile.newPassword' | translate }}</label>
                <input type="password" class="input" [(ngModel)]="passwords.newPassword">
                <span class="input-hint">{{ 'profile.passwordRequirements' | translate }}</span>
              </div>
              <div class="form-group">
                <label>{{ 'profile.confirmPassword' | translate }}</label>
                <input type="password" class="input" [(ngModel)]="passwords.confirmPassword">
              </div>
            </div>
            @if (passwordError()) {
              <div class="error-message">{{ passwordError() }}</div>
            }
            <div class="card-actions">
              <button class="btn-primary" (click)="changePassword()" [disabled]="savingPassword()">
                @if (savingPassword()) {
                  <span class="spinner"></span>
                }
                {{ 'profile.updatePassword' | translate }}
              </button>
            </div>
          </div>

          <!-- Account Actions -->
          <div class="edit-card danger-zone">
            <div class="card-header">
              <h3>{{ 'profile.dangerZone' | translate }}</h3>
              <p>{{ 'profile.dangerZoneDesc' | translate }}</p>
            </div>
            <div class="danger-actions">
              <div class="danger-action">
                <div class="action-info">
                  <h4>{{ 'profile.deactivateAccount' | translate }}</h4>
                  <p>{{ 'profile.deactivateAccountDesc' | translate }}</p>
                </div>
                <button class="btn-outline-danger">{{ 'profile.deactivate' | translate }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host{--c1:#1a1a2e;--c2:#6b7280;--c3:#e5e7eb;--c4:#f3f4f6;--c5:#0d9488;--c6:#dc2626}
    .profile-page{padding:1.5rem;max-width:900px;margin:0 auto}
    .page-header{margin-bottom:1.5rem}
    .page-title{font-size:1.5rem;font-weight:600;color:var(--c1);margin:0 0 .25rem}
    .page-subtitle{color:var(--c2);margin:0;font-size:.9rem}
    .profile-layout{display:flex;flex-direction:column;gap:1.5rem}
    .profile-card{display:flex;align-items:center;gap:1.5rem;background:#fff;border:1px solid var(--c3);border-radius:12px;padding:1.5rem}
    @media(max-width:600px){.profile-card{flex-direction:column;text-align:center}}
    .avatar-section{display:flex;flex-direction:column;align-items:center;gap:.75rem}
    .avatar{width:100px;height:100px;border-radius:50%;background:linear-gradient(135deg,var(--c5),#0f766e);display:flex;align-items:center;justify-content:center;overflow:hidden}
    .avatar img{width:100%;height:100%;object-fit:cover}
    .avatar-initials{color:#fff;font-size:2rem;font-weight:600}
    .btn-change-avatar{display:flex;align-items:center;gap:.375rem;padding:.5rem .75rem;background:none;border:1px solid var(--c3);border-radius:6px;color:var(--c2);font-size:.75rem;cursor:pointer;transition:all .2s}
    .btn-change-avatar:hover{border-color:var(--c5);color:var(--c5)}
    .profile-info h2{font-size:1.25rem;font-weight:600;color:var(--c1);margin:0 0 .25rem}
    .profile-info .role{color:var(--c5);font-weight:500;font-size:.9rem;margin:0 0 .125rem}
    .profile-info .email{color:var(--c2);font-size:.875rem;margin:0}
    .edit-sections{display:flex;flex-direction:column;gap:1.5rem}
    .edit-card{background:#fff;border:1px solid var(--c3);border-radius:12px;padding:1.5rem}
    .edit-card.danger-zone{border-color:#fecaca}
    .card-header{margin-bottom:1.25rem}
    .card-header h3{font-size:1rem;font-weight:600;color:var(--c1);margin:0 0 .25rem}
    .edit-card.danger-zone .card-header h3{color:var(--c6)}
    .card-header p{font-size:.8rem;color:var(--c2);margin:0}
    .form-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem}
    .form-grid.single-column{grid-template-columns:1fr;max-width:400px}
    @media(max-width:600px){.form-grid{grid-template-columns:1fr}}
    .form-group{display:flex;flex-direction:column;gap:.375rem}
    .form-group label{font-size:.8rem;font-weight:500;color:var(--c2)}
    .input{padding:.625rem .875rem;border:1px solid var(--c3);border-radius:8px;font-size:.875rem;transition:border-color .2s}
    .input:focus{outline:none;border-color:var(--c5)}
    .input:disabled{background:var(--c4);color:var(--c2);cursor:not-allowed}
    .input-hint{font-size:.75rem;color:var(--c2)}
    .error-message{background:#fef2f2;color:var(--c6);padding:.75rem;border-radius:8px;font-size:.8rem;margin-bottom:1rem}
    .card-actions{margin-top:1.25rem;display:flex;justify-content:flex-end}
    .btn-primary{display:flex;align-items:center;gap:.5rem;padding:.75rem 1.25rem;background:var(--c5);color:#fff;border:none;border-radius:8px;font-size:.875rem;font-weight:500;cursor:pointer;transition:all .2s}
    .btn-primary:hover:not(:disabled){background:#0f766e}
    .btn-primary:disabled{opacity:.6;cursor:not-allowed}
    .danger-actions{display:flex;flex-direction:column;gap:1rem}
    .danger-action{display:flex;justify-content:space-between;align-items:center;padding:1rem;background:#fef2f2;border-radius:8px}
    @media(max-width:600px){.danger-action{flex-direction:column;gap:.75rem;text-align:center}}
    .action-info h4{font-size:.875rem;font-weight:600;color:var(--c1);margin:0 0 .125rem}
    .action-info p{font-size:.75rem;color:var(--c2);margin:0}
    .btn-outline-danger{padding:.5rem 1rem;background:#fff;border:1px solid var(--c6);color:var(--c6);border-radius:6px;font-size:.8rem;font-weight:500;cursor:pointer;transition:all .2s}
    .btn-outline-danger:hover{background:var(--c6);color:#fff}
    .spinner{width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
  `]
})
export class ProfileComponent implements OnInit {
  private readonly authState = inject(AuthStateService);

  savingProfile = signal(false);
  savingPassword = signal(false);
  passwordError = signal('');

  profile: UserProfile = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    department: '',
    avatar: ''
  };

  passwords: PasswordChange = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    const user = this.authState.currentUser();
    if (user) {
      this.profile = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phoneNumber || '',
        jobTitle: '',
        department: '',
        avatar: user.avatar
      };
    }
  }

  getInitials(): string {
    const first = this.profile.firstName?.charAt(0) || '';
    const last = this.profile.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  }

  getUserRole(): string {
    const user = this.authState.currentUser();
    if (!user) return '';

    // Return first role or default
    return user.roles?.[0] || 'User';
  }

  triggerFileInput(): void {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput?.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.profile.avatar = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfile(): void {
    this.savingProfile.set(true);

    // Simulate API call
    setTimeout(() => {
      // Update auth service with new profile data
      const currentUser = this.authState.currentUser();
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          firstName: this.profile.firstName,
          lastName: this.profile.lastName,
          phoneNumber: this.profile.phone,
          avatar: this.profile.avatar
        };
        // In a real app, this would call an API
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
      this.savingProfile.set(false);
    }, 800);
  }

  changePassword(): void {
    this.passwordError.set('');

    if (!this.passwords.currentPassword || !this.passwords.newPassword || !this.passwords.confirmPassword) {
      this.passwordError.set('All password fields are required');
      return;
    }

    if (this.passwords.newPassword !== this.passwords.confirmPassword) {
      this.passwordError.set('New passwords do not match');
      return;
    }

    if (this.passwords.newPassword.length < 8) {
      this.passwordError.set('Password must be at least 8 characters');
      return;
    }

    this.savingPassword.set(true);

    // Simulate API call
    setTimeout(() => {
      // Reset form
      this.passwords = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
      this.savingPassword.set(false);
    }, 800);
  }
}
