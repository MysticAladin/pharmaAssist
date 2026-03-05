using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class SurveyQuestionConfiguration : IEntityTypeConfiguration<SurveyQuestion>
{
    public void Configure(EntityTypeBuilder<SurveyQuestion> builder)
    {
        builder.ToTable("SurveyQuestions");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.QuestionText)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(e => e.QuestionTextLocal)
            .HasMaxLength(1000);

        builder.Property(e => e.Options)
            .HasColumnType("nvarchar(max)");

        builder.Property(e => e.QuestionType)
            .IsRequired();

        builder.Property(e => e.CreatedBy).HasMaxLength(450);
        builder.Property(e => e.UpdatedBy).HasMaxLength(450);

        builder.HasMany(e => e.Answers)
            .WithOne(a => a.Question)
            .HasForeignKey(a => a.QuestionId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
