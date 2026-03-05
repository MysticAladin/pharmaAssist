using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class CampaignConfiguration : IEntityTypeConfiguration<Campaign>
{
    public void Configure(EntityTypeBuilder<Campaign> builder)
    {
        builder.ToTable("Campaigns");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.NameLocal)
            .HasMaxLength(200);

        builder.Property(e => e.Type)
            .IsRequired();

        builder.Property(e => e.StartDate)
            .IsRequired();

        builder.Property(e => e.EndDate)
            .IsRequired();

        builder.Property(e => e.PlannedBudget)
            .HasPrecision(18, 4);

        builder.Property(e => e.ActualSpent)
            .HasPrecision(18, 4);

        builder.Property(e => e.Status)
            .IsRequired();

        builder.Property(e => e.TargetingCriteria)
            .HasMaxLength(4000);

        builder.Property(e => e.Description)
            .HasMaxLength(2000);

        builder.Property(e => e.CreatedBy)
            .HasMaxLength(450);

        builder.Property(e => e.UpdatedBy)
            .HasMaxLength(450);

        // Relationships
        builder.HasOne(e => e.Cycle)
            .WithMany(c => c.Campaigns)
            .HasForeignKey(e => e.CycleId)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes
        builder.HasIndex(e => e.Status);
        builder.HasIndex(e => e.CycleId);
        builder.HasIndex(e => new { e.StartDate, e.EndDate });

        // Soft-delete filter
        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
