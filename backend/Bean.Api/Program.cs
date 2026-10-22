
var builder = WebApplication.CreateBuilder(args);

// Register API documentation services.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Enable Swagger in the local development environment.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Basic endpoint to verify that the API is running.
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

// Root endpoint.
app.MapGet("/", () =>
{
    return Results.Ok(new
    {
        message = "Welcome to Bean Coffee POS API",
        documentation = "/swagger",
        health = "/api/health"
    });
});

app.Run();
