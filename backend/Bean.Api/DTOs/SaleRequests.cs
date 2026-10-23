
namespace Bean.Api.DTOs;

public record CreateSaleItemRequest(
    int ProductId,
    int Quantity);

public record CreateSaleRequest(
    decimal CashReceived,
    List<CreateSaleItemRequest>? Items);

public record SaleItemResponse(
    int Id,
    int ProductId,
    string ProductName,
    int Quantity,
    decimal UnitPrice,
    decimal LineTotal);

public record SaleResponse(
    int Id,
    decimal TotalAmount,
    decimal CashReceived,
    decimal ChangeDue,
    DateTimeOffset CreatedAt,
    List<SaleItemResponse> Items);
