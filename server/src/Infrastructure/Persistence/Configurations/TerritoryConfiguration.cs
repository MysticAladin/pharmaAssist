using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class TerritoryConfiguration : IEntityTypeConfiguration<Territory>
{
    public void Configure(EntityTypeBuilder<Territory> builder)
    {
        builder.ToTable("Territories");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.NameLocal)
            .HasMaxLength(200);

        builder.Property(e => e.Type)
            .IsRequired();

        builder.Property(e => e.CantonIds)
            .HasMaxLength(500);

        builder.Property(e => e.MunicipalityIds)
            .HasMaxLength(2000);

        builder.Property(e => e.Description)
            .HasMaxLength(1000);

        builder.Property(e => e.CreatedBy)
            .HasMaxLength(450);

        builder.Property(e => e.UpdatedBy)
            .HasMaxLength(450);

        // Self-referencing hierarchy
        builder.HasOne(e => e.ParentTerritory)
            .WithMany(e => e.ChildTerritories)
            .HasForeignKey(e => e.ParentTerritoryId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(e => e.Name);
        builder.HasIndex(e => e.Type);
        builder.HasIndex(e => e.ParentTerritoryId);

        // Soft-delete filter
        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
