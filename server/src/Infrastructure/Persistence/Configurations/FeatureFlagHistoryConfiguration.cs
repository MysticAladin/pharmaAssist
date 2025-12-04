using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class FeatureFlagHistoryConfiguration : IEntityTypeConfiguration<FeatureFlagHistory>
{
    public void Configure(EntityTypeBuilder<FeatureFlagHistory> builder)
    {
        builder.ToTable("FeatureFlagHistory");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.ChangeType)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(e => e.OldValue)
            .HasMaxLength(4000);

        builder.Property(e => e.NewValue)
            .HasMaxLength(4000);

        builder.Property(e => e.ChangedBy)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(e => e.Notes)
            .HasMaxLength(1000);

        builder.Property(e => e.CreatedBy)
            .HasMaxLength(256);

        builder.Property(e => e.UpdatedBy)
            .HasMaxLength(256);

        // Index for efficient querying by system flag
        builder.HasIndex(e => e.SystemFlagId);

        // Index for efficient querying by change date
        builder.HasIndex(e => e.ChangedAt);

        builder.HasOne(e => e.SystemFlag)
            .WithMany()
            .HasForeignKey(e => e.SystemFlagId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(e => e.ClientFlag)
            .WithMany()
            .HasForeignKey(e => e.ClientFlagId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(e => e.Customer)
            .WithMany()
            .HasForeignKey(e => e.CustomerId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
