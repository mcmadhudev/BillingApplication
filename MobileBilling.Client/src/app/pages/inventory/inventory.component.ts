import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Product, ProductStock } from '../../shared/models/models';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Inventory</h1>
      <p>Manage products and stock entries</p>
    </div>

    <div class="tabs">
      <button class="tab-btn" [class.active]="tab==='products'" (click)="tab='products'">📱 Products</button>
      <button class="tab-btn" [class.active]="tab==='stock'" (click)="tab='stock'">📦 Stock Entry</button>
    </div>

    <!-- PRODUCTS TAB -->
    <div *ngIf="tab==='products'">
      <div class="flex-between mb-16">
        <h2 style="font-size:18px;">Products</h2>
        <button class="btn btn-primary" (click)="showProductModal=true; resetProductForm()">+ Add Product</button>
      </div>
      <div class="card">
        <div class="table-container">
          <table>
            <thead><tr>
              <th>Name</th><th>Selling Price</th><th>GST %</th><th>Available Stock</th><th>Actions</th>
            </tr></thead>
            <tbody>
              <tr *ngFor="let p of products">
                <td><strong>{{ p.name }}</strong></td>
                <td>₹{{ p.sellingPrice | number:'1.2-2' }}</td>
                <td>{{ p.gstPercentage }}%</td>
                <td><span class="badge" [class.badge-active]="p.availableStock > 0" [class.badge-void]="p.availableStock <= 0">{{ p.availableStock }}</span></td>
                <td>
                  <div style="display:flex;gap:8px;">
                    <button class="btn btn-sm btn-outline" (click)="editProduct(p)">Edit</button>
                    <button class="btn btn-sm btn-danger" (click)="deleteProduct(p)">Delete</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="products.length===0"><td colspan="5" style="text-align:center;color:var(--text-muted);">No products yet. Add your first product.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Product Modal -->
      <div class="modal-overlay" *ngIf="showProductModal" #productOverlay
           (mousedown)="$event.target === productOverlay ? productOverlay.setAttribute('data-close', 'true') : productOverlay.removeAttribute('data-close')"
           (mouseup)="$event.target === productOverlay && productOverlay.getAttribute('data-close') === 'true' ? showProductModal=false : null">
        <div class="modal">
          <h3>{{ editingProduct ? 'Edit Product' : 'Add Product' }}</h3>
          <div class="form-group">
            <label>Product Name</label>
            <input class="form-control" [(ngModel)]="productForm.name" placeholder="e.g. iPhone 15 Pro">
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label>Selling Price (₹)</label>
              <input class="form-control" type="number" [(ngModel)]="productForm.sellingPrice" placeholder="0.00">
            </div>
            <div class="form-group">
              <label>GST Percentage (%)</label>
              <input class="form-control" type="number" [(ngModel)]="productForm.gstPercentage" placeholder="18">
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" (click)="showProductModal=false">Cancel</button>
            <button class="btn btn-primary" (click)="saveProduct()">{{ editingProduct ? 'Update' : 'Add' }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- STOCK TAB -->
    <div *ngIf="tab==='stock'">
      <div class="card mb-16" style="max-width:700px;">
        <h2 style="font-size:18px;margin-bottom:20px;">Add Stock Entry</h2>
        <div class="grid-2">
          <div class="form-group">
            <label>Product</label>
            <select class="form-control" [(ngModel)]="stockForm.productId">
              <option [ngValue]="0" disabled>Select Product</option>
              <option *ngFor="let p of products" [ngValue]="p.id">{{ p.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>PO Number</label>
            <input class="form-control" [(ngModel)]="stockForm.purchaseOrderNumber" placeholder="PO-001">
          </div>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label>Quantity</label>
            <input class="form-control" type="number" [(ngModel)]="stockForm.quantity" placeholder="0">
          </div>
          <div class="form-group">
            <label>Purchase Date</label>
            <input class="form-control" type="date" [(ngModel)]="stockForm.purchaseDate">
          </div>
        </div>
        <button class="btn btn-primary" (click)="addStock()">📦 Add Stock</button>
      </div>

      <div class="card">
        <h2 style="font-size:18px;margin-bottom:16px;">Stock Entries</h2>
        <div class="table-container">
          <table>
            <thead><tr>
              <th>Product</th><th>PO Number</th><th>Quantity</th><th>Purchase Date</th>
            </tr></thead>
            <tbody>
              <tr *ngFor="let s of stocks">
                <td><strong>{{ s.productName }}</strong></td>
                <td>{{ s.purchaseOrderNumber }}</td>
                <td>{{ s.quantity }}</td>
                <td>{{ s.purchaseDate | date:'dd/MM/yyyy' }}</td>
              </tr>
              <tr *ngIf="stocks.length===0"><td colspan="4" style="text-align:center;color:var(--text-muted);">No stock entries yet.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="toast toast-success" *ngIf="toast">{{ toast }}</div>
    <div class="toast toast-error" *ngIf="errorToast">{{ errorToast }}</div>
  `
})
export class InventoryComponent implements OnInit {
  tab = 'products';
  products: Product[] = [];
  stocks: ProductStock[] = [];

  showProductModal = false;
  editingProduct: Product | null = null;
  productForm = { name: '', sellingPrice: 0, gstPercentage: 18 };
  stockForm: any = { productId: 0, purchaseOrderNumber: '', quantity: 0, purchaseDate: new Date().toISOString().split('T')[0] };
  toast = '';
  errorToast = '';

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadProducts();
    this.loadStocks();
  }

  loadProducts() { this.api.getProducts().subscribe(p => { this.products = p; this.cdr.markForCheck(); }); }
  loadStocks() { this.api.getStocks().subscribe(s => { this.stocks = s; this.cdr.markForCheck(); }); }

  resetProductForm() {
    this.editingProduct = null;
    this.productForm = { name: '', sellingPrice: 0, gstPercentage: 18 };
  }

  editProduct(p: Product) {
    this.editingProduct = p;
    this.productForm = { name: p.name, sellingPrice: p.sellingPrice, gstPercentage: p.gstPercentage };
    this.showProductModal = true;
  }

  saveProduct() {
    if (this.editingProduct) {
      this.api.updateProduct(this.editingProduct.id, this.productForm)
        .subscribe({ next: () => { this.loadProducts(); this.showProductModal = false; this.showToast('Product updated'); },
          error: (e) => { this.showProductModal = false; this.showError(e.error?.message || 'Error updating product'); } });
    } else {
      this.api.createProduct(this.productForm)
        .subscribe({ next: () => { this.loadProducts(); this.showProductModal = false; this.showToast('Product added'); },
          error: (e) => { this.showProductModal = false; this.showError(e.error?.message || 'Error adding product'); } });
    }
  }

  deleteProduct(p: Product) {
    if (confirm(`Delete product "${p.name}"?`)) {
      this.api.deleteProduct(p.id).subscribe(() => { this.loadProducts(); this.showToast('Product deleted'); });
    }
  }

  addStock() {
    if (!this.stockForm.productId) return;
    this.api.createStock(this.stockForm).subscribe(() => {
      this.loadStocks();
      this.loadProducts();
      this.stockForm = { productId: 0, purchaseOrderNumber: '', quantity: 0, purchaseDate: new Date().toISOString().split('T')[0] };
      this.showToast('Stock added');
    });
  }

  showToast(msg: string) {
    this.toast = msg;
    setTimeout(() => this.toast = '', 3000);
  }

  showError(msg: string) {
    this.errorToast = msg;
    setTimeout(() => this.errorToast = '', 4000);
  }
}
