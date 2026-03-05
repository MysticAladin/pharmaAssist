using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class CycleTargetConfiguration : IEntityTypeConfiguration<CycleTarget>
{
    public void Configure(EntityTypeBuilder<CycleTarget> builder)
    {
        builder.ToTable("CycleTargets");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.CycleId)
            .IsRequired();

        builder.Property(e => e.CustomerId)
            .IsRequired();

        builder.Property(e => e.RepId)
            .IsRequired();

        builder.Property(e => e.RequiredVisits)
            .IsRequired();

        builder.Property(e => e.TargetProducts)
            .HasMaxLength(2000);

        builder.Property(e => e.Notes)
            .HasMaxLength(1000);

        builder.Property(e => e.CreatedBy)
            .HasMaxLength(450);

        builder.Property(e => e.UpdatedBy)
            .HasMaxLength(450);

        // Relationships
        builder.HasOne(e => e.Cycle)
            .WithMany(c => c.Targets)
            .HasForeignKey(e => e.CycleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Customer)
            .WithMany()
            .HasForeignKey(e => e.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Rep)
            .WithMany()
            .HasForeignKey(e => e.RepId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(e => new { e.CycleId, e.CustomerId, e.RepId }).IsUnique();
        builder.HasIndex(e => e.RepId);
        builder.HasIndex(e => e.CustomerId);

        // Soft-delete filter
        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
