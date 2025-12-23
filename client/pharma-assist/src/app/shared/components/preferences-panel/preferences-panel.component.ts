import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PreferencesService } from '../../../core/services/preferences.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-preferences-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './preferences-panel-component/preferences-panel.component.html',
  styleUrls: ['./preferences-panel-component/preferences-panel.component.scss']
})
export class PreferencesPanelComponent {
  readonly preferencesService = inject(PreferencesService);
  private readonly notificationService = inject(NotificationService);

  themeOptions = [
    { value: 'light' as const, icon: '☀️', label: 'preferences.theme.light' },
    { value: 'dark' as const, icon: '🌙', label: 'preferences.theme.dark' },
    { value: 'system' as const, icon: '💻', label: 'preferences.theme.system' }
  ];

  notificationCategories = [
    { key: 'stock' as const, label: 'preferences.notifications.cat.stock' },
    { key: 'orders' as const, label: 'preferences.notifications.cat.orders' },
    { key: 'expiry' as const, label: 'preferences.notifications.cat.expiry' },
    { key: 'prescriptions' as const, label: 'preferences.notifications.cat.prescriptions' },
    { key: 'system' as const, label: 'preferences.notifications.cat.system' }
  ];

  updateNotification(key: string, value: boolean): void {
    this.preferencesService.updateNotificationSettings({ [key]: value });
  }

  updateTable(key: string, value: boolean): void {
    this.preferencesService.updateTableSettings({ [key]: value } as any);
  }

  updateAccessibility(key: string, value: boolean): void {
    this.preferencesService.updateAccessibilitySettings({ [key]: value } as any);
  }

  resetPreferences(): void {
    this.preferencesService.resetToDefaults();
    this.notificationService.success('Preferences reset to defaults');
  }

  exportPreferences(): void {
    const json = this.preferencesService.exportPreferences();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pharma-assist-preferences.json';
    a.click();
    URL.revokeObjectURL(url);
    this.notificationService.success('Preferences exported');
  }
}
