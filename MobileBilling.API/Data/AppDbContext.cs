using Microsoft.EntityFrameworkCore;
using MobileBilling.API.Models;

namespace MobileBilling.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<ShopConfig> ShopConfigs => Set<ShopConfig>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductStock> ProductStocks => Set<ProductStock>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Username).IsUnique();
            entity.Property(u => u.Username).HasMaxLength(100).IsRequired();
            entity.Property(u => u.Email).HasMaxLength(200).IsRequired();
            entity.Property(u => u.Role).HasMaxLength(20).IsRequired();
        });

        // ShopConfig
        modelBuilder.Entity<ShopConfig>(entity =>
        {
            entity.Property(s => s.ShopName).HasMaxLength(200);
            entity.Property(s => s.GSTNumber).HasMaxLength(50);
            entity.Property(s => s.Address).HasMaxLength(500);
            entity.Property(s => s.MobileNumber).HasMaxLength(20);
            entity.Property(s => s.Email).HasMaxLength(200);
            entity.Property(s => s.InvoiceRemarks).HasMaxLength(1000);
        });

        // Product
        modelBuilder.Entity<Product>(entity =>
        {
            entity.Property(p => p.Name).HasMaxLength(200).IsRequired();
            entity.Property(p => p.GSTPercentage).HasPrecision(5, 2);
            entity.Property(p => p.SellingPrice).HasPrecision(18, 2);
        });

        // ProductStock
        modelBuilder.Entity<ProductStock>(entity =>
        {
            entity.Property(s => s.PurchaseOrderNumber).HasMaxLength(100).IsRequired();
            entity.HasOne(s => s.Product)
                .WithMany(p => p.Stocks)
                .HasForeignKey(s => s.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Invoice
        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasIndex(i => i.InvoiceNumber).IsUnique();
            entity.Property(i => i.InvoiceNumber).HasMaxLength(20).IsRequired();
            entity.Property(i => i.CustomerName).HasMaxLength(200).IsRequired();
            entity.Property(i => i.CustomerMobile).HasMaxLength(20).IsRequired();
            entity.Property(i => i.CGST).HasPrecision(18, 2);
            entity.Property(i => i.SGST).HasPrecision(18, 2);
            entity.Property(i => i.TotalAmount).HasPrecision(18, 2);
            entity.Property(i => i.Status).HasMaxLength(20);
            entity.Property(i => i.VoidReason).HasMaxLength(500);
            entity.HasOne(i => i.CreatedBy)
                .WithMany()
                .HasForeignKey(i => i.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // InvoiceItem
        modelBuilder.Entity<InvoiceItem>(entity =>
        {
            entity.Property(ii => ii.ProductName).HasMaxLength(200);
            entity.Property(ii => ii.SellingPrice).HasPrecision(18, 2);
            entity.Property(ii => ii.GSTPercentage).HasPrecision(5, 2);
            entity.HasOne(ii => ii.Invoice)
                .WithMany(i => i.Items)
                .HasForeignKey(ii => ii.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(ii => ii.Product)
                .WithMany()
                .HasForeignKey(ii => ii.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // AuditLog
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.Property(a => a.EntityName).HasMaxLength(100);
            entity.Property(a => a.EntityId).HasMaxLength(50);
            entity.Property(a => a.Action).HasMaxLength(20);
            entity.Property(a => a.PerformedBy).HasMaxLength(100);
        });

        // Seed data – use a static hash to avoid EF Core PendingModelChangesWarning
        // Hash of "admin123" generated via BCrypt (cost 11)
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = 1,
            Username = "admin",
            PasswordHash = "$2a$11$SmchrSo9nonfeQQlZGYVC.8A2bBQjOg769x734tgWn8vnNONlA3X.",
            Email = "admin@mobilebilling.com",
            Role = "Admin",
            IsActive = true,
            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });

        modelBuilder.Entity<ShopConfig>().HasData(new ShopConfig
        {
            Id = 1,
            ShopName = "",
            GSTNumber = "",
            Address = "",
            MobileNumber = "",
            Email = "",
            InvoiceRemarks = ""
        });
    }
}
