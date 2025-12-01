using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class MunicipalityConfiguration : IEntityTypeConfiguration<Municipality>
{
    public void Configure(EntityTypeBuilder<Municipality> builder)
    {
        builder.ToTable("Municipalities");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Code)
            .HasMaxLength(10)
            .IsRequired();

        builder.Property(e => e.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(e => e.NameLocal)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(e => e.PostalCode)
            .HasMaxLength(10);

        builder.HasIndex(e => e.Code)
            .IsUnique();

        builder.HasOne(e => e.Canton)
            .WithMany(c => c.Municipalities)
            .HasForeignKey(e => e.CantonId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.Cities)
            .WithOne(c => c.Municipality)
            .HasForeignKey(c => c.MunicipalityId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
