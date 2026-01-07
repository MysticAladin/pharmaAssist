using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class VisitAttachmentConfiguration : IEntityTypeConfiguration<VisitAttachment>
{
    public void Configure(EntityTypeBuilder<VisitAttachment> builder)
    {
        builder.ToTable("VisitAttachments");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.VisitId)
            .IsRequired();

        builder.Property(e => e.FileName)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(e => e.FileType)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(e => e.FilePath)
            .HasMaxLength(500)
            .IsRequired();

        // FK to ExecutedVisit
        builder.HasOne(e => e.Visit)
            .WithMany(ev => ev.Attachments)
            .HasForeignKey(e => e.VisitId)
            .OnDelete(DeleteBehavior.Cascade);

        // Global query filter for soft delete
        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
