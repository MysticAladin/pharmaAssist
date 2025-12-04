using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class ClientFeatureFlagConfiguration : IEntityTypeConfiguration<ClientFeatureFlag>
{
    public void Configure(EntityTypeBuilder<ClientFeatureFlag> builder)
    {
        builder.ToTable("ClientFeatureFlags");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Value)
            .HasMaxLength(4000)
            .IsRequired();

        builder.Property(e => e.Reason)
            .HasMaxLength(500);

        builder.Property(e => e.CreatedBy)
            .HasMaxLength(256);

        builder.Property(e => e.UpdatedBy)
            .HasMaxLength(256);

        // Unique constraint on CustomerId + SystemFlagId (excluding soft deleted)
        builder.HasIndex(e => new { e.CustomerId, e.SystemFlagId })
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");

        builder.HasOne(e => e.Customer)
            .WithMany()
            .HasForeignKey(e => e.CustomerId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(e => e.SystemFlag)
            .WithMany(s => s.ClientOverrides)
            .HasForeignKey(e => e.SystemFlagId)
            .OnDelete(DeleteBehavior.NoAction);

        // Default query filter for soft delete
        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
