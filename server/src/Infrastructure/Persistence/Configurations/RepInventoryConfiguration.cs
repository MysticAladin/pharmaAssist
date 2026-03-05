using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class RepInventoryConfiguration : IEntityTypeConfiguration<RepInventory>
{
    public void Configure(EntityTypeBuilder<RepInventory> builder)
    {
        builder.ToTable("RepInventories");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.MaterialName)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(e => e.Quantity)
            .IsRequired();

        builder.Property(e => e.CreatedBy).HasMaxLength(450);
        builder.Property(e => e.UpdatedBy).HasMaxLength(450);

        builder.HasOne(e => e.Rep)
            .WithMany()
            .HasForeignKey(e => e.RepId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Product)
            .WithMany()
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasQueryFilter(e => !e.IsDeleted);

        // Unique index on rep + material name (only one row per material per rep)
        builder.HasIndex(e => new { e.RepId, e.MaterialName })
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");
    }
}
