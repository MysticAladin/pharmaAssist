using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.SKU)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(e => e.Name)
            .HasMaxLength(300)
            .IsRequired();

        builder.Property(e => e.NameLocal)
            .HasMaxLength(300)
            .IsRequired();

        builder.Property(e => e.GenericName)
            .HasMaxLength(300);

        builder.Property(e => e.Description)
            .HasMaxLength(2000);

        builder.Property(e => e.DescriptionLocal)
            .HasMaxLength(2000);

        builder.Property(e => e.Barcode)
            .HasMaxLength(50);

        builder.Property(e => e.ATCCode)
            .HasMaxLength(20);

        builder.Property(e => e.Strength)
            .HasMaxLength(50);

        builder.Property(e => e.DosageForm)
            .HasMaxLength(100);

        builder.Property(e => e.PackageSize)
            .HasMaxLength(100);

        builder.Property(e => e.ImageUrl)
            .HasMaxLength(500);

        // Decimal precision for prices
        builder.Property(e => e.UnitPrice)
            .HasPrecision(18, 4);

        builder.Property(e => e.CostPrice)
            .HasPrecision(18, 4);

        builder.Property(e => e.TaxRate)
            .HasPrecision(5, 2);

        // Indexes
        builder.HasIndex(e => e.SKU)
            .IsUnique();

        builder.HasIndex(e => e.Barcode);

        builder.HasIndex(e => e.ATCCode);

        // Relationships
        builder.HasOne(e => e.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(e => e.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Manufacturer)
            .WithMany(m => m.Products)
            .HasForeignKey(e => e.ManufacturerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.Batches)
            .WithOne(b => b.Product)
            .HasForeignKey(b => b.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(e => e.OrderItems)
            .WithOne(o => o.Product)
            .HasForeignKey(o => o.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
