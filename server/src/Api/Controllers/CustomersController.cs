using Application.DTOs.Common;
using Application.DTOs.Customers;
using Application.Interfaces;
using Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Customers API Controller
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;
    private readonly ILogger<CustomersController> _logger;

    public CustomersController(ICustomerService customerService, ILogger<CustomersController> logger)
    {
        _customerService = customerService;
        _logger = logger;
    }

    /// <summary>
    /// Get all customers
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<CustomerDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await _customerService.GetAllAsync(cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get customers with pagination
    /// </summary>
    [HttpGet("paged")]
    [ProducesResponseType(typeof(PagedResponse<CustomerSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] CustomerType? customerType = null,
        [FromQuery] CustomerTier? tier = null,
        [FromQuery] bool? activeOnly = true,
        CancellationToken cancellationToken = default)
    {
        var result = await _customerService.GetPagedAsync(page, pageSize, search, customerType, tier, activeOnly, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get customer by ID
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _customerService.GetByIdAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get customer by customer code
    /// </summary>
    [HttpGet("code/{customerCode}")]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByCode(string customerCode, CancellationToken cancellationToken)
    {
        var result = await _customerService.GetByCodeAsync(customerCode, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Search customers
    /// </summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<CustomerSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Search([FromQuery] string searchTerm, CancellationToken cancellationToken)
    {
        var result = await _customerService.SearchAsync(searchTerm, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get customer summaries for dropdowns
    /// </summary>
    [HttpGet("summaries")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<CustomerSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummaries(
        [FromQuery] bool? activeOnly = true,
        [FromQuery] int take = 5000,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Defensive cap to avoid accidental huge payloads
            if (take < 1) take = 1;
            if (take > 10000) take = 10000;

            var page = await _customerService.GetPagedAsync(
                page: 1,
                pageSize: take,
                search: null,
                customerType: null,
                tier: null,
                activeOnly: activeOnly,
                cancellationToken: cancellationToken);

            return Ok(ApiResponse<IEnumerable<CustomerSummaryDto>>.Ok(page.Data));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting customer summaries");
            return Ok(ApiResponse<IEnumerable<CustomerSummaryDto>>.Fail("An error occurred while retrieving customers"));
        }
    }

    /// <summary>
    /// Create a new customer
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateCustomerDto dto, CancellationToken cancellationToken)
    {
        var result = await _customerService.CreateAsync(dto, cancellationToken);
        return result.Success 
            ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result) 
            : BadRequest(result);
    }

    /// <summary>
    /// Update an existing customer
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCustomerDto dto, CancellationToken cancellationToken)
    {
        var result = await _customerService.UpdateAsync(id, dto, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Delete a customer
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var result = await _customerService.DeleteAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Activate a customer
    /// </summary>
    [HttpPatch("{id:int}/activate")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Activate(int id, CancellationToken cancellationToken)
    {
        var result = await _customerService.ActivateAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Deactivate a customer
    /// </summary>
    [HttpPatch("{id:int}/deactivate")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Deactivate(int id, CancellationToken cancellationToken)
    {
        var result = await _customerService.DeactivateAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #region Branches

    /// <summary>
    /// Get branches (child customers) for a headquarters customer
    /// </summary>
    [HttpGet("{customerId:int}/branches")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<CustomerSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBranches(int customerId, CancellationToken cancellationToken)
    {
        var result = await _customerService.GetBranchesAsync(customerId, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Create a branch (child customer) under a headquarters customer
    /// </summary>
    [HttpPost("{customerId:int}/branches")]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateBranch(int customerId, [FromBody] CreateBranchDto dto, CancellationToken cancellationToken)
    {
        var result = await _customerService.CreateBranchAsync(customerId, dto, cancellationToken);
        return result.Success
            ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result)
            : BadRequest(result);
    }

    /// <summary>
    /// Update a branch (child customer) under a headquarters customer
    /// </summary>
    [HttpPut("{customerId:int}/branches/{branchCustomerId:int}")]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateBranch(int customerId, int branchCustomerId, [FromBody] UpdateBranchDto dto, CancellationToken cancellationToken)
    {
        var result = await _customerService.UpdateBranchAsync(customerId, branchCustomerId, dto, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Delete (or deactivate) a branch under a headquarters customer
    /// </summary>
    [HttpDelete("{customerId:int}/branches/{branchCustomerId:int}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteBranch(int customerId, int branchCustomerId, CancellationToken cancellationToken)
    {
        var result = await _customerService.DeleteBranchAsync(customerId, branchCustomerId, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #endregion

    #region Customer Addresses

    /// <summary>
    /// Get customer addresses
    /// </summary>
    [HttpGet("{customerId:int}/addresses")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<CustomerAddressDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAddresses(int customerId, CancellationToken cancellationToken)
    {
        var result = await _customerService.GetAddressesByCustomerAsync(customerId, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get address by ID
    /// </summary>
    [HttpGet("addresses/{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<CustomerAddressDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<CustomerAddressDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAddressById(int id, CancellationToken cancellationToken)
    {
        var result = await _customerService.GetAddressByIdAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Add address to customer
    /// </summary>
    [HttpPost("{customerId:int}/addresses")]
    [ProducesResponseType(typeof(ApiResponse<CustomerAddressDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<CustomerAddressDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateAddress(int customerId, [FromBody] CreateCustomerAddressDto dto, CancellationToken cancellationToken)
    {
        var result = await _customerService.CreateAddressAsync(customerId, dto, cancellationToken);
        return result.Success 
            ? CreatedAtAction(nameof(GetAddressById), new { id = result.Data!.Id }, result) 
            : BadRequest(result);
    }

    /// <summary>
    /// Update customer address
    /// </summary>
    [HttpPut("addresses/{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<CustomerAddressDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<CustomerAddressDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAddress(int id, [FromBody] UpdateCustomerAddressDto dto, CancellationToken cancellationToken)
    {
        var result = await _customerService.UpdateAddressAsync(id, dto, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Delete customer address
    /// </summary>
    [HttpDelete("addresses/{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAddress(int id, CancellationToken cancellationToken)
    {
        var result = await _customerService.DeleteAddressAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Set default address for customer
    /// </summary>
    [HttpPatch("{customerId:int}/addresses/{addressId:int}/set-default")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetDefaultAddress(int customerId, int addressId, CancellationToken cancellationToken)
    {
        var result = await _customerService.SetDefaultAddressAsync(customerId, addressId, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #endregion
}
