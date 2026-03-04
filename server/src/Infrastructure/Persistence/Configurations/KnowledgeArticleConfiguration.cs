using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class KnowledgeArticleConfiguration : IEntityTypeConfiguration<KnowledgeArticle>
{
    public void Configure(EntityTypeBuilder<KnowledgeArticle> builder)
    {
        builder.ToTable("KnowledgeArticles");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Title).HasMaxLength(500).IsRequired();
        builder.Property(e => e.TitleLocal).HasMaxLength(500);
        builder.Property(e => e.Content).IsRequired();
        builder.Property(e => e.Tags).HasMaxLength(500);

        builder.HasIndex(e => e.ProductId);
        builder.HasIndex(e => e.BrandId);
        builder.HasIndex(e => e.Category);

        builder.HasOne(e => e.Product)
            .WithMany(p => p.KnowledgeArticles)
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Brand)
            .WithMany()
            .HasForeignKey(e => e.BrandId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
