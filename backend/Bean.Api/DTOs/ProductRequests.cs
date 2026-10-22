namespace Bean.Api.DTOs;

public record CreateProductRequest(
    string? Name,
    decimal Price,
    bool IsAvailable = true);

public record UpdateProductRequest(
    string? Name,
    decimal Price,
    bool IsAvailable);