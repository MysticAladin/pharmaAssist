using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class ClaimConfiguration : IEntityTypeConfiguration<Claim>
{
    public void Configure(EntityTypeBuilder<Claim> builder)
    {
        builder.ToTable("Claims");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.ClaimNumber)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(e => e.Reason)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(e => e.Description)
            .HasMaxLength(2000);

        builder.Property(e => e.BatchNumber)
            .HasMaxLength(100);

        builder.Property(e => e.ResolutionNotes)
            .HasMaxLength(2000);

        builder.Property(e => e.RefundAmount)
            .HasPrecision(18, 2);

        builder.Property(e => e.ResolvedBy)
            .HasMaxLength(100);

        builder.Property(e => e.ReturnTrackingNumber)
            .HasMaxLength(100);

        builder.Property(e => e.AttachmentIds)
            .HasMaxLength(500);

        // Indexes
        builder.HasIndex(e => e.ClaimNumber)
            .IsUnique();

        builder.HasIndex(e => e.Status);

        builder.HasIndex(e => e.Type);

        builder.HasIndex(e => e.CustomerId);

        builder.HasIndex(e => e.OrderId);

        builder.HasIndex(e => e.CreatedAt);

        // Relationships
        builder.HasOne(e => e.Customer)
            .WithMany()
            .HasForeignKey(e => e.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Order)
            .WithMany()
            .HasForeignKey(e => e.OrderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.OrderItem)
            .WithMany()
            .HasForeignKey(e => e.OrderItemId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Product)
            .WithMany()
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.ReplacementOrder)
            .WithMany()
            .HasForeignKey(e => e.ReplacementOrderId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
