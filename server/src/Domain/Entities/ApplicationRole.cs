using Microsoft.AspNetCore.Identity;

namespace Domain.Entities;

/// <summary>
/// Application role extending ASP.NET Core Identity with permissions support
/// </summary>
public class ApplicationRole : IdentityRole
{
    public string? Description { get; set; }
    
    /// <summary>
    /// Whether this is a system-defined role that cannot be deleted
    /// </summary>
    public bool IsSystemRole { get; set; } = false;
    
    /// <summary>
    /// Display order for UI
    /// </summary>
    public int SortOrder { get; set; } = 0;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    /// <summary>
    /// Navigation property for role permissions
    /// </summary>
    public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}
