using Microsoft.EntityFrameworkCore;
using MobileBilling.API.Data;

namespace MobileBilling.API.Services;

public class InvoiceNumberService
{
    private readonly AppDbContext _db;

    public InvoiceNumberService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<string> GenerateNextInvoiceNumberAsync()
    {
        var year = DateTime.UtcNow.Year;
        var prefix = $"INV-{year}-";

        var lastInvoice = await _db.Invoices
            .Where(i => i.InvoiceNumber.StartsWith(prefix))
            .OrderByDescending(i => i.InvoiceNumber)
            .FirstOrDefaultAsync();

        int nextSequence = 1;
        if (lastInvoice != null)
        {
            var lastNumberStr = lastInvoice.InvoiceNumber.Replace(prefix, "");
            if (int.TryParse(lastNumberStr, out int lastNumber))
                nextSequence = lastNumber + 1;
        }

        return $"{prefix}{nextSequence:D4}";
    }
}
