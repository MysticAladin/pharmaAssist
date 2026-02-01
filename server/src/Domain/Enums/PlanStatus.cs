namespace Domain.Enums;

/// <summary>
/// Status for planning hierarchy (Annual, Quarterly, Monthly plans)
/// </summary>
public enum PlanStatus
{
    /// <summary>
    /// Plan is being drafted
    /// </summary>
    Draft = 0,
    
    /// <summary>
    /// Plan submitted for approval
    /// </summary>
    Submitted = 1,
    
    /// <summary>
    /// Plan approved by manager
    /// </summary>
    Approved = 2,
    
    /// <summary>
    /// Plan rejected, needs revision
    /// </summary>
    Rejected = 3,
    
    /// <summary>
    /// Plan is currently active
    /// </summary>
    Active = 4,
    
    /// <summary>
    /// Plan period completed
    /// </summary>
    Completed = 5,
    
    /// <summary>
    /// Plan archived
    /// </summary>
    Archived = 6
}
