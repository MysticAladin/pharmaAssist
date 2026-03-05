using Application.DTOs.Common;
using Application.DTOs.PriceLists;
using Application.DTOs.Wholesaler;
using Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Price Lists API Controller — manages price lists, items, and price comparisons
/// </summary>
[ApiController]
[Route("api/price-lists")]
[Produces("application/json")]
public class PriceListsController : ControllerBase
{
    private readonly IPriceListService _priceListService;
    private readonly ILogger<PriceListsController> _logger;

    public PriceListsController(IPriceListService priceListService, ILogger<PriceListsController> logger)
    {
        _priceListService = priceListService;
        _logger = logger;
    }

    #region Price Lists

    /// <summary>
    /// Get price lists with pagination and filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<PriceListDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPriceLists(
        [FromQuery] PriceListFilterRequest filter,
        CancellationToken cancellationToken)
    {
        var result = await _priceListService.GetPriceListsAsync(filter, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get price list details by ID including all items
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<PriceListDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPriceList(int id, CancellationToken cancellationToken)
    {
        var result = await _priceListService.GetPriceListByIdAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Create a new price list
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<PriceListDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatePriceList(
        [FromBody] CreatePriceListRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _priceListService.CreatePriceListAsync(request, cancellationToken);
        return result.Success
            ? CreatedAtAction(nameof(GetPriceList), new { id = result.Data!.Id }, result)
            : BadRequest(result);
    }

    /// <summary>
    /// Update an existing price list
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<PriceListDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePriceList(
        int id,
        [FromBody] UpdatePriceListRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _priceListService.UpdatePriceListAsync(id, request, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Delete a price list and all its items
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePriceList(int id, CancellationToken cancellationToken)
    {
        var result = await _priceListService.DeletePriceListAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #endregion

    #region Items

    /// <summary>
    /// Add an item to a price list
    /// </summary>
    [HttpPost("items")]
    [ProducesResponseType(typeof(ApiResponse<PriceListItemDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddItem(
        [FromBody] CreatePriceListItemRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _priceListService.AddItemAsync(request, cancellationToken);
        return result.Success ? CreatedAtAction(nameof(GetPriceList), new { id = request.PriceListId }, result) : BadRequest(result);
    }

    /// <summary>
    /// Update a price list item
    /// </summary>
    [HttpPut("items/{id}")]
    [ProducesResponseType(typeof(ApiResponse<PriceListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateItem(
        int id,
        [FromBody] UpdatePriceListItemRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _priceListService.UpdateItemAsync(id, request, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Remove an item from a price list
    /// </summary>
    [HttpDelete("items/{id}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveItem(int id, CancellationToken cancellationToken)
    {
        var result = await _priceListService.RemoveItemAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Bulk add items to a price list
    /// </summary>
    [HttpPost("items/bulk")]
    [ProducesResponseType(typeof(ApiResponse<int>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> BulkAddItems(
        [FromBody] BulkPriceListItemRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _priceListService.BulkAddItemsAsync(request, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Comparison

    /// <summary>
    /// Compare prices across multiple price lists
    /// </summary>
    [HttpGet("compare")]
    [ProducesResponseType(typeof(ApiResponse<List<PriceComparisonDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ComparePriceLists(
        [FromQuery] List<int> priceListIds,
        [FromQuery] int? productId = null,
        CancellationToken cancellationToken = default)
    {
        if (priceListIds == null || priceListIds.Count < 2)
            return BadRequest(ApiResponse<List<PriceComparisonDto>>.Fail("At least 2 price lists are required for comparison"));

        var result = await _priceListService.ComparePriceListsAsync(priceListIds, productId, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion
}
