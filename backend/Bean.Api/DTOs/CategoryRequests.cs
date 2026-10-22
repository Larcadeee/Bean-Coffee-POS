namespace Bean.Api.DTOs;

public record CreateCategoryRequest(
    string? Name,
    string? Description);

public record UpdateCategoryRequest(
    string? Name,
    string? Description);
