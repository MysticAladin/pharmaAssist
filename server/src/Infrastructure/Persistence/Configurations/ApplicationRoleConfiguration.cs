using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class ApplicationRoleConfiguration : IEntityTypeConfiguration<ApplicationRole>
{
    public void Configure(EntityTypeBuilder<ApplicationRole> builder)
    {
        builder.Property(e => e.Description)
            .HasMaxLength(500);

        // Index on IsSystemRole for filtering
        builder.HasIndex(e => e.IsSystemRole);

        // Index on SortOrder for ordering
        builder.HasIndex(e => e.SortOrder);
    }
}
