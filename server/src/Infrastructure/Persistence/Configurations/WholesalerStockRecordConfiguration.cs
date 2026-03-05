using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class WholesalerStockRecordConfiguration : IEntityTypeConfiguration<WholesalerStockRecord>
{
    public void Configure(EntityTypeBuilder<WholesalerStockRecord> builder)
    {
        builder.ToTable("WholesalerStockRecords");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.ProductCode)
            .HasMaxLength(100);

        builder.Property(e => e.ProductName)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(e => e.Quantity)
            .HasColumnType("decimal(18,4)");

        builder.Property(e => e.CreatedBy).HasMaxLength(450);
        builder.Property(e => e.UpdatedBy).HasMaxLength(450);

        builder.HasOne(e => e.Wholesaler)
            .WithMany()
            .HasForeignKey(e => e.WholesalerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Product)
            .WithMany()
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(e => e.WholesalerId);
        builder.HasIndex(e => e.ProductId);
        builder.HasIndex(e => e.ReportDate);
        builder.HasIndex(e => new { e.WholesalerId, e.ProductId, e.ReportDate }).IsUnique();
    }
}
