import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <h1>Welcome, {{ (auth.user$ | async)?.username }}! 👋</h1>
      <p>Telecom Billing Dashboard</p>
    </div>
    <div class="dashboard-grid">
      <a routerLink="/invoice" class="dash-card">
        <div class="dash-icon">🧾</div>
        <h3>Invoice</h3>
        <p>Create & manage invoices</p>
      </a>
      <a routerLink="/inventory" class="dash-card">
        <div class="dash-icon">📦</div>
        <h3>Inventory</h3>
        <p>Products & stock management</p>
      </a>
      <a routerLink="/reports" class="dash-card">
        <div class="dash-icon">📊</div>
        <h3>Reports</h3>
        <p>Sales & stock reports</p>
      </a>
      <a routerLink="/admin" class="dash-card" *ngIf="auth.isAdmin()">
        <div class="dash-icon">⚙️</div>
        <h3>Admin</h3>
        <p>Users & configuration</p>
      </a>
    </div>
  `,
  styles: [`
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 20px;
      margin-top: 8px;
    }
    .dash-card {
      background: #fff;
      border-radius: 16px;
      padding: 32px 24px;
      text-decoration: none;
      color: inherit;
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
      transition: all 0.25s;
      text-align: center;
    }
    .dash-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(99,102,241,0.15);
      border-color: var(--primary);
    }
    .dash-icon { font-size: 40px; margin-bottom: 12px; }
    .dash-card h3 { font-size: 18px; font-weight: 600; margin-bottom: 4px; }
    .dash-card p { color: var(--text-muted); font-size: 13px; }
  `]
})
export class HomeComponent {
  constructor(public auth: AuthService) {}
}
