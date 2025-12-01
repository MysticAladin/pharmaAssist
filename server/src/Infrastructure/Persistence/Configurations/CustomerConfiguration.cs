using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.ToTable("Customers");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.CustomerCode)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(e => e.FirstName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(e => e.LastName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(e => e.CompanyName)
            .HasMaxLength(200);

        builder.Property(e => e.TaxId)
            .HasMaxLength(20);

        builder.Property(e => e.RegistrationNumber)
            .HasMaxLength(50);

        builder.Property(e => e.Email)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(e => e.Phone)
            .HasMaxLength(50);

        builder.Property(e => e.MobilePhone)
            .HasMaxLength(50);

        builder.Property(e => e.Fax)
            .HasMaxLength(50);

        builder.Property(e => e.CreditLimit)
            .HasPrecision(18, 2);

        builder.Property(e => e.CurrentBalance)
            .HasPrecision(18, 2);

        builder.Property(e => e.VerifiedBy)
            .HasMaxLength(200);

        // Ignore computed property
        builder.Ignore(e => e.FullName);

        builder.HasIndex(e => e.CustomerCode)
            .IsUnique();

        builder.HasIndex(e => e.TaxId);

        builder.HasIndex(e => e.Email);

        // Relationship with ApplicationUser (optional)
        builder.HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(e => e.Addresses)
            .WithOne(a => a.Customer)
            .HasForeignKey(a => a.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(e => e.Orders)
            .WithOne(o => o.Customer)
            .HasForeignKey(o => o.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.Prescriptions)
            .WithOne(p => p.Customer)
            .HasForeignKey(p => p.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
