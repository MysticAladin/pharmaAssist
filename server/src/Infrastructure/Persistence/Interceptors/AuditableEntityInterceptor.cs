using System.Security.Claims;
using System.Text.Json;
using Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Infrastructure.Persistence.Interceptors;

/// <summary>
/// EF Core interceptor for automatic audit logging
/// </summary>
public class AuditableEntityInterceptor : SaveChangesInterceptor
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditableEntityInterceptor(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData, 
        InterceptionResult<int> result)
    {
        UpdateAuditableEntities(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, 
        InterceptionResult<int> result, 
        CancellationToken cancellationToken = default)
    {
        UpdateAuditableEntities(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void UpdateAuditableEntities(DbContext? context)
    {
        if (context == null) return;

        var httpContext = _httpContextAccessor.HttpContext;
        var userId = httpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userName = httpContext?.User.FindFirstValue(ClaimTypes.Email) 
                    ?? httpContext?.User.FindFirstValue(ClaimTypes.Name);
        var ipAddress = httpContext?.Connection.RemoteIpAddress?.ToString();
        var userAgent = httpContext?.Request.Headers.UserAgent.FirstOrDefault();
        var requestPath = httpContext?.Request.Path.ToString();
        var timestamp = DateTime.UtcNow;

        // Update audit fields on BaseEntity
        foreach (var entry in context.ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = timestamp;
                entry.Entity.CreatedBy = userId;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = timestamp;
                entry.Entity.UpdatedBy = userId;
            }
        }

        // Create audit log entries
        var auditLogs = new List<AuditLog>();

        foreach (var entry in context.ChangeTracker.Entries())
        {
            // Skip audit log entries themselves and unchanged/detached entities
            if (entry.Entity is AuditLog || 
                entry.State == EntityState.Unchanged || 
                entry.State == EntityState.Detached)
            {
                continue;
            }

            // Skip entities that don't have a primary key
            var primaryKey = entry.Properties
                .FirstOrDefault(p => p.Metadata.IsPrimaryKey());
            
            if (primaryKey == null) continue;

            var auditLog = new AuditLog
            {
                UserId = userId,
                UserName = userName,
                EntityName = entry.Entity.GetType().Name,
                Timestamp = timestamp,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                RequestPath = requestPath
            };

            switch (entry.State)
            {
                case EntityState.Added:
                    auditLog.Action = "Created";
                    auditLog.EntityId = primaryKey.CurrentValue?.ToString() ?? "0";
                    auditLog.NewValues = SerializeProperties(entry, EntityState.Added);
                    break;

                case EntityState.Modified:
                    auditLog.Action = "Updated";
                    auditLog.EntityId = primaryKey.CurrentValue?.ToString() ?? "0";
                    auditLog.OldValues = SerializeOriginalValues(entry);
                    auditLog.NewValues = SerializeCurrentValues(entry);
                    auditLog.AffectedColumns = GetModifiedProperties(entry);
                    break;

                case EntityState.Deleted:
                    auditLog.Action = "Deleted";
                    auditLog.EntityId = primaryKey.CurrentValue?.ToString() ?? "0";
                    auditLog.OldValues = SerializeProperties(entry, EntityState.Deleted);
                    break;

                default:
                    continue;
            }

            auditLogs.Add(auditLog);
        }

        // Add audit logs to context
        if (auditLogs.Any())
        {
            context.Set<AuditLog>().AddRange(auditLogs);
        }
    }

    private static string? SerializeProperties(EntityEntry entry, EntityState state)
    {
        var properties = new Dictionary<string, object?>();

        foreach (var property in entry.Properties)
        {
            if (property.Metadata.IsPrimaryKey() && state == EntityState.Added)
            {
                // Skip auto-generated primary keys on insert
                continue;
            }

            var value = state == EntityState.Deleted 
                ? property.OriginalValue 
                : property.CurrentValue;

            properties[property.Metadata.Name] = value;
        }

        return properties.Count > 0 
            ? JsonSerializer.Serialize(properties, new JsonSerializerOptions { WriteIndented = false }) 
            : null;
    }

    private static string? SerializeOriginalValues(EntityEntry entry)
    {
        var properties = new Dictionary<string, object?>();

        foreach (var property in entry.Properties.Where(p => p.IsModified))
        {
            properties[property.Metadata.Name] = property.OriginalValue;
        }

        return properties.Count > 0 
            ? JsonSerializer.Serialize(properties, new JsonSerializerOptions { WriteIndented = false }) 
            : null;
    }

    private static string? SerializeCurrentValues(EntityEntry entry)
    {
        var properties = new Dictionary<string, object?>();

        foreach (var property in entry.Properties.Where(p => p.IsModified))
        {
            properties[property.Metadata.Name] = property.CurrentValue;
        }

        return properties.Count > 0 
            ? JsonSerializer.Serialize(properties, new JsonSerializerOptions { WriteIndented = false }) 
            : null;
    }

    private static string? GetModifiedProperties(EntityEntry entry)
    {
        var modifiedProperties = entry.Properties
            .Where(p => p.IsModified)
            .Select(p => p.Metadata.Name)
            .ToList();

        return modifiedProperties.Count > 0 
            ? string.Join(",", modifiedProperties) 
            : null;
    }
}
