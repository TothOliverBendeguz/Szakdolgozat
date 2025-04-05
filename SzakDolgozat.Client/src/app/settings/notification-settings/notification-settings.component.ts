import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { NotificationService, NotificationPreference } from '../../services/notification.service';

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatRadioModule,
    MatDividerModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatButtonToggleModule,
    MatExpansionModule
  ],
  template: `
    <div class="notification-settings">
      <h3 class="section-heading">Értesítési beállítások</h3>
      
      <div class="settings-section">
        <mat-slide-toggle [(ngModel)]="preferences.enabled" class="main-toggle">
          Értesítések engedélyezése
        </mat-slide-toggle>

        <div *ngIf="preferences.enabled" class="settings-content">
          <h4 class="subsection-heading">Általános beállítások</h4>
          
          <!-- Fix értesítések -->
          <div class="notification-option">
            <mat-checkbox [(ngModel)]="alwaysNotifyOneDayBefore" class="important-option">
              Mindig értesítsen a határidő előtt 1 nappal
            </mat-checkbox>
          </div>
          
          <mat-divider class="section-divider"></mat-divider>
          
          <!-- Előre beállított csomagok -->
          <h4 class="subsection-heading">Értesítési gyakoriság</h4>
          <p class="hint-text">Válassz az előre beállított értesítési csomagok közül, vagy állítsd be egyénileg.</p>
          
          <mat-button-toggle-group [(ngModel)]="selectedPreset" (change)="onPresetChange()" class="preset-toggle">
            <mat-button-toggle value="standard">Standard</mat-button-toggle>
            <mat-button-toggle value="intensive">Intenzív</mat-button-toggle>
            <mat-button-toggle value="minimal">Minimális</mat-button-toggle>
            <mat-button-toggle value="custom">Egyéni</mat-button-toggle>
          </mat-button-toggle-group>
          
          <div *ngIf="selectedPreset !== 'custom'" class="preset-description">
            <p *ngIf="selectedPreset === 'standard'">
              <strong>Standard:</strong> Értesítések 30 nappal a határidő előtt, hetente.
            </p>
            <p *ngIf="selectedPreset === 'intensive'">
              <strong>Intenzív:</strong> Értesítések 14 nappal a határidő előtt, 2 naponta.
            </p>
            <p *ngIf="selectedPreset === 'minimal'">
              <strong>Minimális:</strong> Értesítések csak 7 nappal a határidő előtt, hetente.
            </p>
          </div>
          
          <div *ngIf="selectedPreset === 'custom'" class="custom-settings">
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Értesítések kezdete (nappal a határidő előtt)</mat-label>
                <input matInput type="number" [(ngModel)]="preferences.daysBeforeDeadline" min="1" max="180">
              </mat-form-field>
            </div>
              
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Értesítések gyakorisága (naponta)</mat-label>
                <input matInput type="number" [(ngModel)]="preferences.frequencyInDays" min="1" max="14">
              </mat-form-field>
            </div>
          </div>

          <!-- Email értesítési beállítások -->
          <mat-expansion-panel class="email-panel">
            <mat-expansion-panel-header>
              <mat-panel-title>
                Email értesítések
              </mat-panel-title>
              <mat-panel-description>
                Email értesítések beállításai
              </mat-panel-description>
            </mat-expansion-panel-header>

            <div class="email-settings">
              <mat-slide-toggle [(ngModel)]="preferences.emailEnabled" class="email-toggle">
                Email értesítések engedélyezése
              </mat-slide-toggle>

              <div *ngIf="preferences.emailEnabled" class="email-frequency">
                <p class="hint-text">Az email értesítések az alkalmazáson belüli értesítésekkel együtt működnek, 
                  de beállíthatod, hogy ritkábban kapj email értesítéseket.</p>
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Email értesítések gyakorisága (naponta)</mat-label>
                  <input matInput type="number" [(ngModel)]="preferences.emailFrequencyInDays" min="1" max="30">
                  <mat-hint>Állítsd magasabbra, mint az általános értesítési gyakoriság, ha ritkábban szeretnél emaileket kapni</mat-hint>
                </mat-form-field>
              </div>
            </div>
          </mat-expansion-panel>
        </div>
      </div>
      
      <!-- Mentés gomb -->
      <div class="actions">
        <button mat-raised-button color="primary" (click)="saveSettings()" class="save-button">
          Beállítások mentése
        </button>
        <button mat-button (click)="resetSettings()">
          Visszaállítás
        </button>
      </div>
    </div>
  `,
  styles: [`
    .notification-settings {
      padding: 16px 0;
    }
    
    .section-heading {
      font-size: 20px;
      font-weight: 500;
      margin-bottom: 24px;
      color: #333;
    }
    
    .subsection-heading {
      font-size: 18px;
      font-weight: 500;
      margin-top: 28px;
      margin-bottom: 16px;
      color: #444;
    }
    
    .settings-section {
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
      border: 1px solid #eee;
    }
    
    .settings-content {
      margin-top: 24px;
      padding-left: 8px;
    }
    
    .section-divider {
      margin: 32px 0 !important;
      border-color: rgba(0, 0, 0, 0.1);
    }
    
    .notification-option {
      margin: 24px 0;
    }
    
    .main-toggle {
      font-size: 16px;
      font-weight: 500;
    }
    
    .important-option {
      font-weight: 500;
    }
    
    .hint-text {
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 16px;
      font-style: italic;
    }
    
    .preset-toggle {
      width: 100%;
      margin-bottom: 24px;
    }
    
    .preset-description {
      background-color: #e8eaf6;
      padding: 16px;
      border-radius: 4px;
      margin-bottom: 24px;
    }
    
    .preset-description p {
      margin: 0;
    }
    
    .custom-settings {
      background-color: rgba(0, 0, 0, 0.03);
      padding: 20px;
      border-radius: 4px;
      margin-bottom: 24px;
    }
    
    .form-row {
      margin-bottom: 20px;
    }
    
    .form-field {
      width: 100%;
    }
    
    .email-panel {
      margin-top: 28px !important;
      margin-bottom: 24px !important;
    }
    
    .email-settings {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 8px 0;
    }
    
    .email-toggle {
      margin-bottom: 16px;
    }
    
    .email-frequency {
      background-color: rgba(0, 0, 0, 0.02);
      padding: 16px;
      border-radius: 4px;
      margin-top: 8px;
    }
    
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #eee;
    }
    
    .save-button {
      min-width: 150px;
    }
    
    ::ng-deep .mat-mdc-slide-toggle {
      margin-bottom: 16px;
    }
    
    ::ng-deep .mat-mdc-form-field {
      margin-bottom: 16px;
    }
    
    /* Javítás a mat-expansion-panel-hez */
    ::ng-deep .mat-expansion-panel-body {
      padding: 24px 16px !important;
    }
    
    ::ng-deep .mat-expansion-panel-header {
      padding: 16px 24px !important;
      height: auto !important;
      min-height: 60px !important;
    }
  `]
})
export class NotificationSettingsComponent implements OnInit {
  preferences: NotificationPreference = {
    id: 0,
    userId: '',
    enabled: true,
    daysBeforeDeadline: 30,
    frequencyInDays: 7,
    onlyActiveProjects: true,
    onlyAssignedProjects: false,
    alwaysNotifyOneDayBefore: true,
    emailEnabled: true,
    emailFrequencyInDays: 7
  };

  alwaysNotifyOneDayBefore: boolean = true;
  selectedPreset: string = 'standard';

  presetConfigurations = {
    standard: { daysBeforeDeadline: 30, frequencyInDays: 7 },
    intensive: { daysBeforeDeadline: 14, frequencyInDays: 2 },
    minimal: { daysBeforeDeadline: 7, frequencyInDays: 7 }
  };

  originalPreferences: NotificationPreference | null = null;
  loading: boolean = false;

  constructor(
    private notificationService: NotificationService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadPreferences();
  }

  loadPreferences(): void {
    this.loading = true;
    this.notificationService.getPreferences().subscribe({
      next: (preferences) => {
        this.preferences = preferences;
        this.originalPreferences = { ...preferences };
        this.alwaysNotifyOneDayBefore = preferences.alwaysNotifyOneDayBefore || false;
        this.determineCurrentPreset();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading notification preferences:', error);
        this.snackBar.open('Hiba történt a beállítások betöltése közben', 'OK', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }

  determineCurrentPreset(): void {
    const { daysBeforeDeadline, frequencyInDays } = this.preferences;

    if (daysBeforeDeadline === 30 && frequencyInDays === 7) {
      this.selectedPreset = 'standard';
    } else if (daysBeforeDeadline === 14 && frequencyInDays === 2) {
      this.selectedPreset = 'intensive';
    } else if (daysBeforeDeadline === 7 && frequencyInDays === 7) {
      this.selectedPreset = 'minimal';
    } else {
      this.selectedPreset = 'custom';
    }
  }

  onPresetChange(): void {
    if (this.selectedPreset !== 'custom') {
      const preset = this.presetConfigurations[this.selectedPreset as keyof typeof this.presetConfigurations];
      this.preferences.daysBeforeDeadline = preset.daysBeforeDeadline;
      this.preferences.frequencyInDays = preset.frequencyInDays;
    }
  }

  saveSettings(): void {
    this.loading = true;

    if (this.preferences.daysBeforeDeadline <= 0) {
      this.snackBar.open('Az értesítési időszaknak legalább 1 napnak kell lennie', 'OK', { duration: 3000 });
      this.loading = false;
      return;
    }
    if (this.preferences.frequencyInDays <= 0) {
      this.snackBar.open('Az értesítési gyakoriságnak legalább 1 napnak kell lennie', 'OK', { duration: 3000 });
      this.loading = false;
      return;
    }
    if (this.preferences.emailFrequencyInDays <= 0) {
      this.snackBar.open('Az email értesítési gyakoriságnak legalább 1 napnak kell lennie', 'OK', { duration: 3000 });
      this.loading = false;
      return;
    }
    this.preferences.alwaysNotifyOneDayBefore = this.alwaysNotifyOneDayBefore;


    this.notificationService.updatePreferences(this.preferences).subscribe({
      next: (updatedPreferences) => {
        this.preferences = updatedPreferences;
        this.originalPreferences = { ...updatedPreferences };
        this.snackBar.open('Értesítési beállítások mentve', 'OK', {
          duration: 2000
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error saving notification preferences:', error);
        this.snackBar.open('Hiba történt a beállítások mentése közben', 'OK', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }

  resetSettings(): void {
    if (this.originalPreferences) {
      this.preferences = { ...this.originalPreferences };
      this.alwaysNotifyOneDayBefore = this.originalPreferences.alwaysNotifyOneDayBefore || false;
      this.determineCurrentPreset();
    }
  }

  isFormValid(): boolean {
    return this.preferences.daysBeforeDeadline > 0 &&
      this.preferences.frequencyInDays > 0 &&
      this.preferences.emailFrequencyInDays > 0;
  }
}
