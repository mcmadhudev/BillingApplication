import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-invoice-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <h1>Invoice</h1>
      <p>Create a new invoice or open an existing one</p>
    </div>
    <div class="landing-grid">
      <a routerLink="/invoice/new" class="landing-card create-card">
        <div class="card-icon">➕</div>
        <h3>Create New Invoice</h3>
        <p>Start a fresh invoice with auto-generated invoice number</p>
      </a>
      <div class="landing-card open-card">
        <div class="card-icon">🔍</div>
        <h3>Open Existing Invoice</h3>
        <p>Enter an invoice number to view or print</p>
        <div class="open-form">
          <input class="form-control" [(ngModel)]="invoiceNumber" placeholder="e.g. INV-2026-0001"
            list="invoicesList" (keyup.enter)="openInvoice()" [disabled]="loading">
          <datalist id="invoicesList">
            <option *ngFor="let num of filteredInvoices" [value]="num"></option>
          </datalist>
          <button class="btn btn-primary" (click)="openInvoice()" [disabled]="!invoiceNumber.trim() || loading">
            {{ loading ? 'Checking...' : 'Open' }}
          </button>
        </div>
        <div class="error-msg" *ngIf="error">{{ error }}</div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div class="toast toast-success" *ngIf="toast">{{ toast }}</div>
    <div class="toast toast-error" *ngIf="errorToast">{{ errorToast }}</div>
  `,
  styles: [`
    .landing-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      max-width: 800px;
    }
    .landing-card {
      background: #fff;
      border-radius: 16px;
      padding: 40px 32px;
      border: 2px solid var(--border);
      text-decoration: none;
      color: inherit;
      transition: all 0.25s;
      text-align: center;
    }
    .create-card:hover {
      border-color: var(--primary);
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(99,102,241,0.15);
    }
    .card-icon { font-size: 48px; margin-bottom: 16px; }
    .landing-card h3 { font-size: 20px; margin-bottom: 8px; }
    .landing-card p { color: var(--text-muted); font-size: 14px; }
    .open-form {
      display: flex;
      gap: 8px;
      margin-top: 20px;
    }
    .open-form .form-control { flex: 1; }
    .error-msg {
      margin-top: 12px;
      color: var(--danger);
      font-size: 13px;
    }
  `]
})
export class InvoiceLandingComponent implements OnInit {
  invoiceNumber = '';
  error = '';
  toast = '';
  errorToast = '';
  loading = false;
  existingInvoices: string[] = [];

  constructor(
    private router: Router,
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.api.getInvoices().subscribe({
      next: (invs) => {
        this.existingInvoices = invs.map(i => i.invoiceNumber);
        this.cdr.markForCheck();
      },
      error: () => {
        // Silently fallback if unable to fetch for suggestions
      }
    });
  }

  get filteredInvoices(): string[] {
    const searchVal = this.invoiceNumber.trim().toLowerCase();
    if (!searchVal) return [];
    return this.existingInvoices.filter(num => num.toLowerCase().includes(searchVal));
  }

  openInvoice() {
    const invoiceNum = this.invoiceNumber.trim();
    if (invoiceNum && !this.loading) {
      this.error = '';
      this.loading = true;
      this.cdr.markForCheck();
      this.api.getInvoiceByNumber(invoiceNum).subscribe({
        next: (inv) => {
          this.loading = false;
          this.cdr.markForCheck();
          this.router.navigate(['/invoice', inv.invoiceNumber]);
        },
        error: (err) => {
          this.loading = false;
          this.showError(err.error?.message || 'Invoice not found');
        }
      });
    }
  }

  showToast(msg: string) {
    this.toast = msg;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.toast = '';
      this.cdr.markForCheck();
    }, 3000);
  }

  showError(msg: string) {
    this.errorToast = msg;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.errorToast = '';
      this.cdr.markForCheck();
    }, 3000);
  }
}
