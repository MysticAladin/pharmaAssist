using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class BrandGroupConfiguration : IEntityTypeConfiguration<BrandGroup>
{
    public void Configure(EntityTypeBuilder<BrandGroup> builder)
    {
        builder.ToTable("BrandGroups");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Name).HasMaxLength(200).IsRequired();
        builder.Property(e => e.NameLocal).HasMaxLength(200);
        builder.Property(e => e.Description).HasMaxLength(2000);

        builder.HasIndex(e => e.Name);

        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
