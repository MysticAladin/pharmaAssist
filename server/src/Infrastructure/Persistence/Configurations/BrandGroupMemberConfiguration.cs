using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class BrandGroupMemberConfiguration : IEntityTypeConfiguration<BrandGroupMember>
{
    public void Configure(EntityTypeBuilder<BrandGroupMember> builder)
    {
        builder.ToTable("BrandGroupMembers");
        builder.HasKey(e => e.Id);

        builder.HasIndex(e => new { e.BrandGroupId, e.BrandId }).IsUnique();

        builder.HasOne(e => e.BrandGroup)
            .WithMany(bg => bg.Members)
            .HasForeignKey(e => e.BrandGroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Brand)
            .WithMany(b => b.BrandGroupMembers)
            .HasForeignKey(e => e.BrandId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
