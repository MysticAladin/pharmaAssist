using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class CampaignExpenseConfiguration : IEntityTypeConfiguration<CampaignExpense>
{
    public void Configure(EntityTypeBuilder<CampaignExpense> builder)
    {
        builder.ToTable("CampaignExpenses");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Category)
            .IsRequired();

        builder.Property(e => e.Description)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(e => e.Amount)
            .IsRequired()
            .HasPrecision(18, 4);

        builder.Property(e => e.ExpenseDate)
            .IsRequired();

        builder.Property(e => e.ReferenceNumber)
            .HasMaxLength(100);

        builder.Property(e => e.AttachmentPath)
            .HasMaxLength(500);

        builder.Property(e => e.ApprovalNotes)
            .HasMaxLength(1000);

        builder.Property(e => e.CreatedBy)
            .HasMaxLength(450);

        builder.Property(e => e.UpdatedBy)
            .HasMaxLength(450);

        // Relationships
        builder.HasOne(e => e.Campaign)
            .WithMany(c => c.Expenses)
            .HasForeignKey(e => e.CampaignId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Cycle)
            .WithMany()
            .HasForeignKey(e => e.CycleId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Customer)
            .WithMany()
            .HasForeignKey(e => e.CustomerId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Rep)
            .WithMany()
            .HasForeignKey(e => e.RepId)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes
        builder.HasIndex(e => e.CampaignId);
        builder.HasIndex(e => e.CycleId);
        builder.HasIndex(e => e.CustomerId);
        builder.HasIndex(e => e.RepId);
        builder.HasIndex(e => e.ExpenseDate);
        builder.HasIndex(e => e.Category);

        // Soft-delete filter
        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
