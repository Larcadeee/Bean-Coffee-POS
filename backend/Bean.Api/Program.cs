
using Bean.Api.DTOs;
using Bean.Api.Data;
using Bean.Api.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// API documentation.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// PostgreSQL connection.
var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "The DefaultConnection connection string is missing.");
}

builder.Services.AddDbContext<BeanDbContext>(options =>
    options.UseNpgsql(connectionString));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Root endpoint.
app.MapGet("/", () =>
{
    return Results.Ok(new
    {
        message = "Welcome to Bean Coffee POS API",
        documentation = "/swagger",
        health = "/api/health",
        databaseHealth = "/api/health/database"
    });
});

// API health check.
app.MapGet("/api/health", () =>
{
    return Results.Ok(new
    {
        status = "Healthy",
        application = "Bean Coffee POS",
        timestamp = DateTimeOffset.UtcNow
    });
})
.WithName("GetHealth")
.WithTags("System");

// Database connectivity check.
app.MapGet(
    "/api/health/database",
    async (BeanDbContext db) =>
    {
        try
        {
            var canConnect =
                await db.Database.CanConnectAsync();

            if (!canConnect)
            {
                return Results.Problem(
                    title: "Database unavailable",
                    statusCode: StatusCodes.Status503ServiceUnavailable);
            }

            return Results.Ok(new
            {
                status = "Healthy",
                database = "bean_pos"
            });
        }
        catch
        {
            // Avoid returning connection details or credentials.
            return Results.Problem(
                title: "Database connection failed",
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }
    })
    .WithName("GetDatabaseHealth")
    .WithTags("System");

    // GET: /api/products
app.MapGet("/api/products", async (BeanDbContext db) =>
{
    var products = await db.Products
        .AsNoTracking()
        .OrderBy(p => p.Name)
        .ToListAsync();

    return Results.Ok(products);
})
.WithName("GetProducts")
.WithTags("Products");

// GET: /api/products/{id}
app.MapGet("/api/products/{id:int}", async (int id, BeanDbContext db) =>
{
    var product = await db.Products.FindAsync(id);

    return product is null
        ? Results.NotFound()
        : Results.Ok(product);
})
.WithName("GetProductById")
.WithTags("Products");

// POST: /api/products
app.MapPost("/api/products", async (CreateProductRequest request, BeanDbContext db) =>
{
    var name = request.Name?.Trim();

    if (string.IsNullOrWhiteSpace(name))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["name"] = ["Product name is required."]
        });
    }

    if (name.Length > 120)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["name"] = ["Product name must not exceed 120 characters."]
        });
    }

    if (request.Price < 0)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["price"] = ["Price cannot be negative."]
        });
    }

    var product = new Product
    {
        Name = name,
        Price = request.Price,
        IsAvailable = request.IsAvailable,
        CreatedAt = DateTimeOffset.UtcNow
    };

    db.Products.Add(product);
    await db.SaveChangesAsync();

    return Results.Created($"/api/products/{product.Id}", product);
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
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["name"] = ["Product name is required."]
        });
    }

    if (name.Length > 120)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["name"] = ["Product name must not exceed 120 characters."]
        });
    }

    if (request.Price < 0)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["price"] = ["Price cannot be negative."]
        });
    }

    product.Name = name;
    product.Price = request.Price;
    product.IsAvailable = request.IsAvailable;

    await db.SaveChangesAsync();

    return Results.Ok(product);
})
.WithName("UpdateProduct")
.WithTags("Products");

// DELETE: /api/products/{id}
app.MapDelete("/api/products/{id:int}", async (int id, BeanDbContext db) =>
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


app.Run();
