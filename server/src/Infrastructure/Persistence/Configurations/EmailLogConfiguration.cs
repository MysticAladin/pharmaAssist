using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class EmailLogConfiguration : IEntityTypeConfiguration<EmailLog>
{
    public void Configure(EntityTypeBuilder<EmailLog> builder)
    {
        builder.ToTable("EmailLogs");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.ToEmail)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(e => e.ToName)
            .HasMaxLength(200);

        builder.Property(e => e.CcEmail)
            .HasMaxLength(500);

        builder.Property(e => e.BccEmail)
            .HasMaxLength(500);

        builder.Property(e => e.Subject)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(e => e.Body)
            .IsRequired();

        builder.Property(e => e.ErrorMessage)
            .HasMaxLength(2000);

        builder.Property(e => e.Status)
            .HasConversion<int>();

        builder.Property(e => e.EmailType)
            .HasConversion<int>();

        builder.Property(e => e.RelatedEntityType)
            .HasMaxLength(100);

        // Indexes
        builder.HasIndex(e => e.Status)
            .HasDatabaseName("IX_EmailLogs_Status");

        builder.HasIndex(e => e.CreatedAt)
            .HasDatabaseName("IX_EmailLogs_CreatedAt");

        builder.HasIndex(e => e.ToEmail)
            .HasDatabaseName("IX_EmailLogs_ToEmail");

        builder.HasIndex(e => e.EmailType)
            .HasDatabaseName("IX_EmailLogs_EmailType");
    }
}
