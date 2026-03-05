namespace Domain.Entities;

/// <summary>
/// Individual answer to a question within a survey response
/// </summary>
public class SurveyAnswer : BaseEntity
{
    public int ResponseId { get; set; }
    public int QuestionId { get; set; }
    /// <summary>
    /// Free-text answer value for Text/Number/Rating/YesNo question types
    /// </summary>
    public string? AnswerValue { get; set; }
    /// <summary>
    /// JSON array of selected options for SingleChoice/MultiChoice question types
    /// </summary>
    public string? SelectedOptions { get; set; }

    // Navigation
    public SurveyResponse Response { get; set; } = null!;
    public SurveyQuestion Question { get; set; } = null!;
}
