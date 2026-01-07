using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class PlannedVisitConfiguration : IEntityTypeConfiguration<PlannedVisit>
{
    public void Configure(EntityTypeBuilder<PlannedVisit> builder)
    {
        builder.ToTable("PlannedVisits");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.PlanId)
            .IsRequired();

        builder.Property(e => e.CustomerId)
            .IsRequired();

        builder.Property(e => e.PlannedDate)
            .IsRequired();

        builder.Property(e => e.VisitObjective)
            .HasMaxLength(500);

        builder.Property(e => e.ProductsToPresent)
            .HasMaxLength(2000);

        builder.Property(e => e.Notes)
            .HasMaxLength(1000);

        // Index for quick lookup
        builder.HasIndex(e => new { e.PlanId, e.PlannedDate });

        // FK to VisitPlan
        builder.HasOne(e => e.Plan)
            .WithMany(vp => vp.PlannedVisits)
            .HasForeignKey(e => e.PlanId)
            .OnDelete(DeleteBehavior.Cascade);

        // FK to Customer
        builder.HasOne(e => e.Customer)
            .WithMany()
            .HasForeignKey(e => e.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        // Global query filter for soft delete
        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
