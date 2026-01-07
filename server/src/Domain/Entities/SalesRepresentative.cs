using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Sales representative entity - represents a field sales person
/// Commercial reps handle OTC medicines and pharmacy visits
/// Medical reps handle RX medicines and physician visits ("stručni predstavnik")
/// </summary>
public class SalesRepresentative : BaseEntity
{
    /// <summary>
    /// FK to the associated ApplicationUser account
    /// </summary>
    public string UserId { get; set; } = string.Empty;
    
    /// <summary>
    /// Type of representative (Commercial or Medical)
    /// </summary>
    public RepresentativeType RepType { get; set; }
    
    /// <summary>
    /// Internal employee code for tracking
    /// </summary>
    public string EmployeeCode { get; set; } = string.Empty;
    
    /// <summary>
    /// Mobile phone number for field contact
    /// </summary>
    public string? Mobile { get; set; }
    
    /// <summary>
    /// Date when the representative was hired
    /// </summary>
    public DateTime HireDate { get; set; }
    
    /// <summary>
    /// Current employment status
    /// </summary>
    public RepresentativeStatus Status { get; set; } = RepresentativeStatus.Active;
    
    /// <summary>
    /// Informal territory description (e.g., "Sarajevo Canton, Zenica-Doboj Canton")
    /// </summary>
    public string? TerritoryDescription { get; set; }
    
    // Navigation properties
    
    /// <summary>
    /// The associated user account
    /// </summary>
    public virtual ApplicationUser? User { get; set; }
    
    /// <summary>
    /// Manager assignments (who manages this rep)
    /// </summary>
    public virtual ICollection<RepManagerAssignment> ManagerAssignments { get; set; } = new List<RepManagerAssignment>();
    
    /// <summary>
    /// Reps managed by this person (if they are a manager)
    /// </summary>
    public virtual ICollection<RepManagerAssignment> ManagedReps { get; set; } = new List<RepManagerAssignment>();
    
    /// <summary>
    /// Customer assignments for this representative
    /// </summary>
    public virtual ICollection<RepCustomerAssignment> CustomerAssignments { get; set; } = new List<RepCustomerAssignment>();
    
    /// <summary>
    /// Visit plans created by this representative
    /// </summary>
    public virtual ICollection<VisitPlan> VisitPlans { get; set; } = new List<VisitPlan>();
    
    /// <summary>
    /// Executed visits by this representative
    /// </summary>
    public virtual ICollection<ExecutedVisit> ExecutedVisits { get; set; } = new List<ExecutedVisit>();
}
