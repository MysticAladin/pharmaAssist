using Application.DTOs.Common;
using Application.DTOs.Wholesaler;
using Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Wholesaler Data Import API Controller — manages file imports, record matching, and stock
/// </summary>
[ApiController]
[Route("api/wholesaler-data")]
[Produces("application/json")]
public class WholesalerDataController : ControllerBase
{
    private readonly IWholesalerDataService _wholesalerDataService;
    private readonly ILogger<WholesalerDataController> _logger;

    public WholesalerDataController(IWholesalerDataService wholesalerDataService, ILogger<WholesalerDataController> logger)
    {
        _wholesalerDataService = wholesalerDataService;
        _logger = logger;
    }

    #region Import Management

    /// <summary>
    /// Preview a wholesaler data file before importing
    /// </summary>
    [HttpPost("preview")]
    [ProducesResponseType(typeof(ApiResponse<ImportPreviewDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PreviewFile(
        IFormFile file,
        [FromQuery] string? columnMapping = null,
        CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse<ImportPreviewDto>.Fail("No file provided"));

        using var stream = file.OpenReadStream();
        var result = await _wholesalerDataService.PreviewFileAsync(stream, file.FileName, columnMapping, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Import a wholesaler data file
    /// </summary>
    [HttpPost("import")]
    [ProducesResponseType(typeof(ApiResponse<ImportResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ImportFile(
        IFormFile file,
        [FromForm] int wholesalerId,
        [FromForm] string? period = null,
        [FromForm] string? columnMapping = null,
        [FromForm] string? notes = null,
        CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse<ImportResultDto>.Fail("No file provided"));

        var request = new CreateImportRequest
        {
            WholesalerId = wholesalerId,
            Period = period,
            ColumnMapping = columnMapping,
            Notes = notes
        };

        using var stream = file.OpenReadStream();
        var result = await _wholesalerDataService.ImportFileAsync(stream, file.FileName, request, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get all imports with pagination and filtering
    /// </summary>
    [HttpGet("imports")]
    [ProducesResponseType(typeof(PagedResponse<WholesalerDataImportDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetImports(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] int? wholesalerId = null,
        [FromQuery] string? status = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortDirection = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _wholesalerDataService.GetImportsAsync(page, pageSize, wholesalerId, status, sortBy, sortDirection, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get import details by ID
    /// </summary>
    [HttpGet("imports/{id}")]
    [ProducesResponseType(typeof(ApiResponse<WholesalerDataImportDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetImport(int id, CancellationToken cancellationToken)
    {
        var result = await _wholesalerDataService.GetImportByIdAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Delete an import and all its records
    /// </summary>
    [HttpDelete("imports/{id}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteImport(int id, CancellationToken cancellationToken)
    {
        var result = await _wholesalerDataService.DeleteImportAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #endregion

    #region Record Matching

    /// <summary>
    /// Get unmatched records for an import
    /// </summary>
    [HttpGet("imports/{importId}/unmatched")]
    [ProducesResponseType(typeof(ApiResponse<List<WholesalerSalesRecordDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnmatchedRecords(
        int importId,
        [FromQuery] string type = "product",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var result = await _wholesalerDataService.GetUnmatchedRecordsAsync(importId, type, page, pageSize, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Match a single record to a product/customer
    /// </summary>
    [HttpPost("match")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> MatchRecord([FromBody] MatchRecordRequest request, CancellationToken cancellationToken)
    {
        var result = await _wholesalerDataService.MatchRecordAsync(request, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Bulk match records
    /// </summary>
    [HttpPost("match/bulk")]
    [ProducesResponseType(typeof(ApiResponse<int>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> BulkMatchRecords([FromBody] BulkMatchRequest request, CancellationToken cancellationToken)
    {
        var result = await _wholesalerDataService.BulkMatchRecordsAsync(request, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Stock

    /// <summary>
    /// Get wholesaler stock summary
    /// </summary>
    [HttpGet("stock")]
    [ProducesResponseType(typeof(ApiResponse<List<WholesalerStockSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStockSummary(
        [FromQuery] int? wholesalerId = null,
        [FromQuery] int? productId = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _wholesalerDataService.GetStockSummaryAsync(wholesalerId, productId, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion
}
