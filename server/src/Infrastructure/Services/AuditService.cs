using System.Text.Json;
using Application.DTOs.Audit;
using Application.DTOs.Common;
using Application.Interfaces;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

/// <summary>
/// Audit log service implementation
/// </summary>
public class AuditService : IAuditService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AuditService> _logger;

    public AuditService(ApplicationDbContext context, ILogger<AuditService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<PagedResponse<AuditLogDto>> GetAuditLogsAsync(
        AuditLogQueryDto query, 
        CancellationToken cancellationToken = default)
    {
        try
        {
            var dbQuery = _context.AuditLogs.AsQueryable();

            // Apply filters
            if (!string.IsNullOrWhiteSpace(query.EntityName))
            {
                dbQuery = dbQuery.Where(a => a.EntityName == query.EntityName);
            }

            if (!string.IsNullOrWhiteSpace(query.EntityId))
            {
                dbQuery = dbQuery.Where(a => a.EntityId == query.EntityId);
            }

            if (!string.IsNullOrWhiteSpace(query.UserId))
            {
                dbQuery = dbQuery.Where(a => a.UserId == query.UserId);
            }

            if (!string.IsNullOrWhiteSpace(query.Action))
            {
                dbQuery = dbQuery.Where(a => a.Action == query.Action);
            }

            if (query.FromDate.HasValue)
            {
                dbQuery = dbQuery.Where(a => a.Timestamp >= query.FromDate.Value);
            }

            if (query.ToDate.HasValue)
            {
                dbQuery = dbQuery.Where(a => a.Timestamp <= query.ToDate.Value);
            }

            var totalCount = await dbQuery.CountAsync(cancellationToken);

            var logs = await dbQuery
                .OrderByDescending(a => a.Timestamp)
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync(cancellationToken);

            var dtos = logs.Select(MapToDto).ToList();

            return PagedResponse<AuditLogDto>.Create(dtos, totalCount, query.Page, query.PageSize);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting audit logs");
            return PagedResponse<AuditLogDto>.Create(new List<AuditLogDto>(), 0, query.Page, query.PageSize);
        }
    }

    public async Task<ApiResponse<EntityHistoryDto>> GetEntityHistoryAsync(
        string entityName, 
        string entityId, 
        CancellationToken cancellationToken = default)
    {
        try
        {
            var logs = await _context.AuditLogs
                .Where(a => a.EntityName == entityName && a.EntityId == entityId)
                .OrderByDescending(a => a.Timestamp)
                .ToListAsync(cancellationToken);

            var history = new EntityHistoryDto
            {
                EntityName = entityName,
                EntityId = entityId,
                History = logs.Select(MapToDto).ToList()
            };

            return ApiResponse<EntityHistoryDto>.Ok(history);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting entity history for {EntityName}/{EntityId}", entityName, entityId);
            return ApiResponse<EntityHistoryDto>.Fail("Failed to retrieve entity history.");
        }
    }

    public async Task<ApiResponse<IEnumerable<AuditLogDto>>> GetUserActivityAsync(
        string userId, 
        int count = 50, 
        CancellationToken cancellationToken = default)
    {
        try
        {
            var logs = await _context.AuditLogs
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.Timestamp)
                .Take(count)
                .ToListAsync(cancellationToken);

            var dtos = logs.Select(MapToDto).ToList();
            return ApiResponse<IEnumerable<AuditLogDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user activity for {UserId}", userId);
            return ApiResponse<IEnumerable<AuditLogDto>>.Fail("Failed to retrieve user activity.");
        }
    }

    public async Task<ApiResponse<IEnumerable<string>>> GetAuditedEntityNamesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var entityNames = await _context.AuditLogs
                .Select(a => a.EntityName)
                .Distinct()
                .OrderBy(n => n)
                .ToListAsync(cancellationToken);

            return ApiResponse<IEnumerable<string>>.Ok(entityNames);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting audited entity names");
            return ApiResponse<IEnumerable<string>>.Fail("Failed to retrieve entity names.");
        }
    }

    private static AuditLogDto MapToDto(Domain.Entities.AuditLog log)
    {
        return new AuditLogDto
        {
            Id = log.Id,
            UserId = log.UserId,
            UserName = log.UserName,
            EntityName = log.EntityName,
            EntityId = log.EntityId,
            Action = log.Action,
            Timestamp = log.Timestamp,
            OldValues = DeserializeJson(log.OldValues),
            NewValues = DeserializeJson(log.NewValues),
            AffectedColumns = log.AffectedColumns?.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList(),
            IpAddress = log.IpAddress,
            RequestPath = log.RequestPath
        };
    }

    private static Dictionary<string, object?>? DeserializeJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        
        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, object?>>(json);
        }
        catch
        {
            return null;
        }
    }
}
