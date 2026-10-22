
using Bean.Api.Data;
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

app.Run();
