namespace Domain.Entities;

/// <summary>
/// Many-to-many relationship between sales representatives and their managers/supervisors
/// Supports the hierarchical structure where reps can report to multiple managers
/// Managers are Users with Manager role (not necessarily SalesRepresentatives)
/// </summary>
public class RepManagerAssignment : BaseEntity
{
    /// <summary>
    /// FK to the sales representative being managed
    /// </summary>
    public int RepId { get; set; }
    
    /// <summary>
    /// FK to the manager/supervisor (User with Manager role)
    /// </summary>
    public string ManagerUserId { get; set; } = string.Empty;
    
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
    /// The manager/supervisor user
    /// </summary>
    public virtual ApplicationUser? ManagerUser { get; set; }
}
