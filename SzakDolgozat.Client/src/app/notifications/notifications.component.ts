import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotificationService, Notification } from '../services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDividerModule,
    RouterModule,
    FormsModule
  ],
  template: `
    <div class="notifications-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Értesítések</mat-card-title>
          <div class="header-actions">
            <button mat-raised-button color="primary" (click)="markAllAsRead()" *ngIf="hasUnreadNotifications">
              <mat-icon>done_all</mat-icon>
              Összes olvasottnak jelölése
            </button>
          </div>
        </mat-card-header>
        
        <mat-card-content>
          <mat-tab-group>
            <mat-tab label="Összes értesítés">
              <div class="tab-content">
                <table mat-table [dataSource]="notifications" class="notifications-table">
                  <!-- Állapot oszlop -->
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Állapot</th>
                    <td mat-cell *matCellDef="let notification">
                      <mat-chip-option 
                          [color]="notification.isRead ? '' : 'primary'" 
                          [selected]="!notification.isRead"
                          [selectable]="false">
                        {{ notification.isRead ? 'Olvasott' : 'Olvasatlan' }}
                      </mat-chip-option>
                    </td>
                  </ng-container>

                  <!-- Típus oszlop -->
                  <ng-container matColumnDef="type">
                    <th mat-header-cell *matHeaderCellDef>Típus</th>
                    <td mat-cell *matCellDef="let notification">
                      <div class="notification-type">
                        <mat-icon *ngIf="notification.type === 'deadline'">timer</mat-icon>
                        <mat-icon *ngIf="notification.type !== 'deadline'">notifications</mat-icon>
                        <span *ngIf="notification.type === 'deadline'">Határidő</span>
                        <span *ngIf="notification.type !== 'deadline'">Értesítés</span>
                      </div>
                    </td>
                  </ng-container>

                  <!-- Üzenet oszlop -->
                  <ng-container matColumnDef="message">
                    <th mat-header-cell *matHeaderCellDef>Üzenet</th>
                    <td mat-cell *matCellDef="let notification">
                      <div class="notification-message">
                        <div class="message-title">{{ notification.title }}</div>
                        <div class="message-content">{{ notification.message }}</div>
                      </div>
                    </td>
                  </ng-container>

                  <!-- Projekt oszlop -->
                  <ng-container matColumnDef="project">
                    <th mat-header-cell *matHeaderCellDef>Projekt</th>
                    <td mat-cell *matCellDef="let notification">
                      <a *ngIf="notification.project" [routerLink]="['/projects']" 
                         [state]="{ projectId: notification.projectId }"
                         class="project-link">
                        {{ notification.project?.name }}
                      </a>
                      <span *ngIf="!notification.project">-</span>
                    </td>
                  </ng-container>

                  <!-- Dátum oszlop -->
                  <ng-container matColumnDef="date">
                    <th mat-header-cell *matHeaderCellDef>Dátum</th>
                    <td mat-cell *matCellDef="let notification">
                      {{ notification.createdAt | date:'yyyy. MM. dd. HH:mm' }}
                    </td>
                  </ng-container>

                  <!-- Műveletek oszlop -->
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Műveletek</th>
                    <td mat-cell *matCellDef="let notification">
                      <button mat-icon-button color="primary" 
                              (click)="markAsRead(notification)"
                              *ngIf="!notification.isRead"
                              matTooltip="Olvasottnak jelölés">
                        <mat-icon>check_circle</mat-icon>
                      </button>
                      <button mat-icon-button color="warn" 
                              (click)="deleteNotification(notification)"
                              matTooltip="Értesítés törlése">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                      [class.unread-row]="!row.isRead"></tr>
                </table>

                <div *ngIf="notifications.length === 0" class="no-notifications">
                  <mat-icon>notifications_off</mat-icon>
                  <p>Nincsenek értesítések</p>
                </div>

                <mat-paginator [length]="totalItems"
                              [pageSize]="pageSize"
                              [pageSizeOptions]="[5, 10, 25, 50]"
                              (page)="onPageChange($event)"
                              showFirstLastButtons>
                </mat-paginator>
              </div>
            </mat-tab>
            <mat-tab label="Olvasatlan">
              <div class="tab-content">
                <table mat-table [dataSource]="unreadNotifications" class="notifications-table">
                  <!-- Ugyanazok az oszlopok, mint az összes értesítésnél -->
                  <!-- Státusz oszlop nem szükséges itt, mivel mind olvasatlan -->
                  <ng-container matColumnDef="type">
                    <th mat-header-cell *matHeaderCellDef>Típus</th>
                    <td mat-cell *matCellDef="let notification">
                      <div class="notification-type">
                        <mat-icon *ngIf="notification.type === 'deadline'">timer</mat-icon>
                        <mat-icon *ngIf="notification.type !== 'deadline'">notifications</mat-icon>
                        <span *ngIf="notification.type === 'deadline'">Határidő</span>
                        <span *ngIf="notification.type !== 'deadline'">Értesítés</span>
                      </div>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="message">
                    <th mat-header-cell *matHeaderCellDef>Üzenet</th>
                    <td mat-cell *matCellDef="let notification">
                      <div class="notification-message">
                        <div class="message-title">{{ notification.title }}</div>
                        <div class="message-content">{{ notification.message }}</div>
                      </div>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="project">
                    <th mat-header-cell *matHeaderCellDef>Projekt</th>
                    <td mat-cell *matCellDef="let notification">
                      <a *ngIf="notification.project" [routerLink]="['/projects']" 
                         [state]="{ projectId: notification.projectId }"
                         class="project-link">
                        {{ notification.project?.name }}
                      </a>
                      <span *ngIf="!notification.project">-</span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="date">
                    <th mat-header-cell *matHeaderCellDef>Dátum</th>
                    <td mat-cell *matCellDef="let notification">
                      {{ notification.createdAt | date:'yyyy. MM. dd. HH:mm' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Műveletek</th>
                    <td mat-cell *matCellDef="let notification">
                      <button mat-icon-button color="primary" 
                              (click)="markAsRead(notification)"
                              matTooltip="Olvasottnak jelölés">
                        <mat-icon>check_circle</mat-icon>
                      </button>
                      <button mat-icon-button color="warn" 
                              (click)="deleteNotification(notification)"
                              matTooltip="Értesítés törlése">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="unreadDisplayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: unreadDisplayedColumns;"
                      class="unread-row"></tr>
                </table>

                <div *ngIf="unreadNotifications.length === 0" class="no-notifications">
                  <mat-icon>done_all</mat-icon>
                  <p>Nincsenek olvasatlan értesítések</p>
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .notifications-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-actions {
      display: flex;
      gap: 16px;
      margin-left: auto;
    }

    .tab-content {
      margin-top: 20px;
    }

    .notifications-table {
      width: 100%;
    }

    .unread-row {
      background-color: #e3f2fd;
    }

    .notification-type {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .notification-message {
      max-width: 400px;
    }

    .message-title {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .message-content {
      color: rgba(0, 0, 0, 0.6);
    }

    .project-link {
      color: #3f51b5;
      text-decoration: none;
    }

    .project-link:hover {
      text-decoration: underline;
    }

    .no-notifications {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 0;
      color: rgba(0, 0, 0, 0.54);
    }

    .no-notifications mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 16px;
    }
  `]
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  unreadNotifications: Notification[] = [];
  displayedColumns: string[] = ['status', 'type', 'message', 'project', 'date', 'actions'];
  unreadDisplayedColumns: string[] = ['type', 'message', 'project', 'date', 'actions'];

  pageSize: number = 10;
  pageIndex: number = 0;
  totalItems: number = 0;

  get hasUnreadNotifications(): boolean {
    return this.unreadNotifications.length > 0;
  }

  constructor(
    private notificationService: NotificationService,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadAllNotifications();
    this.loadUnreadNotifications();
  }

  loadAllNotifications(): void {
    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.totalItems = notifications.length;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.snackBar.open('Hiba történt az értesítések betöltése közben', 'OK', {
          duration: 3000
        });
      }
    });
  }

  loadUnreadNotifications(): void {
    this.notificationService.getNotifications(true).subscribe({
      next: (notifications) => {
        this.unreadNotifications = notifications;
      },
      error: (error) => {
        console.error('Error loading unread notifications:', error);
      }
    });
  }

  markAsRead(notification: Notification): void {
    if (notification.isRead) return;

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.isRead = true;
        this.unreadNotifications = this.unreadNotifications.filter(n => n.id !== notification.id);
        this.snackBar.open('Értesítés olvasottnak jelölve', 'OK', {
          duration: 2000
        });
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
        this.snackBar.open('Hiba történt az értesítés olvasottnak jelölése közben', 'OK', {
          duration: 3000
        });
      }
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: (response) => {
        this.notifications.forEach(notification => notification.isRead = true);
        this.unreadNotifications = [];
        this.snackBar.open(`${response.count} értesítés olvasottnak jelölve`, 'OK', {
          duration: 2000
        });
      },
      error: (error) => {
        console.error('Error marking all notifications as read:', error);
        this.snackBar.open('Hiba történt az értesítések olvasottnak jelölése közben', 'OK', {
          duration: 3000
        });
      }
    });
  }

  deleteNotification(notification: Notification): void {
    this.notificationService.deleteNotification(notification.id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== notification.id);
        if (!notification.isRead) {
          this.unreadNotifications = this.unreadNotifications.filter(n => n.id !== notification.id);
        }
        this.snackBar.open('Értesítés törölve', 'OK', {
          duration: 2000
        });
      },
      error: (error) => {
        console.error('Error deleting notification:', error);
        this.snackBar.open('Hiba történt az értesítés törlése közben', 'OK', {
          duration: 3000
        });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }
}
