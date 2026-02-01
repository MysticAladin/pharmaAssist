using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class RepManagerAssignmentConfiguration : IEntityTypeConfiguration<RepManagerAssignment>
{
    public void Configure(EntityTypeBuilder<RepManagerAssignment> builder)
    {
        builder.ToTable("RepManagerAssignments");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.RepId)
            .IsRequired();

        builder.Property(e => e.ManagerUserId)
            .HasMaxLength(450)
            .IsRequired();

        // Unique constraint on rep-manager user pair
        builder.HasIndex(e => new { e.RepId, e.ManagerUserId })
            .IsUnique();

        // FK to SalesRepresentative (the rep being managed)
        builder.HasOne(e => e.Rep)
            .WithMany(sr => sr.ManagerAssignments)
            .HasForeignKey(e => e.RepId)
            .OnDelete(DeleteBehavior.Restrict);

        // FK to ApplicationUser (the manager user)
        builder.HasOne(e => e.ManagerUser)
            .WithMany()
            .HasForeignKey(e => e.ManagerUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Global query filter for soft delete
        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
