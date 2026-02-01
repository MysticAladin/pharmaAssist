using Domain.Enums;

namespace Application.DTOs.Visits;

public class ExecutedVisitDto
{
    public int Id { get; set; }

    public int RepId { get; set; }

    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = "";

    public int? PlannedVisitId { get; set; }
    public VisitType VisitType { get; set; }

    public DateTime CheckInTime { get; set; }
    public decimal? CheckInLatitude { get; set; }
    public decimal? CheckInLongitude { get; set; }
    public string? CheckInAddress { get; set; }

    public DateTime? CheckOutTime { get; set; }
    public decimal? CheckOutLatitude { get; set; }
    public decimal? CheckOutLongitude { get; set; }

    public bool LocationVerified { get; set; }
    public int? DistanceFromCustomerMeters { get; set; }

    public VisitOutcome? Outcome { get; set; }
    public string? Summary { get; set; }
    public string? ProductsDiscussed { get; set; }
    
    // Visit notes fields
    public string? GeneralComment { get; set; }
    public string? AgreedDeals { get; set; }
    public string? CompetitionNotes { get; set; }

    public bool IsCompleted => CheckOutTime.HasValue;
}