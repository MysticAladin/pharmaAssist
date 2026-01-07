using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class VisitNoteConfiguration : IEntityTypeConfiguration<VisitNote>
{
    public void Configure(EntityTypeBuilder<VisitNote> builder)
    {
        builder.ToTable("VisitNotes");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.VisitId)
            .IsRequired();

        builder.Property(e => e.NoteType)
            .IsRequired();

        builder.Property(e => e.NoteText)
            .HasMaxLength(4000)
            .IsRequired();

        // FK to ExecutedVisit
        builder.HasOne(e => e.Visit)
            .WithMany(ev => ev.Notes)
            .HasForeignKey(e => e.VisitId)
            .OnDelete(DeleteBehavior.Cascade);

        // Global query filter for soft delete
        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
