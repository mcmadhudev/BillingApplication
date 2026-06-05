using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MobileBilling.API.Data;
using MobileBilling.API.DTOs;
using ClosedXML.Excel;

namespace MobileBilling.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ReportsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("stock")]
    public async Task<IActionResult> GetStockReport()
    {
        var report = await _db.Products
            .Where(p => p.IsActive)
            .Select(p => new StockReportItem(
                p.Id,
                p.Name,
                p.Stocks.Sum(s => s.Quantity),
                _db.InvoiceItems.Where(ii => ii.ProductId == p.Id && ii.Invoice.Status == "Active").Sum(ii => ii.Quantity),
                p.Stocks.Sum(s => s.Quantity) -
                    _db.InvoiceItems.Where(ii => ii.ProductId == p.Id && ii.Invoice.Status == "Active").Sum(ii => ii.Quantity)
            ))
            .ToListAsync();

        return Ok(report);
    }

    [HttpGet("sales")]
    public async Task<IActionResult> GetSalesReport([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        var query = _db.Invoices.AsQueryable();

        if (fromDate.HasValue)
            query = query.Where(i => i.InvoiceDate >= fromDate.Value);
        if (toDate.HasValue)
            query = query.Where(i => i.InvoiceDate <= toDate.Value.AddDays(1));

        var invoices = await query
            .OrderByDescending(i => i.InvoiceDate)
            .Select(i => new SalesReportItem(
                i.InvoiceNumber, i.InvoiceDate, i.CustomerName, i.TotalAmount, i.Status))
            .ToListAsync();

        var totalSales = invoices.Where(i => i.Status == "Active").Sum(i => i.TotalAmount);

        return Ok(new SalesReportResponse(invoices, totalSales, invoices.Count));
    }

    [HttpGet("stock/export")]
    public async Task<IActionResult> ExportStockReport()
    {
        var report = await _db.Products
            .Where(p => p.IsActive)
            .Select(p => new
            {
                p.Name,
                TotalPurchased = p.Stocks.Sum(s => s.Quantity),
                TotalSold = _db.InvoiceItems.Where(ii => ii.ProductId == p.Id && ii.Invoice.Status == "Active").Sum(ii => ii.Quantity),
                Available = p.Stocks.Sum(s => s.Quantity) -
                    _db.InvoiceItems.Where(ii => ii.ProductId == p.Id && ii.Invoice.Status == "Active").Sum(ii => ii.Quantity)
            })
            .ToListAsync();

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Stock Report");

        // Headers
        worksheet.Cell(1, 1).Value = "Product Name";
        worksheet.Cell(1, 2).Value = "Total Purchased";
        worksheet.Cell(1, 3).Value = "Total Sold";
        worksheet.Cell(1, 4).Value = "Available Stock";

        var headerRange = worksheet.Range(1, 1, 1, 4);
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.LightSteelBlue;

        int row = 2;
        foreach (var item in report)
        {
            worksheet.Cell(row, 1).Value = item.Name;
            worksheet.Cell(row, 2).Value = item.TotalPurchased;
            worksheet.Cell(row, 3).Value = item.TotalSold;
            worksheet.Cell(row, 4).Value = item.Available;
            row++;
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "StockReport.xlsx");
    }

    [HttpGet("sales/export")]
    public async Task<IActionResult> ExportSalesReport([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        var query = _db.Invoices.AsQueryable();

        if (fromDate.HasValue)
            query = query.Where(i => i.InvoiceDate >= fromDate.Value);
        if (toDate.HasValue)
            query = query.Where(i => i.InvoiceDate <= toDate.Value.AddDays(1));

        var invoices = await query
            .OrderByDescending(i => i.InvoiceDate)
            .Select(i => new { i.InvoiceNumber, i.InvoiceDate, i.CustomerName, i.CustomerMobile, i.TotalAmount, i.CGST, i.SGST, i.Status })
            .ToListAsync();

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Sales Report");

        string[] headers = { "Invoice #", "Date", "Customer", "Mobile", "CGST", "SGST", "Total", "Status" };
        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(1, i + 1).Value = headers[i];
        }

        var headerRange = worksheet.Range(1, 1, 1, headers.Length);
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.LightSteelBlue;

        int row = 2;
        foreach (var inv in invoices)
        {
            worksheet.Cell(row, 1).Value = inv.InvoiceNumber;
            worksheet.Cell(row, 2).Value = inv.InvoiceDate.ToString("dd/MM/yyyy");
            worksheet.Cell(row, 3).Value = inv.CustomerName;
            worksheet.Cell(row, 4).Value = inv.CustomerMobile;
            worksheet.Cell(row, 5).Value = inv.CGST;
            worksheet.Cell(row, 6).Value = inv.SGST;
            worksheet.Cell(row, 7).Value = inv.TotalAmount;
            worksheet.Cell(row, 8).Value = inv.Status;
            row++;
        }

        // Summary row
        var totalSales = invoices.Where(i => i.Status == "Active").Sum(i => i.TotalAmount);
        worksheet.Cell(row + 1, 6).Value = "Total Sales:";
        worksheet.Cell(row + 1, 6).Style.Font.Bold = true;
        worksheet.Cell(row + 1, 7).Value = totalSales;
        worksheet.Cell(row + 1, 7).Style.Font.Bold = true;

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "SalesReport.xlsx");
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("audit")]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] string? entityName, [FromQuery] string? action,
        [FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        var query = _db.AuditLogs.AsQueryable();

        if (!string.IsNullOrEmpty(entityName))
            query = query.Where(a => a.EntityName == entityName);
        if (!string.IsNullOrEmpty(action))
            query = query.Where(a => a.Action == action);
        if (fromDate.HasValue)
            query = query.Where(a => a.PerformedAt >= fromDate.Value);
        if (toDate.HasValue)
            query = query.Where(a => a.PerformedAt <= toDate.Value.AddDays(1));

        var logs = await query
            .OrderByDescending(a => a.PerformedAt)
            .Take(500)
            .ToListAsync();

        return Ok(logs);
    }
}
