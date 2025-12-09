namespace Domain.Entities;

/// <summary>
/// Join entity for Role-Permission many-to-many relationship
/// </summary>
public class RolePermission
{
    /// <summary>
    /// Foreign key to the role
    /// </summary>
    public string RoleId { get; set; } = string.Empty;

    /// <summary>
    /// Foreign key to the permission
    /// </summary>
    public int PermissionId { get; set; }

    /// <summary>
    /// When this assignment was created
    /// </summary>
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Who assigned this permission
    /// </summary>
    public string? AssignedBy { get; set; }

    /// <summary>
    /// Navigation property for the role
    /// </summary>
    public virtual ApplicationRole Role { get; set; } = null!;

    /// <summary>
    /// Navigation property for the permission
    /// </summary>
    public virtual Permission Permission { get; set; } = null!;
}
