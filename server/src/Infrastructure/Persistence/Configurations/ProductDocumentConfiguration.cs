using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class ProductDocumentConfiguration : IEntityTypeConfiguration<ProductDocument>
{
    public void Configure(EntityTypeBuilder<ProductDocument> builder)
    {
        builder.ToTable("ProductDocuments");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.FileName).HasMaxLength(300).IsRequired();
        builder.Property(e => e.FilePath).HasMaxLength(500).IsRequired();
        builder.Property(e => e.FileType).HasMaxLength(100);
        builder.Property(e => e.Version).HasMaxLength(50);
        builder.Property(e => e.UploadedBy).HasMaxLength(256);
        builder.Property(e => e.Notes).HasMaxLength(2000);

        builder.HasIndex(e => new { e.ProductId, e.DocumentType });
        builder.HasIndex(e => new { e.ProductId, e.IsCurrentVersion });

        builder.HasOne(e => e.Product)
            .WithMany(p => p.Documents)
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
