using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class PriceListItemConfiguration : IEntityTypeConfiguration<PriceListItem>
{
    public void Configure(EntityTypeBuilder<PriceListItem> builder)
    {
        builder.ToTable("PriceListItems");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Price)
            .HasColumnType("decimal(18,4)")
            .IsRequired();

        builder.Property(e => e.DiscountPercent)
            .HasColumnType("decimal(5,2)");

        builder.Property(e => e.Notes)
            .HasMaxLength(1000);

        builder.Property(e => e.CreatedBy).HasMaxLength(450);
        builder.Property(e => e.UpdatedBy).HasMaxLength(450);

        builder.HasOne(e => e.Product)
            .WithMany()
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.PriceListId);
        builder.HasIndex(e => e.ProductId);
        builder.HasIndex(e => new { e.PriceListId, e.ProductId }).IsUnique();
    }
}
