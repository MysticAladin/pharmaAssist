using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class PriceListConfiguration : IEntityTypeConfiguration<PriceList>
{
    public void Configure(EntityTypeBuilder<PriceList> builder)
    {
        builder.ToTable("PriceLists");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(e => e.NameLocal)
            .HasMaxLength(300);

        builder.Property(e => e.Type)
            .IsRequired();

        builder.Property(e => e.Description)
            .HasMaxLength(2000);

        builder.Property(e => e.CreatedBy).HasMaxLength(450);
        builder.Property(e => e.UpdatedBy).HasMaxLength(450);

        builder.HasMany(e => e.Items)
            .WithOne(e => e.PriceList)
            .HasForeignKey(e => e.PriceListId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.IsActive);
        builder.HasIndex(e => e.Type);
        builder.HasIndex(e => e.EffectiveFrom);
    }
}
