using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class InventoryStockConfiguration : IEntityTypeConfiguration<InventoryStock>
{
    public void Configure(EntityTypeBuilder<InventoryStock> builder)
    {
        builder.ToTable("InventoryStocks");

        builder.HasKey(e => e.Id);

        // Ignore computed property
        builder.Ignore(e => e.QuantityAvailable);

        // Create unique index for product/batch/warehouse combination
        builder.HasIndex(e => new { e.ProductId, e.ProductBatchId, e.WarehouseId })
            .IsUnique();

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
            .WithMany(w => w.InventoryStocks)
            .HasForeignKey(e => e.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
