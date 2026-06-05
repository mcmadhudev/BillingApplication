import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-layout" *ngIf="auth.isLoggedIn(); else loginView">
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed">
        <div class="sidebar-header">
          <span class="logo" *ngIf="!sidebarCollapsed">📱 MobileBilling</span>
          <span class="logo" *ngIf="sidebarCollapsed">📱</span>
          <button class="toggle-btn" (click)="sidebarCollapsed = !sidebarCollapsed">
            {{ sidebarCollapsed ? '☰' : '✕' }}
          </button>
        </div>
        <nav class="sidebar-nav">
          <a routerLink="/home" routerLinkActive="active">
            <span class="nav-icon">🏠</span>
            <span class="nav-text" *ngIf="!sidebarCollapsed">Home</span>
          </a>
          <a routerLink="/invoice" routerLinkActive="active">
            <span class="nav-icon">🧾</span>
            <span class="nav-text" *ngIf="!sidebarCollapsed">Invoice</span>
          </a>
          <a routerLink="/inventory" routerLinkActive="active">
            <span class="nav-icon">📦</span>
            <span class="nav-text" *ngIf="!sidebarCollapsed">Inventory</span>
          </a>
          <a routerLink="/reports" routerLinkActive="active">
            <span class="nav-icon">📊</span>
            <span class="nav-text" *ngIf="!sidebarCollapsed">Reports</span>
          </a>
          <a routerLink="/admin" routerLinkActive="active" *ngIf="auth.isAdmin()">
            <span class="nav-icon">⚙️</span>
            <span class="nav-text" *ngIf="!sidebarCollapsed">Admin</span>
          </a>
        </nav>
        <div class="sidebar-footer">
          <button class="logout-btn" (click)="auth.logout()">
            <span class="nav-icon">🚪</span>
            <span class="nav-text" *ngIf="!sidebarCollapsed">Logout</span>
          </button>
        </div>
      </aside>
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
    <ng-template #loginView>
      <router-outlet />
    </ng-template>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
    }
    .sidebar {
      width: 240px;
      background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
      color: #e0e0e0;
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      z-index: 100;
    }
    .sidebar.collapsed { width: 64px; }
    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .logo {
      font-weight: 700;
      font-size: 16px;
      white-space: nowrap;
      overflow: hidden;
    }
    .toggle-btn {
      background: none;
      border: none;
      color: #e0e0e0;
      font-size: 18px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
    }
    .toggle-btn:hover { background: rgba(255,255,255,0.1); }
    .sidebar-nav {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 12px 8px;
      gap: 4px;
    }
    .sidebar-nav a {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 8px;
      text-decoration: none;
      color: #b0b0c0;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .sidebar-nav a:hover { background: rgba(255,255,255,0.08); color: #fff; }
    .sidebar-nav a.active { background: rgba(99,102,241,0.2); color: #818cf8; font-weight: 600; }
    .nav-icon { font-size: 18px; min-width: 20px; text-align: center; }
    .sidebar-footer {
      padding: 12px 8px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    .logout-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 8px;
      background: none;
      border: none;
      color: #f87171;
      cursor: pointer;
      width: 100%;
      font-size: 14px;
      transition: all 0.2s;
    }
    .logout-btn:hover { background: rgba(248,113,113,0.15); }
    .main-content {
      flex: 1;
      margin-left: 240px;
      padding: 32px;
      background: #f5f7fb;
      min-height: 100vh;
      transition: margin-left 0.3s ease;
    }
    .sidebar.collapsed ~ .main-content { margin-left: 64px; }
  `]
})
export class AppComponent {
  sidebarCollapsed = false;
  constructor(public auth: AuthService) {}
}
