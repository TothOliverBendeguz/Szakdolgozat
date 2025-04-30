import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserProfileService } from './user-profile.service';
import { AuthService } from '../auth.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private darkMode = new BehaviorSubject<boolean>(false);
  darkMode$ = this.darkMode.asObservable();

  constructor(
    rendererFactory: RendererFactory2,
    private userProfileService: UserProfileService,
    private authService: AuthService
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.loadTheme();
  }

  private loadTheme(): void {
    if (this.authService.isLoggedIn()) {
      this.userProfileService.getUserSettings().subscribe({
        next: (settings) => {
          const isDarkMode = settings.uiTheme === 'dark';
          this.darkMode.next(isDarkMode);
          this.applyTheme(isDarkMode);
        },
        error: () => {
          this.loadFallbackTheme();
        }
      });
    } else {
      this.loadFallbackTheme();
    }
  }

  private loadFallbackTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDarkMode = savedTheme === 'dark' || (savedTheme === null && prefersDark);

    this.darkMode.next(isDarkMode);
    this.applyTheme(isDarkMode);
  }

  toggleDarkMode(): void {
    const newDarkMode = !this.darkMode.value;
    this.darkMode.next(newDarkMode);
    this.applyTheme(newDarkMode);
    this.saveThemePreference(newDarkMode);
  }

  private saveThemePreference(isDarkMode: boolean): void {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');

    if (this.authService.isLoggedIn()) {
      this.userProfileService.getUserSettings().subscribe({
        next: (settings) => {
          settings.uiTheme = isDarkMode ? 'dark' : 'light';
          this.userProfileService.updateUserSettings(settings).subscribe();
        }
      });
    }
  }

  applyTheme(isDarkMode: boolean): void {
    if (isDarkMode) {
      this.renderer.addClass(document.body, 'dark-theme');
    } else {
      this.renderer.removeClass(document.body, 'dark-theme');
    }
  }
}
