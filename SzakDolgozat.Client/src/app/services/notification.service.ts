import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Notification {
  id: number;
  userId: string;
  projectId?: number;
  title: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
  type: string;
  project?: {
    id: number;
    name: string;
  };
}

export interface NotificationPreference {
  id: number;
  userId: string;
  enabled: boolean;
  daysBeforeDeadline: number;
  frequencyInDays: number;
  onlyActiveProjects: boolean;
  onlyAssignedProjects: boolean;
  alwaysNotifyOneDayBefore?: boolean
  emailEnabled: boolean;
  emailFrequencyInDays: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'https://localhost:7294/api/notification';

  constructor(private http: HttpClient) { }

  getNotifications(unreadOnly: boolean = false, limit: number = 0): Observable<Notification[]> {
    let url = `${this.apiUrl}?unreadOnly=${unreadOnly}`;
    if (limit > 0) {
      url += `&limit=${limit}`;
    }
    return this.http.get<Notification[]>(url);
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count`);
  }

  markAsRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/read`, {});
  }

  markAllAsRead(): Observable<{ count: number }> {
    return this.http.put<{ count: number }>(`${this.apiUrl}/read-all`, {});
  }

  deleteNotification(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getPreferences(): Observable<NotificationPreference> {
    return this.http.get<NotificationPreference>(`${this.apiUrl}/preferences`);
  }

  updatePreferences(preferences: NotificationPreference): Observable<NotificationPreference> {
    return this.http.put<NotificationPreference>(`${this.apiUrl}/preferences`, preferences);
  }

  // Teszt 
  generateTestNotifications(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/generate-test`, {});
  }
}
