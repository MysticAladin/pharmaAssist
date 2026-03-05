using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class WholesalerDataImportConfiguration : IEntityTypeConfiguration<WholesalerDataImport>
{
    public void Configure(EntityTypeBuilder<WholesalerDataImport> builder)
    {
        builder.ToTable("WholesalerDataImports");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.WholesalerName)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(e => e.FileName)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(e => e.Period)
            .HasMaxLength(20);

        builder.Property(e => e.Status)
            .IsRequired();

        builder.Property(e => e.ColumnMapping)
            .HasMaxLength(4000);

        builder.Property(e => e.ErrorLog)
            .HasColumnType("nvarchar(max)");

        builder.Property(e => e.Notes)
            .HasMaxLength(2000);

        builder.Property(e => e.CreatedBy).HasMaxLength(450);
        builder.Property(e => e.UpdatedBy).HasMaxLength(450);

        builder.HasOne(e => e.Wholesaler)
            .WithMany()
            .HasForeignKey(e => e.WholesalerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.SalesRecords)
            .WithOne(e => e.Import)
            .HasForeignKey(e => e.ImportId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(e => e.StockRecords)
            .WithOne(e => e.Import)
            .HasForeignKey(e => e.ImportId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(e => e.WholesalerId);
        builder.HasIndex(e => e.Status);
        builder.HasIndex(e => e.ImportDate);
        builder.HasIndex(e => e.Period);
    }
}
