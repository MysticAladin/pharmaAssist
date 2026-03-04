using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class BrandConfiguration : IEntityTypeConfiguration<Brand>
{
    public void Configure(EntityTypeBuilder<Brand> builder)
    {
        builder.ToTable("Brands");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Name).HasMaxLength(200).IsRequired();
        builder.Property(e => e.NameLocal).HasMaxLength(200);
        builder.Property(e => e.Description).HasMaxLength(2000);
        builder.Property(e => e.DescriptionLocal).HasMaxLength(2000);
        builder.Property(e => e.LogoPath).HasMaxLength(500);
        builder.Property(e => e.TherapeuticArea).HasMaxLength(200);

        builder.HasIndex(e => e.Name);
        builder.HasIndex(e => e.ManufacturerId);

        builder.HasOne(e => e.Manufacturer)
            .WithMany(m => m.Brands)
            .HasForeignKey(e => e.ManufacturerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.Products)
            .WithOne(p => p.Brand)
            .HasForeignKey(p => p.BrandId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
