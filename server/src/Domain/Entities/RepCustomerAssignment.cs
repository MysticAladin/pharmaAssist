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
    
    /// <summary>
    /// Override for required visits per month. When null, defaults by tier:
    /// A = 4/month, B = 2/month, C = 1/month
    /// </summary>
    public int? RequiredVisitsPerMonth { get; set; }
    
    /// <summary>
    /// Get the effective required visits per month based on override or tier default
    /// </summary>
    public int GetEffectiveRequiredVisits(Domain.Enums.CustomerTier tier)
    {
        if (RequiredVisitsPerMonth.HasValue)
            return RequiredVisitsPerMonth.Value;
            
        return tier switch
        {
            Domain.Enums.CustomerTier.A => 4,
            Domain.Enums.CustomerTier.B => 2,
            Domain.Enums.CustomerTier.C => 1,
            _ => 1
        };
    }
    
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
