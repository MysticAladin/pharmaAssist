using Application.Common;
using Application.DTOs.Tenders;
using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

/// <summary>
/// Service for tender management operations
/// </summary>
public class TenderService : ITenderService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<TenderService> _logger;

    public TenderService(ApplicationDbContext context, ILogger<TenderService> logger)
    {
        _context = context;
        _logger = logger;
    }

    #region Tender CRUD

    public async Task<TenderDetailDto?> GetTenderByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var tender = await _context.Tenders
            .Include(t => t.Customer)
            .Include(t => t.AssignedUser)
            .Include(t => t.CreatedByUser)
            .Include(t => t.Items).ThenInclude(i => i.Product)
            .Include(t => t.Bids).ThenInclude(b => b.Items).ThenInclude(bi => bi.Product)
            .Include(t => t.Bids).ThenInclude(b => b.PreparedBy)
            .Include(t => t.Documents).ThenInclude(d => d.UploadedBy)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        return tender == null ? null : MapToDetailDto(tender);
    }

    public async Task<TenderDetailDto?> GetTenderByNumberAsync(string tenderNumber, CancellationToken cancellationToken = default)
    {
        var tender = await _context.Tenders
            .Include(t => t.Customer)
            .Include(t => t.Items)
            .Include(t => t.Bids)
            .Include(t => t.Documents)
            .FirstOrDefaultAsync(t => t.TenderNumber == tenderNumber, cancellationToken);

        return tender == null ? null : MapToDetailDto(tender);
    }

    public async Task<PagedResult<TenderDto>> GetTendersAsync(TenderFilterDto filter, CancellationToken cancellationToken = default)
    {
        var query = _context.Tenders
            .Include(t => t.Customer)
            .Include(t => t.AssignedUser)
            .Include(t => t.Items)
            .Include(t => t.Bids)
            .Include(t => t.Documents)
            .AsNoTracking()
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.ToLower();
            query = query.Where(t => 
                t.TenderNumber.ToLower().Contains(term) ||
                t.Title.ToLower().Contains(term) ||
                (t.Description != null && t.Description.ToLower().Contains(term)) ||
                t.Customer.FullName.ToLower().Contains(term));
        }

        if (filter.Status.HasValue)
            query = query.Where(t => t.Status == filter.Status.Value);

        if (filter.Type.HasValue)
            query = query.Where(t => t.Type == filter.Type.Value);

        if (filter.Priority.HasValue)
            query = query.Where(t => t.Priority == filter.Priority.Value);

        if (filter.CustomerId.HasValue)
            query = query.Where(t => t.CustomerId == filter.CustomerId.Value);

        if (!string.IsNullOrEmpty(filter.AssignedUserId))
            query = query.Where(t => t.AssignedUserId == filter.AssignedUserId);

        if (filter.DeadlineFrom.HasValue)
            query = query.Where(t => t.SubmissionDeadline >= filter.DeadlineFrom.Value);

        if (filter.DeadlineTo.HasValue)
            query = query.Where(t => t.SubmissionDeadline <= filter.DeadlineTo.Value);

        if (filter.IsOpen == true)
            query = query.Where(t => t.Status == TenderStatus.Open && t.SubmissionDeadline >= DateTime.UtcNow);

        if (filter.IsOverdue == true)
            query = query.Where(t => t.Status == TenderStatus.Open && t.SubmissionDeadline < DateTime.UtcNow);

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply sorting
        query = filter.SortBy?.ToLower() switch
        {
            "title" => filter.SortDescending ? query.OrderByDescending(t => t.Title) : query.OrderBy(t => t.Title),
            "customer" => filter.SortDescending ? query.OrderByDescending(t => t.Customer.FullName) : query.OrderBy(t => t.Customer.FullName),
            "status" => filter.SortDescending ? query.OrderByDescending(t => t.Status) : query.OrderBy(t => t.Status),
            "priority" => filter.SortDescending ? query.OrderByDescending(t => t.Priority) : query.OrderBy(t => t.Priority),
            "createdat" => filter.SortDescending ? query.OrderByDescending(t => t.CreatedAt) : query.OrderBy(t => t.CreatedAt),
            _ => filter.SortDescending ? query.OrderByDescending(t => t.SubmissionDeadline) : query.OrderBy(t => t.SubmissionDeadline)
        };

        // Apply pagination
        var tenders = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<TenderDto>
        {
            Items = tenders.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / filter.PageSize)
        };
    }

    public async Task<TenderDto> CreateTenderAsync(CreateTenderDto dto, string userId, CancellationToken cancellationToken = default)
    {
        var tender = new Tender
        {
            TenderNumber = await GenerateTenderNumberAsync(cancellationToken),
            Title = dto.Title,
            Description = dto.Description,
            Type = dto.Type,
            Priority = dto.Priority,
            Status = TenderStatus.Draft,
            CustomerId = dto.CustomerId,
            SubmissionDeadline = dto.SubmissionDeadline,
            OpeningDate = dto.OpeningDate,
            ContractStartDate = dto.ContractStartDate,
            ContractEndDate = dto.ContractEndDate,
            EstimatedValue = dto.EstimatedValue,
            Budget = dto.Budget,
            BidSecurityAmount = dto.BidSecurityAmount,
            Currency = dto.Currency,
            DeliveryLocation = dto.DeliveryLocation,
            DeliveryTerms = dto.DeliveryTerms,
            PaymentTerms = dto.PaymentTerms,
            SpecialConditions = dto.SpecialConditions,
            EvaluationCriteria = dto.EvaluationCriteria,
            ContactPerson = dto.ContactPerson,
            ContactEmail = dto.ContactEmail,
            ContactPhone = dto.ContactPhone,
            AssignedUserId = dto.AssignedUserId,
            InternalNotes = dto.InternalNotes,
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow
        };

        // Add items
        foreach (var itemDto in dto.Items)
        {
            tender.Items.Add(new TenderItem
            {
                ProductId = itemDto.ProductId,
                Description = itemDto.Description,
                Specification = itemDto.Specification,
                Unit = itemDto.Unit,
                Quantity = itemDto.Quantity,
                EstimatedUnitPrice = itemDto.EstimatedUnitPrice,
                Notes = itemDto.Notes,
                SortOrder = itemDto.SortOrder,
                CreatedAt = DateTime.UtcNow
            });
        }

        _context.Tenders.Add(tender);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created tender {TenderNumber} for customer {CustomerId}", tender.TenderNumber, tender.CustomerId);

        // Reload with navigation properties
        await _context.Entry(tender).Reference(t => t.Customer).LoadAsync(cancellationToken);
        return MapToDto(tender);
    }

    public async Task<TenderDto> UpdateTenderAsync(int id, UpdateTenderDto dto, CancellationToken cancellationToken = default)
    {
        var tender = await _context.Tenders
            .Include(t => t.Items)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken)
            ?? throw new InvalidOperationException($"Tender {id} not found");

        // Only allow updates in draft/published status
        if (tender.Status > TenderStatus.Published)
            throw new InvalidOperationException("Cannot update tender after it has been opened");

        tender.Title = dto.Title;
        tender.Description = dto.Description;
        tender.Type = dto.Type;
        tender.Priority = dto.Priority;
        tender.CustomerId = dto.CustomerId;
        tender.SubmissionDeadline = dto.SubmissionDeadline;
        tender.OpeningDate = dto.OpeningDate;
        tender.ContractStartDate = dto.ContractStartDate;
        tender.ContractEndDate = dto.ContractEndDate;
        tender.EstimatedValue = dto.EstimatedValue;
        tender.Budget = dto.Budget;
        tender.BidSecurityAmount = dto.BidSecurityAmount;
        tender.Currency = dto.Currency;
        tender.DeliveryLocation = dto.DeliveryLocation;
        tender.DeliveryTerms = dto.DeliveryTerms;
        tender.PaymentTerms = dto.PaymentTerms;
        tender.SpecialConditions = dto.SpecialConditions;
        tender.EvaluationCriteria = dto.EvaluationCriteria;
        tender.ContactPerson = dto.ContactPerson;
        tender.ContactEmail = dto.ContactEmail;
        tender.ContactPhone = dto.ContactPhone;
        tender.AssignedUserId = dto.AssignedUserId;
        tender.InternalNotes = dto.InternalNotes;
        tender.UpdatedAt = DateTime.UtcNow;

        if (dto.Status.HasValue && dto.Status.Value != tender.Status)
        {
            tender.Status = dto.Status.Value;
            if (dto.Status.Value == TenderStatus.Published)
                tender.PublishedDate = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        await _context.Entry(tender).Reference(t => t.Customer).LoadAsync(cancellationToken);
        return MapToDto(tender);
    }

    public async Task<bool> DeleteTenderAsync(int id, CancellationToken cancellationToken = default)
    {
        var tender = await _context.Tenders.FindAsync(new object[] { id }, cancellationToken);
        if (tender == null) return false;

        if (tender.Status > TenderStatus.Draft)
            throw new InvalidOperationException("Cannot delete tender that has been published");

        _context.Tenders.Remove(tender);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Deleted tender {TenderId}", id);
        return true;
    }

    #endregion

    #region Tender Status Management

    public async Task<TenderDto> PublishTenderAsync(int id, CancellationToken cancellationToken = default)
    {
        var tender = await _context.Tenders.Include(t => t.Customer).FirstOrDefaultAsync(t => t.Id == id, cancellationToken)
            ?? throw new InvalidOperationException($"Tender {id} not found");

        if (tender.Status != TenderStatus.Draft)
            throw new InvalidOperationException("Only draft tenders can be published");

        tender.Status = TenderStatus.Published;
        tender.PublishedDate = DateTime.UtcNow;
        tender.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return MapToDto(tender);
    }

    public async Task<TenderDto> OpenTenderAsync(int id, CancellationToken cancellationToken = default)
    {
        var tender = await _context.Tenders.Include(t => t.Customer).FirstOrDefaultAsync(t => t.Id == id, cancellationToken)
            ?? throw new InvalidOperationException($"Tender {id} not found");

        if (tender.Status != TenderStatus.Published)
            throw new InvalidOperationException("Only published tenders can be opened");

        tender.Status = TenderStatus.Open;
        tender.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return MapToDto(tender);
    }

    public async Task<TenderDto> CloseTenderAsync(int id, CancellationToken cancellationToken = default)
    {
        var tender = await _context.Tenders.Include(t => t.Customer).FirstOrDefaultAsync(t => t.Id == id, cancellationToken)
            ?? throw new InvalidOperationException($"Tender {id} not found");

        if (tender.Status != TenderStatus.Open)
            throw new InvalidOperationException("Only open tenders can be closed");

        tender.Status = TenderStatus.UnderEvaluation;
        tender.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return MapToDto(tender);
    }

    public async Task<TenderDto> CancelTenderAsync(int id, string reason, CancellationToken cancellationToken = default)
    {
        var tender = await _context.Tenders.Include(t => t.Customer).FirstOrDefaultAsync(t => t.Id == id, cancellationToken)
            ?? throw new InvalidOperationException($"Tender {id} not found");

        if (tender.Status == TenderStatus.Completed)
            throw new InvalidOperationException("Cannot cancel completed tender");

        tender.Status = TenderStatus.Cancelled;
        tender.InternalNotes = (tender.InternalNotes ?? "") + $"\nCancelled: {reason}";
        tender.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return MapToDto(tender);
    }

    public async Task<TenderDto> AwardTenderAsync(int id, int winningBidId, CancellationToken cancellationToken = default)
    {
        var tender = await _context.Tenders
            .Include(t => t.Customer)
            .Include(t => t.Bids)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken)
            ?? throw new InvalidOperationException($"Tender {id} not found");

        if (tender.Status != TenderStatus.UnderEvaluation)
            throw new InvalidOperationException("Tender must be under evaluation to award");

        var winningBid = tender.Bids.FirstOrDefault(b => b.Id == winningBidId)
            ?? throw new InvalidOperationException($"Bid {winningBidId} not found for this tender");

        tender.Status = TenderStatus.Awarded;
        tender.WinningBidId = winningBidId;
        tender.AwardedDate = DateTime.UtcNow;
        tender.UpdatedAt = DateTime.UtcNow;

        winningBid.Status = TenderBidStatus.Won;

        // Mark other bids as lost
        foreach (var bid in tender.Bids.Where(b => b.Id != winningBidId && b.Status == TenderBidStatus.Submitted))
        {
            bid.Status = TenderBidStatus.Lost;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return MapToDto(tender);
    }

    #endregion

    #region Tender Items

    public async Task<TenderItemDto> AddTenderItemAsync(int tenderId, CreateTenderItemDto dto, CancellationToken cancellationToken = default)
    {
        var tender = await _context.Tenders.FindAsync(new object[] { tenderId }, cancellationToken)
            ?? throw new InvalidOperationException($"Tender {tenderId} not found");

        if (tender.Status > TenderStatus.Published)
            throw new InvalidOperationException("Cannot add items after tender is opened");

        var item = new TenderItem
        {
            TenderId = tenderId,
            ProductId = dto.ProductId,
            Description = dto.Description,
            Specification = dto.Specification,
            Unit = dto.Unit,
            Quantity = dto.Quantity,
            EstimatedUnitPrice = dto.EstimatedUnitPrice,
            Notes = dto.Notes,
            SortOrder = dto.SortOrder,
            CreatedAt = DateTime.UtcNow
        };

        _context.Set<TenderItem>().Add(item);
        await _context.SaveChangesAsync(cancellationToken);

        if (dto.ProductId.HasValue)
            await _context.Entry(item).Reference(i => i.Product).LoadAsync(cancellationToken);

        return MapToItemDto(item);
    }

    public async Task<TenderItemDto> UpdateTenderItemAsync(int itemId, CreateTenderItemDto dto, CancellationToken cancellationToken = default)
    {
        var item = await _context.Set<TenderItem>()
            .Include(i => i.Tender)
            .FirstOrDefaultAsync(i => i.Id == itemId, cancellationToken)
            ?? throw new InvalidOperationException($"Item {itemId} not found");

        if (item.Tender.Status > TenderStatus.Published)
            throw new InvalidOperationException("Cannot update items after tender is opened");

        item.ProductId = dto.ProductId;
        item.Description = dto.Description;
        item.Specification = dto.Specification;
        item.Unit = dto.Unit;
        item.Quantity = dto.Quantity;
        item.EstimatedUnitPrice = dto.EstimatedUnitPrice;
        item.Notes = dto.Notes;
        item.SortOrder = dto.SortOrder;
        item.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        if (dto.ProductId.HasValue)
            await _context.Entry(item).Reference(i => i.Product).LoadAsync(cancellationToken);

        return MapToItemDto(item);
    }

    public async Task<bool> RemoveTenderItemAsync(int itemId, CancellationToken cancellationToken = default)
    {
        var item = await _context.Set<TenderItem>()
            .Include(i => i.Tender)
            .FirstOrDefaultAsync(i => i.Id == itemId, cancellationToken);

        if (item == null) return false;

        if (item.Tender.Status > TenderStatus.Published)
            throw new InvalidOperationException("Cannot remove items after tender is opened");

        _context.Set<TenderItem>().Remove(item);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    #endregion

    #region Bids

    public async Task<TenderBidDto?> GetBidByIdAsync(int bidId, CancellationToken cancellationToken = default)
    {
        var bid = await _context.Set<TenderBid>()
            .Include(b => b.Tender)
            .Include(b => b.Items).ThenInclude(i => i.Product)
            .Include(b => b.Items).ThenInclude(i => i.TenderItem)
            .Include(b => b.PreparedBy)
            .Include(b => b.ApprovedBy)
            .FirstOrDefaultAsync(b => b.Id == bidId, cancellationToken);

        return bid == null ? null : MapToBidDto(bid);
    }

    public async Task<List<TenderBidDto>> GetBidsForTenderAsync(int tenderId, CancellationToken cancellationToken = default)
    {
        var bids = await _context.Set<TenderBid>()
            .Include(b => b.Items)
            .Include(b => b.PreparedBy)
            .Where(b => b.TenderId == tenderId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync(cancellationToken);

        var tender = await _context.Tenders.FindAsync(new object[] { tenderId }, cancellationToken);
        return bids.Select(b => MapToBidDto(b, tender?.WinningBidId)).ToList();
    }

    public async Task<TenderBidDto> CreateBidAsync(CreateTenderBidDto dto, string userId, CancellationToken cancellationToken = default)
    {
        var tender = await _context.Tenders
            .Include(t => t.Items)
            .FirstOrDefaultAsync(t => t.Id == dto.TenderId, cancellationToken)
            ?? throw new InvalidOperationException($"Tender {dto.TenderId} not found");

        if (!tender.IsOpen)
            throw new InvalidOperationException("Tender is not open for bids");

        var bid = new TenderBid
        {
            TenderId = dto.TenderId,
            BidNumber = await GenerateBidNumberAsync(dto.TenderId, cancellationToken),
            Status = TenderBidStatus.Draft,
            ValidityDays = dto.ValidityDays,
            DeliveryDays = dto.DeliveryDays,
            WarrantyMonths = dto.WarrantyMonths,
            PaymentTerms = dto.PaymentTerms,
            TechnicalProposal = dto.TechnicalProposal,
            Notes = dto.Notes,
            Currency = tender.Currency,
            PreparedById = userId,
            CreatedAt = DateTime.UtcNow
        };

        decimal totalAmount = 0;
        foreach (var itemDto in dto.Items)
        {
            var tenderItem = tender.Items.FirstOrDefault(i => i.Id == itemDto.TenderItemId)
                ?? throw new InvalidOperationException($"Tender item {itemDto.TenderItemId} not found");

            var discountPercent = itemDto.DiscountPercent ?? 0;
            var finalUnitPrice = itemDto.UnitPrice * (1 - discountPercent / 100);

            bid.Items.Add(new TenderBidItem
            {
                TenderItemId = itemDto.TenderItemId,
                ProductId = itemDto.ProductId,
                Description = itemDto.Description,
                Quantity = itemDto.Quantity,
                UnitPrice = itemDto.UnitPrice,
                DiscountPercent = itemDto.DiscountPercent,
                FinalUnitPrice = finalUnitPrice,
                Notes = itemDto.Notes,
                CreatedAt = DateTime.UtcNow
            });

            totalAmount += finalUnitPrice * itemDto.Quantity;
        }

        bid.TotalAmount = totalAmount;
        bid.FinalAmount = totalAmount;

        _context.Set<TenderBid>().Add(bid);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created bid {BidNumber} for tender {TenderId}", bid.BidNumber, tender.Id);

        return MapToBidDto(bid);
    }

    public async Task<TenderBidDto> UpdateBidAsync(int bidId, UpdateTenderBidDto dto, CancellationToken cancellationToken = default)
    {
        var bid = await _context.Set<TenderBid>()
            .Include(b => b.Items)
            .Include(b => b.Tender)
            .FirstOrDefaultAsync(b => b.Id == bidId, cancellationToken)
            ?? throw new InvalidOperationException($"Bid {bidId} not found");

        if (bid.Status > TenderBidStatus.Approved)
            throw new InvalidOperationException("Cannot update submitted bid");

        bid.ValidityDays = dto.ValidityDays;
        bid.DeliveryDays = dto.DeliveryDays;
        bid.WarrantyMonths = dto.WarrantyMonths;
        bid.PaymentTerms = dto.PaymentTerms;
        bid.TechnicalProposal = dto.TechnicalProposal;
        bid.Notes = dto.Notes;
        bid.UpdatedAt = DateTime.UtcNow;

        // Remove old items and add new ones
        _context.Set<TenderBidItem>().RemoveRange(bid.Items);
        bid.Items.Clear();

        decimal totalAmount = 0;
        foreach (var itemDto in dto.Items)
        {
            var discountPercent = itemDto.DiscountPercent ?? 0;
            var finalUnitPrice = itemDto.UnitPrice * (1 - discountPercent / 100);

            bid.Items.Add(new TenderBidItem
            {
                TenderItemId = itemDto.TenderItemId,
                ProductId = itemDto.ProductId,
                Description = itemDto.Description,
                Quantity = itemDto.Quantity,
                UnitPrice = itemDto.UnitPrice,
                DiscountPercent = itemDto.DiscountPercent,
                FinalUnitPrice = finalUnitPrice,
                Notes = itemDto.Notes,
                CreatedAt = DateTime.UtcNow
            });

            totalAmount += finalUnitPrice * itemDto.Quantity;
        }

        bid.TotalAmount = totalAmount;
        bid.FinalAmount = totalAmount;

        await _context.SaveChangesAsync(cancellationToken);
        return MapToBidDto(bid);
    }

    public async Task<bool> DeleteBidAsync(int bidId, CancellationToken cancellationToken = default)
    {
        var bid = await _context.Set<TenderBid>().FindAsync(new object[] { bidId }, cancellationToken);
        if (bid == null) return false;

        if (bid.Status > TenderBidStatus.Draft)
            throw new InvalidOperationException("Cannot delete bid that has been submitted");

        _context.Set<TenderBid>().Remove(bid);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<TenderBidDto> SubmitBidAsync(int bidId, string userId, CancellationToken cancellationToken = default)
    {
        var bid = await _context.Set<TenderBid>()
            .Include(b => b.Tender)
            .FirstOrDefaultAsync(b => b.Id == bidId, cancellationToken)
            ?? throw new InvalidOperationException($"Bid {bidId} not found");

        if (bid.Status != TenderBidStatus.Approved)
            throw new InvalidOperationException("Bid must be approved before submission");

        if (!bid.Tender.IsOpen)
            throw new InvalidOperationException("Tender is no longer accepting bids");

        bid.Status = TenderBidStatus.Submitted;
        bid.SubmittedDate = DateTime.UtcNow;
        bid.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Submitted bid {BidId} for tender {TenderId}", bidId, bid.TenderId);

        return MapToBidDto(bid);
    }

    public async Task<TenderBidDto> ApproveBidAsync(int bidId, string approverId, CancellationToken cancellationToken = default)
    {
        var bid = await _context.Set<TenderBid>().FindAsync(new object[] { bidId }, cancellationToken)
            ?? throw new InvalidOperationException($"Bid {bidId} not found");

        if (bid.Status != TenderBidStatus.PendingApproval && bid.Status != TenderBidStatus.Draft)
            throw new InvalidOperationException("Bid is not pending approval");

        bid.Status = TenderBidStatus.Approved;
        bid.ApprovedById = approverId;
        bid.ApprovedDate = DateTime.UtcNow;
        bid.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return MapToBidDto(bid);
    }

    public async Task<TenderBidDto> WithdrawBidAsync(int bidId, string reason, CancellationToken cancellationToken = default)
    {
        var bid = await _context.Set<TenderBid>().FindAsync(new object[] { bidId }, cancellationToken)
            ?? throw new InvalidOperationException($"Bid {bidId} not found");

        if (bid.Status == TenderBidStatus.Won || bid.Status == TenderBidStatus.Lost)
            throw new InvalidOperationException("Cannot withdraw completed bid");

        bid.Status = TenderBidStatus.Withdrawn;
        bid.Notes = (bid.Notes ?? "") + $"\nWithdrawn: {reason}";
        bid.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return MapToBidDto(bid);
    }

    #endregion

    #region Documents

    public async Task<TenderDocumentDto> AddDocumentAsync(
        CreateTenderDocumentDto dto, 
        Stream fileStream, 
        string fileName, 
        string contentType, 
        string userId, 
        CancellationToken cancellationToken = default)
    {
        var tender = await _context.Tenders.FindAsync(new object[] { dto.TenderId }, cancellationToken)
            ?? throw new InvalidOperationException($"Tender {dto.TenderId} not found");

        // Save file to storage (simplified - in production use Azure Blob, AWS S3, etc.)
        var uploadsPath = Path.Combine("wwwroot", "uploads", "tenders", tender.TenderNumber);
        Directory.CreateDirectory(uploadsPath);
        
        var uniqueFileName = $"{Guid.NewGuid()}_{fileName}";
        var filePath = Path.Combine(uploadsPath, uniqueFileName);

        using (var fs = new FileStream(filePath, FileMode.Create))
        {
            await fileStream.CopyToAsync(fs, cancellationToken);
        }

        var document = new TenderDocument
        {
            TenderId = dto.TenderId,
            Name = dto.Name,
            DocumentType = dto.DocumentType,
            FilePath = filePath,
            FileName = fileName,
            FileSize = fileStream.Length,
            MimeType = contentType,
            Description = dto.Description,
            IsRequired = dto.IsRequired,
            IsTemplate = dto.IsTemplate,
            UploadedById = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Set<TenderDocument>().Add(document);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToDocumentDto(document);
    }

    public async Task<bool> RemoveDocumentAsync(int documentId, CancellationToken cancellationToken = default)
    {
        var document = await _context.Set<TenderDocument>().FindAsync(new object[] { documentId }, cancellationToken);
        if (document == null) return false;

        // Delete file
        if (File.Exists(document.FilePath))
            File.Delete(document.FilePath);

        _context.Set<TenderDocument>().Remove(document);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<(Stream Stream, string FileName, string ContentType)?> DownloadDocumentAsync(int documentId, CancellationToken cancellationToken = default)
    {
        var document = await _context.Set<TenderDocument>().FindAsync(new object[] { documentId }, cancellationToken);
        if (document == null || !File.Exists(document.FilePath))
            return null;

        var stream = new FileStream(document.FilePath, FileMode.Open, FileAccess.Read);
        return (stream, document.FileName, document.MimeType ?? "application/octet-stream");
    }

    #endregion

    #region Statistics

    public async Task<TenderStatsDto> GetStatisticsAsync(DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Tenders.AsQueryable();

        if (fromDate.HasValue)
            query = query.Where(t => t.CreatedAt >= fromDate.Value);
        if (toDate.HasValue)
            query = query.Where(t => t.CreatedAt <= toDate.Value);

        var tenders = await query.Include(t => t.Bids).ToListAsync(cancellationToken);
        var now = DateTime.UtcNow;

        var stats = new TenderStatsDto
        {
            TotalTenders = tenders.Count,
            OpenTenders = tenders.Count(t => t.Status == TenderStatus.Open && t.SubmissionDeadline >= now),
            OverdueTenders = tenders.Count(t => t.Status == TenderStatus.Open && t.SubmissionDeadline < now),
            AwardedTenders = tenders.Count(t => t.Status == TenderStatus.Awarded || t.Status == TenderStatus.Completed),
            WonBids = tenders.SelectMany(t => t.Bids).Count(b => b.Status == TenderBidStatus.Won),
            LostBids = tenders.SelectMany(t => t.Bids).Count(b => b.Status == TenderBidStatus.Lost),
            PendingBids = tenders.SelectMany(t => t.Bids).Count(b => b.Status == TenderBidStatus.Submitted || b.Status == TenderBidStatus.UnderEvaluation),
            TotalEstimatedValue = tenders.Where(t => t.EstimatedValue.HasValue).Sum(t => t.EstimatedValue!.Value),
            TotalWonValue = tenders.SelectMany(t => t.Bids).Where(b => b.Status == TenderBidStatus.Won).Sum(b => b.FinalAmount),
            ByStatus = tenders.GroupBy(t => t.Status).ToDictionary(g => g.Key, g => g.Count()),
            ByPriority = tenders.GroupBy(t => t.Priority).ToDictionary(g => g.Key, g => g.Count())
        };

        var totalBids = stats.WonBids + stats.LostBids;
        stats.WinRate = totalBids > 0 ? Math.Round((decimal)stats.WonBids / totalBids * 100, 1) : 0;

        return stats;
    }

    public async Task<TenderActionsDto> GetAvailableActionsAsync(int tenderId, CancellationToken cancellationToken = default)
    {
        var tender = await _context.Tenders.FindAsync(new object[] { tenderId }, cancellationToken);
        if (tender == null)
            return new TenderActionsDto();

        return new TenderActionsDto
        {
            CanEdit = tender.Status <= TenderStatus.Published,
            CanPublish = tender.Status == TenderStatus.Draft,
            CanOpen = tender.Status == TenderStatus.Published,
            CanClose = tender.Status == TenderStatus.Open,
            CanCancel = tender.Status < TenderStatus.Completed,
            CanAward = tender.Status == TenderStatus.UnderEvaluation,
            CanAddBid = tender.IsOpen,
            CanAddDocument = tender.Status <= TenderStatus.Open
        };
    }

    #endregion

    #region Utilities

    public async Task<string> GenerateTenderNumberAsync(CancellationToken cancellationToken = default)
    {
        var year = DateTime.UtcNow.Year;
        var lastTender = await _context.Tenders
            .Where(t => t.TenderNumber.StartsWith($"TND-{year}"))
            .OrderByDescending(t => t.TenderNumber)
            .FirstOrDefaultAsync(cancellationToken);

        int sequence = 1;
        if (lastTender != null)
        {
            var parts = lastTender.TenderNumber.Split('-');
            if (parts.Length >= 3 && int.TryParse(parts[2], out var lastSeq))
                sequence = lastSeq + 1;
        }

        return $"TND-{year}-{sequence:D4}";
    }

    public async Task<string> GenerateBidNumberAsync(int tenderId, CancellationToken cancellationToken = default)
    {
        var tender = await _context.Tenders.FindAsync(new object[] { tenderId }, cancellationToken);
        if (tender == null)
            return $"BID-{DateTime.UtcNow:yyyyMMdd}-0001";

        var bidCount = await _context.Set<TenderBid>()
            .CountAsync(b => b.TenderId == tenderId, cancellationToken);

        return $"BID-{tender.TenderNumber}-{(bidCount + 1):D2}";
    }

    public async Task<List<TenderDto>> GetUpcomingDeadlinesAsync(int days = 7, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var deadline = now.AddDays(days);

        var tenders = await _context.Tenders
            .Include(t => t.Customer)
            .Where(t => t.Status == TenderStatus.Open)
            .Where(t => t.SubmissionDeadline >= now && t.SubmissionDeadline <= deadline)
            .OrderBy(t => t.SubmissionDeadline)
            .ToListAsync(cancellationToken);

        return tenders.Select(MapToDto).ToList();
    }

    public async Task<List<TenderDto>> GetTendersForCustomerAsync(int customerId, CancellationToken cancellationToken = default)
    {
        var tenders = await _context.Tenders
            .Include(t => t.Customer)
            .Where(t => t.CustomerId == customerId)
            .OrderByDescending(t => t.CreatedAt)
            .Take(50)
            .ToListAsync(cancellationToken);

        return tenders.Select(MapToDto).ToList();
    }

    #endregion

    #region Mapping Helpers

    private static TenderDto MapToDto(Tender tender)
    {
        return new TenderDto
        {
            Id = tender.Id,
            TenderNumber = tender.TenderNumber,
            Title = tender.Title,
            Description = tender.Description,
            Type = tender.Type,
            TypeName = GetTypeName(tender.Type),
            Status = tender.Status,
            StatusName = GetStatusName(tender.Status),
            Priority = tender.Priority,
            PriorityName = GetPriorityName(tender.Priority),
            CustomerId = tender.CustomerId,
            CustomerName = tender.Customer?.FullName ?? "",
            PublishedDate = tender.PublishedDate,
            SubmissionDeadline = tender.SubmissionDeadline,
            OpeningDate = tender.OpeningDate,
            ContractStartDate = tender.ContractStartDate,
            ContractEndDate = tender.ContractEndDate,
            AwardedDate = tender.AwardedDate,
            EstimatedValue = tender.EstimatedValue,
            Budget = tender.Budget,
            Currency = tender.Currency,
            DeliveryLocation = tender.DeliveryLocation,
            DeliveryTerms = tender.DeliveryTerms,
            PaymentTerms = tender.PaymentTerms,
            ContactPerson = tender.ContactPerson,
            ContactEmail = tender.ContactEmail,
            AssignedUserId = tender.AssignedUserId,
            AssignedUserName = tender.AssignedUser?.FullName,
            ItemCount = tender.Items?.Count ?? 0,
            BidCount = tender.Bids?.Count ?? 0,
            DocumentCount = tender.Documents?.Count ?? 0,
            IsOpen = tender.IsOpen,
            IsOverdue = tender.IsOverdue,
            DaysUntilDeadline = tender.DaysUntilDeadline,
            WinningBidId = tender.WinningBidId,
            WinningBidAmount = tender.Bids?.FirstOrDefault(b => b.Id == tender.WinningBidId)?.FinalAmount,
            CreatedAt = tender.CreatedAt,
            UpdatedAt = tender.UpdatedAt
        };
    }

    private static TenderDetailDto MapToDetailDto(Tender tender)
    {
        var dto = new TenderDetailDto
        {
            Id = tender.Id,
            TenderNumber = tender.TenderNumber,
            Title = tender.Title,
            Description = tender.Description,
            Type = tender.Type,
            TypeName = GetTypeName(tender.Type),
            Status = tender.Status,
            StatusName = GetStatusName(tender.Status),
            Priority = tender.Priority,
            PriorityName = GetPriorityName(tender.Priority),
            CustomerId = tender.CustomerId,
            CustomerName = tender.Customer?.FullName ?? "",
            PublishedDate = tender.PublishedDate,
            SubmissionDeadline = tender.SubmissionDeadline,
            OpeningDate = tender.OpeningDate,
            ContractStartDate = tender.ContractStartDate,
            ContractEndDate = tender.ContractEndDate,
            AwardedDate = tender.AwardedDate,
            EstimatedValue = tender.EstimatedValue,
            Budget = tender.Budget,
            BidSecurityAmount = tender.BidSecurityAmount,
            Currency = tender.Currency,
            DeliveryLocation = tender.DeliveryLocation,
            DeliveryTerms = tender.DeliveryTerms,
            PaymentTerms = tender.PaymentTerms,
            SpecialConditions = tender.SpecialConditions,
            EvaluationCriteria = tender.EvaluationCriteria,
            ContactPerson = tender.ContactPerson,
            ContactEmail = tender.ContactEmail,
            ContactPhone = tender.ContactPhone,
            InternalNotes = tender.InternalNotes,
            AssignedUserId = tender.AssignedUserId,
            AssignedUserName = tender.AssignedUser?.FullName,
            CreatedById = tender.CreatedById,
            CreatedByName = tender.CreatedByUser?.FullName,
            ItemCount = tender.Items?.Count ?? 0,
            BidCount = tender.Bids?.Count ?? 0,
            DocumentCount = tender.Documents?.Count ?? 0,
            IsOpen = tender.IsOpen,
            IsOverdue = tender.IsOverdue,
            DaysUntilDeadline = tender.DaysUntilDeadline,
            WinningBidId = tender.WinningBidId,
            WinningBidAmount = tender.Bids?.FirstOrDefault(b => b.Id == tender.WinningBidId)?.FinalAmount,
            CreatedAt = tender.CreatedAt,
            UpdatedAt = tender.UpdatedAt,
            Items = tender.Items?.Select(MapToItemDto).ToList() ?? new(),
            Bids = tender.Bids?.Select(b => MapToBidDto(b, tender.WinningBidId)).ToList() ?? new(),
            Documents = tender.Documents?.Select(MapToDocumentDto).ToList() ?? new()
        };

        return dto;
    }

    private static TenderItemDto MapToItemDto(TenderItem item)
    {
        return new TenderItemDto
        {
            Id = item.Id,
            TenderId = item.TenderId,
            ProductId = item.ProductId,
            ProductName = item.Product?.Name,
            ProductSku = item.Product?.SKU,
            Description = item.Description,
            Specification = item.Specification,
            Unit = item.Unit,
            Quantity = item.Quantity,
            EstimatedUnitPrice = item.EstimatedUnitPrice,
            EstimatedTotal = item.EstimatedTotal,
            Notes = item.Notes,
            SortOrder = item.SortOrder
        };
    }

    private static TenderBidDto MapToBidDto(TenderBid bid, int? winningBidId = null)
    {
        return new TenderBidDto
        {
            Id = bid.Id,
            TenderId = bid.TenderId,
            BidNumber = bid.BidNumber,
            Status = bid.Status,
            StatusName = GetBidStatusName(bid.Status),
            TotalAmount = bid.TotalAmount,
            DiscountAmount = bid.DiscountAmount,
            FinalAmount = bid.FinalAmount,
            Currency = bid.Currency,
            ValidityDays = bid.ValidityDays,
            DeliveryDays = bid.DeliveryDays,
            WarrantyMonths = bid.WarrantyMonths,
            PaymentTerms = bid.PaymentTerms,
            TechnicalProposal = bid.TechnicalProposal,
            Notes = bid.Notes,
            SubmittedDate = bid.SubmittedDate,
            PreparedById = bid.PreparedById,
            PreparedByName = bid.PreparedBy?.FullName,
            ApprovedById = bid.ApprovedById,
            ApprovedByName = bid.ApprovedBy?.FullName,
            ApprovedDate = bid.ApprovedDate,
            RejectionReason = bid.RejectionReason,
            EvaluationScore = bid.EvaluationScore,
            EvaluationNotes = bid.EvaluationNotes,
            IsExpired = bid.IsExpired,
            IsWinningBid = winningBidId.HasValue && bid.Id == winningBidId.Value,
            Items = bid.Items?.Select(MapToBidItemDto).ToList() ?? new(),
            CreatedAt = bid.CreatedAt
        };
    }

    private static TenderBidItemDto MapToBidItemDto(TenderBidItem item)
    {
        return new TenderBidItemDto
        {
            Id = item.Id,
            TenderBidId = item.TenderBidId,
            TenderItemId = item.TenderItemId,
            TenderItemDescription = item.TenderItem?.Description ?? "",
            ProductId = item.ProductId,
            ProductName = item.Product?.Name,
            ProductSku = item.Product?.SKU,
            Description = item.Description,
            Quantity = item.Quantity,
            UnitPrice = item.UnitPrice,
            DiscountPercent = item.DiscountPercent,
            FinalUnitPrice = item.FinalUnitPrice,
            TotalPrice = item.TotalPrice,
            Notes = item.Notes
        };
    }

    private static TenderDocumentDto MapToDocumentDto(TenderDocument doc)
    {
        return new TenderDocumentDto
        {
            Id = doc.Id,
            TenderId = doc.TenderId,
            Name = doc.Name,
            DocumentType = doc.DocumentType,
            DocumentTypeName = GetDocumentTypeName(doc.DocumentType),
            FilePath = doc.FilePath,
            FileName = doc.FileName,
            FileSize = doc.FileSize,
            MimeType = doc.MimeType,
            Description = doc.Description,
            UploadedById = doc.UploadedById,
            UploadedByName = doc.UploadedBy?.FullName,
            IsRequired = doc.IsRequired,
            IsTemplate = doc.IsTemplate,
            CreatedAt = doc.CreatedAt
        };
    }

    private static string GetTypeName(TenderType type) => type switch
    {
        TenderType.OpenTender => "Open Tender",
        TenderType.RestrictedTender => "Restricted Tender",
        TenderType.NegotiatedProcurement => "Negotiated Procurement",
        TenderType.FrameworkAgreement => "Framework Agreement",
        TenderType.QuoteRequest => "Quote Request",
        _ => type.ToString()
    };

    private static string GetStatusName(TenderStatus status) => status switch
    {
        TenderStatus.Draft => "Draft",
        TenderStatus.Published => "Published",
        TenderStatus.Open => "Open for Bids",
        TenderStatus.UnderEvaluation => "Under Evaluation",
        TenderStatus.Awarded => "Awarded",
        TenderStatus.Cancelled => "Cancelled",
        TenderStatus.Expired => "Expired",
        TenderStatus.Completed => "Completed",
        _ => status.ToString()
    };

    private static string GetPriorityName(TenderPriority priority) => priority switch
    {
        TenderPriority.Low => "Low",
        TenderPriority.Medium => "Medium",
        TenderPriority.High => "High",
        TenderPriority.Critical => "Critical",
        _ => priority.ToString()
    };

    private static string GetBidStatusName(TenderBidStatus status) => status switch
    {
        TenderBidStatus.Draft => "Draft",
        TenderBidStatus.PendingApproval => "Pending Approval",
        TenderBidStatus.Approved => "Approved",
        TenderBidStatus.Submitted => "Submitted",
        TenderBidStatus.UnderEvaluation => "Under Evaluation",
        TenderBidStatus.ShortListed => "Short Listed",
        TenderBidStatus.Won => "Won",
        TenderBidStatus.Lost => "Lost",
        TenderBidStatus.Withdrawn => "Withdrawn",
        _ => status.ToString()
    };

    private static string GetDocumentTypeName(TenderDocumentType type) => type switch
    {
        TenderDocumentType.TenderNotice => "Tender Notice",
        TenderDocumentType.Specification => "Specification",
        TenderDocumentType.TechnicalRequirements => "Technical Requirements",
        TenderDocumentType.PriceSchedule => "Price Schedule",
        TenderDocumentType.Contract => "Contract",
        TenderDocumentType.BidForm => "Bid Form",
        TenderDocumentType.QualificationDocuments => "Qualification Documents",
        TenderDocumentType.FinancialProposal => "Financial Proposal",
        TenderDocumentType.TechnicalProposal => "Technical Proposal",
        TenderDocumentType.Certificate => "Certificate",
        TenderDocumentType.Other => "Other",
        _ => type.ToString()
    };

    #endregion
}
