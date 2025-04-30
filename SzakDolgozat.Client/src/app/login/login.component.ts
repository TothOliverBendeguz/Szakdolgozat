import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <div class="login-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Bejelentkezés</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline">
              <mat-label>Felhasználónév</mat-label>
              <input matInput [(ngModel)]="username" name="username" required>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Jelszó</mat-label>
              <input matInput type="password" [(ngModel)]="password" name="password" required>
            </mat-form-field>

            <button type="submit" class="login-button">Bejelentkezés</button>
            <p class="register-link">
              Nincs még fiókod? <a routerLink="/register">Regisztrálj itt</a>
            </p>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f5f5f5;
    }

    mat-card {
      width: 400px;
      max-width: 90%;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    mat-form-field {
      width: 100%;
    }

    .login-button {
      background-color: #e0e0e0;  /* Enyhén sötétebb mint a háttér */
      color: rgba(0, 0, 0, 0.87);
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 500;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s;
      margin-top: 8px;
      text-align: center;
    }

    .login-button:hover {
      background-color: #d5d5d5;  /* Kicsit sötétebb hover állapotban */
    }

    .register-link {
      margin-top: 16px;
      text-align: center;
    }

    a {
      color: #1976D2;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    mat-card-header {
      margin-bottom: 16px;
    }
  `]
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  onSubmit() {
    this.authService.login(this.username, this.password).subscribe({
      next: (response) => {
        if (response && response.token) {
          localStorage.setItem('token', response.token);
          this.router.navigate(['/projects']);
        }
      },
      error: (error) => {
        console.error('Login failed', error);
        alert('Sikertelen bejelentkezés. Kérjük, ellenőrizze az adatait.');
      }
    });
  }
}
