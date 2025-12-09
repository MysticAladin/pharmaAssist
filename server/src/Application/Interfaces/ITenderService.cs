using Application.Common;
using Application.DTOs;
using Application.DTOs.Tenders;
using Domain.Entities;

namespace Application.Interfaces;

/// <summary>
/// Service interface for tender management
/// </summary>
public interface ITenderService
{
    // Tender CRUD
    Task<TenderDetailDto?> GetTenderByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<TenderDetailDto?> GetTenderByNumberAsync(string tenderNumber, CancellationToken cancellationToken = default);
    Task<PagedResult<TenderDto>> GetTendersAsync(TenderFilterDto filter, CancellationToken cancellationToken = default);
    Task<TenderDto> CreateTenderAsync(CreateTenderDto dto, string userId, CancellationToken cancellationToken = default);
    Task<TenderDto> UpdateTenderAsync(int id, UpdateTenderDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteTenderAsync(int id, CancellationToken cancellationToken = default);
    
    // Tender Status Management
    Task<TenderDto> PublishTenderAsync(int id, CancellationToken cancellationToken = default);
    Task<TenderDto> OpenTenderAsync(int id, CancellationToken cancellationToken = default);
    Task<TenderDto> CloseTenderAsync(int id, CancellationToken cancellationToken = default);
    Task<TenderDto> CancelTenderAsync(int id, string reason, CancellationToken cancellationToken = default);
    Task<TenderDto> AwardTenderAsync(int id, int winningBidId, CancellationToken cancellationToken = default);
    
    // Tender Items
    Task<TenderItemDto> AddTenderItemAsync(int tenderId, CreateTenderItemDto dto, CancellationToken cancellationToken = default);
    Task<TenderItemDto> UpdateTenderItemAsync(int itemId, CreateTenderItemDto dto, CancellationToken cancellationToken = default);
    Task<bool> RemoveTenderItemAsync(int itemId, CancellationToken cancellationToken = default);
    
    // Bids
    Task<TenderBidDto?> GetBidByIdAsync(int bidId, CancellationToken cancellationToken = default);
    Task<List<TenderBidDto>> GetBidsForTenderAsync(int tenderId, CancellationToken cancellationToken = default);
    Task<TenderBidDto> CreateBidAsync(CreateTenderBidDto dto, string userId, CancellationToken cancellationToken = default);
    Task<TenderBidDto> UpdateBidAsync(int bidId, UpdateTenderBidDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteBidAsync(int bidId, CancellationToken cancellationToken = default);
    
    // Bid Status
    Task<TenderBidDto> SubmitBidAsync(int bidId, string userId, CancellationToken cancellationToken = default);
    Task<TenderBidDto> ApproveBidAsync(int bidId, string approverId, CancellationToken cancellationToken = default);
    Task<TenderBidDto> WithdrawBidAsync(int bidId, string reason, CancellationToken cancellationToken = default);
    
    // Documents
    Task<TenderDocumentDto> AddDocumentAsync(CreateTenderDocumentDto dto, Stream fileStream, string fileName, string contentType, string userId, CancellationToken cancellationToken = default);
    Task<bool> RemoveDocumentAsync(int documentId, CancellationToken cancellationToken = default);
    Task<(Stream Stream, string FileName, string ContentType)?> DownloadDocumentAsync(int documentId, CancellationToken cancellationToken = default);
    
    // Statistics
    Task<TenderStatsDto> GetStatisticsAsync(DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default);
    Task<TenderActionsDto> GetAvailableActionsAsync(int tenderId, CancellationToken cancellationToken = default);
    
    // Utilities
    Task<string> GenerateTenderNumberAsync(CancellationToken cancellationToken = default);
    Task<string> GenerateBidNumberAsync(int tenderId, CancellationToken cancellationToken = default);
    Task<List<TenderDto>> GetUpcomingDeadlinesAsync(int days = 7, CancellationToken cancellationToken = default);
    Task<List<TenderDto>> GetTendersForCustomerAsync(int customerId, CancellationToken cancellationToken = default);
}
