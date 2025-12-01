using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class CustomerAddressConfiguration : IEntityTypeConfiguration<CustomerAddress>
{
    public void Configure(EntityTypeBuilder<CustomerAddress> builder)
    {
        builder.ToTable("CustomerAddresses");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Street)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(e => e.Street2)
            .HasMaxLength(200);

        builder.Property(e => e.City)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(e => e.PostalCode)
            .HasMaxLength(10)
            .IsRequired();

        builder.Property(e => e.ContactName)
            .HasMaxLength(200);

        builder.Property(e => e.ContactPhone)
            .HasMaxLength(50);

        builder.Property(e => e.Notes)
            .HasMaxLength(500);

        builder.HasOne(e => e.Customer)
            .WithMany(c => c.Addresses)
            .HasForeignKey(e => e.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Municipality)
            .WithMany()
            .HasForeignKey(e => e.MunicipalityId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Canton)
            .WithMany()
            .HasForeignKey(e => e.CantonId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.BiHEntity)
            .WithMany()
            .HasForeignKey(e => e.BiHEntityId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
