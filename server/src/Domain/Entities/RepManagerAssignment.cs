namespace Domain.Entities;

/// <summary>
/// Many-to-many relationship between sales representatives and their managers
/// Supports the hierarchical structure where reps can report to multiple managers
/// </summary>
public class RepManagerAssignment : BaseEntity
{
    /// <summary>
    /// FK to the sales representative being managed
    /// </summary>
    public int RepId { get; set; }
    
    /// <summary>
    /// FK to the manager (who is also a SalesRepresentative with manager permissions)
    /// </summary>
    public int ManagerId { get; set; }
    
    /// <summary>
    /// Date when this assignment was made
    /// </summary>
    public DateTime AssignmentDate { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Whether this assignment is currently active
    /// </summary>
    public bool IsActive { get; set; } = true;
    
    /// <summary>
    /// Whether this is the primary manager for notifications and approvals
    /// </summary>
    public bool IsPrimary { get; set; } = false;
    
    // Navigation properties
    
    /// <summary>
    /// The sales representative being managed
    /// </summary>
    public virtual SalesRepresentative? Rep { get; set; }
    
    /// <summary>
    /// The manager
    /// </summary>
    public virtual SalesRepresentative? Manager { get; set; }
}
