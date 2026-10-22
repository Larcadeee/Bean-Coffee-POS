
namespace Bean.Api.DTOs;

public record CreateStockAdjustmentRequest(
    int QuantityChange,
    string? Reason);

public record StockAdjustmentResponse(
    int Id,
    int ProductId,
    string ProductName,
    int QuantityChange,
    int StockBefore,
    int StockAfter,
    string Reason,
    DateTimeOffset CreatedAt);
