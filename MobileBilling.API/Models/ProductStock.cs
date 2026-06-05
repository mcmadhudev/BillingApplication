namespace MobileBilling.API.Models;

public class ProductStock
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string PurchaseOrderNumber { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public DateTime PurchaseDate { get; set; } = DateTime.UtcNow;

    public Product Product { get; set; } = null!;
}
