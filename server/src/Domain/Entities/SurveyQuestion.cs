using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// A question within a survey. Supports multiple question types with configurable options.
/// </summary>
public class SurveyQuestion : BaseEntity
{
    public int SurveyId { get; set; }
    public QuestionType QuestionType { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string? QuestionTextLocal { get; set; }
    /// <summary>
    /// JSON array of option strings for SingleChoice / MultiChoice questions
    /// </summary>
    public string? Options { get; set; }
    public bool IsRequired { get; set; } = true;
    public int SortOrder { get; set; }

    // Navigation
    public Survey Survey { get; set; } = null!;
    public ICollection<SurveyAnswer> Answers { get; set; } = new List<SurveyAnswer>();
}
