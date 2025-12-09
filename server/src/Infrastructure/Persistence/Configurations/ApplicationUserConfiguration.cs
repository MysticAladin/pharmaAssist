using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.Property(e => e.FirstName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.LastName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.MiddleName)
            .HasMaxLength(100);

        builder.Property(e => e.CreatedBy)
            .HasMaxLength(256);

        builder.Property(e => e.UpdatedBy)
            .HasMaxLength(256);

        // Relationship to Customer (optional)
        builder.HasOne(e => e.Customer)
            .WithMany()
            .HasForeignKey(e => e.CustomerId)
            .OnDelete(DeleteBehavior.SetNull);

        // Index on CustomerId for filtering users by client
        builder.HasIndex(e => e.CustomerId);

        // Index on IsActive for filtering active users
        builder.HasIndex(e => e.IsActive);
    }
}
