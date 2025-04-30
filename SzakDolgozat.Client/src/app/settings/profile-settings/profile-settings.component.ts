import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserProfileService, UserProfile, UserSettings } from '../../services/user-profile.service';
import { AuthService } from '../../auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="profile-settings-container">
      <mat-tab-group>
        <!-- Személyes adatok fül -->
        <mat-tab label="Személyes adatok">
          <div class="tab-content">
            <h3>Alap információk</h3>
            
            <div class="form-field-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Felhasználónév</mat-label>
                <input matInput [value]="userProfile?.userName" disabled>
                <mat-hint>A felhasználónév nem módosítható</mat-hint>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Email cím</mat-label>
                <input matInput [value]="userProfile?.email" disabled>
                <mat-hint>Az email cím nem módosítható</mat-hint>
              </mat-form-field>
            </div>
            
            <div class="form-field-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Vezetéknév</mat-label>
                <input matInput [(ngModel)]="profileForm.lastName" name="lastName">
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Keresztnév</mat-label>
                <input matInput [(ngModel)]="profileForm.firstName" name="firstName">
              </mat-form-field>
            </div>
            
            <div class="action-row">
              <button mat-raised-button color="primary" (click)="saveProfile()">
                Profil mentése
              </button>
            </div>
          </div>
        </mat-tab>
        
        <!-- Jelszó módosítás fül -->
        <mat-tab label="Jelszó módosítás">
          <div class="tab-content">
            <h3>Jelszó módosítása</h3>
            
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Jelenlegi jelszó</mat-label>
              <input matInput [(ngModel)]="passwordForm.currentPassword" type="password" name="currentPassword">
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Új jelszó</mat-label>
              <input matInput [(ngModel)]="passwordForm.newPassword" type="password" name="newPassword">
              <mat-hint>A jelszónak legalább 6 karaktert kell tartalmaznia</mat-hint>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Új jelszó megerősítése</mat-label>
              <input matInput [(ngModel)]="passwordForm.confirmPassword" type="password" name="confirmPassword">
            </mat-form-field>
            
            <div class="action-row">
              <button mat-raised-button color="primary" (click)="changePassword()"
                      [disabled]="!passwordForm.currentPassword || 
                                 !passwordForm.newPassword || 
                                 passwordForm.newPassword !== passwordForm.confirmPassword ||
                                 passwordForm.newPassword.length < 6">
                Jelszó módosítása
              </button>
            </div>
          </div>
        </mat-tab>
        
        <!-- Megjelenítés beállításai fül -->
        <mat-tab label="Megjelenítés">
          <div class="tab-content">
            <h3>Megjelenítési beállítások</h3>
            
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Alapértelmezett projekt nézet</mat-label>
              <mat-select [(ngModel)]="userSettings.defaultProjectView" (selectionChange)="saveSettings()">
                <mat-option value="card">Kártya</mat-option>
                <mat-option value="table">Táblázat</mat-option>
              </mat-select>
              <mat-hint>A projektek megjelenítési módja</mat-hint>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Alapértelmezett grafikon nézet</mat-label>
              <mat-select [(ngModel)]="userSettings.defaultGraphView" (selectionChange)="saveSettings()">
                <mat-option value="all" *ngIf="authService.isAdmin()">Összes kapcsolat</mat-option>
                <mat-option value="projects">Csak projektek</mat-option>
                <mat-option value="project-tasks">Projekt és feladatai</mat-option>
                <mat-option value="user">Felhasználó és kapcsolatai</mat-option>
              </mat-select>
              <mat-hint>A grafikon nézet kezdeti beállítása</mat-hint>
            </mat-form-field>
            
            <div class="theme-toggle">
              <h4>Felület témája</h4>
              <div class="theme-selection">
                <div class="theme-option" 
                     [class.selected]="userSettings.uiTheme === 'light'"
                     (click)="setTheme('light')">
                  <mat-icon>light_mode</mat-icon>
                  <span>Világos</span>
                </div>
                <div class="theme-option" 
                     [class.selected]="userSettings.uiTheme === 'dark'"
                     (click)="setTheme('dark')">
                  <mat-icon>dark_mode</mat-icon>
                  <span>Sötét</span>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .profile-settings-container {
      margin: 20px 0;
    }
    
    .tab-content {
      padding: 20px 0;
    }
    
    .form-field-row {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .form-field {
      width: 100%;
      margin-bottom: 20px;
    }
    
    .action-row {
      margin-top: 20px;
    }
    
    h3 {
      margin-top: 0;
      margin-bottom: 20px;
      font-weight: 500;
    }
    
    .theme-toggle {
      margin-top: 20px;
    }
    
    .theme-selection {
      display: flex;
      gap: 20px;
      margin-top: 10px;
    }
    
    .theme-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 15px;
      border-radius: 8px;
      border: 2px solid transparent;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .theme-option:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
    
    .theme-option.selected {
      border-color: #3f51b5;
      background-color: rgba(63, 81, 181, 0.1);
    }
    
    .theme-option mat-icon {
      font-size: 24px;
      height: 24px;
      width: 24px;
      margin-bottom: 8px;
    }
    
    @media (max-width: 768px) {
      .form-field-row {
        flex-direction: column;
        gap: 0;
      }
    }
  `]
})
export class ProfileSettingsComponent implements OnInit {
  userProfile: UserProfile | null = null;
  userSettings: UserSettings = {
    userId: '',
    defaultProjectView: 'card',
    defaultGraphView: 'all',
    uiTheme: 'light'
  };

  profileForm = {
    firstName: '',
    lastName: ''
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  constructor(
    private userProfileService: UserProfileService,
    public authService: AuthService,
    private themeService: ThemeService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadUserSettings();
  }

  loadUserProfile(): void {
    this.userProfileService.getUserProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.profileForm.firstName = profile.firstName || '';
        this.profileForm.lastName = profile.lastName || '';
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        this.snackBar.open('Hiba történt a felhasználói profil betöltése közben', 'OK', {
          duration: 3000
        });
      }
    });
  }

  loadUserSettings(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    this.userSettings.userId = userId;

    this.userProfileService.getUserSettings().subscribe({
      next: (settings) => {
        this.userSettings = settings;
      },
      error: (error) => {
        console.error('Error loading user settings:', error);
        this.snackBar.open('Hiba történt a felhasználói beállítások betöltése közben', 'OK', {
          duration: 3000
        });
      }
    });
  }

  saveProfile(): void {
    this.userProfileService.updateUserProfile(
      this.profileForm.firstName,
      this.profileForm.lastName
    ).subscribe({
      next: () => {
        this.snackBar.open('A profil adatok sikeresen mentve', 'OK', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Error saving profile:', error);
        this.snackBar.open('Hiba történt a profil mentése közben', 'OK', {
          duration: 3000
        });
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.snackBar.open('Az új jelszó és a megerősítés nem egyezik', 'OK', {
        duration: 3000
      });
      return;
    }

    this.userProfileService.changePassword(
      this.passwordForm.currentPassword,
      this.passwordForm.newPassword
    ).subscribe({
      next: () => {
        this.snackBar.open('A jelszó sikeresen módosítva', 'OK', {
          duration: 3000
        });
        // Ürítsük ki a form mezőket
        this.passwordForm = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
      },
      error: (error) => {
        console.error('Error changing password:', error);
        this.snackBar.open('Hiba történt a jelszó módosítása közben. Ellenőrizze, hogy a jelenlegi jelszó helyes-e.', 'OK', {
          duration: 5000
        });
      }
    });
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.userSettings.uiTheme = theme;

    if (theme === 'dark') {
      this.themeService.applyTheme(true);
    } else {
      this.themeService.applyTheme(false);
    }

    this.saveSettings();
  }

  saveSettings(): void {
    const settingsToSave = {
      id: this.userSettings.id,
      userId: this.userSettings.userId,
      defaultProjectView: this.userSettings.defaultProjectView,
      defaultGraphView: this.userSettings.defaultGraphView,
      uiTheme: this.userSettings.uiTheme
    };

    console.log('Saving settings:', settingsToSave);

    this.userProfileService.updateUserSettings(settingsToSave).subscribe({
      next: () => {
        console.log('Settings saved successfully');
        this.snackBar.open('A beállítások sikeresen mentve', 'OK', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Error saving settings:', error);
        console.error('Error details:', error.error);
        this.snackBar.open(`Hiba történt a beállítások mentése közben: ${error.message || error.statusText}`, 'OK', {
          duration: 3000
        });
      }
    });
  }
}
