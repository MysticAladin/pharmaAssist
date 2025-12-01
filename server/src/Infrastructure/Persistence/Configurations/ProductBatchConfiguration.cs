using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class ProductBatchConfiguration : IEntityTypeConfiguration<ProductBatch>
{
    public void Configure(EntityTypeBuilder<ProductBatch> builder)
    {
        builder.ToTable("ProductBatches");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.BatchNumber)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(e => e.CostPrice)
            .HasPrecision(18, 4);

        builder.HasIndex(e => new { e.ProductId, e.BatchNumber })
            .IsUnique();

        builder.HasOne(e => e.Product)
            .WithMany(p => p.Batches)
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
