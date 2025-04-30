import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { UserManagementComponent } from './user-management/user-management.component';
import { NotificationSettingsComponent } from './notification-settings/notification-settings.component';
import { ProfileSettingsComponent } from './profile-settings/profile-settings.component';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    UserManagementComponent,
    NotificationSettingsComponent,
    ProfileSettingsComponent
  ],
  template: `
    <div class="settings-container">
      <h2 class="settings-title">Beállítások</h2>

      <!-- Profil beállítások minden felhasználó számára -->
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-card-title>
            <div class="card-title-container">
              <mat-icon class="setting-icon">person</mat-icon>
              <span>Profil beállítások</span>
            </div>
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-expansion-panel [expanded]="showProfileSettings" class="settings-panel">
            <mat-expansion-panel-header (click)="toggleProfileSettings()" class="panel-header">
              <mat-panel-title>
                Profil kezelése
              </mat-panel-title>
              <mat-panel-description>
                Személyes adatok és jelszó módosítása
              </mat-panel-description>
            </mat-expansion-panel-header>
            
            <div class="panel-content">
              <app-profile-settings></app-profile-settings>
            </div>
          </mat-expansion-panel>
        </mat-card-content>
      </mat-card>

      <!-- Értesítési beállítások minden felhasználó számára -->
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-card-title>
            <div class="card-title-container">
              <mat-icon class="setting-icon">notifications</mat-icon>
              <span>Értesítési beállítások</span>
            </div>
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-expansion-panel [expanded]="showNotificationSettings" class="settings-panel">
            <mat-expansion-panel-header (click)="toggleNotificationSettings()" class="panel-header">
              <mat-panel-title>
                Értesítések kezelése
              </mat-panel-title>
              <mat-panel-description>
                Beállíthatod a projekthatáridő értesítéseket
              </mat-panel-description>
            </mat-expansion-panel-header>
            
            <div class="panel-content">
              <app-notification-settings></app-notification-settings>
            </div>
          </mat-expansion-panel>
        </mat-card-content>
      </mat-card>

      <!-- Felhasználó kezelő csak adminok számára -->
      <div *ngIf="authService.isAdmin()">
        <mat-card class="settings-card">
          <mat-card-header>
            <mat-card-title>
              <div class="card-title-container">
                <mat-icon class="setting-icon">group</mat-icon>
                <span>Felhasználók kezelése</span>
              </div>
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-expansion-panel [expanded]="showUserManagement" class="settings-panel">
              <mat-expansion-panel-header (click)="toggleUserManagement()" class="panel-header">
                <mat-panel-title>
                  Felhasználók
                </mat-panel-title>
                <mat-panel-description>
                  Felhasználók és jogosultságok kezelése
                </mat-panel-description>
              </mat-expansion-panel-header>
              
              <div class="panel-content">
                <app-user-management></app-user-management>
              </div>
            </mat-expansion-panel>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .settings-title {
      margin-bottom: 24px;
      font-size: 28px;
      font-weight: 500;
      color: #333;
      border-left: 4px solid #3f51b5;
      padding-left: 12px;
    }

    .settings-card {
      margin-top: 24px;
      margin-bottom: 32px;
      border-radius: 8px;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .card-title-container {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
    }

    .setting-icon {
      color: #3f51b5;
    }

    .settings-panel {
      margin-top: 10px;
      border-radius: 6px;
      overflow: hidden;
    }

    .panel-header {
      padding: 16px;
      background-color: #f5f7ff;
    }

    .panel-content {
      padding: 20px 10px;
    }

    mat-card-header {
      background-color: #f9f9f9;
      padding: 12px 16px;
      margin-bottom: 0;
      border-bottom: 1px solid #eee;
    }

    mat-card-content {
      padding: 20px;
    }

    mat-expansion-panel-header {
      min-height: 60px !important;
    }

    ::ng-deep .mat-expansion-panel-content {
      border-top: 1px solid #f0f0f0;
    }

    ::ng-deep .mat-expansion-panel-body {
      padding: 24px 16px !important;
    }

    ::ng-deep .mat-expanded {
      margin-bottom: 16px !important;
    }

    ::ng-deep .mat-expansion-panel {
      margin-bottom: 10px !important;
    }

    ::ng-deep .mat-expansion-panel-header-title {
      font-weight: 500;
      color: #333;
    }

    ::ng-deep .mat-expansion-panel-header-description {
      color: #666;
    }
  `]
})
export class SettingsComponent {
  showUserManagement = false;
  showNotificationSettings = false;
  showProfileSettings = false;

  constructor(public authService: AuthService) { }

  toggleUserManagement() {
    this.showUserManagement = !this.showUserManagement;
  }

  toggleNotificationSettings() {
    this.showNotificationSettings = !this.showNotificationSettings;
  }

  toggleProfileSettings() {
    this.showProfileSettings = !this.showProfileSettings;
  }
}
