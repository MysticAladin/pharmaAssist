using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class WarehouseConfiguration : IEntityTypeConfiguration<Warehouse>
{
    public void Configure(EntityTypeBuilder<Warehouse> builder)
    {
        builder.ToTable("Warehouses");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Code)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(e => e.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(e => e.NameLocal)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(e => e.Address)
            .HasMaxLength(300);

        builder.Property(e => e.PostalCode)
            .HasMaxLength(10);

        builder.Property(e => e.ContactPhone)
            .HasMaxLength(50);

        builder.Property(e => e.ContactEmail)
            .HasMaxLength(200);

        builder.Property(e => e.CapacityCubicMeters)
            .HasPrecision(10, 2);

        // Indexes
        builder.HasIndex(e => e.Code)
            .IsUnique();

        // Relationships
        builder.HasOne(e => e.City)
            .WithMany()
            .HasForeignKey(e => e.CityId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(e => e.InventoryStocks)
            .WithOne(i => i.Warehouse)
            .HasForeignKey(i => i.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.StockMovements)
            .WithOne(m => m.Warehouse)
            .HasForeignKey(m => m.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
