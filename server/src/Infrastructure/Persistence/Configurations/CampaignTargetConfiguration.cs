using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class CampaignTargetConfiguration : IEntityTypeConfiguration<CampaignTarget>
{
    public void Configure(EntityTypeBuilder<CampaignTarget> builder)
    {
        builder.ToTable("CampaignTargets");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.CampaignId)
            .IsRequired();

        builder.Property(e => e.CustomerId)
            .IsRequired();

        builder.Property(e => e.Status)
            .IsRequired();

        builder.Property(e => e.Notes)
            .HasMaxLength(1000);

        builder.Property(e => e.CreatedBy)
            .HasMaxLength(450);

        builder.Property(e => e.UpdatedBy)
            .HasMaxLength(450);

        // Relationships
        builder.HasOne(e => e.Campaign)
            .WithMany(c => c.Targets)
            .HasForeignKey(e => e.CampaignId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Customer)
            .WithMany()
            .HasForeignKey(e => e.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Rep)
            .WithMany()
            .HasForeignKey(e => e.RepId)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes
        builder.HasIndex(e => new { e.CampaignId, e.CustomerId }).IsUnique();
        builder.HasIndex(e => e.RepId);
        builder.HasIndex(e => e.Status);

        // Soft-delete filter
        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
