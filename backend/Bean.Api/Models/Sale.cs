
namespace Bean.Api.Models;

public class Sale
{
    public int Id { get; set; }

    public decimal TotalAmount { get; set; }

    public decimal CashReceived { get; set; }

    public decimal ChangeDue { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
        = DateTimeOffset.UtcNow;

    public ICollection<SaleItem> Items { get; set; }
        = new List<SaleItem>();
}
