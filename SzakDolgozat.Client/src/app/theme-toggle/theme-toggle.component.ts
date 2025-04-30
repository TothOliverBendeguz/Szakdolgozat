import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '../services/theme.service';
import { UserProfileService } from '../services/user-profile.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  template: `
    <button 
      mat-icon-button 
      [matTooltip]="isDarkMode ? 'Váltás világos módra' : 'Váltás sötét módra'"
      (click)="toggleTheme()">
      <mat-icon>{{ isDarkMode ? 'light_mode' : 'dark_mode' }}</mat-icon>
    </button>
  `,
  styles: []
})
export class ThemeToggleComponent implements OnInit {
  isDarkMode = false;

  constructor(
    private themeService: ThemeService,
    private userProfileService: UserProfileService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.themeService.darkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });
  }

  toggleTheme(): void {
    this.themeService.toggleDarkMode();

    if (this.authService.isLoggedIn()) {
      this.userProfileService.getUserSettings().subscribe({
        next: (settings) => {
          settings.uiTheme = this.isDarkMode ? 'light' : 'dark';
          this.userProfileService.updateUserSettings(settings).subscribe({
            error: (error) => console.error('Error updating user theme preference:', error)
          });
        },
        error: (error) => console.error('Error getting user settings for theme update:', error)
      });
    }
  }
}
