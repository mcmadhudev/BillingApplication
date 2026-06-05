using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MobileBilling.API.Data;
using MobileBilling.API.DTOs;
using MobileBilling.API.Models;
using MobileBilling.API.Services;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Security.Claims;

namespace MobileBilling.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InvoicesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly InvoiceNumberService _invoiceNumberService;
    private readonly AuditService _audit;

    public InvoicesController(AppDbContext db, InvoiceNumberService invoiceNumberService, AuditService audit)
    {
        _db = db;
        _invoiceNumberService = invoiceNumberService;
        _audit = audit;
    }

    private string CurrentUsername => User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
    private int CurrentUserId => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate, [FromQuery] string? status)
    {
        var query = _db.Invoices.AsQueryable();

        if (fromDate.HasValue)
            query = query.Where(i => i.InvoiceDate >= fromDate.Value);
        if (toDate.HasValue)
            query = query.Where(i => i.InvoiceDate <= toDate.Value.AddDays(1));
        if (!string.IsNullOrEmpty(status))
            query = query.Where(i => i.Status == status);

        var invoices = await query
            .OrderByDescending(i => i.InvoiceDate)
            .Select(i => new InvoiceListResponse(
                i.Id, i.InvoiceNumber, i.CustomerName, i.CustomerMobile,
                i.InvoiceDate, i.TotalAmount, i.Status))
            .ToListAsync();

        return Ok(invoices);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var invoice = await _db.Invoices
            .Include(i => i.Items)
            .Include(i => i.CreatedBy)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice == null) return NotFound();

        return Ok(MapToResponse(invoice));
    }

    [HttpGet("by-number/{invoiceNumber}")]
    public async Task<IActionResult> GetByNumber(string invoiceNumber)
    {
        var invoice = await _db.Invoices
            .Include(i => i.Items)
            .Include(i => i.CreatedBy)
            .FirstOrDefaultAsync(i => i.InvoiceNumber == invoiceNumber);

        if (invoice == null) return NotFound();

        return Ok(MapToResponse(invoice));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInvoiceRequest request)
    {
        using var transaction = await _db.Database.BeginTransactionAsync();

        try
        {
            var invoiceNumber = await _invoiceNumberService.GenerateNextInvoiceNumberAsync();

            var invoice = new Invoice
            {
                InvoiceNumber = invoiceNumber,
                CustomerName = request.CustomerName,
                CustomerMobile = request.CustomerMobile,
                InvoiceDate = DateTime.UtcNow,
                CreatedByUserId = CurrentUserId
            };

            decimal totalSellingPrice = 0;
            decimal totalGST = 0;

            foreach (var itemReq in request.Items)
            {
                var product = await _db.Products.FindAsync(itemReq.ProductId);
                if (product == null)
                    return BadRequest(new { message = $"Product with ID {itemReq.ProductId} not found" });

                // Check available stock
                var totalStock = await _db.ProductStocks.Where(s => s.ProductId == itemReq.ProductId).SumAsync(s => s.Quantity);
                var totalSold = await _db.InvoiceItems
                    .Where(ii => ii.ProductId == itemReq.ProductId && ii.Invoice.Status == "Active")
                    .SumAsync(ii => ii.Quantity);
                var available = totalStock - totalSold;

                if (available < itemReq.Quantity)
                    return BadRequest(new { message = $"Insufficient stock for {product.Name}. Available: {available}" });

                var gstAmount = product.SellingPrice * itemReq.Quantity * product.GSTPercentage / 100;
                totalSellingPrice += product.SellingPrice * itemReq.Quantity;
                totalGST += gstAmount;

                invoice.Items.Add(new InvoiceItem
                {
                    ProductId = product.Id,
                    ProductName = product.Name,
                    SellingPrice = product.SellingPrice,
                    GSTPercentage = product.GSTPercentage,
                    Quantity = itemReq.Quantity
                });
            }

            invoice.CGST = Math.Round(totalGST / 2, 2);
            invoice.SGST = Math.Round(totalGST / 2, 2);
            invoice.TotalAmount = Math.Round(totalSellingPrice + totalGST, 2);

            _db.Invoices.Add(invoice);
            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            await _audit.LogAsync("Invoice", invoice.Id.ToString(), "Create", CurrentUsername,
                $"Created invoice {invoiceNumber} for {request.CustomerName}");

            // Reload with navigation properties
            await _db.Entry(invoice).Reference(i => i.CreatedBy).LoadAsync();
            return Ok(MapToResponse(invoice));
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    [HttpPost("{id}/void")]
    public async Task<IActionResult> VoidInvoice(int id, [FromBody] VoidInvoiceRequest request)
    {
        var invoice = await _db.Invoices
            .Include(i => i.Items)
            .Include(i => i.CreatedBy)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice == null) return NotFound();
        if (invoice.Status == "Void")
            return BadRequest(new { message = "Invoice is already voided" });

        invoice.Status = "Void";
        invoice.VoidReason = request.Reason;
        invoice.VoidedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await _audit.LogAsync("Invoice", id.ToString(), "Void", CurrentUsername,
            $"Voided invoice {invoice.InvoiceNumber}. Reason: {request.Reason}");

        return Ok(MapToResponse(invoice));
    }

    [HttpGet("{id}/pdf")]
    public async Task<IActionResult> DownloadPdf(int id)
    {
        var invoice = await _db.Invoices
            .Include(i => i.Items)
            .Include(i => i.CreatedBy)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice == null) return NotFound();

        var config = await _db.ShopConfigs.FirstOrDefaultAsync();

        var pdf = GenerateInvoicePdf(invoice, config);
        return File(pdf, "application/pdf", $"{invoice.InvoiceNumber}.pdf");
    }

    private static InvoiceResponse MapToResponse(Invoice invoice)
    {
        return new InvoiceResponse(
            invoice.Id, invoice.InvoiceNumber, invoice.CustomerName, invoice.CustomerMobile,
            invoice.InvoiceDate, invoice.CGST, invoice.SGST, invoice.TotalAmount,
            invoice.Status, invoice.VoidReason, invoice.VoidedAt,
            invoice.CreatedBy?.Username ?? "Unknown",
            invoice.Items.Select(ii => new InvoiceItemResponse(
                ii.Id, ii.ProductId, ii.ProductName, ii.SellingPrice, ii.GSTPercentage,
                ii.Quantity,
                Math.Round(ii.SellingPrice * ii.Quantity * ii.GSTPercentage / 100, 2),
                Math.Round(ii.SellingPrice * ii.Quantity, 2)
            )).ToList()
        );
    }

    private byte[] GenerateInvoicePdf(Invoice invoice, ShopConfig? config)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(15, Unit.Millimetre);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header().Column(col =>
                {
                    if (config != null)
                    {
                        col.Item().Text(config.ShopName).Bold().FontSize(16);
                        col.Item().Text($"GST: {config.GSTNumber}");
                        col.Item().Text(config.Address);
                        col.Item().Text($"Mobile: {config.MobileNumber} | Email: {config.Email}");
                    }
                    col.Item().PaddingVertical(5).LineHorizontal(1);
                });

                page.Content().Column(col =>
                {
                    // Invoice info
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(left =>
                        {
                            left.Item().Text($"Invoice No: {invoice.InvoiceNumber}").Bold();
                            left.Item().Text($"Customer: {invoice.CustomerName}");
                            left.Item().Text($"Mobile: {invoice.CustomerMobile}");
                        });
                        row.RelativeItem().AlignRight().Column(right =>
                        {
                            right.Item().Text($"Date: {invoice.InvoiceDate:dd/MM/yyyy}");
                            if (invoice.Status == "Void")
                                right.Item().Text("VOID").Bold().FontSize(14).FontColor(Colors.Red.Medium);
                        });
                    });

                    col.Item().PaddingVertical(10);

                    // Items table
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(30);   // #
                            columns.RelativeColumn(3);    // Product
                            columns.RelativeColumn(1.5f); // Price
                            columns.RelativeColumn(1);    // GST%
                            columns.RelativeColumn(1.5f); // GST Amt
                            columns.RelativeColumn(0.8f); // Qty
                            columns.RelativeColumn(1.5f); // Amount
                        });

                        table.Header(header =>
                        {
                            header.Cell().BorderBottom(1).Padding(4).Text("#").Bold();
                            header.Cell().BorderBottom(1).Padding(4).Text("Product").Bold();
                            header.Cell().BorderBottom(1).Padding(4).AlignRight().Text("Price").Bold();
                            header.Cell().BorderBottom(1).Padding(4).AlignRight().Text("GST%").Bold();
                            header.Cell().BorderBottom(1).Padding(4).AlignRight().Text("GST Amt").Bold();
                            header.Cell().BorderBottom(1).Padding(4).AlignCenter().Text("Qty").Bold();
                            header.Cell().BorderBottom(1).Padding(4).AlignRight().Text("Amount").Bold();
                        });

                        int index = 1;
                        foreach (var item in invoice.Items)
                        {
                            var gstAmt = Math.Round(item.SellingPrice * item.Quantity * item.GSTPercentage / 100, 2);
                            var amount = Math.Round(item.SellingPrice * item.Quantity, 2);

                            table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(index.ToString());
                            table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(item.ProductName);
                            table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4).AlignRight().Text($"₹{item.SellingPrice:N2}");
                            table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4).AlignRight().Text($"{item.GSTPercentage}%");
                            table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4).AlignRight().Text($"₹{gstAmt:N2}");
                            table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4).AlignCenter().Text(item.Quantity.ToString());
                            table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4).AlignRight().Text($"₹{amount:N2}");
                            index++;
                        }
                    });

                    col.Item().PaddingVertical(10);

                    // Totals
                    col.Item().AlignRight().Width(200).Column(totals =>
                    {
                        var subTotal = invoice.Items.Sum(i => i.SellingPrice * i.Quantity);
                        totals.Item().Row(r =>
                        {
                            r.RelativeItem().Text("Sub Total:");
                            r.ConstantItem(100).AlignRight().Text($"₹{subTotal:N2}");
                        });
                        totals.Item().Row(r =>
                        {
                            r.RelativeItem().Text("CGST:");
                            r.ConstantItem(100).AlignRight().Text($"₹{invoice.CGST:N2}");
                        });
                        totals.Item().Row(r =>
                        {
                            r.RelativeItem().Text("SGST:");
                            r.ConstantItem(100).AlignRight().Text($"₹{invoice.SGST:N2}");
                        });
                        totals.Item().PaddingTop(5).BorderTop(1).Row(r =>
                        {
                            r.RelativeItem().Text("Grand Total:").Bold();
                            r.ConstantItem(100).AlignRight().Text($"₹{invoice.TotalAmount:N2}").Bold();
                        });
                    });
                });

                page.Footer().Column(col =>
                {
                    col.Item().PaddingVertical(5).LineHorizontal(1);
                    if (config != null && !string.IsNullOrEmpty(config.InvoiceRemarks))
                        col.Item().Text(config.InvoiceRemarks).FontSize(8).Italic();
                });
            });
        });

        return document.GeneratePdf();
    }
}
