using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class TerritoryAssignmentConfiguration : IEntityTypeConfiguration<TerritoryAssignment>
{
    public void Configure(EntityTypeBuilder<TerritoryAssignment> builder)
    {
        builder.ToTable("TerritoryAssignments");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.StartDate)
            .IsRequired();

        builder.Property(e => e.AssignmentType)
            .IsRequired();

        builder.Property(e => e.Notes)
            .HasMaxLength(500);

        builder.Property(e => e.CreatedBy)
            .HasMaxLength(450);

        builder.Property(e => e.UpdatedBy)
            .HasMaxLength(450);

        // Relationships
        builder.HasOne(e => e.Territory)
            .WithMany(t => t.Assignments)
            .HasForeignKey(e => e.TerritoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Rep)
            .WithMany()
            .HasForeignKey(e => e.RepId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(e => e.TerritoryId);
        builder.HasIndex(e => e.RepId);
        builder.HasIndex(e => new { e.TerritoryId, e.RepId, e.StartDate });

        // Soft-delete filter
        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
