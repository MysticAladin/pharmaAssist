using Application.DTOs.Tenders;
using Application.Interfaces;
using Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers;

/// <summary>
/// API endpoints for tender management
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TendersController : ControllerBase
{
    private readonly ITenderService _tenderService;
    private readonly ILogger<TendersController> _logger;

    public TendersController(ITenderService tenderService, ILogger<TendersController> logger)
    {
        _tenderService = tenderService;
        _logger = logger;
    }

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

    #region Tender CRUD

    /// <summary>
    /// Get all tenders with filtering and pagination
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetTenders([FromQuery] TenderFilterDto filter, CancellationToken cancellationToken)
    {
        var result = await _tenderService.GetTendersAsync(filter, cancellationToken);
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Get tender by ID with full details
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetTender(int id, CancellationToken cancellationToken)
    {
        var tender = await _tenderService.GetTenderByIdAsync(id, cancellationToken);
        if (tender == null)
            return NotFound(new { success = false, message = "Tender not found" });

        return Ok(new { success = true, data = tender });
    }

    /// <summary>
    /// Get tender by tender number
    /// </summary>
    [HttpGet("by-number/{tenderNumber}")]
    public async Task<IActionResult> GetTenderByNumber(string tenderNumber, CancellationToken cancellationToken)
    {
        var tender = await _tenderService.GetTenderByNumberAsync(tenderNumber, cancellationToken);
        if (tender == null)
            return NotFound(new { success = false, message = "Tender not found" });

        return Ok(new { success = true, data = tender });
    }

    /// <summary>
    /// Create a new tender
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateTender([FromBody] CreateTenderDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var tender = await _tenderService.CreateTenderAsync(dto, GetUserId(), cancellationToken);
            return CreatedAtAction(nameof(GetTender), new { id = tender.Id }, new { success = true, data = tender });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating tender");
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Update an existing tender
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTender(int id, [FromBody] UpdateTenderDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var tender = await _tenderService.UpdateTenderAsync(id, dto, cancellationToken);
            return Ok(new { success = true, data = tender });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Delete a tender (only draft)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTender(int id, CancellationToken cancellationToken)
    {
        try
        {
            var success = await _tenderService.DeleteTenderAsync(id, cancellationToken);
            if (!success)
                return NotFound(new { success = false, message = "Tender not found" });

            return Ok(new { success = true, message = "Tender deleted" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    #endregion

    #region Tender Status Management

    /// <summary>
    /// Publish a draft tender
    /// </summary>
    [HttpPost("{id}/publish")]
    public async Task<IActionResult> PublishTender(int id, CancellationToken cancellationToken)
    {
        try
        {
            var tender = await _tenderService.PublishTenderAsync(id, cancellationToken);
            return Ok(new { success = true, data = tender });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Open tender for bids
    /// </summary>
    [HttpPost("{id}/open")]
    public async Task<IActionResult> OpenTender(int id, CancellationToken cancellationToken)
    {
        try
        {
            var tender = await _tenderService.OpenTenderAsync(id, cancellationToken);
            return Ok(new { success = true, data = tender });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Close tender for evaluation
    /// </summary>
    [HttpPost("{id}/close")]
    public async Task<IActionResult> CloseTender(int id, CancellationToken cancellationToken)
    {
        try
        {
            var tender = await _tenderService.CloseTenderAsync(id, cancellationToken);
            return Ok(new { success = true, data = tender });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Cancel a tender
    /// </summary>
    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelTender(int id, [FromBody] CancelTenderRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var tender = await _tenderService.CancelTenderAsync(id, request.Reason, cancellationToken);
            return Ok(new { success = true, data = tender });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Award tender to a winning bid
    /// </summary>
    [HttpPost("{id}/award")]
    public async Task<IActionResult> AwardTender(int id, [FromBody] AwardTenderRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var tender = await _tenderService.AwardTenderAsync(id, request.WinningBidId, cancellationToken);
            return Ok(new { success = true, data = tender });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    #endregion

    #region Tender Items

    /// <summary>
    /// Add item to tender
    /// </summary>
    [HttpPost("{id}/items")]
    public async Task<IActionResult> AddTenderItem(int id, [FromBody] CreateTenderItemDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var item = await _tenderService.AddTenderItemAsync(id, dto, cancellationToken);
            return Ok(new { success = true, data = item });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Update tender item
    /// </summary>
    [HttpPut("items/{itemId}")]
    public async Task<IActionResult> UpdateTenderItem(int itemId, [FromBody] CreateTenderItemDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var item = await _tenderService.UpdateTenderItemAsync(itemId, dto, cancellationToken);
            return Ok(new { success = true, data = item });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Remove tender item
    /// </summary>
    [HttpDelete("items/{itemId}")]
    public async Task<IActionResult> RemoveTenderItem(int itemId, CancellationToken cancellationToken)
    {
        try
        {
            var success = await _tenderService.RemoveTenderItemAsync(itemId, cancellationToken);
            if (!success)
                return NotFound(new { success = false, message = "Item not found" });

            return Ok(new { success = true, message = "Item removed" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    #endregion

    #region Bids

    /// <summary>
    /// Get all bids for a tender
    /// </summary>
    [HttpGet("{id}/bids")]
    public async Task<IActionResult> GetTenderBids(int id, CancellationToken cancellationToken)
    {
        var bids = await _tenderService.GetBidsForTenderAsync(id, cancellationToken);
        return Ok(new { success = true, data = bids });
    }

    /// <summary>
    /// Get bid by ID
    /// </summary>
    [HttpGet("bids/{bidId}")]
    public async Task<IActionResult> GetBid(int bidId, CancellationToken cancellationToken)
    {
        var bid = await _tenderService.GetBidByIdAsync(bidId, cancellationToken);
        if (bid == null)
            return NotFound(new { success = false, message = "Bid not found" });

        return Ok(new { success = true, data = bid });
    }

    /// <summary>
    /// Create a new bid for a tender
    /// </summary>
    [HttpPost("bids")]
    public async Task<IActionResult> CreateBid([FromBody] CreateTenderBidDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var bid = await _tenderService.CreateBidAsync(dto, GetUserId(), cancellationToken);
            return CreatedAtAction(nameof(GetBid), new { bidId = bid.Id }, new { success = true, data = bid });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Update a bid
    /// </summary>
    [HttpPut("bids/{bidId}")]
    public async Task<IActionResult> UpdateBid(int bidId, [FromBody] UpdateTenderBidDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var bid = await _tenderService.UpdateBidAsync(bidId, dto, cancellationToken);
            return Ok(new { success = true, data = bid });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Delete a bid (only draft)
    /// </summary>
    [HttpDelete("bids/{bidId}")]
    public async Task<IActionResult> DeleteBid(int bidId, CancellationToken cancellationToken)
    {
        try
        {
            var success = await _tenderService.DeleteBidAsync(bidId, cancellationToken);
            if (!success)
                return NotFound(new { success = false, message = "Bid not found" });

            return Ok(new { success = true, message = "Bid deleted" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Submit a bid
    /// </summary>
    [HttpPost("bids/{bidId}/submit")]
    public async Task<IActionResult> SubmitBid(int bidId, CancellationToken cancellationToken)
    {
        try
        {
            var bid = await _tenderService.SubmitBidAsync(bidId, GetUserId(), cancellationToken);
            return Ok(new { success = true, data = bid });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Approve a bid internally
    /// </summary>
    [HttpPost("bids/{bidId}/approve")]
    public async Task<IActionResult> ApproveBid(int bidId, CancellationToken cancellationToken)
    {
        try
        {
            var bid = await _tenderService.ApproveBidAsync(bidId, GetUserId(), cancellationToken);
            return Ok(new { success = true, data = bid });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Withdraw a bid
    /// </summary>
    [HttpPost("bids/{bidId}/withdraw")]
    public async Task<IActionResult> WithdrawBid(int bidId, [FromBody] WithdrawBidRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var bid = await _tenderService.WithdrawBidAsync(bidId, request.Reason, cancellationToken);
            return Ok(new { success = true, data = bid });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    #endregion

    #region Documents

    /// <summary>
    /// Upload document to tender
    /// </summary>
    [HttpPost("{id}/documents")]
    public async Task<IActionResult> UploadDocument(int id, [FromForm] UploadTenderDocumentRequest request, CancellationToken cancellationToken)
    {
        try
        {
            if (request.File == null || request.File.Length == 0)
                return BadRequest(new { success = false, message = "No file provided" });

            using var stream = request.File.OpenReadStream();
            var dto = new CreateTenderDocumentDto
            {
                TenderId = id,
                Name = request.Name ?? request.File.FileName,
                DocumentType = request.DocumentType,
                Description = request.Description,
                IsRequired = request.IsRequired,
                IsTemplate = request.IsTemplate
            };

            var document = await _tenderService.AddDocumentAsync(
                dto, 
                stream, 
                request.File.FileName, 
                request.File.ContentType, 
                GetUserId(), 
                cancellationToken);

            return Ok(new { success = true, data = document });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading document for tender {TenderId}", id);
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Download document
    /// </summary>
    [HttpGet("documents/{documentId}/download")]
    public async Task<IActionResult> DownloadDocument(int documentId, CancellationToken cancellationToken)
    {
        var result = await _tenderService.DownloadDocumentAsync(documentId, cancellationToken);
        if (result == null)
            return NotFound(new { success = false, message = "Document not found" });

        return File(result.Value.Stream, result.Value.ContentType, result.Value.FileName);
    }

    /// <summary>
    /// Delete document
    /// </summary>
    [HttpDelete("documents/{documentId}")]
    public async Task<IActionResult> DeleteDocument(int documentId, CancellationToken cancellationToken)
    {
        var success = await _tenderService.RemoveDocumentAsync(documentId, cancellationToken);
        if (!success)
            return NotFound(new { success = false, message = "Document not found" });

        return Ok(new { success = true, message = "Document deleted" });
    }

    #endregion

    #region Statistics & Utilities

    /// <summary>
    /// Get tender statistics
    /// </summary>
    [HttpGet("statistics")]
    public async Task<IActionResult> GetStatistics([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate, CancellationToken cancellationToken)
    {
        var stats = await _tenderService.GetStatisticsAsync(fromDate, toDate, cancellationToken);
        return Ok(new { success = true, data = stats });
    }

    /// <summary>
    /// Get available actions for a tender
    /// </summary>
    [HttpGet("{id}/actions")]
    public async Task<IActionResult> GetAvailableActions(int id, CancellationToken cancellationToken)
    {
        var actions = await _tenderService.GetAvailableActionsAsync(id, cancellationToken);
        return Ok(new { success = true, data = actions });
    }

    /// <summary>
    /// Get tenders with upcoming deadlines
    /// </summary>
    [HttpGet("upcoming-deadlines")]
    public async Task<IActionResult> GetUpcomingDeadlines([FromQuery] int days = 7, CancellationToken cancellationToken = default)
    {
        var tenders = await _tenderService.GetUpcomingDeadlinesAsync(days, cancellationToken);
        return Ok(new { success = true, data = tenders });
    }

    /// <summary>
    /// Get tenders for a customer
    /// </summary>
    [HttpGet("by-customer/{customerId}")]
    public async Task<IActionResult> GetTendersForCustomer(int customerId, CancellationToken cancellationToken)
    {
        var tenders = await _tenderService.GetTendersForCustomerAsync(customerId, cancellationToken);
        return Ok(new { success = true, data = tenders });
    }

    /// <summary>
    /// Get enum values for dropdowns
    /// </summary>
    [HttpGet("enums")]
    public IActionResult GetEnums()
    {
        return Ok(new
        {
            success = true,
            data = new
            {
                tenderTypes = Enum.GetValues<TenderType>().Select(t => new { value = (int)t, name = t.ToString() }),
                tenderStatuses = Enum.GetValues<TenderStatus>().Select(s => new { value = (int)s, name = s.ToString() }),
                tenderPriorities = Enum.GetValues<TenderPriority>().Select(p => new { value = (int)p, name = p.ToString() }),
                bidStatuses = Enum.GetValues<TenderBidStatus>().Select(s => new { value = (int)s, name = s.ToString() }),
                documentTypes = Enum.GetValues<TenderDocumentType>().Select(d => new { value = (int)d, name = d.ToString() })
            }
        });
    }

    #endregion
}

#region Request Models

public class CancelTenderRequest
{
    public string Reason { get; set; } = string.Empty;
}

public class AwardTenderRequest
{
    public int WinningBidId { get; set; }
}

public class WithdrawBidRequest
{
    public string Reason { get; set; } = string.Empty;
}

public class UploadTenderDocumentRequest
{
    public IFormFile? File { get; set; }
    public string? Name { get; set; }
    public TenderDocumentType DocumentType { get; set; }
    public string? Description { get; set; }
    public bool IsRequired { get; set; }
    public bool IsTemplate { get; set; }
}

#endregion
