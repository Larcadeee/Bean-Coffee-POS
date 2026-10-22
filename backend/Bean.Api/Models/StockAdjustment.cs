
namespace Bean.Api.Models;

public class StockAdjustment
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    public Product Product { get; set; } = null!;

    // Positive = stock added; negative = stock removed.
    public int QuantityChange { get; set; }

    public int StockBefore { get; set; }

    public int StockAfter { get; set; }

    public string Reason { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; } =
        DateTimeOffset.UtcNow;
}
