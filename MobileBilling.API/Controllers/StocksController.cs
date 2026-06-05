using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MobileBilling.API.Data;
using MobileBilling.API.DTOs;
using MobileBilling.API.Models;
using MobileBilling.API.Services;
using System.Security.Claims;

namespace MobileBilling.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StocksController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AuditService _audit;

    public StocksController(AppDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    private string CurrentUsername => User.FindFirst(ClaimTypes.Name)?.Value ?? "System";

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var stocks = await _db.ProductStocks
            .Include(s => s.Product)
            .OrderByDescending(s => s.PurchaseDate)
            .Select(s => new StockResponse(s.Id, s.ProductId, s.Product.Name, s.PurchaseOrderNumber, s.Quantity, s.PurchaseDate))
            .ToListAsync();
        return Ok(stocks);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateStockRequest request)
    {
        var product = await _db.Products.FindAsync(request.ProductId);
        if (product == null) return BadRequest(new { message = "Product not found" });

        var stock = new ProductStock
        {
            ProductId = request.ProductId,
            PurchaseOrderNumber = request.PurchaseOrderNumber,
            Quantity = request.Quantity,
            PurchaseDate = request.PurchaseDate
        };

        _db.ProductStocks.Add(stock);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("ProductStock", stock.Id.ToString(), "Create", CurrentUsername,
            $"Added stock: {request.Quantity} units of {product.Name} (PO: {request.PurchaseOrderNumber})");

        return Ok(new StockResponse(stock.Id, stock.ProductId, product.Name, stock.PurchaseOrderNumber, stock.Quantity, stock.PurchaseDate));
    }
}
