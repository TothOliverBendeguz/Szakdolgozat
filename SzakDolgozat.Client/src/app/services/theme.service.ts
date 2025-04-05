import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserProfileService } from './user-profile.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private darkMode = new BehaviorSubject<boolean>(false);
  darkMode$ = this.darkMode.asObservable();

  constructor(
    rendererFactory: RendererFactory2
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);

    // Alapértelmezetten próbáljuk meg betölteni a témát a localStorage-ból
    this.loadThemeFromLocalStorage();
  }

  private loadThemeFromLocalStorage(): void {
    const savedTheme = localStorage.getItem('theme');
    const isDarkMode = savedTheme === 'dark';
    this.darkMode.next(isDarkMode);
    this.applyTheme(isDarkMode);
  }

  toggleDarkMode(): void {
    const newDarkMode = !this.darkMode.value;
    this.darkMode.next(newDarkMode);
    this.applyTheme(newDarkMode);

    // Mentés localStorage-ba
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
  }

  applyTheme(isDarkMode: boolean): void {
    if (isDarkMode) {
      this.renderer.addClass(document.body, 'dark-theme');
    } else {
      this.renderer.removeClass(document.body, 'dark-theme');
    }

    // Mentés localStorage-ba
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }
}
