import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
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
      <span class="site-name">&lt;P r e s s&gt;</span>
      <span class="spacer"></span>
      
      <button mat-button routerLink="/projects">
        <mat-icon>work</mat-icon>
        Projektek
      </button>
      
      <button mat-button routerLink="/graph">
        <mat-icon>bubble_chart</mat-icon>
        Gráf nézet
      </button>
      
      <button mat-button routerLink="/calendar">
        <mat-icon>calendar_today</mat-icon>
        Naptár
      </button>
      
      <button mat-button routerLink="/settings">
        <mat-icon>settings</mat-icon>
        Beállítások
      </button>
      
      <button mat-button (click)="logout()">
        <mat-icon>exit_to_app</mat-icon>
        Kijelentkezés
      </button>
      
      <div class="notification-container">
        <app-notification-dropdown></app-notification-dropdown>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .mat-toolbar {
      background-color: #1976D2; /* Kevésbé élénk kék */
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
    }
    
    .site-name {
      font-family: 'Fira Code', monospace;
      font-size: 20px;
      font-weight: 500;
      letter-spacing: 2px;
    }
    
    .spacer {
      flex: 1 1 auto;
    }

    button {
      margin: 0 4px;
    }

    mat-icon {
      margin-right: 4px;
    }
    
    .notification-container {
      margin-left: 8px;
    }
  `]
})
export class NavbarComponent {
  constructor(public authService: AuthService) { }

  logout() {
    this.authService.logout();
  }
}
