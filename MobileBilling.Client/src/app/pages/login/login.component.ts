import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <span class="login-icon">📱</span>
          <h1>MobileBilling</h1>
          <p>Telecom Billing Solution</p>
        </div>
        <form (ngSubmit)="onLogin()" class="login-form">
          <div class="form-group">
            <label for="username">Username</label>
            <input id="username" type="text" class="form-control" [(ngModel)]="username" name="username"
              placeholder="Enter username" required autofocus>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" type="password" class="form-control" [(ngModel)]="password" name="password"
              placeholder="Enter password" required>
          </div>
          <div class="error-msg" *ngIf="error">{{ error }}</div>
          <button type="submit" class="btn btn-primary login-btn" [disabled]="loading">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    }
    .login-card {
      background: #fff;
      border-radius: 20px;
      padding: 48px 40px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      animation: fadeUp 0.5s ease;
    }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .login-header {
      text-align: center;
      margin-bottom: 36px;
    }
    .login-icon { font-size: 48px; display: block; margin-bottom: 12px; }
    .login-header h1 { font-size: 28px; font-weight: 700; color: #1a1a2e; }
    .login-header p { color: #64748b; font-size: 14px; margin-top: 4px; }
    .login-btn { width: 100%; justify-content: center; padding: 14px; font-size: 16px; margin-top: 8px; }
    .error-msg {
      background: #fef2f2;
      color: #dc2626;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 13px;
      margin-bottom: 12px;
      border: 1px solid #fecaca;
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {
    if (auth.isLoggedIn()) this.router.navigate(['/home']);
  }

  onLogin() {
    this.error = '';
    this.loading = true;
    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Invalid username or password';
        this.loading = false;
      }
    });
  }
}
