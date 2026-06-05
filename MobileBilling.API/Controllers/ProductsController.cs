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
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AuditService _audit;

    public ProductsController(AppDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    private string CurrentUsername => User.FindFirst(ClaimTypes.Name)?.Value ?? "System";

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var products = await _db.Products
            .Where(p => p.IsActive)
            .Select(p => new ProductResponse(
                p.Id, p.Name, p.GSTPercentage, p.SellingPrice, p.IsActive, p.CreatedAt,
                p.Stocks.Sum(s => s.Quantity) -
                _db.InvoiceItems.Where(ii => ii.ProductId == p.Id && ii.Invoice.Status == "Active").Sum(ii => ii.Quantity)
            ))
            .ToListAsync();
        return Ok(products);
    }

    [HttpGet("in-stock")]
    public async Task<IActionResult> GetInStock()
    {
        var products = await _db.Products
            .Where(p => p.IsActive)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.GSTPercentage,
                p.SellingPrice,
                AvailableStock = p.Stocks.Sum(s => s.Quantity) -
                    _db.InvoiceItems.Where(ii => ii.ProductId == p.Id && ii.Invoice.Status == "Active").Sum(ii => ii.Quantity)
            })
            .Where(p => p.AvailableStock > 0)
            .ToListAsync();
        return Ok(products);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProductRequest request)
    {
        var product = new Product
        {
            Name = request.Name,
            GSTPercentage = request.GSTPercentage,
            SellingPrice = request.SellingPrice
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("Product", product.Id.ToString(), "Create", CurrentUsername, $"Created product: {product.Name}");

        return Ok(new ProductResponse(product.Id, product.Name, product.GSTPercentage, product.SellingPrice, product.IsActive, product.CreatedAt, 0));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProductRequest request)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return NotFound();

        product.Name = request.Name;
        product.GSTPercentage = request.GSTPercentage;
        product.SellingPrice = request.SellingPrice;
        await _db.SaveChangesAsync();
        await _audit.LogAsync("Product", id.ToString(), "Update", CurrentUsername, $"Updated product: {product.Name}");

        return Ok(new ProductResponse(product.Id, product.Name, product.GSTPercentage, product.SellingPrice, product.IsActive, product.CreatedAt, 0));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return NotFound();

        product.IsActive = false;
        await _db.SaveChangesAsync();
        await _audit.LogAsync("Product", id.ToString(), "Delete", CurrentUsername, $"Deactivated product: {product.Name}");

        return NoContent();
    }
}
