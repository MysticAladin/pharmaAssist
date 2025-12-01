using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class CantonConfiguration : IEntityTypeConfiguration<Canton>
{
    public void Configure(EntityTypeBuilder<Canton> builder)
    {
        builder.ToTable("Cantons");

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

        builder.HasIndex(e => e.Code)
            .IsUnique();

        builder.HasOne(e => e.BiHEntity)
            .WithMany(b => b.Cantons)
            .HasForeignKey(e => e.BiHEntityId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.Municipalities)
            .WithOne(m => m.Canton)
            .HasForeignKey(m => m.CantonId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
