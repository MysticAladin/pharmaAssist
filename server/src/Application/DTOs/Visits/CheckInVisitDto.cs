namespace Application.DTOs.Visits;

public class CheckInVisitDto
{
    public int? PlannedVisitId { get; set; }
    public int? CustomerId { get; set; }

    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? Address { get; set; }
}
