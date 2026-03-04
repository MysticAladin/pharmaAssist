using Application.DTOs.Brands;
using Application.DTOs.Common;
using Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers;

/// <summary>
/// Brands API Controller — manages brands, brand groups, product documents, and knowledge articles
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class BrandsController : ControllerBase
{
    private readonly IBrandService _brandService;
    private readonly ILogger<BrandsController> _logger;

    public BrandsController(IBrandService brandService, ILogger<BrandsController> logger)
    {
        _brandService = brandService;
        _logger = logger;
    }

    #region Brands

    /// <summary>
    /// Get brand by ID with full details
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<BrandDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBrand(int id, CancellationToken cancellationToken)
    {
        var result = await _brandService.GetBrandByIdAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get brands with pagination and filtering
    /// </summary>
    [HttpGet("paged")]
    [ProducesResponseType(typeof(PagedResponse<BrandSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBrandsPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] int? manufacturerId = null,
        [FromQuery] bool? activeOnly = true,
        [FromQuery] string? therapeuticArea = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortDirection = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _brandService.GetBrandsPagedAsync(
            page, pageSize, search, manufacturerId, activeOnly, therapeuticArea, sortBy, sortDirection, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get brands by manufacturer
    /// </summary>
    [HttpGet("by-manufacturer/{manufacturerId}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<BrandSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByManufacturer(int manufacturerId, CancellationToken cancellationToken)
    {
        var result = await _brandService.GetBrandsByManufacturerAsync(manufacturerId, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Create a new brand
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<BrandDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateBrand([FromBody] CreateBrandDto dto, CancellationToken cancellationToken)
    {
        var result = await _brandService.CreateBrandAsync(dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return CreatedAtAction(nameof(GetBrand), new { id = result.Data!.Id }, result);
    }

    /// <summary>
    /// Update an existing brand
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<BrandDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateBrand(int id, [FromBody] UpdateBrandDto dto, CancellationToken cancellationToken)
    {
        var result = await _brandService.UpdateBrandAsync(id, dto, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Soft delete a brand
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteBrand(int id, CancellationToken cancellationToken)
    {
        var result = await _brandService.DeleteBrandAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Activate a brand
    /// </summary>
    [HttpPost("{id}/activate")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ActivateBrand(int id, CancellationToken cancellationToken)
    {
        var result = await _brandService.ActivateBrandAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Deactivate a brand
    /// </summary>
    [HttpPost("{id}/deactivate")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeactivateBrand(int id, CancellationToken cancellationToken)
    {
        var result = await _brandService.DeactivateBrandAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #endregion

    #region Brand Groups

    /// <summary>
    /// Get all brand groups
    /// </summary>
    [HttpGet("groups")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<BrandGroupDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllBrandGroups(CancellationToken cancellationToken)
    {
        var result = await _brandService.GetAllBrandGroupsAsync(cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get brand group by ID
    /// </summary>
    [HttpGet("groups/{id}")]
    [ProducesResponseType(typeof(ApiResponse<BrandGroupDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBrandGroup(int id, CancellationToken cancellationToken)
    {
        var result = await _brandService.GetBrandGroupByIdAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Create a new brand group
    /// </summary>
    [HttpPost("groups")]
    [ProducesResponseType(typeof(ApiResponse<BrandGroupDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateBrandGroup([FromBody] CreateBrandGroupDto dto, CancellationToken cancellationToken)
    {
        var result = await _brandService.CreateBrandGroupAsync(dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return CreatedAtAction(nameof(GetBrandGroup), new { id = result.Data!.Id }, result);
    }

    /// <summary>
    /// Update a brand group
    /// </summary>
    [HttpPut("groups/{id}")]
    [ProducesResponseType(typeof(ApiResponse<BrandGroupDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateBrandGroup(int id, [FromBody] UpdateBrandGroupDto dto, CancellationToken cancellationToken)
    {
        var result = await _brandService.UpdateBrandGroupAsync(id, dto, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Delete a brand group
    /// </summary>
    [HttpDelete("groups/{id}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteBrandGroup(int id, CancellationToken cancellationToken)
    {
        var result = await _brandService.DeleteBrandGroupAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Add a brand to a group
    /// </summary>
    [HttpPost("groups/{groupId}/brands/{brandId}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> AddBrandToGroup(int groupId, int brandId, CancellationToken cancellationToken)
    {
        var result = await _brandService.AddBrandToGroupAsync(groupId, brandId, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Remove a brand from a group
    /// </summary>
    [HttpDelete("groups/{groupId}/brands/{brandId}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveBrandFromGroup(int groupId, int brandId, CancellationToken cancellationToken)
    {
        var result = await _brandService.RemoveBrandFromGroupAsync(groupId, brandId, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #endregion

    #region Product Documents

    /// <summary>
    /// Get all documents for a product
    /// </summary>
    [HttpGet("~/api/products/{productId}/documents")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ProductDocumentDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProductDocuments(int productId, CancellationToken cancellationToken)
    {
        var result = await _brandService.GetProductDocumentsAsync(productId, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Upload a product document
    /// </summary>
    [HttpPost("~/api/products/{productId}/documents")]
    [ProducesResponseType(typeof(ApiResponse<ProductDocumentDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateProductDocument(int productId, [FromBody] CreateProductDocumentDto dto, CancellationToken cancellationToken)
    {
        dto.ProductId = productId;
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "system";
        var result = await _brandService.CreateProductDocumentAsync(dto, userId, cancellationToken);
        return result.Success ? StatusCode(201, result) : BadRequest(result);
    }

    /// <summary>
    /// Delete a product document
    /// </summary>
    [HttpDelete("~/api/products/documents/{documentId}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteProductDocument(int documentId, CancellationToken cancellationToken)
    {
        var result = await _brandService.DeleteProductDocumentAsync(documentId, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get version history for a specific document type
    /// </summary>
    [HttpGet("~/api/products/{productId}/documents/history/{documentType}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ProductDocumentDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDocumentVersionHistory(int productId, int documentType, CancellationToken cancellationToken)
    {
        var result = await _brandService.GetDocumentVersionHistoryAsync(productId, documentType, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Knowledge Articles

    /// <summary>
    /// Get knowledge article by ID
    /// </summary>
    [HttpGet("~/api/knowledge/{id}")]
    [ProducesResponseType(typeof(ApiResponse<KnowledgeArticleDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetKnowledgeArticle(int id, CancellationToken cancellationToken)
    {
        var result = await _brandService.GetKnowledgeArticleByIdAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get knowledge articles with pagination and filtering
    /// </summary>
    [HttpGet("~/api/knowledge")]
    [ProducesResponseType(typeof(PagedResponse<KnowledgeArticleSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetKnowledgeArticlesPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] int? productId = null,
        [FromQuery] int? brandId = null,
        [FromQuery] int? category = null,
        [FromQuery] bool? publishedOnly = true,
        CancellationToken cancellationToken = default)
    {
        var result = await _brandService.GetKnowledgeArticlesPagedAsync(
            page, pageSize, search, productId, brandId, category, publishedOnly, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Create a knowledge article
    /// </summary>
    [HttpPost("~/api/knowledge")]
    [ProducesResponseType(typeof(ApiResponse<KnowledgeArticleDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateKnowledgeArticle([FromBody] CreateKnowledgeArticleDto dto, CancellationToken cancellationToken)
    {
        var result = await _brandService.CreateKnowledgeArticleAsync(dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return CreatedAtAction(nameof(GetKnowledgeArticle), new { id = result.Data!.Id }, result);
    }

    /// <summary>
    /// Update a knowledge article
    /// </summary>
    [HttpPut("~/api/knowledge/{id}")]
    [ProducesResponseType(typeof(ApiResponse<KnowledgeArticleDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateKnowledgeArticle(int id, [FromBody] UpdateKnowledgeArticleDto dto, CancellationToken cancellationToken)
    {
        var result = await _brandService.UpdateKnowledgeArticleAsync(id, dto, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Delete a knowledge article
    /// </summary>
    [HttpDelete("~/api/knowledge/{id}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteKnowledgeArticle(int id, CancellationToken cancellationToken)
    {
        var result = await _brandService.DeleteKnowledgeArticleAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #endregion

    #region Promotion Reports

    /// <summary>
    /// Get product promotion effectiveness report
    /// </summary>
    [HttpGet("~/api/reports/product-promotion")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ProductPromotionReportDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProductPromotionReport(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] int? productId = null,
        [FromQuery] int? brandId = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _brandService.GetProductPromotionReportAsync(fromDate, toDate, productId, brandId, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion
}
