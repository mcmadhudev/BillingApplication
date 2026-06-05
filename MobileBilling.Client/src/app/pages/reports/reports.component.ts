import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { StockReportItem, SalesReport } from '../../shared/models/models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Reports</h1>
      <p>Stock levels and sales analytics</p>
    </div>

    <div class="tabs">
      <button class="tab-btn" [class.active]="tab==='stock'" (click)="tab='stock'">📦 Stock Report</button>
      <button class="tab-btn" [class.active]="tab==='sales'" (click)="tab='sales'">💰 Sales Report</button>
    </div>

    <!-- STOCK REPORT -->
    <div *ngIf="tab==='stock'">
      <div class="flex-between mb-16">
        <h2 style="font-size:18px;">Current Stock Levels</h2>
        <button class="btn btn-outline" (click)="exportStock()">📥 Export Excel</button>
      </div>
      <div class="card">
        <div class="table-container">
          <table>
            <thead><tr>
              <th>Product</th><th class="text-right">Total Purchased</th><th class="text-right">Total Sold</th><th class="text-right">Available Stock</th>
            </tr></thead>
            <tbody>
              <tr *ngFor="let item of stockReport">
                <td><strong>{{ item.productName }}</strong></td>
                <td class="text-right">{{ item.totalPurchased }}</td>
                <td class="text-right">{{ item.totalSold }}</td>
                <td class="text-right">
                  <span class="badge" [class.badge-active]="item.availableStock > 0" [class.badge-void]="item.availableStock <= 0">
                    {{ item.availableStock }}
                  </span>
                </td>
              </tr>
              <tr *ngIf="stockReport.length===0"><td colspan="4" style="text-align:center;color:var(--text-muted);">No products found</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- SALES REPORT -->
    <div *ngIf="tab==='sales'">
      <div class="flex-between mb-16">
        <h2 style="font-size:18px;">Sales Report</h2>
        <div style="display:flex;gap:8px;align-items:center;">
          <input type="date" class="form-control" [(ngModel)]="salesFilter.fromDate" style="width:auto;">
          <span style="color:var(--text-muted);">to</span>
          <input type="date" class="form-control" [(ngModel)]="salesFilter.toDate" style="width:auto;">
          <button class="btn btn-primary btn-sm" (click)="loadSales()">Filter</button>
          <button class="btn btn-outline btn-sm" (click)="exportSales()">📥 Excel</button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;max-width:500px;" *ngIf="salesReport">
        <div class="card" style="text-align:center;">
          <p style="color:var(--text-muted);font-size:13px;">Total Invoices</p>
          <h2 style="color:var(--primary);font-size:28px;">{{ salesReport.totalInvoices }}</h2>
        </div>
        <div class="card" style="text-align:center;">
          <p style="color:var(--text-muted);font-size:13px;">Total Sales</p>
          <h2 style="color:var(--success);font-size:28px;">₹{{ salesReport.totalSales | number:'1.2-2' }}</h2>
        </div>
      </div>

      <div class="card">
        <div class="table-container">
          <table>
            <thead><tr>
              <th>Invoice #</th><th>Date</th><th>Customer</th><th class="text-right">Total</th><th>Status</th><th>Action</th>
            </tr></thead>
            <tbody>
              <tr *ngFor="let inv of salesReport?.invoices">
                <td><strong>{{ inv.invoiceNumber }}</strong></td>
                <td>{{ inv.invoiceDate | date:'dd/MM/yyyy' }}</td>
                <td>{{ inv.customerName }}</td>
                <td class="text-right">₹{{ inv.totalAmount | number:'1.2-2' }}</td>
                <td><span class="badge" [class.badge-active]="inv.status==='Active'" [class.badge-void]="inv.status==='Void'">{{ inv.status }}</span></td>
                <td><button class="btn btn-sm btn-outline" (click)="viewInvoice(inv.invoiceNumber)">View</button></td>
              </tr>
              <tr *ngIf="!salesReport || salesReport.invoices.length===0">
                <td colspan="6" style="text-align:center;color:var(--text-muted);">No invoices found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class ReportsComponent implements OnInit {
  tab = 'stock';
  stockReport: StockReportItem[] = [];
  salesReport: SalesReport | null = null;
  salesFilter = { fromDate: '', toDate: '' };

  constructor(private api: ApiService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadStock();
    this.loadSales();
  }

  loadStock() { this.api.getStockReport().subscribe(r => { this.stockReport = r; this.cdr.markForCheck(); }); }

  loadSales() {
    this.api.getSalesReport(this.salesFilter).subscribe(r => { this.salesReport = r; this.cdr.markForCheck(); });
  }

  exportStock() {
    this.api.exportStockReport().subscribe(blob => this.downloadBlob(blob, 'StockReport.xlsx'));
  }

  exportSales() {
    this.api.exportSalesReport(this.salesFilter).subscribe(blob => this.downloadBlob(blob, 'SalesReport.xlsx'));
  }

  viewInvoice(num: string) {
    this.router.navigate(['/invoice', num]);
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
