namespace Domain.Entities;

/// <summary>
/// A completed response to a survey by a sales rep for a specific customer/visit
/// </summary>
public class SurveyResponse : BaseEntity
{
    public int SurveyId { get; set; }
    public int RespondentRepId { get; set; }
    public int CustomerId { get; set; }
    public int? VisitId { get; set; }
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Survey Survey { get; set; } = null!;
    public SalesRepresentative RespondentRep { get; set; } = null!;
    public Customer Customer { get; set; } = null!;
    public ExecutedVisit? Visit { get; set; }
    public ICollection<SurveyAnswer> Answers { get; set; } = new List<SurveyAnswer>();
}
