
namespace Bean.Api.Models;

public class SaleItem
{
    public int Id { get; set; }

    public int SaleId { get; set; }

    public Sale Sale { get; set; } = null!;

    public int ProductId { get; set; }

    public Product Product { get; set; } = null!;

    public int Quantity { get; set; }

    // Price captured at the time of the sale.
    public decimal UnitPrice { get; set; }

    public decimal LineTotal { get; set; }
}
