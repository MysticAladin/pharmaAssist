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
  templateUrl: './profile-component/profile.component.html',
  styleUrls: ['./profile-component/profile.component.scss']
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
