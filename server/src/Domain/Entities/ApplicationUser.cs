using Microsoft.AspNetCore.Identity;

namespace Domain.Entities;

/// <summary>
/// Application user extending ASP.NET Core Identity
/// </summary>
public class ApplicationUser : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public bool IsActive { get; set; } = true;
    
    /// <summary>
    /// Associated client/customer organization (for multi-tenant feature flags)
    /// </summary>
    public int? CustomerId { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    
    public string FullName => string.IsNullOrEmpty(MiddleName) 
        ? $"{FirstName} {LastName}" 
        : $"{FirstName} {MiddleName} {LastName}";
    
    /// <summary>
    /// Navigation property for the associated customer/client
    /// </summary>
    public virtual Customer? Customer { get; set; }
}
