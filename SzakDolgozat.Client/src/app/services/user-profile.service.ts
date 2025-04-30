import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError, shareReplay } from 'rxjs/operators';
import { AuthService } from '../auth.service';

export interface UserProfile {
  id: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  role: number;
}

export interface UserSettings {
  id?: number;
  userId: string;
  defaultProjectView: string;
  defaultGraphView: string;
  uiTheme: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private apiUrl = 'https://localhost:7294/api/UserProfile';

  private userSettingsCache: UserSettings | null = null;
  private userSettings$ = new BehaviorSubject<UserSettings | null>(null);

  public settings$ = this.userSettings$.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.loadUserSettings();
  }

  getUserProfile(): Observable<UserProfile> {
    if (!this.authService.isLoggedIn()) {
      return of({
        id: '',
        userName: 'Guest',
        email: '',
        firstName: '',
        lastName: '',
        role: 3
      });
    }

    return this.http.get<UserProfile>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Error fetching user profile:', error);
        return of({
          id: this.authService.getCurrentUserId() || '',
          userName: this.authService.getCurrentUserEmail() || 'Guest',
          email: this.authService.getCurrentUserEmail() || '',
          firstName: '',
          lastName: '',
          role: this.authService.getCurrentUserRole()
        });
      })
    );
  }

  updateUserProfile(firstName: string, lastName: string): Observable<any> {
    return this.http.put(this.apiUrl, { firstName, lastName });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, { currentPassword, newPassword });
  }

  getUserSettings(): Observable<UserSettings> {
    if (!this.authService.isLoggedIn()) {
      const defaultSettings: UserSettings = {
        userId: '',
        defaultProjectView: 'card',
        defaultGraphView: 'all',
        uiTheme: localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
      };
      return of(defaultSettings);
    }

    if (this.userSettingsCache) {
      return of(this.userSettingsCache);
    }

    return this.http.get<UserSettings>(`${this.apiUrl}/settings`).pipe(
      tap(settings => {
        this.userSettingsCache = settings;
        this.userSettings$.next(settings);
      }),
      catchError(error => {
        console.error('Error fetching user settings:', error);
        const defaultSettings: UserSettings = {
          userId: this.authService.getCurrentUserId() || '',
          defaultProjectView: 'card',
          defaultGraphView: 'all',
          uiTheme: localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
        };
        return of(defaultSettings);
      }),
      shareReplay(1)
    );
  }

  updateUserSettings(settings: UserSettings): Observable<any> {
    this.userSettingsCache = settings;
    this.userSettings$.next(settings);

    if (settings.uiTheme) {
      localStorage.setItem('theme', settings.uiTheme);
    }

    return this.http.put(`${this.apiUrl}/settings`, settings).pipe(
      tap(() => {
        console.log('Settings saved successfully');
      }),
      catchError(error => {
        console.error('Error saving settings:', error);
        return of({ error: error.message });
      })
    );
  }

  loadUserSettings(): void {
    if (!this.authService.isLoggedIn()) {
      const defaultSettings: UserSettings = {
        userId: '',
        defaultProjectView: 'card',
        defaultGraphView: 'all',
        uiTheme: localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
      };
      this.userSettingsCache = defaultSettings;
      this.userSettings$.next(defaultSettings);
      return;
    }

    this.http.get<UserSettings>(`${this.apiUrl}/settings`).subscribe({
      next: (settings) => {
        this.userSettingsCache = settings;
        this.userSettings$.next(settings);
        console.log('User settings loaded:', settings);
      },
      error: (error) => {
        console.error('Error loading user settings:', error);
        const defaultSettings: UserSettings = {
          userId: this.authService.getCurrentUserId() || '',
          defaultProjectView: 'card',
          defaultGraphView: 'all',
          uiTheme: localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
        };
        this.userSettingsCache = defaultSettings;
        this.userSettings$.next(defaultSettings);
      }
    });
  }

  getCurrentSettings(): UserSettings | null {
    return this.userSettingsCache;
  }
}
