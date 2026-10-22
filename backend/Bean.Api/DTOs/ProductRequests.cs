namespace Bean.Api.DTOs;

public record CreateProductRequest(
    string? Name,
    decimal Price,
    bool IsAvailable = true,
    int? CategoryId = null,
    int StockQuantity = 0);

public record UpdateProductRequest(
    string? Name,
    decimal Price,
    bool IsAvailable,
    int? CategoryId = null,
    int StockQuantity = 0);