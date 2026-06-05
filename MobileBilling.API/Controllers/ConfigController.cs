using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MobileBilling.API.Data;
using MobileBilling.API.DTOs;
using MobileBilling.API.Services;
using System.Security.Claims;

namespace MobileBilling.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConfigController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AuditService _audit;

    public ConfigController(AppDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var config = await _db.ShopConfigs.FirstOrDefaultAsync();
        if (config == null) return NotFound();

        return Ok(new ShopConfigResponse(config.Id, config.ShopName, config.GSTNumber,
            config.Address, config.MobileNumber, config.Email, config.InvoiceRemarks));
    }

    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update([FromBody] ShopConfigRequest request)
    {
        var config = await _db.ShopConfigs.FirstOrDefaultAsync();
        if (config == null) return NotFound();

        config.ShopName = request.ShopName;
        config.GSTNumber = request.GSTNumber;
        config.Address = request.Address;
        config.MobileNumber = request.MobileNumber;
        config.Email = request.Email;
        config.InvoiceRemarks = request.InvoiceRemarks;

        await _db.SaveChangesAsync();

        var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        await _audit.LogAsync("ShopConfig", config.Id.ToString(), "Update", username, "Shop configuration updated");

        return Ok(new ShopConfigResponse(config.Id, config.ShopName, config.GSTNumber,
            config.Address, config.MobileNumber, config.Email, config.InvoiceRemarks));
    }
}
