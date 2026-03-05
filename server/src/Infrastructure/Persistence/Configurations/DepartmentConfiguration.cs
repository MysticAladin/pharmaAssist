using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class DepartmentConfiguration : IEntityTypeConfiguration<Department>
{
    public void Configure(EntityTypeBuilder<Department> builder)
    {
        builder.ToTable("Departments");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Name).HasMaxLength(200).IsRequired();
        builder.Property(e => e.NameLocal).HasMaxLength(200);
        builder.Property(e => e.Floor).HasMaxLength(50);
        builder.Property(e => e.ContactPhone).HasMaxLength(50);
        builder.Property(e => e.ContactEmail).HasMaxLength(200);

        builder.HasIndex(e => e.CustomerId);
        builder.HasIndex(e => new { e.CustomerId, e.Name }).IsUnique();

        builder.HasOne(e => e.Customer)
            .WithMany(c => c.Departments)
            .HasForeignKey(e => e.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.HeadPhysician)
            .WithMany()
            .HasForeignKey(e => e.HeadPhysicianId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
