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
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AuditService _audit;

    public UsersController(AppDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    private string CurrentUsername => User.FindFirst(ClaimTypes.Name)?.Value ?? "System";

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await _db.Users
            .Select(u => new UserResponse(u.Id, u.Username, u.Email, u.Role, u.IsActive, u.CreatedAt))
            .ToListAsync();
        return Ok(users);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        if (await _db.Users.AnyAsync(u => u.Username == request.Username))
            return BadRequest(new { message = "Username already exists" });

        var user = new User
        {
            Username = request.Username,
            PasswordHash = AuthService.HashPassword(request.Password),
            Email = request.Email,
            Role = request.Role
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("User", user.Id.ToString(), "Create", CurrentUsername, $"Created user: {user.Username}");

        return Ok(new UserResponse(user.Id, user.Username, user.Email, user.Role, user.IsActive, user.CreatedAt));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest request)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.Email = request.Email;
        user.Role = request.Role;
        await _db.SaveChangesAsync();
        await _audit.LogAsync("User", id.ToString(), "Update", CurrentUsername, $"Updated email/role for: {user.Username}");

        return Ok(new UserResponse(user.Id, user.Username, user.Email, user.Role, user.IsActive, user.CreatedAt));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.IsActive = false;
        await _db.SaveChangesAsync();
        await _audit.LogAsync("User", id.ToString(), "Delete", CurrentUsername, $"Deactivated user: {user.Username}");

        return NoContent();
    }

    [HttpPost("{id}/reset-password")]
    public async Task<IActionResult> ResetPassword(int id, [FromBody] ResetPasswordRequest request)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.PasswordHash = AuthService.HashPassword(request.NewPassword);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("User", id.ToString(), "Update", CurrentUsername, $"Password reset for: {user.Username}");

        return Ok(new { message = "Password reset successfully" });
    }
}
