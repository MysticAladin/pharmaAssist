using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class PriceRuleConfiguration : IEntityTypeConfiguration<PriceRule>
{
    public void Configure(EntityTypeBuilder<PriceRule> builder)
    {
        builder.ToTable("PriceRules");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.Description)
            .HasMaxLength(500);

        builder.Property(e => e.Scope)
            .IsRequired();

        builder.Property(e => e.DiscountType)
            .IsRequired();

        builder.Property(e => e.DiscountValue)
            .HasPrecision(18, 4)
            .IsRequired();

        builder.Property(e => e.MinimumQuantity)
            .HasPrecision(18, 4);

        builder.Property(e => e.MaximumQuantity)
            .HasPrecision(18, 4);

        builder.Property(e => e.Priority)
            .HasDefaultValue(0);

        builder.Property(e => e.IsActive)
            .HasDefaultValue(true);

        // Relationships
        builder.HasOne(e => e.Product)
            .WithMany()
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Category)
            .WithMany()
            .HasForeignKey(e => e.CategoryId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Manufacturer)
            .WithMany()
            .HasForeignKey(e => e.ManufacturerId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Customer)
            .WithMany()
            .HasForeignKey(e => e.CustomerId)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes
        builder.HasIndex(e => e.Scope);
        builder.HasIndex(e => e.CustomerTier);
        builder.HasIndex(e => e.IsActive);
        builder.HasIndex(e => new { e.StartDate, e.EndDate });
        builder.HasIndex(e => e.ProductId);
        builder.HasIndex(e => e.CategoryId);
        builder.HasIndex(e => e.ManufacturerId);
    }
}
