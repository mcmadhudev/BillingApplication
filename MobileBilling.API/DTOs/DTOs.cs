namespace MobileBilling.API.DTOs;

// Auth
public record LoginRequest(string Username, string Password);
public record LoginResponse(string Token, string Username, string Role);

// Users
public record CreateUserRequest(string Username, string Password, string Email, string Role);
public record UpdateUserRequest(string Email, string Role);
public record ResetPasswordRequest(string NewPassword);
public record UserResponse(int Id, string Username, string Email, string Role, bool IsActive, DateTime CreatedAt);

// Config
public record ShopConfigRequest(string ShopName, string GSTNumber, string Address, string MobileNumber, string Email, string InvoiceRemarks);
public record ShopConfigResponse(int Id, string ShopName, string GSTNumber, string Address, string MobileNumber, string Email, string InvoiceRemarks);

// Products
public record CreateProductRequest(string Name, decimal GSTPercentage, decimal SellingPrice);
public record UpdateProductRequest(string Name, decimal GSTPercentage, decimal SellingPrice);
public record ProductResponse(int Id, string Name, decimal GSTPercentage, decimal SellingPrice, bool IsActive, DateTime CreatedAt, int AvailableStock);

// Stock
public record CreateStockRequest(int ProductId, string PurchaseOrderNumber, int Quantity, DateTime PurchaseDate);
public record StockResponse(int Id, int ProductId, string ProductName, string PurchaseOrderNumber, int Quantity, DateTime PurchaseDate);

// Invoice
public record CreateInvoiceRequest(string CustomerName, string CustomerMobile, List<InvoiceItemRequest> Items);
public record InvoiceItemRequest(int ProductId, int Quantity);
public record VoidInvoiceRequest(string Reason);
public record InvoiceResponse(
    int Id, string InvoiceNumber, string CustomerName, string CustomerMobile,
    DateTime InvoiceDate, decimal CGST, decimal SGST, decimal TotalAmount,
    string Status, string? VoidReason, DateTime? VoidedAt,
    string CreatedByUsername, List<InvoiceItemResponse> Items);
public record InvoiceItemResponse(
    int Id, int ProductId, string ProductName, decimal SellingPrice,
    decimal GSTPercentage, int Quantity, decimal GSTAmount, decimal Amount);
public record InvoiceListResponse(
    int Id, string InvoiceNumber, string CustomerName, string CustomerMobile,
    DateTime InvoiceDate, decimal TotalAmount, string Status);

// Reports
public record StockReportItem(int ProductId, string ProductName, int TotalPurchased, int TotalSold, int AvailableStock);
public record SalesReportItem(string InvoiceNumber, DateTime InvoiceDate, string CustomerName, decimal TotalAmount, string Status);
public record SalesReportResponse(List<SalesReportItem> Invoices, decimal TotalSales, int TotalInvoices);
