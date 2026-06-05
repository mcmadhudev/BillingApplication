namespace MobileBilling.API.Models;

public class ShopConfig
{
    public int Id { get; set; }
    public string ShopName { get; set; } = string.Empty;
    public string GSTNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string InvoiceRemarks { get; set; } = string.Empty;
}
