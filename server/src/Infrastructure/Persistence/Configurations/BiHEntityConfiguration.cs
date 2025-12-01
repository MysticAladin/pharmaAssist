using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class BiHEntityConfiguration : IEntityTypeConfiguration<BiHEntity>
{
    public void Configure(EntityTypeBuilder<BiHEntity> builder)
    {
        builder.ToTable("BiHEntities");

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

        builder.HasMany(e => e.Cantons)
            .WithOne(c => c.BiHEntity)
            .HasForeignKey(c => c.BiHEntityId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
