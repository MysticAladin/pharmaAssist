using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class SalesRepresentativeConfiguration : IEntityTypeConfiguration<SalesRepresentative>
{
    public void Configure(EntityTypeBuilder<SalesRepresentative> builder)
    {
        builder.ToTable("SalesRepresentatives");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.UserId)
            .HasMaxLength(450)
            .IsRequired();

        builder.Property(e => e.EmployeeCode)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(e => e.Mobile)
            .HasMaxLength(50);

        builder.Property(e => e.TerritoryDescription)
            .HasMaxLength(500);

        builder.Property(e => e.RepType)
            .IsRequired();

        builder.Property(e => e.Status)
            .IsRequired();

        // Unique constraint on employee code
        builder.HasIndex(e => e.EmployeeCode)
            .IsUnique();

        // FK to ApplicationUser
        builder.HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Global query filter for soft delete
        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
