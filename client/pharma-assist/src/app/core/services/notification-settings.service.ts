import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

interface NotificationEmailRecipientDto {
  id: number;
  email: string;
  name?: string | null;
  isEnabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationSettingsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/notificationsettings`;

  getOrderPlacedInternalRecipients(): Observable<string[]> {
    return this.http
      .get<ApiResponse<NotificationEmailRecipientDto[]>>(`${this.apiUrl}/order-placed-internal-recipients`)
      .pipe(map(r => (r.data ?? []).filter(x => x.isEnabled).map(x => x.email)));
  }

  updateOrderPlacedInternalRecipients(emails: string[]): Observable<string[]> {
    return this.http
      .put<ApiResponse<NotificationEmailRecipientDto[]>>(`${this.apiUrl}/order-placed-internal-recipients`, { emails })
      .pipe(map(r => (r.data ?? []).filter(x => x.isEnabled).map(x => x.email)));
  }
}
