import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslationService } from '../../core/services/translation.service';

interface NotificationSettings {
  // Email Settings
  emailNotifications: boolean;
  orderAlerts: boolean;
  lowStockAlerts: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
  // Push Notifications
  pushNotifications: boolean;
  // Alert Types
  expiryAlerts: boolean;
  expiryAlertDays: number;
  prescriptionAlerts: boolean;
  paymentAlerts: boolean;
  systemAlerts: boolean;
  // Quiet Hours
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './settings-component/settings.component.html',
  styleUrls: ['./settings-component/settings.component.scss']
})
export class SettingsComponent implements OnInit {
  private readonly translationService = inject(TranslationService);

  activeSection = signal<'general' | 'appearance' | 'notifications' | 'regional' | 'privacy'>('general');
  saving = signal(false);

  // General settings
  companyName = 'PharmaAssist';
  currency = 'BAM';
  taxRate = 17;

  // Appearance settings
  compactMode = false;

  // Notification settings
  notifications: NotificationSettings = {
    // Email Settings
    emailNotifications: true,
    orderAlerts: true,
    lowStockAlerts: true,
    marketingEmails: false,
    weeklyDigest: true,
    // Push Notifications
    pushNotifications: true,
    // Alert Types
    expiryAlerts: true,
    expiryAlertDays: 30,
    prescriptionAlerts: true,
    paymentAlerts: true,
    systemAlerts: true,
    // Quiet Hours
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00'
  };

  // Regional settings
  currentLanguage = 'bs';
  dateFormat = 'dd.MM.yyyy';
  timezone = 'Europe/Sarajevo';

  // Privacy settings
  activityLogEnabled = true;
  dataSharing = false;

  ngOnInit(): void {
    this.loadSettings();
  }

  private loadSettings(): void {
    // Load current language
    this.currentLanguage = this.translationService.currentLanguage();

    // Load other settings from localStorage or API
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        this.companyName = settings.companyName || this.companyName;
        this.currency = settings.currency || this.currency;
        this.taxRate = settings.taxRate || this.taxRate;
        this.compactMode = settings.compactMode || false;
        this.notifications = { ...this.notifications, ...settings.notifications };
        this.dateFormat = settings.dateFormat || this.dateFormat;
        this.timezone = settings.timezone || this.timezone;
        this.activityLogEnabled = settings.activityLogEnabled ?? true;
        this.dataSharing = settings.dataSharing ?? false;
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
  }

  onLanguageChange(language: string): void {
    this.translationService.setLanguage(language as 'en' | 'bs');
  }

  saveSettings(): void {
    this.saving.set(true);

    const settings = {
      companyName: this.companyName,
      currency: this.currency,
      taxRate: this.taxRate,
      compactMode: this.compactMode,
      notifications: this.notifications,
      dateFormat: this.dateFormat,
      timezone: this.timezone,
      activityLogEnabled: this.activityLogEnabled,
      dataSharing: this.dataSharing
    };

    // Save to localStorage
    localStorage.setItem('appSettings', JSON.stringify(settings));

    // Simulate API save
    setTimeout(() => {
      this.saving.set(false);
    }, 800);
  }
}
