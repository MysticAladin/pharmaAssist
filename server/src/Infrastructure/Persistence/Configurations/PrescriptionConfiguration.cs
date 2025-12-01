using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class PrescriptionConfiguration : IEntityTypeConfiguration<Prescription>
{
    public void Configure(EntityTypeBuilder<Prescription> builder)
    {
        builder.ToTable("Prescriptions");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.PrescriptionNumber)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(e => e.DoctorName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(e => e.DoctorLicenseNumber)
            .HasMaxLength(50);

        builder.Property(e => e.MedicalInstitution)
            .HasMaxLength(300);

        builder.Property(e => e.PatientName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(e => e.PatientIdNumber)
            .HasMaxLength(20);

        builder.Property(e => e.ImagePath)
            .HasMaxLength(500);

        builder.Property(e => e.Notes)
            .HasMaxLength(1000);

        // Indexes
        builder.HasIndex(e => e.PrescriptionNumber);

        // Relationships
        builder.HasOne(e => e.Customer)
            .WithMany()
            .HasForeignKey(e => e.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.OrderItems)
            .WithOne(i => i.Prescription)
            .HasForeignKey(i => i.PrescriptionId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
