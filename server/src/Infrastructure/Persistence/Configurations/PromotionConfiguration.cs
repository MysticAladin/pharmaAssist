using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class PromotionConfiguration : IEntityTypeConfiguration<Promotion>
{
    public void Configure(EntityTypeBuilder<Promotion> builder)
    {
        builder.ToTable("Promotions");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.Description)
            .HasMaxLength(1000);

        builder.Property(e => e.TermsAndConditions)
            .HasMaxLength(2000);

        builder.Property(e => e.Type)
            .IsRequired();

        builder.Property(e => e.Value)
            .HasPrecision(18, 4)
            .IsRequired();

        builder.Property(e => e.MinimumOrderAmount)
            .HasPrecision(18, 2);

        builder.Property(e => e.MaximumDiscountAmount)
            .HasPrecision(18, 2);

        builder.Property(e => e.IsActive)
            .HasDefaultValue(true);

        builder.Property(e => e.RequiresCode)
            .HasDefaultValue(true);

        builder.Property(e => e.CanStackWithOtherPromotions)
            .HasDefaultValue(false);

        builder.Property(e => e.CanStackWithTierPricing)
            .HasDefaultValue(true);

        builder.Property(e => e.CurrentUsageCount)
            .HasDefaultValue(0);

        // Unique code constraint
        builder.HasIndex(e => e.Code).IsUnique();
        
        // Other indexes
        builder.HasIndex(e => e.IsActive);
        builder.HasIndex(e => new { e.StartDate, e.EndDate });
        builder.HasIndex(e => e.RequiredCustomerTier);
    }
}

public class PromotionProductConfiguration : IEntityTypeConfiguration<PromotionProduct>
{
    public void Configure(EntityTypeBuilder<PromotionProduct> builder)
    {
        builder.ToTable("PromotionProducts");

        builder.HasKey(e => e.Id);

        builder.HasOne(e => e.Promotion)
            .WithMany(p => p.ApplicableProducts)
            .HasForeignKey(e => e.PromotionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Product)
            .WithMany()
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => new { e.PromotionId, e.ProductId }).IsUnique();
    }
}

public class PromotionCategoryConfiguration : IEntityTypeConfiguration<PromotionCategory>
{
    public void Configure(EntityTypeBuilder<PromotionCategory> builder)
    {
        builder.ToTable("PromotionCategories");

        builder.HasKey(e => e.Id);

        builder.HasOne(e => e.Promotion)
            .WithMany(p => p.ApplicableCategories)
            .HasForeignKey(e => e.PromotionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Category)
            .WithMany()
            .HasForeignKey(e => e.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => new { e.PromotionId, e.CategoryId }).IsUnique();
    }
}

public class PromotionUsageConfiguration : IEntityTypeConfiguration<PromotionUsage>
{
    public void Configure(EntityTypeBuilder<PromotionUsage> builder)
    {
        builder.ToTable("PromotionUsages");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.DiscountApplied)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.HasOne(e => e.Promotion)
            .WithMany(p => p.Usages)
            .HasForeignKey(e => e.PromotionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Customer)
            .WithMany()
            .HasForeignKey(e => e.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Order)
            .WithMany()
            .HasForeignKey(e => e.OrderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(e => new { e.PromotionId, e.CustomerId });
        builder.HasIndex(e => e.UsedAt);
    }
}
