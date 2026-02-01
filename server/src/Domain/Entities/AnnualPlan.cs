using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Annual plan (Godišnji plan) - highest level of planning hierarchy
/// Contains territory assignments, annual targets, and major event calendar
/// </summary>
public class AnnualPlan : BaseEntity
{
    /// <summary>
    /// FK to the sales representative
    /// </summary>
    public int RepId { get; set; }
    
    /// <summary>
    /// The year this plan covers
    /// </summary>
    public int Year { get; set; }
    
    /// <summary>
    /// Plan title/name
    /// </summary>
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// Territory description/assignment for the year
    /// </summary>
    public string? TerritoryDescription { get; set; }
    
    /// <summary>
    /// Assigned cantons/regions (comma-separated IDs or JSON)
    /// </summary>
    public string? AssignedCantons { get; set; }
    
    /// <summary>
    /// Annual revenue target (KM)
    /// </summary>
    public decimal? RevenueTarget { get; set; }
    
    /// <summary>
    /// Annual visits target count
    /// </summary>
    public int? VisitsTarget { get; set; }
    
    /// <summary>
    /// Annual new customers acquisition target
    /// </summary>
    public int? NewCustomersTarget { get; set; }
    
    /// <summary>
    /// Major events calendar (JSON: [{date, title, description}])
    /// </summary>
    public string? MajorEvents { get; set; }
    
    /// <summary>
    /// Strategic priorities and focus areas for the year
    /// </summary>
    public string? StrategicPriorities { get; set; }
    
    /// <summary>
    /// Product focus list (comma-separated product IDs)
    /// </summary>
    public string? FocusProducts { get; set; }
    
    /// <summary>
    /// Current status
    /// </summary>
    public PlanStatus Status { get; set; } = PlanStatus.Draft;
    
    /// <summary>
    /// Manager/Director who approved
    /// </summary>
    public string? ApprovedBy { get; set; }
    
    /// <summary>
    /// Approval date
    /// </summary>
    public DateTime? ApprovedAt { get; set; }
    
    /// <summary>
    /// General notes
    /// </summary>
    public string? Notes { get; set; }
    
    // Navigation properties
    
    public virtual SalesRepresentative? Rep { get; set; }
    
    /// <summary>
    /// Quarterly breakdowns of this annual plan
    /// </summary>
    public virtual ICollection<QuarterlyPlan> QuarterlyPlans { get; set; } = new List<QuarterlyPlan>();
}
