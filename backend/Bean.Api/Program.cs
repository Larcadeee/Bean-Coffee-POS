
using Bean.Api.Data;
using Bean.Api.DTOs;
using Bean.Api.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Database configuration
builder.Services.AddDbContext<BeanDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")));

// Swagger configuration
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

// Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Health checks
app.MapGet("/api/health", () =>
{
    return Results.Ok(new { status = "Healthy" });
})
.WithName("HealthCheck")
.WithTags("Health");

app.MapGet("/api/health/database", async (BeanDbContext db) =>
{
    try
    {
        await db.Database.CanConnectAsync();

        return Results.Ok(new
        {
            status = "Healthy",
            database = "bean_pos"
        });
    }
    catch
    {
        return Results.Problem(
            title: "Database connection failed",
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }
})
.WithName("DatabaseHealthCheck")
.WithTags("Health");

// =====================================================
// PRODUCTS
// =====================================================

// GET: /api/products
app.MapGet("/api/products", async (BeanDbContext db) =>
{
    var products = await db.Products
        .AsNoTracking()
        .OrderBy(p => p.Name)
        .Select(p => new ProductResponse(
            p.Id,
            p.Name,
            p.Price,
            p.IsAvailable,
            p.CreatedAt,
            p.CategoryId,
            p.Category != null ? p.Category.Name : null))
        .ToListAsync();

    return Results.Ok(products);
})
.WithName("GetProducts")
.WithTags("Products");

// GET: /api/products/{id}
app.MapGet("/api/products/{id:int}", async (
    int id,
    BeanDbContext db) =>
{
    var product = await db.Products
        .AsNoTracking()
        .Where(p => p.Id == id)
        .Select(p => new ProductResponse(
            p.Id,
            p.Name,
            p.Price,
            p.IsAvailable,
            p.CreatedAt,
            p.CategoryId,
            p.Category != null ? p.Category.Name : null))
        .FirstOrDefaultAsync();

    return product is null
        ? Results.NotFound()
        : Results.Ok(product);
})
.WithName("GetProductById")
.WithTags("Products");

// POST: /api/products
app.MapPost("/api/products", async (
    CreateProductRequest request,
    BeanDbContext db) =>
{
    var name = request.Name?.Trim();

    if (string.IsNullOrWhiteSpace(name))
    {
        return Results.ValidationProblem(
            new Dictionary<string, string[]>
            {
                ["name"] = ["Product name is required."]
            });
    }

    if (name.Length > 120)
    {
        return Results.ValidationProblem(
            new Dictionary<string, string[]>
            {
                ["name"] = ["Product name must not exceed 120 characters."]
            });
    }

    if (request.Price < 0)
    {
        return Results.ValidationProblem(
            new Dictionary<string, string[]>
            {
                ["price"] = ["Price cannot be negative."]
            });
    }

    if (request.CategoryId.HasValue)
    {
        var categoryExists = await db.Categories
            .AnyAsync(c => c.Id == request.CategoryId.Value);

        if (!categoryExists)
        {
            return Results.ValidationProblem(
                new Dictionary<string, string[]>
                {
                    ["categoryId"] =
                    [
                        "The selected category does not exist."
                    ]
                });
        }
    }

    var product = new Product
    {
        Name = name,
        Price = request.Price,
        IsAvailable = request.IsAvailable,
        CategoryId = request.CategoryId,
        CreatedAt = DateTimeOffset.UtcNow
    };

    db.Products.Add(product);
    await db.SaveChangesAsync();

        var response = new ProductResponse(
    product.Id,
    product.Name,
    product.Price,
    product.IsAvailable,
    product.CreatedAt,
    product.CategoryId,
    product.CategoryId.HasValue
        ? await db.Categories
            .Where(c => c.Id == product.CategoryId.Value)
            .Select(c => c.Name)
            .FirstOrDefaultAsync()
        : null);

return Results.Created(
    $"/api/products/{product.Id}",
    response);
})
.WithName("CreateProduct")
.WithTags("Products");

// PUT: /api/products/{id}
app.MapPut("/api/products/{id:int}", async (
    int id,
    UpdateProductRequest request,
    BeanDbContext db) =>
{
    var product = await db.Products.FindAsync(id);

    if (product is null)
    {
        return Results.NotFound();
    }

    var name = request.Name?.Trim();

    if (string.IsNullOrWhiteSpace(name))
    {
        return Results.ValidationProblem(
            new Dictionary<string, string[]>
            {
                ["name"] = ["Product name is required."]
            });
    }

    if (name.Length > 120)
    {
        return Results.ValidationProblem(
            new Dictionary<string, string[]>
            {
                ["name"] = ["Product name must not exceed 120 characters."]
            });
    }

    if (request.Price < 0)
    {
        return Results.ValidationProblem(
            new Dictionary<string, string[]>
            {
                ["price"] = ["Price cannot be negative."]
            });
    }

    if (request.CategoryId.HasValue)
    {
        var categoryExists = await db.Categories
            .AnyAsync(c => c.Id == request.CategoryId.Value);

        if (!categoryExists)
        {
            return Results.ValidationProblem(
                new Dictionary<string, string[]>
                {
                    ["categoryId"] =
                    [
                        "The selected category does not exist."
                    ]
                });
        }
    }

    product.Name = name;
    product.Price = request.Price;
    product.IsAvailable = request.IsAvailable;
    product.CategoryId = request.CategoryId;

    await db.SaveChangesAsync();

    var response = new ProductResponse(
    product.Id,
    product.Name,
    product.Price,
    product.IsAvailable,
    product.CreatedAt,
    product.CategoryId,
    product.CategoryId.HasValue
        ? await db.Categories
            .Where(c => c.Id == product.CategoryId.Value)
            .Select(c => c.Name)
            .FirstOrDefaultAsync()
        : null);

return Results.Ok(response);
})
.WithName("UpdateProduct")
.WithTags("Products");

// DELETE: /api/products/{id}
app.MapDelete("/api/products/{id:int}", async (
    int id,
    BeanDbContext db) =>
{
    var product = await db.Products.FindAsync(id);

    if (product is null)
    {
        return Results.NotFound();
    }

    db.Products.Remove(product);
    await db.SaveChangesAsync();

    return Results.NoContent();
})
.WithName("DeleteProduct")
.WithTags("Products");

// =====================================================
// CATEGORIES
// =====================================================

// GET: /api/categories
app.MapGet("/api/categories", async (BeanDbContext db) =>
{
    var categories = await db.Categories
        .AsNoTracking()
        .OrderBy(c => c.Name)
        .ToListAsync();

    return Results.Ok(categories);
})
.WithName("GetCategories")
.WithTags("Categories");

// GET: /api/categories/{id}
app.MapGet("/api/categories/{id:int}", async (
    int id,
    BeanDbContext db) =>
{
    var category = await db.Categories
        .AsNoTracking()
        .FirstOrDefaultAsync(c => c.Id == id);

    return category is null
        ? Results.NotFound()
        : Results.Ok(category);
})
.WithName("GetCategoryById")
.WithTags("Categories");

// POST: /api/categories
app.MapPost("/api/categories", async (
    CreateCategoryRequest request,
    BeanDbContext db) =>
{
    var name = request.Name?.Trim();
    var description = request.Description?.Trim();

    if (string.IsNullOrWhiteSpace(name))
    {
        return Results.ValidationProblem(
            new Dictionary<string, string[]>
            {
                ["name"] = ["Category name is required."]
            });
    }

    if (name.Length > 80)
    {
        return Results.ValidationProblem(
            new Dictionary<string, string[]>
            {
                ["name"] =
                [
                    "Category name must not exceed 80 characters."
                ]
            });
    }

    if (description?.Length > 300)
    {
        return Results.ValidationProblem(
            new Dictionary<string, string[]>
            {
                ["description"] =
                [
                    "Description must not exceed 300 characters."
                ]
            });
    }

    var duplicate = await db.Categories
        .AnyAsync(c => c.Name.ToLower() == name.ToLower());

    if (duplicate)
    {
        return Results.Conflict(new
        {
            message = "A category with this name already exists."
        });
    }

    var category = new Category
    {
        Name = name,
        Description = string.IsNullOrWhiteSpace(description)
            ? null
            : description,
        CreatedAt = DateTimeOffset.UtcNow
    };

    db.Categories.Add(category);
    await db.SaveChangesAsync();

    return Results.Created(
        $"/api/categories/{category.Id}",
        category);
})
.WithName("CreateCategory")
.WithTags("Categories");

// PUT: /api/categories/{id}
app.MapPut("/api/categories/{id:int}", async (
    int id,
    UpdateCategoryRequest request,
    BeanDbContext db) =>
{
    var category = await db.Categories.FindAsync(id);

    if (category is null)
    {
        return Results.NotFound();
    }

    var name = request.Name?.Trim();
    var description = request.Description?.Trim();

    if (string.IsNullOrWhiteSpace(name))
    {
        return Results.ValidationProblem(
            new Dictionary<string, string[]>
            {
                ["name"] = ["Category name is required."]
            });
    }

    if (name.Length > 80)
    {
        return Results.ValidationProblem(
            new Dictionary<string, string[]>
            {
                ["name"] =
                [
                    "Category name must not exceed 80 characters."
                ]
            });
    }

    if (description?.Length > 300)
    {
        return Results.ValidationProblem(
            new Dictionary<string, string[]>
            {
                ["description"] =
                [
                    "Description must not exceed 300 characters."
                ]
            });
    }

    var duplicate = await db.Categories.AnyAsync(c =>
        c.Id != id &&
        c.Name.ToLower() == name.ToLower());

    if (duplicate)
    {
        return Results.Conflict(new
        {
            message = "A category with this name already exists."
        });
    }

    category.Name = name;
    category.Description = string.IsNullOrWhiteSpace(description)
        ? null
        : description;

    await db.SaveChangesAsync();

    return Results.Ok(category);
})
.WithName("UpdateCategory")
.WithTags("Categories");

// DELETE: /api/categories/{id}
app.MapDelete("/api/categories/{id:int}", async (
    int id,
    BeanDbContext db) =>
{
    var category = await db.Categories.FindAsync(id);

    if (category is null)
    {
        return Results.NotFound();
    }

    var hasProducts = await db.Products
        .AnyAsync(p => p.CategoryId == id);

    if (hasProducts)
    {
        return Results.Conflict(new
        {
            message =
                "Cannot delete a category that still has products."
        });
    }

    db.Categories.Remove(category);
    await db.SaveChangesAsync();

    return Results.NoContent();
})
.WithName("DeleteCategory")
.WithTags("Categories");

app.Run();
