using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.ToTable("OrderItems");

        builder.HasKey(e => e.Id);

        // Decimal precision for monetary values
        builder.Property(e => e.UnitPrice)
            .HasPrecision(18, 4);

        builder.Property(e => e.DiscountPercent)
            .HasPrecision(5, 2);

        builder.Property(e => e.TaxRate)
            .HasPrecision(5, 2);

        builder.Property(e => e.LineTotal)
            .HasPrecision(18, 2);

        // Relationships
        builder.HasOne(e => e.Order)
            .WithMany(o => o.OrderItems)
            .HasForeignKey(e => e.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Product)
            .WithMany(p => p.OrderItems)
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.ProductBatch)
            .WithMany()
            .HasForeignKey(e => e.ProductBatchId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Prescription)
            .WithMany(p => p.OrderItems)
            .HasForeignKey(e => e.PrescriptionId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
