using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.OrderNumber)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(e => e.Notes)
            .HasMaxLength(1000);

        builder.Property(e => e.InternalNotes)
            .HasMaxLength(1000);

        builder.Property(e => e.CancellationReason)
            .HasMaxLength(500);

        // Decimal precision for monetary values
        builder.Property(e => e.SubTotal)
            .HasPrecision(18, 2);

        builder.Property(e => e.TaxAmount)
            .HasPrecision(18, 2);

        builder.Property(e => e.ShippingAmount)
            .HasPrecision(18, 2);

        builder.Property(e => e.DiscountAmount)
            .HasPrecision(18, 2);

        builder.Property(e => e.TotalAmount)
            .HasPrecision(18, 2);

        // Indexes
        builder.HasIndex(e => e.OrderNumber)
            .IsUnique();

        builder.HasIndex(e => e.OrderDate);

        builder.HasIndex(e => e.Status);

        builder.HasIndex(e => e.RepId);

        builder.HasIndex(e => e.VisitId);

        // Relationships
        builder.HasOne(e => e.Customer)
            .WithMany(c => c.Orders)
            .HasForeignKey(e => e.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Rep)
            .WithMany()
            .HasForeignKey(e => e.RepId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Visit)
            .WithMany()
            .HasForeignKey(e => e.VisitId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.ShippingAddress)
            .WithMany()
            .HasForeignKey(e => e.ShippingAddressId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.BillingAddress)
            .WithMany()
            .HasForeignKey(e => e.BillingAddressId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.OrderItems)
            .WithOne(i => i.Order)
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        // Rep-specific properties
        builder.Property(e => e.RepDeviceId)
            .HasMaxLength(100);
    }
}
