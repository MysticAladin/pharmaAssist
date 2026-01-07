using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class ExecutedVisitConfiguration : IEntityTypeConfiguration<ExecutedVisit>
{
    public void Configure(EntityTypeBuilder<ExecutedVisit> builder)
    {
        builder.ToTable("ExecutedVisits");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.RepId)
            .IsRequired();

        builder.Property(e => e.CustomerId)
            .IsRequired();

        builder.Property(e => e.CheckInTime)
            .IsRequired();

        // GPS coordinates with precision for lat/long
        builder.Property(e => e.CheckInLatitude)
            .HasPrecision(9, 6);

        builder.Property(e => e.CheckInLongitude)
            .HasPrecision(9, 6);

        builder.Property(e => e.CheckOutLatitude)
            .HasPrecision(9, 6);

        builder.Property(e => e.CheckOutLongitude)
            .HasPrecision(9, 6);

        builder.Property(e => e.CheckInAddress)
            .HasMaxLength(500);

        builder.Property(e => e.Summary)
            .HasMaxLength(2000);

        builder.Property(e => e.ProductsDiscussed)
            .HasMaxLength(2000);

        // Indexes for reporting
        builder.HasIndex(e => new { e.RepId, e.CheckInTime });
        builder.HasIndex(e => new { e.CustomerId, e.CheckInTime });

        // FK to PlannedVisit (nullable for ad-hoc visits)
        builder.HasOne(e => e.PlannedVisit)
            .WithOne(pv => pv.ExecutedVisit)
            .HasForeignKey<ExecutedVisit>(e => e.PlannedVisitId)
            .OnDelete(DeleteBehavior.SetNull);

        // FK to SalesRepresentative
        builder.HasOne(e => e.Rep)
            .WithMany(sr => sr.ExecutedVisits)
            .HasForeignKey(e => e.RepId)
            .OnDelete(DeleteBehavior.Restrict);

        // FK to Customer
        builder.HasOne(e => e.Customer)
            .WithMany()
            .HasForeignKey(e => e.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        // Global query filter for soft delete
        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
