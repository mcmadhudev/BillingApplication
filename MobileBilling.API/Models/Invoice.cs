namespace MobileBilling.API.Models;

public class Invoice
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerMobile { get; set; } = string.Empty;
    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
    public decimal CGST { get; set; }
    public decimal SGST { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "Active"; // "Active" or "Void"
    public string? VoidReason { get; set; }
    public DateTime? VoidedAt { get; set; }
    public int CreatedByUserId { get; set; }

    public User CreatedBy { get; set; } = null!;
    public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
}
