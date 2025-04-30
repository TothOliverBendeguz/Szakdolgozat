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
  selector: 'app-register',
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
    <div class="register-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Regisztráció</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline">
              <mat-label>Felhasználónév</mat-label>
              <input matInput [(ngModel)]="username" name="username" required>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" [(ngModel)]="email" name="email" required>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Jelszó</mat-label>
              <input matInput type="password" [(ngModel)]="password" name="password" required>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Jelszó újra</mat-label>
              <input matInput type="password" [(ngModel)]="confirmPassword" name="confirmPassword" required>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit" class="register-button">Regisztráció</button>
            <p class="login-link">
              Már van fiókod? <a routerLink="/login">Bejelentkezés</a>
            </p>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .register-container {
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

    .register-button {
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

    .login-link {
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
export class RegisterComponent {
  username: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  onSubmit(): void {
    if (this.password !== this.confirmPassword) {
      alert("A két jelszó nem egyezik!");
      return;
    }

    this.authService.register({
      username: this.username,
      email: this.email,
      password: this.password
    }).subscribe({
      next: (response) => {
        console.log('Sikeres regisztráció', response);
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Regisztráció sikertelen', error);
        alert('Sikertelen regisztráció. Kérjük, próbálja újra.');
      }
    });
  }
}
