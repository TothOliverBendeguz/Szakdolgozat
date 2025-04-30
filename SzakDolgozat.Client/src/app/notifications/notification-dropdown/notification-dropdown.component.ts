import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { NotificationService, Notification } from '../../services/notification.service';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    MatListModule,
    MatDividerModule,
    RouterModule
  ],
  template: `
    <button mat-icon-button [matMenuTriggerFor]="notificationMenu" 
            [matBadge]="unreadCount > 0 ? unreadCount : null" 
            matBadgeColor="warn"
            matBadgeSize="small"
            aria-label="Notifications">
      <mat-icon>notifications</mat-icon>
    </button>

    <mat-menu #notificationMenu="matMenu" class="notification-menu">
      <div class="notification-header">
        <h3 class="notification-title">Értesítések</h3>
        <button mat-button *ngIf="unreadCount > 0" (click)="markAllAsRead(); $event.stopPropagation()">
          Mind olvasottnak jelölése
        </button>
      </div>

      <mat-divider></mat-divider>

      <div class="notification-list">
        <ng-container *ngIf="notifications.length > 0">
          <div *ngFor="let notification of notifications" class="notification-item"
               [class.unread]="!notification.isRead">
            <div class="notification-content" (click)="onNotificationClick(notification)">
              <div class="notification-icon">
                <mat-icon *ngIf="notification.type === 'deadline'">timer</mat-icon>
                <mat-icon *ngIf="notification.type !== 'deadline'">notifications</mat-icon>
              </div>
              <div class="notification-details">
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-message">{{ notification.message }}</div>
                <div class="notification-time">{{ notification.createdAt | date:'medium' }}</div>
                <div *ngIf="notification.project" class="notification-project">
                  {{ notification.project.name }}
                </div>
              </div>
            </div>
            <button mat-icon-button class="notification-action" 
                    (click)="markAsRead(notification); $event.stopPropagation()">
              <mat-icon>check</mat-icon>
            </button>
          </div>
        </ng-container>

        <div *ngIf="notifications.length === 0" class="no-notifications">
          Nincsenek értesítések
        </div>
      </div>

      <mat-divider></mat-divider>

      <div class="notification-footer">
        <a mat-button routerLink="/notifications" (click)="$event.stopPropagation()">
          Összes értesítés megtekintése
        </a>
      </div>
    </mat-menu>
  `,
  styles: [`
    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
    }

    .notification-title {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }

    .notification-list {
      max-height: 360px;
      overflow-y: auto;
      padding: 0;
    }

    .notification-item {
      display: flex;
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: background-color 0.2s;
      align-items: center;
    }

    .notification-item:hover {
      background-color: #f5f5f5;
    }

    .notification-item.unread {
      background-color: #e3f2fd;
    }

    .notification-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .notification-icon {
      margin-right: 16px;
      display: flex;
      align-items: center;
    }

    .notification-details {
      flex: 1;
      overflow: hidden;
    }

    .notification-title {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .notification-message {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: rgba(0, 0, 0, 0.6);
      font-size: 14px;
      margin: 4px 0;
    }

    .notification-time, .notification-project {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
    }

    .notification-action {
      opacity: 0.5;
    }

    .notification-action:hover {
      opacity: 1;
    }

    .no-notifications {
      padding: 16px;
      text-align: center;
      color: rgba(0, 0, 0, 0.54);
    }

    .notification-footer {
      display: flex;
      justify-content: center;
      padding: 8px 16px;
    }
  `]
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount: number = 0;
  private refreshSubscription?: Subscription;

  constructor(private notificationService: NotificationService) { }

  ngOnInit(): void {
    this.loadNotifications();
    this.loadUnreadCount();

    this.refreshSubscription = interval(60000).subscribe(() => {
      this.loadUnreadCount();
      this.loadNotifications();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadNotifications(): void {
    this.notificationService.getNotifications(false, 5).subscribe({
      next: (notifications: Notification[]) => {
        this.notifications = notifications;
      },
      error: (error: any) => console.error('Error loading notifications:', error)
    });
  }

  loadUnreadCount(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: (count: number) => {
        this.unreadCount = count;
      },
      error: (error: any) => console.error('Error loading unread count:', error)
    });
  }

  markAsRead(notification: Notification): void {
    if (notification.isRead) return;

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.isRead = true;
        this.loadUnreadCount();
      },
      error: (error: any) => console.error('Error marking notification as read:', error)
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(notification => notification.isRead = true);
        this.unreadCount = 0;
      },
      error: (error: any) => console.error('Error marking all notifications as read:', error)
    });
  }

  onNotificationClick(notification: Notification): void {
    if (!notification.isRead) {
      this.markAsRead(notification);
    }

    if (notification.projectId) {

    }
  }
}
