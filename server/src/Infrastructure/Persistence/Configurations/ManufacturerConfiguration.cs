using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class ManufacturerConfiguration : IEntityTypeConfiguration<Manufacturer>
{
    public void Configure(EntityTypeBuilder<Manufacturer> builder)
    {
        builder.ToTable("Manufacturers");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(e => e.Description)
            .HasMaxLength(500);

        builder.Property(e => e.Country)
            .HasMaxLength(100);

        builder.Property(e => e.City)
            .HasMaxLength(100);

        builder.Property(e => e.Address)
            .HasMaxLength(300);

        builder.Property(e => e.ContactEmail)
            .HasMaxLength(200);

        builder.Property(e => e.ContactPhone)
            .HasMaxLength(50);

        builder.Property(e => e.Website)
            .HasMaxLength(300);

        builder.Property(e => e.LogoUrl)
            .HasMaxLength(500);

        builder.HasMany(e => e.Products)
            .WithOne(p => p.Manufacturer)
            .HasForeignKey(p => p.ManufacturerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
