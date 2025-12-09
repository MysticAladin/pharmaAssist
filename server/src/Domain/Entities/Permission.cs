namespace Domain.Entities;

/// <summary>
/// Permission entity for granular access control
/// </summary>
public class Permission : BaseEntity
{
    /// <summary>
    /// Unique key for the permission (e.g., "products.create", "orders.edit")
    /// </summary>
    public string Key { get; set; } = string.Empty;

    /// <summary>
    /// Human-readable name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Description of what this permission allows
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Category for grouping in UI (e.g., "Products", "Orders", "Admin")
    /// </summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// Display order within category
    /// </summary>
    public int SortOrder { get; set; } = 0;

    /// <summary>
    /// Whether this permission is active
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Navigation property for role assignments
    /// </summary>
    public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}
