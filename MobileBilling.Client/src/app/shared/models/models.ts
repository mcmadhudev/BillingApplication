export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface ShopConfig {
  id: number;
  shopName: string;
  gstNumber: string;
  address: string;
  mobileNumber: string;
  email: string;
  invoiceRemarks: string;
}

export interface Product {
  id: number;
  name: string;
  gstPercentage: number;
  sellingPrice: number;
  isActive: boolean;
  createdAt: string;
  availableStock: number;
}

export interface ProductStock {
  id: number;
  productId: number;
  productName: string;
  purchaseOrderNumber: string;
  quantity: number;
  purchaseDate: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  customerName: string;
  customerMobile: string;
  invoiceDate: string;
  cgst: number;
  sgst: number;
  totalAmount: number;
  status: string;
  voidReason?: string;
  voidedAt?: string;
  createdByUsername: string;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: number;
  productId: number;
  productName: string;
  sellingPrice: number;
  gstPercentage: number;
  quantity: number;
  gstAmount: number;
  amount: number;
}

export interface InvoiceListItem {
  id: number;
  invoiceNumber: string;
  customerName: string;
  customerMobile: string;
  invoiceDate: string;
  totalAmount: number;
  status: string;
}

export interface StockReportItem {
  productId: number;
  productName: string;
  totalPurchased: number;
  totalSold: number;
  availableStock: number;
}

export interface SalesReport {
  invoices: SalesReportItem[];
  totalSales: number;
  totalInvoices: number;
}

export interface SalesReportItem {
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  totalAmount: number;
  status: string;
}

export interface AuditLog {
  id: number;
  entityName: string;
  entityId: string;
  action: string;
  performedBy: string;
  performedAt: string;
  details?: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
}
