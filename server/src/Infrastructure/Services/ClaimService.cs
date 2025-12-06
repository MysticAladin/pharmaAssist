using Application.DTOs.Claims;
using Application.DTOs.Common;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

/// <summary>
/// Service implementation for claim/return management
/// </summary>
public class ClaimService : IClaimService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ClaimService> _logger;

    public ClaimService(ApplicationDbContext context, ILogger<ClaimService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ApiResponse<IEnumerable<ClaimSummaryDto>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var claims = await _context.Claims
            .Include(c => c.Order)
            .Include(c => c.Product)
            .Where(c => !c.IsDeleted)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

        return ApiResponse<IEnumerable<ClaimSummaryDto>>.Ok(claims.Select(MapToSummary).ToList());
    }

    public async Task<PagedResponse<ClaimSummaryDto>> GetPagedAsync(int page, int pageSize, int? customerId = null, ClaimStatus? status = null, ClaimType? type = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Claims
            .Include(c => c.Order)
            .Include(c => c.Product)
            .Where(c => !c.IsDeleted)
            .AsQueryable();

        if (customerId.HasValue)
            query = query.Where(c => c.CustomerId == customerId.Value);
        if (status.HasValue)
            query = query.Where(c => c.Status == status.Value);
        if (type.HasValue)
            query = query.Where(c => c.Type == type.Value);

        var totalCount = await query.CountAsync(cancellationToken);
        var claims = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return PagedResponse<ClaimSummaryDto>.Create(
            claims.Select(MapToSummary).ToList(),
            totalCount, page, pageSize
        );
    }

    public async Task<ApiResponse<ClaimDto>> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var claim = await _context.Claims
            .Include(c => c.Customer)
            .Include(c => c.Order)
            .Include(c => c.OrderItem)
            .Include(c => c.Product)
            .Include(c => c.ReplacementOrder)
            .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted, cancellationToken);

        if (claim == null)
            return ApiResponse<ClaimDto>.Fail("Claim not found");

        return ApiResponse<ClaimDto>.Ok(MapToDto(claim));
    }

    public async Task<ApiResponse<ClaimDto>> GetByClaimNumberAsync(string claimNumber, CancellationToken cancellationToken = default)
    {
        var claim = await _context.Claims
            .Include(c => c.Customer)
            .Include(c => c.Order)
            .Include(c => c.OrderItem)
            .Include(c => c.Product)
            .Include(c => c.ReplacementOrder)
            .FirstOrDefaultAsync(c => c.ClaimNumber == claimNumber && !c.IsDeleted, cancellationToken);

        if (claim == null)
            return ApiResponse<ClaimDto>.Fail("Claim not found");

        return ApiResponse<ClaimDto>.Ok(MapToDto(claim));
    }

    public async Task<ApiResponse<IEnumerable<ClaimSummaryDto>>> GetByCustomerAsync(int customerId, CancellationToken cancellationToken = default)
    {
        var claims = await _context.Claims
            .Include(c => c.Order)
            .Include(c => c.Product)
            .Where(c => c.CustomerId == customerId && !c.IsDeleted)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

        return ApiResponse<IEnumerable<ClaimSummaryDto>>.Ok(claims.Select(MapToSummary).ToList());
    }

    public async Task<ApiResponse<IEnumerable<ClaimSummaryDto>>> GetByOrderAsync(int orderId, CancellationToken cancellationToken = default)
    {
        var claims = await _context.Claims
            .Include(c => c.Order)
            .Include(c => c.Product)
            .Where(c => c.OrderId == orderId && !c.IsDeleted)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

        return ApiResponse<IEnumerable<ClaimSummaryDto>>.Ok(claims.Select(MapToSummary).ToList());
    }

    public async Task<ApiResponse<IEnumerable<ClaimSummaryDto>>> GetByStatusAsync(ClaimStatus status, CancellationToken cancellationToken = default)
    {
        var claims = await _context.Claims
            .Include(c => c.Order)
            .Include(c => c.Product)
            .Where(c => c.Status == status && !c.IsDeleted)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

        return ApiResponse<IEnumerable<ClaimSummaryDto>>.Ok(claims.Select(MapToSummary).ToList());
    }

    public async Task<ApiResponse<ClaimDto>> CreateAsync(CreateClaimDto dto, CancellationToken cancellationToken = default)
    {
        var order = await _context.Orders.FindAsync(new object[] { dto.OrderId }, cancellationToken);
        if (order == null)
            return ApiResponse<ClaimDto>.Fail("Order not found");

        var claim = new Claim
        {
            ClaimNumber = await GenerateClaimNumberAsync(cancellationToken),
            CustomerId = order.CustomerId,
            OrderId = dto.OrderId,
            OrderItemId = dto.OrderItemId,
            Type = dto.Type,
            Status = ClaimStatus.Submitted,
            Reason = dto.Reason,
            Description = dto.Description,
            ProductId = dto.ProductId,
            Quantity = dto.Quantity,
            BatchNumber = dto.BatchNumber,
            AttachmentIds = dto.AttachmentIds != null ? string.Join(",", dto.AttachmentIds) : null
        };

        _context.Claims.Add(claim);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created claim {ClaimNumber} for order {OrderNumber}", claim.ClaimNumber, order.OrderNumber);

        return await GetByIdAsync(claim.Id, cancellationToken);
    }

    public async Task<ApiResponse<ClaimDto>> CreateFromPortalAsync(int customerId, PortalCreateClaimDto dto, CancellationToken cancellationToken = default)
    {
        var order = await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(i => i.Product)
            .Include(o => o.OrderItems)
                .ThenInclude(i => i.ProductBatch)
            .FirstOrDefaultAsync(o => o.Id == dto.OrderId && o.CustomerId == customerId, cancellationToken);

        if (order == null)
            return ApiResponse<ClaimDto>.Fail("Order not found or access denied");

        // Validate order item belongs to the order
        var orderItem = order.OrderItems.FirstOrDefault(i => i.Id == dto.OrderItemId);
        if (orderItem == null)
            return ApiResponse<ClaimDto>.Fail("Order item not found");

        // Check if order is eligible for claims (delivered or shipped)
        if (order.Status != OrderStatus.Delivered && order.Status != OrderStatus.Shipped)
            return ApiResponse<ClaimDto>.Fail("Claims can only be submitted for shipped or delivered orders");

        var claim = new Claim
        {
            ClaimNumber = await GenerateClaimNumberAsync(cancellationToken),
            CustomerId = customerId,
            OrderId = dto.OrderId,
            OrderItemId = dto.OrderItemId,
            Type = dto.Type,
            Status = ClaimStatus.Submitted,
            Reason = dto.Reason,
            Description = dto.Description,
            ProductId = orderItem.ProductId,
            Quantity = Math.Min(dto.Quantity, orderItem.Quantity),
            BatchNumber = orderItem.ProductBatch?.BatchNumber,
            AttachmentIds = dto.AttachmentIds != null ? string.Join(",", dto.AttachmentIds) : null
        };

        _context.Claims.Add(claim);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Customer created claim {ClaimNumber} for order {OrderNumber}", claim.ClaimNumber, order.OrderNumber);

        return await GetByIdAsync(claim.Id, cancellationToken);
    }

    public async Task<ApiResponse<ClaimDto>> UpdateStatusAsync(int id, UpdateClaimStatusDto dto, CancellationToken cancellationToken = default)
    {
        var claim = await _context.Claims.FindAsync(new object[] { id }, cancellationToken);
        if (claim == null || claim.IsDeleted)
            return ApiResponse<ClaimDto>.Fail("Claim not found");

        claim.Status = dto.Status;
        if (!string.IsNullOrEmpty(dto.Notes))
        {
            claim.ResolutionNotes = string.IsNullOrEmpty(claim.ResolutionNotes) 
                ? dto.Notes 
                : $"{claim.ResolutionNotes}\n\n[{DateTime.UtcNow:yyyy-MM-dd HH:mm}] {dto.Notes}";
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated claim {ClaimNumber} status to {Status}", claim.ClaimNumber, dto.Status);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<ApiResponse<ClaimDto>> ResolveAsync(int id, ResolveClaimDto dto, CancellationToken cancellationToken = default)
    {
        var claim = await _context.Claims.FindAsync(new object[] { id }, cancellationToken);
        if (claim == null || claim.IsDeleted)
            return ApiResponse<ClaimDto>.Fail("Claim not found");

        claim.Status = dto.Status;
        claim.ResolutionNotes = dto.ResolutionNotes;
        claim.RefundAmount = dto.RefundAmount;
        claim.ResolvedAt = DateTime.UtcNow;
        // TODO: Set ResolvedBy from current user

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Resolved claim {ClaimNumber} with status {Status}", claim.ClaimNumber, dto.Status);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<ApiResponse<ClaimDto>> UpdateReturnTrackingAsync(int id, UpdateReturnTrackingDto dto, CancellationToken cancellationToken = default)
    {
        var claim = await _context.Claims.FindAsync(new object[] { id }, cancellationToken);
        if (claim == null || claim.IsDeleted)
            return ApiResponse<ClaimDto>.Fail("Claim not found");

        claim.ReturnTrackingNumber = dto.TrackingNumber;
        if (claim.Status == ClaimStatus.Approved)
            claim.Status = ClaimStatus.AwaitingReturn;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<ApiResponse<ClaimDto>> MarkReturnReceivedAsync(int id, CancellationToken cancellationToken = default)
    {
        var claim = await _context.Claims.FindAsync(new object[] { id }, cancellationToken);
        if (claim == null || claim.IsDeleted)
            return ApiResponse<ClaimDto>.Fail("Claim not found");

        claim.ReturnReceivedAt = DateTime.UtcNow;
        claim.Status = ClaimStatus.ReturnReceived;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<ApiResponse<bool>> CancelAsync(int id, string reason, CancellationToken cancellationToken = default)
    {
        var claim = await _context.Claims.FindAsync(new object[] { id }, cancellationToken);
        if (claim == null || claim.IsDeleted)
            return ApiResponse<bool>.Fail("Claim not found");

        if (claim.Status == ClaimStatus.Resolved)
            return ApiResponse<bool>.Fail("Cannot cancel a resolved claim");

        claim.Status = ClaimStatus.Cancelled;
        claim.ResolutionNotes = $"Cancelled: {reason}";

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Cancelled claim {ClaimNumber}: {Reason}", claim.ClaimNumber, reason);

        return ApiResponse<bool>.Ok(true, "Claim cancelled successfully");
    }

    public async Task<string> GenerateClaimNumberAsync(CancellationToken cancellationToken = default)
    {
        var prefix = $"CLM-{DateTime.UtcNow:yyyyMM}-";
        var lastClaim = await _context.Claims
            .Where(c => c.ClaimNumber.StartsWith(prefix))
            .OrderByDescending(c => c.ClaimNumber)
            .FirstOrDefaultAsync(cancellationToken);

        var nextNumber = 1;
        if (lastClaim != null)
        {
            var lastNumberStr = lastClaim.ClaimNumber.Replace(prefix, "");
            if (int.TryParse(lastNumberStr, out var lastNumber))
                nextNumber = lastNumber + 1;
        }

        return $"{prefix}{nextNumber:D4}";
    }

    private static ClaimSummaryDto MapToSummary(Claim claim)
    {
        return new ClaimSummaryDto
        {
            Id = claim.Id,
            ClaimNumber = claim.ClaimNumber,
            OrderNumber = claim.Order?.OrderNumber ?? "",
            OrderId = claim.OrderId,
            Type = claim.Type,
            TypeName = claim.Type.ToString(),
            Status = claim.Status,
            StatusName = claim.Status.ToString(),
            ProductName = claim.Product?.Name ?? "Multiple Items",
            Quantity = claim.Quantity,
            Reason = claim.Reason,
            CreatedAt = claim.CreatedAt,
            ResolvedAt = claim.ResolvedAt,
            RefundAmount = claim.RefundAmount
        };
    }

    private static ClaimDto MapToDto(Claim claim)
    {
        var dto = new ClaimDto
        {
            Id = claim.Id,
            ClaimNumber = claim.ClaimNumber,
            OrderNumber = claim.Order?.OrderNumber ?? "",
            OrderId = claim.OrderId,
            Type = claim.Type,
            TypeName = claim.Type.ToString(),
            Status = claim.Status,
            StatusName = claim.Status.ToString(),
            ProductName = claim.Product?.Name ?? "Multiple Items",
            Quantity = claim.Quantity,
            Reason = claim.Reason,
            CreatedAt = claim.CreatedAt,
            ResolvedAt = claim.ResolvedAt,
            RefundAmount = claim.RefundAmount,
            CustomerId = claim.CustomerId,
            CustomerName = claim.Customer != null ? $"{claim.Customer.FirstName} {claim.Customer.LastName}".Trim() : "",
            OrderItemId = claim.OrderItemId,
            ProductId = claim.ProductId,
            ProductSku = claim.Product?.SKU,
            BatchNumber = claim.BatchNumber,
            Description = claim.Description,
            ResolutionNotes = claim.ResolutionNotes,
            ReplacementOrderId = claim.ReplacementOrderId,
            ReplacementOrderNumber = claim.ReplacementOrder?.OrderNumber,
            ResolvedBy = claim.ResolvedBy,
            ReturnTrackingNumber = claim.ReturnTrackingNumber,
            ReturnReceivedAt = claim.ReturnReceivedAt,
            UpdatedAt = claim.UpdatedAt,
            AttachmentIds = !string.IsNullOrEmpty(claim.AttachmentIds) 
                ? claim.AttachmentIds.Split(',').Select(int.Parse).ToList() 
                : new List<int>()
        };

        // Build timeline
        dto.Timeline = BuildTimeline(claim);

        return dto;
    }

    private static List<ClaimTimelineEvent> BuildTimeline(Claim claim)
    {
        var timeline = new List<ClaimTimelineEvent>
        {
            new() { Date = claim.CreatedAt, Status = ClaimStatus.Submitted, StatusName = "Submitted", Description = "Claim submitted" }
        };

        // Add status-based events (simplified - in production would use audit log)
        if (claim.Status >= ClaimStatus.UnderReview)
            timeline.Add(new() { Date = claim.CreatedAt.AddHours(1), Status = ClaimStatus.UnderReview, StatusName = "Under Review", Description = "Claim is being reviewed" });

        if (claim.Status >= ClaimStatus.Approved)
            timeline.Add(new() { Date = claim.CreatedAt.AddDays(1), Status = ClaimStatus.Approved, StatusName = "Approved", Description = "Claim approved" });

        if (claim.Status == ClaimStatus.Rejected)
            timeline.Add(new() { Date = claim.ResolvedAt ?? claim.UpdatedAt ?? DateTime.UtcNow, Status = ClaimStatus.Rejected, StatusName = "Rejected", Description = "Claim rejected" });

        if (claim.Status >= ClaimStatus.AwaitingReturn && !string.IsNullOrEmpty(claim.ReturnTrackingNumber))
            timeline.Add(new() { Date = claim.UpdatedAt ?? DateTime.UtcNow, Status = ClaimStatus.AwaitingReturn, StatusName = "Awaiting Return", Description = $"Tracking: {claim.ReturnTrackingNumber}" });

        if (claim.ReturnReceivedAt.HasValue)
            timeline.Add(new() { Date = claim.ReturnReceivedAt.Value, Status = ClaimStatus.ReturnReceived, StatusName = "Return Received", Description = "Product returned and received" });

        if (claim.Status == ClaimStatus.Resolved && claim.ResolvedAt.HasValue)
            timeline.Add(new() { Date = claim.ResolvedAt.Value, Status = ClaimStatus.Resolved, StatusName = "Resolved", Description = claim.ResolutionNotes ?? "Claim resolved" });

        return timeline.OrderBy(t => t.Date).ToList();
    }
}
