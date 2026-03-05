using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Represents a survey that can be assigned to a cycle and filled out by reps during visits
/// </summary>
public class Survey : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? TitleLocal { get; set; }
    public string? Description { get; set; }
    public int? CycleId { get; set; }
    public SurveyStatus Status { get; set; } = SurveyStatus.Draft;
    public bool IsAnonymous { get; set; }
    public DateTime? StartsAt { get; set; }
    public DateTime? ExpiresAt { get; set; }

    // Navigation
    public Cycle? Cycle { get; set; }
    public ICollection<SurveyQuestion> Questions { get; set; } = new List<SurveyQuestion>();
    public ICollection<SurveyResponse> Responses { get; set; } = new List<SurveyResponse>();
}
