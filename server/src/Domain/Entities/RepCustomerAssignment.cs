namespace Domain.Entities;

/// <summary>
/// Assignment of customers to sales representatives
/// Determines which rep is responsible for which customers
/// </summary>
public class RepCustomerAssignment : BaseEntity
{
    /// <summary>
    /// FK to the sales representative
    /// </summary>
    public int RepId { get; set; }
    
    /// <summary>
    /// FK to the customer
    /// </summary>
    public int CustomerId { get; set; }
    
    /// <summary>
    /// Date when this assignment was made
    /// </summary>
    public DateTime AssignmentDate { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Whether this assignment is currently active
    /// </summary>
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    
    /// <summary>
    /// The sales representative
    /// </summary>
    public virtual SalesRepresentative? Rep { get; set; }
    
    /// <summary>
    /// The customer
    /// </summary>
    public virtual Customer? Customer { get; set; }
}
