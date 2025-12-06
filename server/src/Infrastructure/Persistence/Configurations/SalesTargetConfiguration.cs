using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class SalesTargetConfiguration : IEntityTypeConfiguration<SalesTarget>
{
    public void Configure(EntityTypeBuilder<SalesTarget> builder)
    {
        builder.ToTable("SalesTargets");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.Description)
            .HasMaxLength(500);

        builder.Property(e => e.TargetType)
            .IsRequired();

        builder.Property(e => e.Metric)
            .IsRequired();

        builder.Property(e => e.TargetValue)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(e => e.CurrentValue)
            .HasPrecision(18, 2)
            .HasDefaultValue(0);

        builder.Property(e => e.IsActive)
            .HasDefaultValue(true);

        builder.Property(e => e.UserId)
            .HasMaxLength(450);

        builder.Property(e => e.LockedBy)
            .HasMaxLength(450);

        // Relationships
        builder.HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Customer)
            .WithMany()
            .HasForeignKey(e => e.CustomerId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Product)
            .WithMany()
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Category)
            .WithMany()
            .HasForeignKey(e => e.CategoryId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Manufacturer)
            .WithMany()
            .HasForeignKey(e => e.ManufacturerId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Canton)
            .WithMany()
            .HasForeignKey(e => e.CantonId)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes
        builder.HasIndex(e => new { e.Year, e.Month, e.Quarter });
        builder.HasIndex(e => e.TargetType);
        builder.HasIndex(e => e.UserId);
        builder.HasIndex(e => e.CustomerId);
        builder.HasIndex(e => e.IsActive);
    }
}

public class SalesTargetProgressConfiguration : IEntityTypeConfiguration<SalesTargetProgress>
{
    public void Configure(EntityTypeBuilder<SalesTargetProgress> builder)
    {
        builder.ToTable("SalesTargetProgress");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Value)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(e => e.PreviousValue)
            .HasPrecision(18, 2);

        builder.Property(e => e.Notes)
            .HasMaxLength(500);

        builder.Property(e => e.RecordedBy)
            .HasMaxLength(450);

        builder.HasOne(e => e.SalesTarget)
            .WithMany(t => t.ProgressHistory)
            .HasForeignKey(e => e.SalesTargetId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.RecordedAt);
        builder.HasIndex(e => e.SalesTargetId);
    }
}

public class BudgetConfiguration : IEntityTypeConfiguration<Budget>
{
    public void Configure(EntityTypeBuilder<Budget> builder)
    {
        builder.ToTable("Budgets");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.Description)
            .HasMaxLength(500);

        builder.Property(e => e.BudgetType)
            .IsRequired();

        builder.Property(e => e.Status)
            .HasDefaultValue(BudgetStatus.Draft);

        builder.Property(e => e.AllocatedAmount)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(e => e.SpentAmount)
            .HasPrecision(18, 2)
            .HasDefaultValue(0);

        builder.Property(e => e.UserId)
            .HasMaxLength(450);

        builder.Property(e => e.ApprovedBy)
            .HasMaxLength(450);

        // Relationships
        builder.HasOne(e => e.Category)
            .WithMany()
            .HasForeignKey(e => e.CategoryId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Manufacturer)
            .WithMany()
            .HasForeignKey(e => e.ManufacturerId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.ResponsibleUser)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes
        builder.HasIndex(e => new { e.Year, e.Month, e.Quarter });
        builder.HasIndex(e => e.BudgetType);
        builder.HasIndex(e => e.Status);
    }
}

public class BudgetExpenseConfiguration : IEntityTypeConfiguration<BudgetExpense>
{
    public void Configure(EntityTypeBuilder<BudgetExpense> builder)
    {
        builder.ToTable("BudgetExpenses");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Description)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(e => e.Amount)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(e => e.ReferenceNumber)
            .HasMaxLength(100);

        builder.Property(e => e.Notes)
            .HasMaxLength(500);

        builder.Property(e => e.RecordedBy)
            .HasMaxLength(450);

        builder.HasOne(e => e.Budget)
            .WithMany(b => b.Expenses)
            .HasForeignKey(e => e.BudgetId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Order)
            .WithMany()
            .HasForeignKey(e => e.OrderId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Promotion)
            .WithMany()
            .HasForeignKey(e => e.PromotionId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(e => e.ExpenseDate);
        builder.HasIndex(e => e.ExpenseCategory);
    }
}
