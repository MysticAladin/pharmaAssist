using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class ProductPriceConfiguration : IEntityTypeConfiguration<ProductPrice>
{
    public void Configure(EntityTypeBuilder<ProductPrice> builder)
    {
        builder.ToTable("ProductPrices");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.UnitPrice)
            .HasPrecision(18, 4);

        builder.Property(e => e.ValidFrom)
            .IsRequired();

        builder.Property(e => e.PriceType)
            .IsRequired();

        builder.Property(e => e.IsActive)
            .HasDefaultValue(true);

        builder.Property(e => e.Priority)
            .HasDefaultValue(0);

        builder.HasIndex(e => new { e.ProductId, e.CustomerId, e.CantonId, e.PriceType, e.ValidFrom, e.ValidTo });
        builder.HasIndex(e => new { e.CustomerId, e.IsActive });
        builder.HasIndex(e => new { e.CantonId, e.IsActive });

        builder.HasOne(e => e.Product)
            .WithMany()
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Canton)
            .WithMany()
            .HasForeignKey(e => e.CantonId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Customer)
            .WithMany()
            .HasForeignKey(e => e.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
