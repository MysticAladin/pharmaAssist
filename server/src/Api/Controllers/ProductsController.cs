using Application.DTOs.Common;
using Application.DTOs.Products;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Products API Controller
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(IProductService productService, ILogger<ProductsController> logger)
    {
        _productService = productService;
        _logger = logger;
    }

    /// <summary>
    /// Get all products
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ProductDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await _productService.GetAllAsync(cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get products with pagination
    /// </summary>
    [HttpGet("paged")]
    [ProducesResponseType(typeof(PagedResponse<ProductSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] int? manufacturerId = null,
        [FromQuery] bool? activeOnly = true,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] string? stockStatus = null,
        [FromQuery] bool? requiresPrescription = null,
        [FromQuery] bool? hasBarcode = null,
        [FromQuery] string? expiryStatus = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortDirection = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _productService.GetPagedAsync(
            page, pageSize, search, categoryId, manufacturerId, activeOnly,
            minPrice, maxPrice, stockStatus, requiresPrescription, hasBarcode,
            expiryStatus, sortBy, sortDirection, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get product by ID
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<ProductDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<ProductDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _productService.GetByIdAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Search products
    /// </summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ProductSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Search([FromQuery] string searchTerm, CancellationToken cancellationToken)
    {
        var result = await _productService.SearchAsync(searchTerm, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get products by category
    /// </summary>
    [HttpGet("by-category/{categoryId:int}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ProductDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByCategory(int categoryId, CancellationToken cancellationToken)
    {
        var result = await _productService.GetByCategoryAsync(categoryId, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get products by manufacturer
    /// </summary>
    [HttpGet("by-manufacturer/{manufacturerId:int}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ProductDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByManufacturer(int manufacturerId, CancellationToken cancellationToken)
    {
        var result = await _productService.GetByManufacturerAsync(manufacturerId, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get low stock products
    /// </summary>
    [HttpGet("low-stock")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ProductDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLowStock([FromQuery] int threshold = 10, CancellationToken cancellationToken = default)
    {
        var result = await _productService.GetLowStockAsync(threshold, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Create a new product
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<ProductDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<ProductDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateProductDto dto, CancellationToken cancellationToken)
    {
        var result = await _productService.CreateAsync(dto, cancellationToken);
        return result.Success 
            ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result) 
            : BadRequest(result);
    }

    /// <summary>
    /// Update an existing product
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<ProductDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<ProductDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProductDto dto, CancellationToken cancellationToken)
    {
        var result = await _productService.UpdateAsync(id, dto, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Delete a product
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var result = await _productService.DeleteAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Activate a product
    /// </summary>
    [HttpPatch("{id:int}/activate")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Activate(int id, CancellationToken cancellationToken)
    {
        var result = await _productService.ActivateAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Deactivate a product
    /// </summary>
    [HttpPatch("{id:int}/deactivate")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Deactivate(int id, CancellationToken cancellationToken)
    {
        var result = await _productService.DeactivateAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #region Product Batches

    /// <summary>
    /// Get product batch by ID
    /// </summary>
    [HttpGet("batches/{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<ProductBatchDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<ProductBatchDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBatchById(int id, CancellationToken cancellationToken)
    {
        var result = await _productService.GetBatchByIdAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get batches for a product
    /// </summary>
    [HttpGet("{productId:int}/batches")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ProductBatchDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBatchesByProduct(int productId, CancellationToken cancellationToken)
    {
        var result = await _productService.GetBatchesByProductAsync(productId, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get expiring batches
    /// </summary>
    [HttpGet("batches/expiring")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ProductBatchDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetExpiringBatches([FromQuery] int daysUntilExpiry = 90, CancellationToken cancellationToken = default)
    {
        var result = await _productService.GetExpiringBatchesAsync(daysUntilExpiry, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Create a new product batch
    /// </summary>
    [HttpPost("batches")]
    [ProducesResponseType(typeof(ApiResponse<ProductBatchDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<ProductBatchDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateBatch([FromBody] CreateProductBatchDto dto, CancellationToken cancellationToken)
    {
        var result = await _productService.CreateBatchAsync(dto, cancellationToken);
        return result.Success 
            ? CreatedAtAction(nameof(GetBatchById), new { id = result.Data!.Id }, result) 
            : BadRequest(result);
    }

    /// <summary>
    /// Update a product batch
    /// </summary>
    [HttpPut("batches/{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<ProductBatchDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<ProductBatchDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateBatch(int id, [FromBody] UpdateProductBatchDto dto, CancellationToken cancellationToken)
    {
        var result = await _productService.UpdateBatchAsync(id, dto, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #endregion
}
