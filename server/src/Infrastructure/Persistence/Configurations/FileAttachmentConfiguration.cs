using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class FileAttachmentConfiguration : IEntityTypeConfiguration<FileAttachment>
{
    public void Configure(EntityTypeBuilder<FileAttachment> builder)
    {
        builder.ToTable("FileAttachments");

        builder.HasKey(f => f.Id);

        builder.Property(f => f.FileName)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(f => f.OriginalFileName)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(f => f.ContentType)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(f => f.FilePath)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(f => f.ThumbnailPath)
            .HasMaxLength(1000);

        builder.Property(f => f.EntityType)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(f => f.Description)
            .HasMaxLength(500);

        builder.Property(f => f.Alt)
            .HasMaxLength(255);

        builder.Property(f => f.Category)
            .HasConversion<int>();

        // Indexes
        builder.HasIndex(f => new { f.EntityType, f.EntityId })
            .HasDatabaseName("IX_FileAttachments_Entity");

        builder.HasIndex(f => f.Category)
            .HasDatabaseName("IX_FileAttachments_Category");

        builder.HasIndex(f => f.CreatedAt)
            .HasDatabaseName("IX_FileAttachments_CreatedAt");
    }
}
