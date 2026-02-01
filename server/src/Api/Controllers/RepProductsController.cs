using Application.DTOs.Common;
using Application.DTOs.Inventory;
using Application.DTOs.Products;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers;

/// <summary>
/// Rep Products API Controller - Product catalog for sales representatives
/// </summary>
[ApiController]
[Route("api/products/rep")]
[Produces("application/json")]
[Authorize]
public class RepProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly IInventoryService _inventoryService;
    private readonly ILogger<RepProductsController> _logger;

    public RepProductsController(
        IProductService productService,
        IInventoryService inventoryService,
        ILogger<RepProductsController> logger)
    {
        _productService = productService;
        _inventoryService = inventoryService;
        _logger = logger;
    }

    /// <summary>
    /// Get product catalog for reps (active products only)
    /// </summary>
    [HttpGet("catalog")]
    [ProducesResponseType(typeof(PagedResponse<ProductSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCatalog(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] int? manufacturerId = null,
        [FromQuery] bool? requiresPrescription = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortDirection = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _productService.GetPagedAsync(
                page: page,
                pageSize: pageSize,
                search: search,
                categoryId: categoryId,
                manufacturerId: manufacturerId,
                activeOnly: true, // Always filter active products for reps
                minPrice: null,
                maxPrice: null,
                stockStatus: null,
                requiresPrescription: requiresPrescription,
                hasBarcode: null,
                expiryStatus: null,
                sortBy: sortBy,
                sortDirection: sortDirection,
                cancellationToken: cancellationToken);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error getting rep product catalog");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get product details for rep
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProduct(int id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _productService.GetByIdAsync(id, cancellationToken);
            if (!result.Success || result.Data == null)
            {
                return NotFound(new { message = "Product not found" });
            }
            return Ok(result.Data);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error getting product {ProductId}", id);
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get inventory levels for a product across warehouses
    /// </summary>
    [HttpGet("{id:int}/inventory")]
    [ProducesResponseType(typeof(ProductStockSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProductInventory(int id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _inventoryService.GetProductStockSummaryAsync(id, cancellationToken);
            if (!result.Success)
            {
                return NotFound(new { message = "Product not found or no inventory data" });
            }
            return Ok(result.Data);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error getting product inventory {ProductId}", id);
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Search products by name or barcode
    /// </summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(IEnumerable<ProductSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SearchProducts([FromQuery] string term, CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(term) || term.Length < 2)
            {
                return Ok(Array.Empty<ProductSummaryDto>());
            }

            var result = await _productService.SearchAsync(term, cancellationToken);
            return Ok(result.Data ?? Array.Empty<ProductSummaryDto>());
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error searching products");
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get products by category for quick filtering
    /// </summary>
    [HttpGet("category/{categoryId:int}")]
    [ProducesResponseType(typeof(IEnumerable<ProductDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByCategory(int categoryId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _productService.GetByCategoryAsync(categoryId, cancellationToken);
            return Ok(result.Data ?? Array.Empty<ProductDto>());
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error getting products by category {CategoryId}", categoryId);
            return BadRequest(new { message = ex.Message });
        }
    }

    private string GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            throw new InvalidOperationException("User ID not found in claims.");
        }
        return userId;
    }
}
