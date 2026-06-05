import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Invoice, Product, ShopConfig } from '../../shared/models/models';

interface InvoiceLineItem {
  productId: number;
  productName: string;
  sellingPrice: number;
  gstPercentage: number;
  quantity: number;
}

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="no-print flex-between mb-16">
      <div class="page-header" style="margin-bottom:0;">
        <h1>{{ isNew ? 'New Invoice' : 'Invoice ' + invoiceNumber }}</h1>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-outline" (click)="printInvoice()" title="Print">🖨️ Print</button>
        <button class="btn btn-outline" (click)="downloadPdf()" *ngIf="!isNew && invoice" title="PDF">📄 PDF</button>
        <button class="btn btn-danger" (click)="openVoidDialog()" *ngIf="!isNew && invoice && invoice.status==='Active'">⛔ Void</button>
      </div>
    </div>

    <!-- VOID BANNER -->
    <div class="void-banner" *ngIf="invoice?.status==='Void'">
      ⛔ This invoice has been voided. Reason: {{ invoice.voidReason }}
    </div>

    <!-- INVOICE TABLE -->
    <div class="invoice-paper" id="invoice-print">
      <!-- HEADER -->
      <div class="inv-header">
        <div>
          <h2 class="shop-name">{{ config?.shopName || 'Shop Name' }}</h2>
          <p *ngIf="config?.gstNumber">GST: {{ config.gstNumber }}</p>
          <p>{{ config?.address }}</p>
          <p>{{ config?.mobileNumber }} | {{ config?.email }}</p>
        </div>
      </div>

      <hr class="inv-divider">

      <!-- PART 1: Invoice Info -->
      <div class="inv-info-row">
        <div class="inv-info-left">
          <div class="info-field">
            <label>Invoice No:</label>
            <span class="inv-number">{{ invoiceNumber || 'Auto-generated' }}</span>
          </div>
          <div class="info-field">
            <label>Customer Name:</label>
            <input *ngIf="isNew" class="form-control" [(ngModel)]="customerName" placeholder="Customer name">
            <span *ngIf="!isNew">{{ invoice?.customerName }}</span>
          </div>
          <div class="info-field">
            <label>Mobile Number:</label>
            <input *ngIf="isNew" class="form-control" [(ngModel)]="customerMobile" placeholder="Mobile number">
            <span *ngIf="!isNew">{{ invoice?.customerMobile }}</span>
          </div>
        </div>
        <div class="inv-info-right">
          <div class="info-field">
            <label>Date:</label>
            <span>{{ today }}</span>
          </div>
        </div>
      </div>

      <!-- PART 2: Products Table -->
      <table class="inv-table">
        <thead>
          <tr>
            <th style="width:40px;">#</th>
            <th>Product</th>
            <th style="width:120px;">Selling Price</th>
            <th style="width:80px;">GST %</th>
            <th style="width:110px;">GST Amount</th>
            <th style="width:60px;">Qty</th>
            <th style="width:120px;">Amount</th>
            <th style="width:40px;" *ngIf="isNew" class="no-print"></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of items; let i = index">
            <td>{{ i + 1 }}</td>
            <td>
              <select *ngIf="isNew" class="form-control" [(ngModel)]="item.productId" (change)="onProductSelect(item)">
                <option [ngValue]="0" disabled>Select product</option>
                <option *ngFor="let p of inStockProducts" [ngValue]="p.id">{{ p.name }} (Stock: {{ p.availableStock }})</option>
              </select>
              <span *ngIf="!isNew">{{ item.productName }}</span>
            </td>
            <td class="text-right">₹{{ item.sellingPrice | number:'1.2-2' }}</td>
            <td class="text-right">{{ item.gstPercentage }}%</td>
            <td class="text-right">₹{{ getGstAmount(item) | number:'1.2-2' }}</td>
            <td>
              <input *ngIf="isNew" type="number" class="form-control" [(ngModel)]="item.quantity" (ngModelChange)="recalculate()" min="1" style="width:60px;">
              <span *ngIf="!isNew">{{ item.quantity }}</span>
            </td>
            <td class="text-right">₹{{ getLineAmount(item) | number:'1.2-2' }}</td>
            <td *ngIf="isNew" class="no-print">
              <button class="btn-icon" (click)="removeItem(i)" title="Remove" *ngIf="items.length > 1">✕</button>
            </td>
          </tr>
        </tbody>
        <tfoot *ngIf="isNew">
          <tr class="no-print">
            <td [attr.colspan]="8">
              <button class="btn btn-sm btn-outline" (click)="addItem()">+ Add Product</button>
            </td>
          </tr>
        </tfoot>
      </table>

      <!-- PART 3: Totals -->
      <div class="inv-totals">
        <div class="totals-row">
          <span>Sub Total</span>
          <span>₹{{ subTotal | number:'1.2-2' }}</span>
        </div>
        <div class="totals-row">
          <span>CGST</span>
          <span>₹{{ cgst | number:'1.2-2' }}</span>
        </div>
        <div class="totals-row">
          <span>SGST</span>
          <span>₹{{ sgst | number:'1.2-2' }}</span>
        </div>
        <div class="totals-row grand-total">
          <span>Grand Total</span>
          <span>₹{{ grandTotal | number:'1.2-2' }}</span>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="inv-footer" *ngIf="config?.invoiceRemarks">
        <hr class="inv-divider">
        <p class="remarks">{{ config.invoiceRemarks }}</p>
      </div>
    </div>

    <!-- ACTION BUTTONS (outside table) -->
    <div class="no-print" style="display:flex;gap:12px;margin-top:24px;">
      <button class="btn btn-primary" (click)="saveInvoice()" *ngIf="isNew" [disabled]="saving">
        {{ saving ? 'Saving...' : '💾 Save Invoice' }}
      </button>
      <a routerLink="/home" class="btn btn-outline">🏠 Back to Home</a>
    </div>

    <!-- VOID MODAL -->
    <div class="modal-overlay" *ngIf="showVoidModal" #voidOverlay
         (mousedown)="$event.target === voidOverlay ? voidOverlay.setAttribute('data-close', 'true') : voidOverlay.removeAttribute('data-close')"
         (mouseup)="$event.target === voidOverlay && voidOverlay.getAttribute('data-close') === 'true' ? showVoidModal=false : null">
      <div class="modal">
        <h3>⛔ Void Invoice {{ invoice?.invoiceNumber }}</h3>
        <p style="color:var(--text-muted);margin-bottom:16px;">This will restore stock for all items.</p>
        <div class="form-group">
          <label>Reason for voiding</label>
          <textarea class="form-control" [(ngModel)]="voidReason" rows="3" placeholder="Enter reason..."></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" (click)="showVoidModal=false">Cancel</button>
          <button class="btn btn-danger" (click)="voidInvoice()">Void Invoice</button>
        </div>
      </div>
    </div>

    <div class="toast toast-success" *ngIf="toast">{{ toast }}</div>
    <div class="toast toast-error" *ngIf="errorToast">{{ errorToast }}</div>
  `,
  styles: [`
    .invoice-paper {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 40px;
      box-shadow: var(--shadow);
      max-width: 900px;
    }
    .inv-header { margin-bottom: 8px; }
    .shop-name { font-size: 22px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
    .inv-header p { color: var(--text-muted); font-size: 13px; margin: 2px 0; }
    .inv-divider { border: none; border-top: 1px solid var(--border); margin: 16px 0; }
    .inv-info-row { display: flex; justify-content: space-between; margin-bottom: 24px; }
    .info-field { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .info-field label { font-weight: 600; font-size: 13px; min-width: 120px; color: var(--text-muted); }
    .info-field .form-control { max-width: 250px; }
    .inv-number { font-weight: 700; color: var(--primary); font-size: 15px; }
    .inv-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .inv-table th { background: #f8fafc; padding: 10px 12px; border: 1px solid var(--border); font-size: 12px; text-transform: uppercase; }
    .inv-table td { padding: 8px 12px; border: 1px solid var(--border); font-size: 14px; }
    .inv-table tfoot td { border: none; padding-top: 12px; }
    .inv-totals { display: flex; flex-direction: column; align-items: flex-end; margin-top: 8px; }
    .totals-row { display: flex; width: 280px; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .grand-total { border-top: 2px solid var(--text); font-weight: 700; font-size: 16px; padding-top: 12px; margin-top: 4px; }
    .inv-footer { margin-top: 8px; }
    .remarks { font-size: 12px; color: var(--text-muted); font-style: italic; }
    .void-banner {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 12px 20px;
      border-radius: 10px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    @media print {
      .invoice-paper { border: none; box-shadow: none; padding: 0; border-radius: 0; }
      .inv-table th { background: #f0f0f0 !important; }
    }
  `]
})
export class InvoiceFormComponent implements OnInit {
  isNew = true;
  invoiceNumber = '';
  invoice: Invoice | null = null;
  config: ShopConfig | null = null;
  inStockProducts: Product[] = [];

  customerName = '';
  customerMobile = '';
  today = new Date().toLocaleDateString('en-GB');
  items: InvoiceLineItem[] = [{ productId: 0, productName: '', sellingPrice: 0, gstPercentage: 0, quantity: 1 }];

  subTotal = 0;
  cgst = 0;
  sgst = 0;
  grandTotal = 0;

  saving = false;
  showVoidModal = false;
  voidReason = '';
  toast = '';
  errorToast = '';

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.api.getConfig().subscribe(c => { this.config = c; this.cdr.markForCheck(); });
    this.api.getInStockProducts().subscribe(p => { this.inStockProducts = p; this.cdr.markForCheck(); });

    const param = this.route.snapshot.paramMap.get('invoiceNumber');
    if (param && param !== 'new') {
      this.isNew = false;
      this.invoiceNumber = param;
      this.api.getInvoiceByNumber(param).subscribe({
        next: (inv) => {
          this.invoice = inv;
          this.invoiceNumber = inv.invoiceNumber;
          this.today = new Date(inv.invoiceDate).toLocaleDateString('en-GB');
          this.items = inv.items.map(i => ({
            productId: i.productId,
            productName: i.productName,
            sellingPrice: i.sellingPrice,
            gstPercentage: i.gstPercentage,
            quantity: i.quantity
          }));
          this.subTotal = inv.items.reduce((s, i) => s + i.sellingPrice * i.quantity, 0);
          this.cgst = inv.cgst;
          this.sgst = inv.sgst;
          this.grandTotal = inv.totalAmount;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorToast = 'Invoice not found';
          setTimeout(() => this.router.navigate(['/invoice']), 2000);
        }
      });
    }
  }

  onProductSelect(item: InvoiceLineItem) {
    const p = this.inStockProducts.find(x => x.id === item.productId);
    if (p) {
      item.productName = p.name;
      item.sellingPrice = p.sellingPrice;
      item.gstPercentage = p.gstPercentage;
    }
    this.recalculate();
  }

  addItem() {
    this.items.push({ productId: 0, productName: '', sellingPrice: 0, gstPercentage: 0, quantity: 1 });
  }

  removeItem(i: number) {
    this.items.splice(i, 1);
    this.recalculate();
  }

  getGstAmount(item: InvoiceLineItem): number {
    return item.sellingPrice * item.quantity * item.gstPercentage / 100;
  }

  getLineAmount(item: InvoiceLineItem): number {
    return item.sellingPrice * item.quantity;
  }

  recalculate() {
    this.subTotal = this.items.reduce((s, i) => s + i.sellingPrice * i.quantity, 0);
    const totalGst = this.items.reduce((s, i) => s + this.getGstAmount(i), 0);
    this.cgst = Math.round(totalGst / 2 * 100) / 100;
    this.sgst = Math.round(totalGst / 2 * 100) / 100;
    this.grandTotal = Math.round((this.subTotal + totalGst) * 100) / 100;
  }

  saveInvoice() {
    const validItems = this.items.filter(i => i.productId > 0 && i.quantity > 0);
    if (!this.customerName.trim() || !this.customerMobile.trim() || validItems.length === 0) {
      this.errorToast = 'Please fill customer details and add at least one product';
      setTimeout(() => this.errorToast = '', 3000);
      return;
    }

    this.saving = true;
    this.api.createInvoice({
      customerName: this.customerName,
      customerMobile: this.customerMobile,
      items: validItems.map(i => ({ productId: i.productId, quantity: i.quantity }))
    }).subscribe({
      next: (inv) => {
        this.saving = false;
        this.router.navigate(['/invoice', inv.invoiceNumber]);
      },
      error: (err) => {
        this.saving = false;
        this.errorToast = err.error?.message || 'Error creating invoice';
        setTimeout(() => this.errorToast = '', 4000);
      }
    });
  }

  openVoidDialog() { this.showVoidModal = true; this.voidReason = ''; }

  voidInvoice() {
    if (!this.invoice || !this.voidReason.trim()) return;
    this.api.voidInvoice(this.invoice.id, this.voidReason).subscribe({
      next: (inv) => {
        this.invoice = inv;
        this.showVoidModal = false;
        this.toast = 'Invoice voided successfully';
        this.cdr.markForCheck();
        setTimeout(() => this.toast = '', 3000);
      },
      error: (err) => {
        this.showVoidModal = false;
        this.errorToast = err.error?.message || 'Error voiding invoice';
        setTimeout(() => this.errorToast = '', 4000);
      }
    });
  }

  printInvoice() { window.print(); }

  downloadPdf() {
    if (!this.invoice) return;
    this.api.downloadInvoicePdf(this.invoice.id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.invoice!.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
