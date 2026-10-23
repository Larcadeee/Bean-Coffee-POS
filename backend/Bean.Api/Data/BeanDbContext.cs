
using Bean.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Bean.Api.Data;

public class BeanDbContext : DbContext
{
    public BeanDbContext(
        DbContextOptions<BeanDbContext> options)
        : base(options)
    {
    }

    public DbSet<Product> Products => Set<Product>();

    public DbSet<Category> Categories => Set<Category>();

    public DbSet<StockAdjustment> StockAdjustments
        => Set<StockAdjustment>();

    public DbSet<Sale> Sales => Set<Sale>();

    public DbSet<SaleItem> SaleItems => Set<SaleItem>();

    protected override void OnModelCreating(
        ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("Products");
            entity.HasKey(product => product.Id);

            entity.Property(product => product.Name)
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(product => product.Price)
                .HasPrecision(10, 2)
                .IsRequired();

            entity.Property(product => product.IsAvailable)
                .HasDefaultValue(true);

            entity.Property(product => product.StockQuantity)
                .HasDefaultValue(0)
                .IsRequired();

            entity.Property(product => product.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .IsRequired();

            entity.HasOne(product => product.Category)
                .WithMany(category => category.Products)
                .HasForeignKey(product => product.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.ToTable("Categories");
            entity.HasKey(category => category.Id);

            entity.Property(category => category.Name)
                .HasMaxLength(80)
                .IsRequired();

            entity.Property(category => category.Description)
                .HasMaxLength(300);

            entity.Property(category => category.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .IsRequired();

            entity.HasIndex(category => category.Name)
                .IsUnique();
        });

        modelBuilder.Entity<StockAdjustment>(entity =>
        {
            entity.ToTable("StockAdjustments");
            entity.HasKey(adjustment => adjustment.Id);

            entity.Property(adjustment => adjustment.QuantityChange)
                .IsRequired();

            entity.Property(adjustment => adjustment.StockBefore)
                .IsRequired();

            entity.Property(adjustment => adjustment.StockAfter)
                .IsRequired();

            entity.Property(adjustment => adjustment.Reason)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(adjustment => adjustment.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .IsRequired();

            entity.HasOne(adjustment => adjustment.Product)
                .WithMany()
                .HasForeignKey(adjustment => adjustment.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(adjustment => new
                {
                    adjustment.ProductId,
                    adjustment.CreatedAt
                })
                .HasDatabaseName(
                    "IX_StockAdjustments_ProductId_CreatedAt");
        });

        modelBuilder.Entity<Sale>(entity =>
        {
            entity.ToTable("Sales");
            entity.HasKey(sale => sale.Id);

            entity.Property(sale => sale.TotalAmount)
                .HasPrecision(10, 2)
                .IsRequired();

            entity.Property(sale => sale.CashReceived)
                .HasPrecision(10, 2)
                .IsRequired();

            entity.Property(sale => sale.ChangeDue)
                .HasPrecision(10, 2)
                .IsRequired();

            entity.Property(sale => sale.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .IsRequired();

            entity.HasMany(sale => sale.Items)
                .WithOne(item => item.Sale)
                .HasForeignKey(item => item.SaleId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(sale => sale.CreatedAt)
                .HasDatabaseName("IX_Sales_CreatedAt");
        });

        modelBuilder.Entity<SaleItem>(entity =>
        {
            entity.ToTable("SaleItems");
            entity.HasKey(item => item.Id);

            entity.Property(item => item.Quantity)
                .IsRequired();

            entity.Property(item => item.UnitPrice)
                .HasPrecision(10, 2)
                .IsRequired();

            entity.Property(item => item.LineTotal)
                .HasPrecision(10, 2)
                .IsRequired();

            entity.HasOne(item => item.Product)
                .WithMany()
                .HasForeignKey(item => item.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(item => item.SaleId)
                .HasDatabaseName("IX_SaleItems_SaleId");
        });
    }
}
