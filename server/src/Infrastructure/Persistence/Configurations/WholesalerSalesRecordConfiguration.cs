using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class WholesalerSalesRecordConfiguration : IEntityTypeConfiguration<WholesalerSalesRecord>
{
    public void Configure(EntityTypeBuilder<WholesalerSalesRecord> builder)
    {
        builder.ToTable("WholesalerSalesRecords");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.ProductCode)
            .HasMaxLength(100);

        builder.Property(e => e.ProductName)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(e => e.CustomerCode)
            .HasMaxLength(100);

        builder.Property(e => e.CustomerName)
            .HasMaxLength(500);

        builder.Property(e => e.Quantity)
            .HasColumnType("decimal(18,4)");

        builder.Property(e => e.UnitPrice)
            .HasColumnType("decimal(18,4)");

        builder.Property(e => e.TotalAmount)
            .HasColumnType("decimal(18,4)");

        builder.Property(e => e.InvoiceNumber)
            .HasMaxLength(100);

        builder.Property(e => e.CreatedBy).HasMaxLength(450);
        builder.Property(e => e.UpdatedBy).HasMaxLength(450);

        builder.HasOne(e => e.Product)
            .WithMany()
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Customer)
            .WithMany()
            .HasForeignKey(e => e.CustomerId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(e => e.ImportId);
        builder.HasIndex(e => e.ProductId);
        builder.HasIndex(e => e.CustomerId);
        builder.HasIndex(e => e.InvoiceDate);
        builder.HasIndex(e => e.ProductCode);
        builder.HasIndex(e => e.CustomerCode);
    }
}
