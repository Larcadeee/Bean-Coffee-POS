namespace Bean.Api.DTOs;

public record ProductResponse(
    int Id,
    string Name,
    decimal Price,
    bool IsAvailable,
    DateTimeOffset CreatedAt,
    int? CategoryId,
    string? CategoryName,
    int StockQuantity);