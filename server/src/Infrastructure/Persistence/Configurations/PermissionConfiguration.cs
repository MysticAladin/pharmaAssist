using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class PermissionConfiguration : IEntityTypeConfiguration<Permission>
{
    public void Configure(EntityTypeBuilder<Permission> builder)
    {
        builder.ToTable("Permissions");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Key)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.Description)
            .HasMaxLength(500);

        builder.Property(e => e.Category)
            .IsRequired()
            .HasMaxLength(50);

        // Unique index on Key
        builder.HasIndex(e => e.Key)
            .IsUnique();

        // Index on Category for filtering
        builder.HasIndex(e => e.Category);

        // Soft delete filter
        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
