using Application.DTOs.Targets;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Api.Controllers;

/// <summary>
/// API endpoints for sales targets and budgets management
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TargetsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<TargetsController> _logger;

    public TargetsController(ApplicationDbContext context, ILogger<TargetsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    #region Sales Targets

    /// <summary>
    /// Get all sales targets with optional filters
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,Manager,SalesRep")]
    public async Task<ActionResult<IEnumerable<SalesTargetDto>>> GetSalesTargets(
        [FromQuery] int? year = null,
        [FromQuery] int? month = null,
        [FromQuery] int? quarter = null,
        [FromQuery] SalesTargetType? type = null,
        [FromQuery] bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.SalesTargets
            .Include(t => t.User)
            .Include(t => t.Customer)
            .Include(t => t.Product)
            .Include(t => t.Category)
            .Include(t => t.Manufacturer)
            .Include(t => t.Canton)
            .AsNoTracking();

        // Apply filters
        if (year.HasValue)
            query = query.Where(t => t.Year == year.Value);
        
        if (month.HasValue)
            query = query.Where(t => t.Month == month.Value);
        
        if (quarter.HasValue)
            query = query.Where(t => t.Quarter == quarter.Value);
        
        if (type.HasValue)
            query = query.Where(t => t.TargetType == type.Value);
        
        if (activeOnly == true)
            query = query.Where(t => t.IsActive);

        // If SalesRep, only show their own targets
        if (User.IsInRole("SalesRep") && !User.IsInRole("Admin") && !User.IsInRole("Manager"))
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            query = query.Where(t => t.UserId == userId);
        }

        var targets = await query
            .OrderByDescending(t => t.Year)
            .ThenByDescending(t => t.Month ?? 0)
            .ThenByDescending(t => t.Quarter ?? 0)
            .ToListAsync(cancellationToken);

        return Ok(targets.Select(MapToDto));
    }

    /// <summary>
    /// Get target summary dashboard
    /// </summary>
    [HttpGet("summary")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<TargetSummaryDto>> GetTargetSummary(
        [FromQuery] int? year = null,
        CancellationToken cancellationToken = default)
    {
        year ??= DateTime.UtcNow.Year;

        var targets = await _context.SalesTargets
            .Include(t => t.User)
            .Where(t => t.Year == year.Value && t.IsActive)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var summary = new TargetSummaryDto
        {
            TotalTargets = targets.Count,
            AchievedTargets = targets.Count(t => t.IsAchieved),
            OverAchievedTargets = targets.Count(t => t.IsOverAchieved),
            InProgressTargets = targets.Count(t => !t.IsAchieved && t.CurrentValue > 0),
            OverallAchievementPercentage = targets.Any() 
                ? Math.Round(targets.Average(t => t.AchievementPercentage), 2) 
                : 0,
            TopPerformers = targets
                .OrderByDescending(t => t.AchievementPercentage)
                .Take(5)
                .Select(MapToDto)
                .ToList(),
            NeedsAttention = targets
                .Where(t => !t.IsAchieved && t.AchievementPercentage < 50)
                .OrderBy(t => t.AchievementPercentage)
                .Take(5)
                .Select(MapToDto)
                .ToList()
        };

        return Ok(summary);
    }

    /// <summary>
    /// Get a specific sales target
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<SalesTargetDto>> GetSalesTarget(int id, CancellationToken cancellationToken)
    {
        var target = await _context.SalesTargets
            .Include(t => t.User)
            .Include(t => t.Customer)
            .Include(t => t.Product)
            .Include(t => t.Category)
            .Include(t => t.Manufacturer)
            .Include(t => t.Canton)
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (target == null)
            return NotFound();

        return Ok(MapToDto(target));
    }

    /// <summary>
    /// Create a new sales target
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<SalesTargetDto>> CreateSalesTarget(
        [FromBody] CreateSalesTargetDto dto,
        CancellationToken cancellationToken)
    {
        var target = new SalesTarget
        {
            Name = dto.Name,
            Description = dto.Description,
            TargetType = dto.TargetType,
            UserId = dto.UserId,
            CustomerId = dto.CustomerId,
            ProductId = dto.ProductId,
            CategoryId = dto.CategoryId,
            ManufacturerId = dto.ManufacturerId,
            CantonId = dto.CantonId,
            Year = dto.Year,
            Month = dto.Month,
            Quarter = dto.Quarter,
            Metric = dto.Metric,
            TargetValue = dto.TargetValue,
            IsActive = dto.IsActive
        };

        _context.SalesTargets.Add(target);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created sales target {TargetName} with ID {TargetId}", target.Name, target.Id);

        return CreatedAtAction(nameof(GetSalesTarget), new { id = target.Id }, MapToDto(target));
    }

    /// <summary>
    /// Update a sales target
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<SalesTargetDto>> UpdateSalesTarget(
        int id,
        [FromBody] CreateSalesTargetDto dto,
        CancellationToken cancellationToken)
    {
        var target = await _context.SalesTargets.FindAsync([id], cancellationToken);

        if (target == null)
            return NotFound();

        if (target.LockedAt.HasValue)
            return BadRequest(new { message = "This target is locked and cannot be modified" });

        target.Name = dto.Name;
        target.Description = dto.Description;
        target.TargetType = dto.TargetType;
        target.UserId = dto.UserId;
        target.CustomerId = dto.CustomerId;
        target.ProductId = dto.ProductId;
        target.CategoryId = dto.CategoryId;
        target.ManufacturerId = dto.ManufacturerId;
        target.CantonId = dto.CantonId;
        target.Year = dto.Year;
        target.Month = dto.Month;
        target.Quarter = dto.Quarter;
        target.Metric = dto.Metric;
        target.TargetValue = dto.TargetValue;
        target.IsActive = dto.IsActive;

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(MapToDto(target));
    }

    /// <summary>
    /// Update target progress
    /// </summary>
    [HttpPost("{id}/progress")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<SalesTargetDto>> UpdateProgress(
        int id,
        [FromBody] UpdateTargetProgressDto dto,
        CancellationToken cancellationToken)
    {
        var target = await _context.SalesTargets
            .Include(t => t.ProgressHistory)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (target == null)
            return NotFound();

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        // Record progress history
        var progress = new SalesTargetProgress
        {
            SalesTargetId = id,
            PreviousValue = target.CurrentValue,
            Value = dto.NewValue,
            Notes = dto.Notes,
            RecordedBy = userId,
            RecordedAt = DateTime.UtcNow
        };

        _context.SalesTargetProgress.Add(progress);

        // Update current value
        target.CurrentValue = dto.NewValue;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Updated progress for target {TargetId}: {OldValue} -> {NewValue}",
            id, progress.PreviousValue, dto.NewValue);

        return Ok(MapToDto(target));
    }

    /// <summary>
    /// Get progress history for a target
    /// </summary>
    [HttpGet("{id}/progress")]
    public async Task<ActionResult<IEnumerable<SalesTargetProgressDto>>> GetProgressHistory(
        int id,
        CancellationToken cancellationToken)
    {
        var history = await _context.SalesTargetProgress
            .Where(p => p.SalesTargetId == id)
            .OrderByDescending(p => p.RecordedAt)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return Ok(history.Select(p => new SalesTargetProgressDto
        {
            Id = p.Id,
            SalesTargetId = p.SalesTargetId,
            RecordedAt = p.RecordedAt,
            Value = p.Value,
            PreviousValue = p.PreviousValue,
            IncrementalValue = p.IncrementalValue,
            Notes = p.Notes,
            RecordedBy = p.RecordedBy
        }));
    }

    /// <summary>
    /// Lock a target (prevent further modifications)
    /// </summary>
    [HttpPost("{id}/lock")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> LockTarget(int id, CancellationToken cancellationToken)
    {
        var target = await _context.SalesTargets.FindAsync([id], cancellationToken);

        if (target == null)
            return NotFound();

        target.LockedAt = DateTime.UtcNow;
        target.LockedBy = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new { message = "Target locked successfully" });
    }

    /// <summary>
    /// Delete a sales target
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteSalesTarget(int id, CancellationToken cancellationToken)
    {
        var target = await _context.SalesTargets.FindAsync([id], cancellationToken);

        if (target == null)
            return NotFound();

        if (target.LockedAt.HasValue)
            return BadRequest(new { message = "Cannot delete a locked target" });

        _context.SalesTargets.Remove(target);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    #endregion

    #region Helpers

    private static SalesTargetDto MapToDto(SalesTarget target) => new()
    {
        Id = target.Id,
        Name = target.Name,
        Description = target.Description,
        TargetType = target.TargetType,
        TargetTypeName = GetTargetTypeName(target.TargetType),
        UserId = target.UserId,
        UserName = target.User != null ? $"{target.User.FirstName} {target.User.LastName}" : null,
        CustomerId = target.CustomerId,
        CustomerName = target.Customer?.FullName,
        ProductId = target.ProductId,
        ProductName = target.Product?.Name,
        CategoryId = target.CategoryId,
        CategoryName = target.Category?.Name,
        ManufacturerId = target.ManufacturerId,
        ManufacturerName = target.Manufacturer?.Name,
        CantonId = target.CantonId,
        CantonName = target.Canton?.Name,
        Year = target.Year,
        Month = target.Month,
        Quarter = target.Quarter,
        PeriodDisplay = GetPeriodDisplay(target.Year, target.Month, target.Quarter),
        Metric = target.Metric,
        MetricName = GetMetricName(target.Metric),
        TargetValue = target.TargetValue,
        CurrentValue = target.CurrentValue,
        AchievementPercentage = target.AchievementPercentage,
        IsAchieved = target.IsAchieved,
        IsOverAchieved = target.IsOverAchieved,
        IsActive = target.IsActive,
        IsLocked = target.LockedAt.HasValue,
        LockedAt = target.LockedAt,
        CreatedAt = target.CreatedAt
    };

    private static string GetTargetTypeName(SalesTargetType type) => type switch
    {
        SalesTargetType.SalesRep => "Sales Representative",
        SalesTargetType.Customer => "Customer",
        SalesTargetType.Product => "Product",
        SalesTargetType.Category => "Category",
        SalesTargetType.Manufacturer => "Manufacturer",
        SalesTargetType.Territory => "Territory",
        SalesTargetType.Company => "Company",
        _ => type.ToString()
    };

    private static string GetMetricName(SalesTargetMetric metric) => metric switch
    {
        SalesTargetMetric.Revenue => "Revenue (KM)",
        SalesTargetMetric.Quantity => "Units Sold",
        SalesTargetMetric.Orders => "Number of Orders",
        SalesTargetMetric.NewCustomers => "New Customers",
        SalesTargetMetric.Visits => "Customer Visits",
        _ => metric.ToString()
    };

    private static string GetPeriodDisplay(int year, int? month, int? quarter)
    {
        if (month.HasValue)
            return $"{year}-{month:D2}";
        if (quarter.HasValue)
            return $"{year} Q{quarter}";
        return year.ToString();
    }

    #endregion
}
