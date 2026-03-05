using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class PhysicianConfiguration : IEntityTypeConfiguration<Physician>
{
    public void Configure(EntityTypeBuilder<Physician> builder)
    {
        builder.ToTable("Physicians");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.FullName).HasMaxLength(200).IsRequired();
        builder.Property(e => e.FullNameLocal).HasMaxLength(200);
        builder.Property(e => e.SpecialtyOther).HasMaxLength(200);
        builder.Property(e => e.LicenseNumber).HasMaxLength(50);
        builder.Property(e => e.Phone).HasMaxLength(50);
        builder.Property(e => e.Email).HasMaxLength(200);
        builder.Property(e => e.Notes).HasMaxLength(2000);

        builder.HasIndex(e => e.InstitutionId);
        builder.HasIndex(e => e.DepartmentId);
        builder.HasIndex(e => e.LicenseNumber);

        builder.HasOne(e => e.Institution)
            .WithMany(c => c.Physicians)
            .HasForeignKey(e => e.InstitutionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Department)
            .WithMany(d => d.Physicians)
            .HasForeignKey(e => e.DepartmentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(e => e.Prescriptions)
            .WithOne(p => p.Physician)
            .HasForeignKey(p => p.PhysicianId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
