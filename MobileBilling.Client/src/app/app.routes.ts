import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent)
  },
  {
    path: 'inventory',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/inventory/inventory.component').then(m => m.InventoryComponent)
  },
  {
    path: 'invoice',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/invoice/invoice-landing.component').then(m => m.InvoiceLandingComponent)
  },
  {
    path: 'invoice/new',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/invoice/invoice-form.component').then(m => m.InvoiceFormComponent)
  },
  {
    path: 'invoice/:invoiceNumber',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/invoice/invoice-form.component').then(m => m.InvoiceFormComponent)
  },
  {
    path: 'reports',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent)
  },
  { path: '**', redirectTo: '/login' }
];
