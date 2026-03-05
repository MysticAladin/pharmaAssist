using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Territory assignment — links a sales rep to a territory for a date range
/// </summary>
public class TerritoryAssignment : BaseEntity
{
    public int TerritoryId { get; set; }
    public int RepId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsPrimary { get; set; }
    public AssignmentType AssignmentType { get; set; }
    public string? Notes { get; set; }

    // Navigation properties
    public Territory Territory { get; set; } = null!;
    public SalesRepresentative Rep { get; set; } = null!;
}
