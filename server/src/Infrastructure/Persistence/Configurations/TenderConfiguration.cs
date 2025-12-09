using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class TenderConfiguration : IEntityTypeConfiguration<Tender>
{
    public void Configure(EntityTypeBuilder<Tender> builder)
    {
        builder.HasKey(t => t.Id);
        
        builder.Property(t => t.TenderNumber)
            .IsRequired()
            .HasMaxLength(50);
        
        builder.HasIndex(t => t.TenderNumber)
            .IsUnique();
        
        builder.Property(t => t.Title)
            .IsRequired()
            .HasMaxLength(500);
        
        builder.Property(t => t.Description)
            .HasMaxLength(4000);
        
        builder.Property(t => t.Currency)
            .HasMaxLength(10)
            .HasDefaultValue("BAM");
        
        builder.Property(t => t.DeliveryLocation)
            .HasMaxLength(500);
        
        builder.Property(t => t.ContactPerson)
            .HasMaxLength(200);
        
        builder.Property(t => t.ContactEmail)
            .HasMaxLength(200);
        
        builder.Property(t => t.ContactPhone)
            .HasMaxLength(50);
        
        builder.Property(t => t.EstimatedValue)
            .HasPrecision(18, 2);
        
        builder.Property(t => t.Budget)
            .HasPrecision(18, 2);
        
        builder.Property(t => t.BidSecurityAmount)
            .HasPrecision(18, 2);
        
        builder.HasOne(t => t.Customer)
            .WithMany()
            .HasForeignKey(t => t.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);
        
        builder.HasOne(t => t.AssignedUser)
            .WithMany()
            .HasForeignKey(t => t.AssignedUserId)
            .OnDelete(DeleteBehavior.NoAction);
        
        builder.HasOne(t => t.CreatedByUser)
            .WithMany()
            .HasForeignKey(t => t.CreatedById)
            .OnDelete(DeleteBehavior.NoAction);
        
        builder.HasMany(t => t.Items)
            .WithOne(i => i.Tender)
            .HasForeignKey(i => i.TenderId)
            .OnDelete(DeleteBehavior.Restrict);
        
        builder.HasMany(t => t.Bids)
            .WithOne(b => b.Tender)
            .HasForeignKey(b => b.TenderId)
            .OnDelete(DeleteBehavior.Restrict);
        
        builder.HasMany(t => t.Documents)
            .WithOne(d => d.Tender)
            .HasForeignKey(d => d.TenderId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class TenderItemConfiguration : IEntityTypeConfiguration<TenderItem>
{
    public void Configure(EntityTypeBuilder<TenderItem> builder)
    {
        builder.HasKey(i => i.Id);
        
        builder.Property(i => i.Description)
            .IsRequired()
            .HasMaxLength(1000);
        
        builder.Property(i => i.Specification)
            .HasMaxLength(2000);
        
        builder.Property(i => i.Unit)
            .HasMaxLength(50);
        
        builder.Property(i => i.Quantity)
            .HasPrecision(18, 2);
        
        builder.Property(i => i.EstimatedUnitPrice)
            .HasPrecision(18, 2);
        
        builder.HasOne(i => i.Product)
            .WithMany()
            .HasForeignKey(i => i.ProductId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}

public class TenderBidConfiguration : IEntityTypeConfiguration<TenderBid>
{
    public void Configure(EntityTypeBuilder<TenderBid> builder)
    {
        builder.HasKey(b => b.Id);
        
        builder.Property(b => b.BidNumber)
            .IsRequired()
            .HasMaxLength(50);
        
        builder.Property(b => b.TotalAmount)
            .HasPrecision(18, 2);
        
        builder.Property(b => b.DiscountAmount)
            .HasPrecision(18, 2);
        
        builder.Property(b => b.FinalAmount)
            .HasPrecision(18, 2);
        
        builder.Property(b => b.Currency)
            .HasMaxLength(10);
        
        builder.Property(b => b.EvaluationScore)
            .HasPrecision(10, 2);
        
        builder.HasOne(b => b.PreparedBy)
            .WithMany()
            .HasForeignKey(b => b.PreparedById)
            .OnDelete(DeleteBehavior.NoAction);
        
        builder.HasOne(b => b.ApprovedBy)
            .WithMany()
            .HasForeignKey(b => b.ApprovedById)
            .OnDelete(DeleteBehavior.NoAction);
        
        builder.HasMany(b => b.Items)
            .WithOne(i => i.TenderBid)
            .HasForeignKey(i => i.TenderBidId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class TenderBidItemConfiguration : IEntityTypeConfiguration<TenderBidItem>
{
    public void Configure(EntityTypeBuilder<TenderBidItem> builder)
    {
        builder.HasKey(i => i.Id);
        
        builder.Property(i => i.Description)
            .HasMaxLength(1000);
        
        builder.Property(i => i.Quantity)
            .HasPrecision(18, 2);
        
        builder.Property(i => i.UnitPrice)
            .HasPrecision(18, 2);
        
        builder.Property(i => i.DiscountPercent)
            .HasPrecision(5, 2);
        
        builder.Property(i => i.FinalUnitPrice)
            .HasPrecision(18, 2);
        
        builder.HasOne(i => i.TenderItem)
            .WithMany()
            .HasForeignKey(i => i.TenderItemId)
            .OnDelete(DeleteBehavior.NoAction);
        
        builder.HasOne(i => i.Product)
            .WithMany()
            .HasForeignKey(i => i.ProductId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}

public class TenderDocumentConfiguration : IEntityTypeConfiguration<TenderDocument>
{
    public void Configure(EntityTypeBuilder<TenderDocument> builder)
    {
        builder.HasKey(d => d.Id);
        
        builder.Property(d => d.Name)
            .IsRequired()
            .HasMaxLength(500);
        
        builder.Property(d => d.FilePath)
            .IsRequired()
            .HasMaxLength(1000);
        
        builder.Property(d => d.FileName)
            .IsRequired()
            .HasMaxLength(500);
        
        builder.Property(d => d.MimeType)
            .HasMaxLength(100);
        
        builder.Property(d => d.Description)
            .HasMaxLength(1000);
        
        builder.HasOne(d => d.UploadedBy)
            .WithMany()
            .HasForeignKey(d => d.UploadedById)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
