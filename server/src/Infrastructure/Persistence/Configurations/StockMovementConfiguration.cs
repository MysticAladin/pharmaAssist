using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class StockMovementConfiguration : IEntityTypeConfiguration<StockMovement>
{
    public void Configure(EntityTypeBuilder<StockMovement> builder)
    {
        builder.ToTable("StockMovements");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.ReferenceNumber)
            .HasMaxLength(100);

        builder.Property(e => e.Reason)
            .HasMaxLength(200);

        builder.Property(e => e.Notes)
            .HasMaxLength(1000);

        // Indexes
        builder.HasIndex(e => e.MovementDate);
        builder.HasIndex(e => e.MovementType);

        // Relationships
        builder.HasOne(e => e.Product)
            .WithMany()
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.ProductBatch)
            .WithMany()
            .HasForeignKey(e => e.ProductBatchId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Warehouse)
            .WithMany(w => w.StockMovements)
            .HasForeignKey(e => e.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Order)
            .WithMany()
            .HasForeignKey(e => e.OrderId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.PerformedByUser)
            .WithMany()
            .HasForeignKey(e => e.PerformedByUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
