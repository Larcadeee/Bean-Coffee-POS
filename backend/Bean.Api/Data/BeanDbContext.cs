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
    }
}