using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class RepCustomerAssignmentConfiguration : IEntityTypeConfiguration<RepCustomerAssignment>
{
    public void Configure(EntityTypeBuilder<RepCustomerAssignment> builder)
    {
        builder.ToTable("RepCustomerAssignments");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.RepId)
            .IsRequired();

        builder.Property(e => e.CustomerId)
            .IsRequired();

        // Unique constraint on rep-customer pair
        builder.HasIndex(e => new { e.RepId, e.CustomerId })
            .IsUnique();

        // FK to SalesRepresentative
        builder.HasOne(e => e.Rep)
            .WithMany(sr => sr.CustomerAssignments)
            .HasForeignKey(e => e.RepId)
            .OnDelete(DeleteBehavior.Restrict);

        // FK to Customer
        builder.HasOne(e => e.Customer)
            .WithMany()
            .HasForeignKey(e => e.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        // Global query filter for soft delete
        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
