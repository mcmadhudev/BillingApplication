import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import * as M from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private url = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Users
  getUsers(): Observable<M.User[]> { return this.http.get<M.User[]>(`${this.url}/users`); }
  createUser(data: any): Observable<M.User> { return this.http.post<M.User>(`${this.url}/users`, data); }
  updateUser(id: number, data: any): Observable<M.User> { return this.http.put<M.User>(`${this.url}/users/${id}`, data); }
  deleteUser(id: number): Observable<void> { return this.http.delete<void>(`${this.url}/users/${id}`); }
  resetPassword(id: number, newPassword: string): Observable<any> {
    return this.http.post(`${this.url}/users/${id}/reset-password`, { newPassword });
  }

  // Config
  getConfig(): Observable<M.ShopConfig> { return this.http.get<M.ShopConfig>(`${this.url}/config`); }
  updateConfig(data: any): Observable<M.ShopConfig> { return this.http.put<M.ShopConfig>(`${this.url}/config`, data); }

  // Products
  getProducts(): Observable<M.Product[]> { return this.http.get<M.Product[]>(`${this.url}/products`); }
  getInStockProducts(): Observable<M.Product[]> { return this.http.get<M.Product[]>(`${this.url}/products/in-stock`); }
  createProduct(data: any): Observable<M.Product> { return this.http.post<M.Product>(`${this.url}/products`, data); }
  updateProduct(id: number, data: any): Observable<M.Product> { return this.http.put<M.Product>(`${this.url}/products/${id}`, data); }
  deleteProduct(id: number): Observable<void> { return this.http.delete<void>(`${this.url}/products/${id}`); }

  // Stock
  getStocks(): Observable<M.ProductStock[]> { return this.http.get<M.ProductStock[]>(`${this.url}/stocks`); }
  createStock(data: any): Observable<M.ProductStock> { return this.http.post<M.ProductStock>(`${this.url}/stocks`, data); }

  // Invoices
  getInvoices(params?: any): Observable<M.InvoiceListItem[]> {
    let httpParams = new HttpParams();
    if (params?.fromDate) httpParams = httpParams.set('fromDate', params.fromDate);
    if (params?.toDate) httpParams = httpParams.set('toDate', params.toDate);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    return this.http.get<M.InvoiceListItem[]>(`${this.url}/invoices`, { params: httpParams });
  }
  getInvoice(id: number): Observable<M.Invoice> { return this.http.get<M.Invoice>(`${this.url}/invoices/${id}`); }
  getInvoiceByNumber(num: string): Observable<M.Invoice> { return this.http.get<M.Invoice>(`${this.url}/invoices/by-number/${num}`); }
  createInvoice(data: any): Observable<M.Invoice> { return this.http.post<M.Invoice>(`${this.url}/invoices`, data); }
  voidInvoice(id: number, reason: string): Observable<M.Invoice> {
    return this.http.post<M.Invoice>(`${this.url}/invoices/${id}/void`, { reason });
  }
  downloadInvoicePdf(id: number): Observable<Blob> {
    return this.http.get(`${this.url}/invoices/${id}/pdf`, { responseType: 'blob' });
  }

  // Reports
  getStockReport(): Observable<M.StockReportItem[]> { return this.http.get<M.StockReportItem[]>(`${this.url}/reports/stock`); }
  getSalesReport(params?: any): Observable<M.SalesReport> {
    let httpParams = new HttpParams();
    if (params?.fromDate) httpParams = httpParams.set('fromDate', params.fromDate);
    if (params?.toDate) httpParams = httpParams.set('toDate', params.toDate);
    return this.http.get<M.SalesReport>(`${this.url}/reports/sales`, { params: httpParams });
  }
  exportStockReport(): Observable<Blob> {
    return this.http.get(`${this.url}/reports/stock/export`, { responseType: 'blob' });
  }
  exportSalesReport(params?: any): Observable<Blob> {
    let httpParams = new HttpParams();
    if (params?.fromDate) httpParams = httpParams.set('fromDate', params.fromDate);
    if (params?.toDate) httpParams = httpParams.set('toDate', params.toDate);
    return this.http.get(`${this.url}/reports/sales/export`, { responseType: 'blob', params: httpParams });
  }
  getAuditLogs(params?: any): Observable<M.AuditLog[]> {
    let httpParams = new HttpParams();
    if (params?.entityName) httpParams = httpParams.set('entityName', params.entityName);
    if (params?.action) httpParams = httpParams.set('action', params.action);
    if (params?.fromDate) httpParams = httpParams.set('fromDate', params.fromDate);
    if (params?.toDate) httpParams = httpParams.set('toDate', params.toDate);
    return this.http.get<M.AuditLog[]>(`${this.url}/reports/audit`, { params: httpParams });
  }
}
