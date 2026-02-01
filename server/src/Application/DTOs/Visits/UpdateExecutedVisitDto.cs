using Domain.Enums;

namespace Application.DTOs.Visits;

public class UpdateExecutedVisitDto
{
    public VisitOutcome? Outcome { get; set; }
    public string? Summary { get; set; }
    public string? ProductsDiscussed { get; set; }
    
    // Visit notes
    public string? GeneralComment { get; set; }
    public string? AgreedDeals { get; set; }
    public string? CompetitionNotes { get; set; }

    public bool? FollowUpRequired { get; set; }
    public DateTime? FollowUpDate { get; set; }
}
