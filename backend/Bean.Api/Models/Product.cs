
namespace Bean.Api.Models;

public class Product
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public decimal Price { get; set; }

    public bool IsAvailable { get; set; } = true;

    public DateTimeOffset CreatedAt { get; set; }
        = DateTimeOffset.UtcNow;
}
