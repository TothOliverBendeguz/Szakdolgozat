import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { ThemeService } from './services/theme.service';
import { UserProfileService } from './services/user-profile.service';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, CommonModule],
  template: `
    <app-navbar></app-navbar>
    <div class="content-container">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .content-container {
      padding-top: 64px; 
      padding: 84px 20px 20px 20px;
    }
  `]
})
export class AppComponent implements OnInit {
  constructor(
    private themeService: ThemeService,
    private userProfileService: UserProfileService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.loadThemePreference();

    this.authService.authStateChange.subscribe(() => {
      this.loadThemePreference();
    });
  }

  private loadThemePreference() {
    if (this.authService.isLoggedIn()) {
      this.userProfileService.getUserSettings().subscribe({
        next: (settings) => {
          const isDarkMode = settings.uiTheme === 'dark';
          this.themeService.applyTheme(isDarkMode);
        },
        error: (error) => {
          console.error('Error loading theme setting:', error);
          const savedTheme = localStorage.getItem('theme');
          const isDarkMode = savedTheme === 'dark';
          this.themeService.applyTheme(isDarkMode);
        }
      });
    } else {
      const savedTheme = localStorage.getItem('theme');
      const isDarkMode = savedTheme === 'dark';
      this.themeService.applyTheme(isDarkMode);
    }
  }
}
