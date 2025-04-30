import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { Observable, throwError, Subject } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

export enum UserRole {
  Admin = 1,
  Developer = 2,
  Reader = 3
}

interface RegisterResponse {
  token: string;
  role: UserRole;
  message: string;
}

interface LoginResponse {
  token: string;
  role: UserRole;
  message: string;
}

interface DecodedToken {
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': string;
  exp: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://localhost:7294/api';
  private currentUserRole: UserRole | null = null;
  private tokenCheckInterval: any = null;

  public authStateChange = new Subject<boolean>();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserRole();
    this.setupTokenExpirationCheck();
  }

  register(user: { username: string; email: string; password: string }): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/auth/register`, user)
      .pipe(
        tap(response => {
          if (response && response.token) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('userRole', response.role.toString());
            this.currentUserRole = response.role;
            this.setupTokenExpirationCheck();

            this.authStateChange.next(true);
          }
        }),
        catchError(this.handleError)
      );
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { username, password })
      .pipe(
        tap(response => {
          if (response && response.token) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('userRole', response.role.toString());
            this.currentUserRole = response.role;
            this.setupTokenExpirationCheck();

            this.authStateChange.next(true);
          }
        }),
        catchError(this.handleError)
      );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    this.currentUserRole = null;
    this.clearTokenExpirationCheck();

    
    this.authStateChange.next(false);

    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const decodedToken = jwtDecode<DecodedToken>(token);
      const currentTime = Date.now() / 1000;

      if (decodedToken.exp <= currentTime) {
        console.log('Token expired, logging out');
        this.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating token:', error);
      this.logout();
      return false;
    }
  }

  isTokenValid(): boolean {
    return this.isLoggedIn();
  }

  getCurrentUserRole(): UserRole {
    if (this.currentUserRole === null) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decodedToken = jwtDecode<DecodedToken>(token);
          const role = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
          this.currentUserRole = Number(role) as UserRole;
        } catch (error) {
          console.error('Error decoding role from token:', error);
          this.currentUserRole = UserRole.Reader;
        }
      } else {
        this.currentUserRole = UserRole.Reader;
      }
    }
    return this.currentUserRole;
  }

  isAdmin(): boolean {
    return this.isLoggedIn() && this.getCurrentUserRole() === UserRole.Admin;
  }

  isDeveloper(): boolean {
    return this.isLoggedIn() && this.getCurrentUserRole() === UserRole.Developer;
  }

  isReader(): boolean {
    return this.isLoggedIn() && this.getCurrentUserRole() === UserRole.Reader;
  }

  getCurrentUserId(): string | null {
    if (!this.isLoggedIn()) return null;

    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const decodedToken = jwtDecode<DecodedToken>(token);
      return decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  getCurrentUserEmail(): string | null {
    if (!this.isLoggedIn()) return null;

    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const decodedToken = jwtDecode<DecodedToken>(token);
      return decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
    } catch (error) {
      console.error('Error getting user email:', error);
      return null;
    }
  }

  private loadUserRole() {
    if (this.isLoggedIn()) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decodedToken = jwtDecode<DecodedToken>(token);
          const roleStr = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
          this.currentUserRole = Number(roleStr) as UserRole;
        } catch (error) {
          console.error('Error loading user role:', error);
          this.currentUserRole = UserRole.Reader;
        }
      }
    } else {
      this.currentUserRole = null;
    }
  }

  private setupTokenExpirationCheck() {
    this.clearTokenExpirationCheck();

    this.tokenCheckInterval = setInterval(() => {
      if (!this.isLoggedIn()) {
        this.logout();
        this.clearTokenExpirationCheck();
      }
    }, 60 * 60 * 1000); 
  }

  private clearTokenExpirationCheck() {
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
      this.tokenCheckInterval = null;
    }
  }

  private handleError(error: any) {
    console.error('An error occurred:', error);
    return throwError(() => error);
  }
}
