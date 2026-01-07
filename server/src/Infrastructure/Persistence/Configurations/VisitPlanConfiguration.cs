using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class VisitPlanConfiguration : IEntityTypeConfiguration<VisitPlan>
{
    public void Configure(EntityTypeBuilder<VisitPlan> builder)
    {
        builder.ToTable("VisitPlans");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.RepId)
            .IsRequired();

        builder.Property(e => e.PlanWeek)
            .IsRequired();

        builder.Property(e => e.Status)
            .IsRequired();

        builder.Property(e => e.ApprovedBy)
            .HasMaxLength(450);

        builder.Property(e => e.RejectionReason)
            .HasMaxLength(500);

        // Index for quick lookup by rep and week
        builder.HasIndex(e => new { e.RepId, e.PlanWeek });

        // FK to SalesRepresentative
        builder.HasOne(e => e.Rep)
            .WithMany(sr => sr.VisitPlans)
            .HasForeignKey(e => e.RepId)
            .OnDelete(DeleteBehavior.Restrict);

        // Global query filter for soft delete
        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
