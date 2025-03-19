import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NotificationDropdownComponent } from '../notifications/notification-dropdown/notification-dropdown.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    NotificationDropdownComponent
  ],
  template: `
    <mat-toolbar color="primary" *ngIf="authService.isLoggedIn()">
      <span>P r e s s</span>
      <span class="spacer"></span>
      <button mat-button routerLink="/projects">
        <mat-icon>work</mat-icon>
        Projects
      </button>
      <button mat-button routerLink="/calendar">
        <mat-icon>calendar_today</mat-icon>
        Calendar
      </button>
      <button mat-button routerLink="/graph">
        <mat-icon>share</mat-icon>
        Graph View
      </button>
      
      <!-- Értesítési komponens -->
      <app-notification-dropdown></app-notification-dropdown>
      
      <button mat-button routerLink="/settings">
        <mat-icon>settings</mat-icon>
        Settings
      </button>
      <button mat-button (click)="logout()">
        <mat-icon>exit_to_app</mat-icon>
        Logout
      </button>
    </mat-toolbar>
  `,
  styles: [`
    .spacer {
      flex: 1 1 auto;
    }
    
    mat-toolbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
    }

    button {
      margin: 0 8px;
    }

    mat-icon {
      margin-right: 4px;
    }
  `]
})
export class NavbarComponent {
  constructor(public authService: AuthService) { }

  logout() {
    this.authService.logout();
  }
}
