using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class MaterialDistributionConfiguration : IEntityTypeConfiguration<MaterialDistribution>
{
    public void Configure(EntityTypeBuilder<MaterialDistribution> builder)
    {
        builder.ToTable("MaterialDistributions");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.MaterialName)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(e => e.MaterialType)
            .IsRequired();

        builder.Property(e => e.Quantity)
            .IsRequired();

        builder.Property(e => e.LotNumber)
            .HasMaxLength(100);

        builder.Property(e => e.Notes)
            .HasMaxLength(2000);

        builder.Property(e => e.DistributedAt)
            .IsRequired();

        builder.Property(e => e.CreatedBy).HasMaxLength(450);
        builder.Property(e => e.UpdatedBy).HasMaxLength(450);

        builder.HasOne(e => e.Rep)
            .WithMany()
            .HasForeignKey(e => e.RepId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Customer)
            .WithMany()
            .HasForeignKey(e => e.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Visit)
            .WithMany()
            .HasForeignKey(e => e.VisitId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Product)
            .WithMany()
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
