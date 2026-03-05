using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class SurveyAnswerConfiguration : IEntityTypeConfiguration<SurveyAnswer>
{
    public void Configure(EntityTypeBuilder<SurveyAnswer> builder)
    {
        builder.ToTable("SurveyAnswers");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.AnswerValue)
            .HasMaxLength(4000);

        builder.Property(e => e.SelectedOptions)
            .HasColumnType("nvarchar(max)");

        builder.Property(e => e.CreatedBy).HasMaxLength(450);
        builder.Property(e => e.UpdatedBy).HasMaxLength(450);

        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
