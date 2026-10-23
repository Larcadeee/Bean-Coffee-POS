
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

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();
app.UseCors("Frontend");

// Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// HEALTH CHECKS
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
        var canConnect = await db.Database.CanConnectAsync();

        if (!canConnect)
        {
            return Results.Problem(
                title: "Database connection failed",
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
        return Results.Problem(
            title: "Database connection failed",
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }
})
.WithName("DatabaseHealthCheck")
.WithTags("Health");

// ==============================
// PRODUCTS
// ==============================

// GET all products
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
            p.Category != null ? p.Category.Name : null,
            p.StockQuantity))
        .ToListAsync();

    return Results.Ok(products);
})
.WithName("GetProducts")
.WithTags("Products");

// GET product by ID
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
            p.Category != null ? p.Category.Name : null,
            p.StockQuantity))
        .FirstOrDefaultAsync();

    return product is null
        ? Results.NotFound()
        : Results.Ok(product);
})
.WithName("GetProductById")
.WithTags("Products");

// CREATE product
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

    if (request.StockQuantity < 0)
    {
        return Results.ValidationProblem(
            new Dictionary<string, string[]>
            {
                ["stockQuantity"] = ["Stock quantity cannot be negative."]
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
        StockQuantity = request.StockQuantity,
        CreatedAt = DateTimeOffset.UtcNow
    };

    db.Products.Add(product);
    await db.SaveChangesAsync();

    var categoryName = product.CategoryId.HasValue
        ? await db.Categories
            .Where(c => c.Id == product.CategoryId.Value)
            .Select(c => c.Name)
            .FirstOrDefaultAsync()
        : null;

    var response = new ProductResponse(
        product.Id,
        product.Name,
        product.Price,
        product.IsAvailable,
        product.CreatedAt,
        product.CategoryId,
        categoryName,
        product.StockQuantity);

    return Results.Created(
        $"/api/products/{product.Id}",
        response);
})
.WithName("CreateProduct")
.WithTags("Products");

// UPDATE product
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

    if (request.StockQuantity < 0)
    {
        return Results.ValidationProblem(
            new Dictionary<string, string[]>
            {
                ["stockQuantity"] = ["Stock quantity cannot be negative."]
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
    product.StockQuantity = request.StockQuantity;

    await db.SaveChangesAsync();

    var categoryName = product.CategoryId.HasValue
        ? await db.Categories
            .Where(c => c.Id == product.CategoryId.Value)
            .Select(c => c.Name)
            .FirstOrDefaultAsync()
        : null;

    var response = new ProductResponse(
        product.Id,
        product.Name,
        product.Price,
        product.IsAvailable,
        product.CreatedAt,
        product.CategoryId,
        categoryName,
        product.StockQuantity);

    return Results.Ok(response);
})
.WithName("UpdateProduct")
.WithTags("Products");

// DELETE product
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


 // ==============================
 // STOCK ADJUSTMENTS
 // ==============================

 // GET stock adjustment history for a product
 app.MapGet("/api/products/{id:int}/stock-adjustments", async (
     int id,
     BeanDbContext db) =>
 {
     var productExists = await db.Products
         .AnyAsync(p => p.Id == id);

     if (!productExists)
     {
         return Results.NotFound(new
         {
             message = "Product not found."
         });
     }

     var adjustments = await db.StockAdjustments
         .AsNoTracking()
         .Where(a => a.ProductId == id)
         .OrderByDescending(a => a.CreatedAt)
         .Select(a => new StockAdjustmentResponse(
             a.Id,
             a.ProductId,
             a.Product.Name,
             a.QuantityChange,
             a.StockBefore,
             a.StockAfter,
             a.Reason,
             a.CreatedAt))
         .ToListAsync();

     return Results.Ok(adjustments);
 })
 .WithName("GetProductStockAdjustments")
 .WithTags("Inventory");

 // CREATE a stock adjustment
 app.MapPost("/api/products/{id:int}/stock-adjustments", async (
     int id,
     CreateStockAdjustmentRequest request,
     BeanDbContext db) =>
 {
     var reason = request.Reason?.Trim();

     if (request.QuantityChange == 0)
     {
         return Results.ValidationProblem(
             new Dictionary<string, string[]>
             {
                 ["quantityChange"] =
                 [
                     "Quantity change cannot be zero."
                 ]
             });
     }

     if (string.IsNullOrWhiteSpace(reason))
     {
         return Results.ValidationProblem(
             new Dictionary<string, string[]>
             {
                 ["reason"] = ["An adjustment reason is required."]
             });
     }

     if (reason.Length > 200)
     {
         return Results.ValidationProblem(
             new Dictionary<string, string[]>
             {
                 ["reason"] =
                 [
                     "Reason must not exceed 200 characters."
                 ]
             });
     }

     await using var transaction =
         await db.Database.BeginTransactionAsync();

     var product = await db.Products
         .FromSqlInterpolated(
             $"SELECT * FROM \"Products\" WHERE \"Id\" = {id} FOR UPDATE")
         .FirstOrDefaultAsync();

     if (product is null)
     {
         await transaction.RollbackAsync();

         return Results.NotFound(new
         {
             message = "Product not found."
         });
     }

     var stockBefore = product.StockQuantity;

     var stockAfter = (long)stockBefore + request.QuantityChange;

     if (stockAfter < 0)
     {
         await transaction.RollbackAsync();

         return Results.ValidationProblem(
             new Dictionary<string, string[]>
             {
                 ["quantityChange"] =
                 [
                     $"Insufficient stock. Current stock is {stockBefore}."
                 ]
             });
     }

     if (stockAfter > int.MaxValue)
     {
         await transaction.RollbackAsync();

         return Results.ValidationProblem(
             new Dictionary<string, string[]>
             {
                 ["quantityChange"] =
                 [
                     "The resulting stock quantity is too large."
                 ]
             });
     }

     product.StockQuantity = (int)stockAfter;

     var adjustment = new StockAdjustment
     {
         ProductId = product.Id,
         QuantityChange = request.QuantityChange,
         StockBefore = stockBefore,
         StockAfter = product.StockQuantity,
         Reason = reason,
         CreatedAt = DateTimeOffset.UtcNow
     };

     db.StockAdjustments.Add(adjustment);

     await db.SaveChangesAsync();
     await transaction.CommitAsync();

     var response = new StockAdjustmentResponse(
         adjustment.Id,
         product.Id,
         product.Name,
         adjustment.QuantityChange,
         adjustment.StockBefore,
         adjustment.StockAfter,
         adjustment.Reason,
         adjustment.CreatedAt);

     return Results.Created(
         $"/api/products/{id}/stock-adjustments/{adjustment.Id}",
         response);
 })
 .WithName("CreateProductStockAdjustment")
 .WithTags("Inventory");


app.MapPost("/api/sales", async (
    CreateSaleRequest request,
    BeanDbContext db) =>
{
    const decimal MaxAmount = 99999999.99m;

    if (request.Items is null || request.Items.Count == 0)
    {
        return Results.ValidationProblem(
            new Dictionary<string, string[]>
            {
                ["items"] = ["A sale must contain at least one item."]
            });
    }

    if (request.Items.Count > 100)
    {
        return Results.ValidationProblem(
            new Dictionary<string, string[]>
            {
                ["items"] = ["A sale cannot contain more than 100 items."]
            });
    }

    if (request.CashReceived < 0 ||
        request.CashReceived > MaxAmount ||
        decimal.Round(request.CashReceived, 2) != request.CashReceived)
    {
        return Results.ValidationProblem(
            new Dictionary<string, string[]>
            {
                ["cashReceived"] =
                [
                    "Cash received must be a nonnegative amount with at most two decimal places."
                ]
            });
    }

    if (request.Items.Any(item =>
        item.ProductId <= 0 || item.Quantity <= 0))
    {
        return Results.ValidationProblem(
            new Dictionary<string, string[]>
            {
                ["items"] =
                [
                    "Every item must have a valid product ID and a quantity greater than zero."
                ]
            });
    }

    if (request.Items
        .GroupBy(item => item.ProductId)
        .Any(group => group.Count() > 1))
    {
        return Results.ValidationProblem(
            new Dictionary<string, string[]>
            {
                ["items"] =
                [
                    "Each product must appear only once. Combine quantities for duplicate products."
                ]
            });
    }

    await using var transaction =
        await db.Database.BeginTransactionAsync();

    var lockedProducts = new Dictionary<int, Product>();

    // Lock products in ascending ID order to reduce deadlock risk.
    foreach (var productId in request.Items
        .Select(item => item.ProductId)
        .OrderBy(id => id))
    {
        var product = await db.Products
            .FromSqlInterpolated(
                $"SELECT * FROM \"Products\" WHERE \"Id\" = {productId} FOR UPDATE")
            .FirstOrDefaultAsync();

        if (product is null)
        {
            await transaction.RollbackAsync();

            return Results.NotFound(new
            {
                message = $"Product {productId} was not found."
            });
        }

        lockedProducts.Add(productId, product);
    }

    foreach (var item in request.Items)
    {
        var product = lockedProducts[item.ProductId];

        if (!product.IsAvailable)
        {
            await transaction.RollbackAsync();

            return Results.ValidationProblem(
                new Dictionary<string, string[]>
                {
                    ["items"] =
                    [
                        $"{product.Name} is currently unavailable."
                    ]
                });
        }

        if (product.StockQuantity < item.Quantity)
        {
            await transaction.RollbackAsync();

            return Results.ValidationProblem(
                new Dictionary<string, string[]>
                {
                    ["items"] =
                    [
                        $"Insufficient stock for {product.Name}. Available: {product.StockQuantity}; requested: {item.Quantity}."
                    ]
                });
        }
    }

    var saleItems = new List<SaleItem>();
    decimal totalAmount = 0;

    foreach (var item in request.Items)
    {
        var product = lockedProducts[item.ProductId];

        var lineTotal = decimal.Round(
            product.Price * item.Quantity,
            2,
            MidpointRounding.AwayFromZero);

        if (lineTotal > MaxAmount ||
            totalAmount > MaxAmount - lineTotal)
        {
            await transaction.RollbackAsync();

            return Results.ValidationProblem(
                new Dictionary<string, string[]>
                {
                    ["items"] =
                    [
                        "The sale total exceeds the supported amount."
                    ]
                });
        }

        totalAmount += lineTotal;

        saleItems.Add(new SaleItem
        {
            ProductId = product.Id,
            Quantity = item.Quantity,
            UnitPrice = product.Price,
            LineTotal = lineTotal
        });
    }

    if (request.CashReceived < totalAmount)
    {
        await transaction.RollbackAsync();

        return Results.ValidationProblem(
            new Dictionary<string, string[]>
            {
                ["cashReceived"] =
                [
                    $"Insufficient payment. The total is {totalAmount:0.00}."
                ]
            });
    }

    var sale = new Sale
    {
        TotalAmount = totalAmount,
        CashReceived = request.CashReceived,
        ChangeDue = request.CashReceived - totalAmount,
        CreatedAt = DateTimeOffset.UtcNow,
        Items = saleItems
    };

    db.Sales.Add(sale);

    // Save the sale and its items inside the transaction.
    await db.SaveChangesAsync();

    foreach (var item in sale.Items)
    {
        var product = lockedProducts[item.ProductId];
        var stockBefore = product.StockQuantity;

        product.StockQuantity -= item.Quantity;

        db.StockAdjustments.Add(new StockAdjustment
        {
            ProductId = product.Id,
            QuantityChange = -item.Quantity,
            StockBefore = stockBefore,
            StockAfter = product.StockQuantity,
            Reason = $"Sale #{sale.Id}",
            CreatedAt = DateTimeOffset.UtcNow
        });
    }

    // Persist inventory changes and adjustment history.
    await db.SaveChangesAsync();

    var response = new SaleResponse(
        sale.Id,
        sale.TotalAmount,
        sale.CashReceived,
        sale.ChangeDue,
        sale.CreatedAt,
        sale.Items.Select(item => new SaleItemResponse(
            item.Id,
            item.ProductId,
            lockedProducts[item.ProductId].Name,
            item.Quantity,
            item.UnitPrice,
            item.LineTotal
        )).ToList());

    await transaction.CommitAsync();

    return Results.Created(
        $"/api/sales/{sale.Id}",
        response);
})
.WithName("CreateSale")
.WithTags("Sales");


// SALES HISTORY

// GET /api/sales?page=1&pageSize=20
app.MapGet("/api/sales", async (
    int page,
    int pageSize,
    BeanDbContext db) =>
{
    if (page < 1)
    {
        return Results.ValidationProblem(
            new Dictionary<string, string[]>
            {
                ["page"] = ["Page must be greater than zero."]
            });
    }

    if (pageSize < 1 || pageSize > 100)
    {
        return Results.ValidationProblem(
            new Dictionary<string, string[]>
            {
                ["pageSize"] =
                [
                    "Page size must be between 1 and 100."
                ]
            });
    }

    var query = db.Sales
        .AsNoTracking();

    var totalCount = await query.CountAsync();

    var sales = await query
        .Include(sale => sale.Items)
            .ThenInclude(item => item.Product)
        .OrderByDescending(sale => sale.CreatedAt)
        .ThenByDescending(sale => sale.Id)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

    var items = sales.Select(sale =>
        new SaleResponse(
            sale.Id,
            sale.TotalAmount,
            sale.CashReceived,
            sale.ChangeDue,
            sale.CreatedAt,
            sale.Items.Select(item =>
                new SaleItemResponse(
                    item.Id,
                    item.ProductId,
                    item.Product.Name,
                    item.Quantity,
                    item.UnitPrice,
                    item.LineTotal
                )).ToList()
        )).ToList();

    return Results.Ok(new
    {
        page,
        pageSize,
        totalCount,
        totalPages = (int)Math.Ceiling(
            totalCount / (double)pageSize),
        items
    });
})
.WithName("GetSales")
.WithTags("Sales");


// GET /api/sales/{id}
app.MapGet("/api/sales/{id:int}", async (
    int id,
    BeanDbContext db) =>
{
    var sale = await db.Sales
        .AsNoTracking()
        .Include(sale => sale.Items)
            .ThenInclude(item => item.Product)
        .FirstOrDefaultAsync(sale => sale.Id == id);

    if (sale is null)
    {
        return Results.NotFound(new
        {
            message = $"Sale {id} was not found."
        });
    }

    var response = new SaleResponse(
        sale.Id,
        sale.TotalAmount,
        sale.CashReceived,
        sale.ChangeDue,
        sale.CreatedAt,
        sale.Items.Select(item =>
            new SaleItemResponse(
                item.Id,
                item.ProductId,
                item.Product.Name,
                item.Quantity,
                item.UnitPrice,
                item.LineTotal
            )).ToList()
    );

    return Results.Ok(response);
})
.WithName("GetSaleById")
.WithTags("Sales");


// ==============================
// CATEGORIES
// ==============================

// GET all categories
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

// GET category by ID
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

// CREATE category
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
                ["name"] = ["Category name must not exceed 80 characters."]
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

// UPDATE category
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
                ["name"] = ["Category name must not exceed 80 characters."]
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

// DELETE category
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
