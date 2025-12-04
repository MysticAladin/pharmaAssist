using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class SystemFeatureFlagConfiguration : IEntityTypeConfiguration<SystemFeatureFlag>
{
    public void Configure(EntityTypeBuilder<SystemFeatureFlag> builder)
    {
        builder.ToTable("SystemFeatureFlags");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Key)
            .HasMaxLength(100)
            .IsRequired();

        builder.HasIndex(e => e.Key)
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");

        builder.Property(e => e.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(e => e.Description)
            .HasMaxLength(1000);

        builder.Property(e => e.Category)
            .IsRequired();

        builder.Property(e => e.Type)
            .IsRequired();

        builder.Property(e => e.Value)
            .HasMaxLength(4000)
            .IsRequired();

        builder.Property(e => e.DefaultValue)
            .HasMaxLength(4000)
            .IsRequired();

        builder.Property(e => e.Environment)
            .HasMaxLength(50);

        builder.Property(e => e.CreatedBy)
            .HasMaxLength(256);

        builder.Property(e => e.UpdatedBy)
            .HasMaxLength(256);

        builder.HasMany(e => e.ClientOverrides)
            .WithOne(c => c.SystemFlag)
            .HasForeignKey(c => c.SystemFlagId)
            .OnDelete(DeleteBehavior.Cascade);

        // Default query filter for soft delete
        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
