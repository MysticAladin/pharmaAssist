using Application.DTOs.Claims;
using Application.DTOs.Common;
using Application.DTOs.Orders;
using Application.Interfaces;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Api.Controllers;

/// <summary>
/// Customer Portal API Controller - endpoints for B2B customer portal
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize(Roles = "Customer,Admin,Manager")]
public class PortalController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IOrderService _orderService;
    private readonly IClaimService _claimService;
    private readonly ILogger<PortalController> _logger;

    public PortalController(
        ApplicationDbContext context,
        IOrderService orderService,
        IClaimService claimService,
        ILogger<PortalController> logger)
    {
        _context = context;
        _orderService = orderService;
        _claimService = claimService;
        _logger = logger;
    }

    private async Task<int?> GetCurrentCustomerIdAsync()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return null;

        var customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.UserId == userId && !c.IsDeleted);
        return customer?.Id;
    }

    #region Orders

    /// <summary>
    /// Get current customer's orders
    /// </summary>
    [HttpGet("orders")]
    [ProducesResponseType(typeof(PagedResponse<OrderSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] OrderStatus? status = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var customerId = await GetCurrentCustomerIdAsync();
        if (!customerId.HasValue)
            return Unauthorized(ApiResponse<object>.Fail("Customer not found"));

        var result = await _orderService.GetPagedAsync(page, pageSize, customerId, status, null, fromDate, toDate, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get order details for current customer
    /// </summary>
    [HttpGet("orders/{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOrderById(int id, CancellationToken cancellationToken)
    {
        var customerId = await GetCurrentCustomerIdAsync();
        if (!customerId.HasValue)
            return Unauthorized(ApiResponse<object>.Fail("Customer not found"));

        var result = await _orderService.GetByIdAsync(id, cancellationToken);
        if (!result.Success || result.Data == null)
            return NotFound(result);

        // Ensure customer owns this order
        if (result.Data.CustomerId != customerId.Value)
            return NotFound(ApiResponse<OrderDto>.Fail("Order not found"));

        return Ok(result);
    }

    /// <summary>
    /// Get order by order number for current customer
    /// </summary>
    [HttpGet("orders/number/{orderNumber}")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOrderByNumber(string orderNumber, CancellationToken cancellationToken)
    {
        var customerId = await GetCurrentCustomerIdAsync();
        if (!customerId.HasValue)
            return Unauthorized(ApiResponse<object>.Fail("Customer not found"));

        var result = await _orderService.GetByOrderNumberAsync(orderNumber, cancellationToken);
        if (!result.Success || result.Data == null)
            return NotFound(result);

        // Ensure customer owns this order
        if (result.Data.CustomerId != customerId.Value)
            return NotFound(ApiResponse<OrderDto>.Fail("Order not found"));

        return Ok(result);
    }

    /// <summary>
    /// Cancel an order (customer initiated)
    /// </summary>
    [HttpPost("orders/{id:int}/cancel")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CancelOrder(int id, [FromBody] CancelOrderRequest request, CancellationToken cancellationToken)
    {
        var customerId = await GetCurrentCustomerIdAsync();
        if (!customerId.HasValue)
            return Unauthorized(ApiResponse<object>.Fail("Customer not found"));

        // Verify order belongs to customer
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == id && o.CustomerId == customerId.Value, cancellationToken);
        if (order == null)
            return NotFound(ApiResponse<OrderDto>.Fail("Order not found"));

        // Only allow cancellation if order is Pending or Confirmed
        if (order.Status != OrderStatus.Pending && order.Status != OrderStatus.Confirmed)
            return BadRequest(ApiResponse<OrderDto>.Fail("Order cannot be cancelled at this stage"));

        var result = await _orderService.CancelOrderAsync(id, request.Reason, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Create a new order (from portal cart)
    /// </summary>
    [HttpPost("orders")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDto dto, CancellationToken cancellationToken)
    {
        var customerId = await GetCurrentCustomerIdAsync();
        if (!customerId.HasValue)
            return Unauthorized(ApiResponse<object>.Fail("Customer not found"));

        // Override customer ID with the logged-in customer
        dto.CustomerId = customerId.Value;

        var result = await _orderService.CreateAsync(dto, cancellationToken);
        return result.Success 
            ? CreatedAtAction(nameof(GetOrderById), new { id = result.Data!.Id }, result) 
            : BadRequest(result);
    }

    /// <summary>
    /// Reorder items from a previous order
    /// </summary>
    [HttpPost("orders/{id:int}/reorder")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Reorder(int id, CancellationToken cancellationToken)
    {
        var customerId = await GetCurrentCustomerIdAsync();
        if (!customerId.HasValue)
            return Unauthorized(ApiResponse<object>.Fail("Customer not found"));

        // Get the original order
        var originalOrder = await _context.Orders
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == id && o.CustomerId == customerId.Value, cancellationToken);

        if (originalOrder == null)
            return NotFound(ApiResponse<OrderDto>.Fail("Order not found"));

        // Create new order with same items
        var createDto = new CreateOrderDto
        {
            CustomerId = customerId.Value,
            ShippingAddressId = originalOrder.ShippingAddressId,
            BillingAddressId = originalOrder.BillingAddressId,
            PaymentMethod = originalOrder.PaymentMethod,
            Notes = $"Reorder of {originalOrder.OrderNumber}",
            Items = originalOrder.OrderItems.Select(i => new CreateOrderItemDto
            {
                ProductId = i.ProductId,
                Quantity = i.Quantity
            }).ToList()
        };

        var result = await _orderService.CreateAsync(createDto, cancellationToken);
        return result.Success 
            ? CreatedAtAction(nameof(GetOrderById), new { id = result.Data!.Id }, result) 
            : BadRequest(result);
    }

    #endregion

    #region Claims

    /// <summary>
    /// Get current customer's claims
    /// </summary>
    [HttpGet("claims")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ClaimSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyClaims(CancellationToken cancellationToken)
    {
        var customerId = await GetCurrentCustomerIdAsync();
        if (!customerId.HasValue)
            return Unauthorized(ApiResponse<object>.Fail("Customer not found"));

        var result = await _claimService.GetByCustomerAsync(customerId.Value, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get claim details for current customer
    /// </summary>
    [HttpGet("claims/{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<ClaimDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<ClaimDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetClaimById(int id, CancellationToken cancellationToken)
    {
        var customerId = await GetCurrentCustomerIdAsync();
        if (!customerId.HasValue)
            return Unauthorized(ApiResponse<object>.Fail("Customer not found"));

        var result = await _claimService.GetByIdAsync(id, cancellationToken);
        if (!result.Success || result.Data == null)
            return NotFound(result);

        // Ensure customer owns this claim
        if (result.Data.CustomerId != customerId.Value)
            return NotFound(ApiResponse<ClaimDto>.Fail("Claim not found"));

        return Ok(result);
    }

    /// <summary>
    /// Get claims for a specific order (customer must own the order)
    /// </summary>
    [HttpGet("orders/{orderId:int}/claims")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ClaimSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOrderClaims(int orderId, CancellationToken cancellationToken)
    {
        var customerId = await GetCurrentCustomerIdAsync();
        if (!customerId.HasValue)
            return Unauthorized(ApiResponse<object>.Fail("Customer not found"));

        // Verify order belongs to customer
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId && o.CustomerId == customerId.Value, cancellationToken);
        if (order == null)
            return NotFound(ApiResponse<object>.Fail("Order not found"));

        var result = await _claimService.GetByOrderAsync(orderId, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Submit a new claim (customer portal)
    /// </summary>
    [HttpPost("claims")]
    [ProducesResponseType(typeof(ApiResponse<ClaimDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<ClaimDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitClaim([FromBody] PortalCreateClaimDto dto, CancellationToken cancellationToken)
    {
        var customerId = await GetCurrentCustomerIdAsync();
        if (!customerId.HasValue)
            return Unauthorized(ApiResponse<object>.Fail("Customer not found"));

        var result = await _claimService.CreateFromPortalAsync(customerId.Value, dto, cancellationToken);
        return result.Success 
            ? CreatedAtAction(nameof(GetClaimById), new { id = result.Data!.Id }, result) 
            : BadRequest(result);
    }

    /// <summary>
    /// Cancel a claim (customer can cancel if not yet processed)
    /// </summary>
    [HttpPost("claims/{id:int}/cancel")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CancelClaim(int id, [FromBody] CancelClaimRequest request, CancellationToken cancellationToken)
    {
        var customerId = await GetCurrentCustomerIdAsync();
        if (!customerId.HasValue)
            return Unauthorized(ApiResponse<object>.Fail("Customer not found"));

        // Verify claim belongs to customer
        var claim = await _context.Claims.FirstOrDefaultAsync(c => c.Id == id && c.CustomerId == customerId.Value, cancellationToken);
        if (claim == null)
            return NotFound(ApiResponse<bool>.Fail("Claim not found"));

        // Only allow cancellation if claim is still in Submitted or UnderReview status
        if (claim.Status != ClaimStatus.Submitted && claim.Status != ClaimStatus.UnderReview)
            return BadRequest(ApiResponse<bool>.Fail("Claim cannot be cancelled at this stage"));

        var result = await _claimService.CancelAsync(id, request.Reason, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Update return tracking number (customer provides shipping info)
    /// </summary>
    [HttpPatch("claims/{id:int}/tracking")]
    [ProducesResponseType(typeof(ApiResponse<ClaimDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<ClaimDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateClaimTracking(int id, [FromBody] UpdateReturnTrackingDto dto, CancellationToken cancellationToken)
    {
        var customerId = await GetCurrentCustomerIdAsync();
        if (!customerId.HasValue)
            return Unauthorized(ApiResponse<object>.Fail("Customer not found"));

        // Verify claim belongs to customer
        var claim = await _context.Claims.FirstOrDefaultAsync(c => c.Id == id && c.CustomerId == customerId.Value, cancellationToken);
        if (claim == null)
            return NotFound(ApiResponse<ClaimDto>.Fail("Claim not found"));

        var result = await _claimService.UpdateReturnTrackingAsync(id, dto, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Products

    /// <summary>
    /// Get paginated product catalog for portal
    /// </summary>
    [HttpGet("products")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [AllowAnonymous]
    public async Task<IActionResult> GetProducts(
        [FromQuery] string? search = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] string? category = null,
        [FromQuery] int? manufacturerId = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] bool? inStockOnly = null,
        [FromQuery] bool? requiresPrescription = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortOrder = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.Manufacturer)
            .Where(p => !p.IsDeleted && p.IsActive);

        // Apply filters
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(p => 
                p.Name.ToLower().Contains(searchLower) ||
                p.SKU.ToLower().Contains(searchLower) ||
                (p.Description != null && p.Description.ToLower().Contains(searchLower)));
        }

        // Filter by category ID or category name/slug
        if (categoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == categoryId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(category))
        {
            // Map common navigation slugs to actual category names or parent categories
            var categorySlugMappings = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
            {
                // "medications" / "lijekovi" -> All medicine-related categories
                { "medications", new[] { "Prescription Medicines", "OTC Medicines", "Antibiotics", "Cardiovascular", "Diabetes", "Neurological", "Respiratory", "Gastroenterology", "Pain Relief", "Cold & Flu", "Allergies", "First Aid" } },
                // "medical-supplies" -> Medical devices and supplies
                { "medical-supplies", new[] { "Medical Devices", "Diagnostic Equipment", "Mobility Aids" } },
                // "equipment" / "oprema" -> Equipment categories
                { "equipment", new[] { "Medical Devices", "Diagnostic Equipment", "Mobility Aids" } }
            };

            if (categorySlugMappings.TryGetValue(category, out var mappedCategories))
            {
                // Filter by multiple category names
                query = query.Where(p => p.Category != null && mappedCategories.Contains(p.Category.Name));
            }
            else
            {
                // Support category filtering by name or slug (original logic)
                var categoryLower = category.ToLower().Replace("-", " ").Replace("_", " ");
                query = query.Where(p => p.Category != null && 
                    (p.Category.Name.ToLower() == categoryLower ||
                     p.Category.Name.ToLower().Replace(" ", "-") == category.ToLower() ||
                     p.Category.Name.ToLower().Replace(" ", "_") == category.ToLower()));
            }
        }

        if (manufacturerId.HasValue)
            query = query.Where(p => p.ManufacturerId == manufacturerId.Value);

        if (minPrice.HasValue)
            query = query.Where(p => p.UnitPrice >= minPrice.Value);

        if (maxPrice.HasValue)
            query = query.Where(p => p.UnitPrice <= maxPrice.Value);

        if (inStockOnly == true)
            query = query.Where(p => p.StockQuantity > 0);

        if (requiresPrescription.HasValue)
            query = query.Where(p => p.RequiresPrescription == requiresPrescription.Value);

        // Apply sorting
        query = (sortBy?.ToLower(), sortOrder?.ToLower()) switch
        {
            ("name", "desc") => query.OrderByDescending(p => p.Name),
            ("name", _) => query.OrderBy(p => p.Name),
            ("price", "desc") => query.OrderByDescending(p => p.UnitPrice),
            ("price", _) => query.OrderBy(p => p.UnitPrice),
            ("date", "desc") or ("createdat", "desc") => query.OrderByDescending(p => p.CreatedAt),
            ("date", _) or ("createdat", _) => query.OrderBy(p => p.CreatedAt),
            _ => query.OrderBy(p => p.Name)
        };

        var totalCount = await query.CountAsync(cancellationToken);
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new PortalProductDto
            {
                Id = p.Id,
                Name = p.Name,
                SKU = p.SKU,
                Description = p.Description ?? "",
                Price = p.UnitPrice,
                ImageUrl = p.ImageUrl,
                CategoryName = p.Category != null ? p.Category.Name : "",
                ManufacturerName = p.Manufacturer != null ? p.Manufacturer.Name : "",
                IsInStock = p.StockQuantity > 0,
                StockQuantity = p.StockQuantity
            })
            .ToListAsync(cancellationToken);

        return Ok(new
        {
            items,
            totalCount,
            page,
            pageSize,
            totalPages,
            hasPrevious = page > 1,
            hasNext = page < totalPages
        });
    }

    /// <summary>
    /// Get single product details for portal
    /// </summary>
    [HttpGet("products/{id:int}")]
    [ProducesResponseType(typeof(PortalProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [AllowAnonymous]
    public async Task<IActionResult> GetProductById(int id, CancellationToken cancellationToken)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Manufacturer)
            .Where(p => p.Id == id && !p.IsDeleted && p.IsActive)
            .Select(p => new PortalProductDto
            {
                Id = p.Id,
                Name = p.Name,
                SKU = p.SKU,
                Description = p.Description ?? "",
                Price = p.UnitPrice,
                ImageUrl = p.ImageUrl,
                CategoryName = p.Category != null ? p.Category.Name : "",
                ManufacturerName = p.Manufacturer != null ? p.Manufacturer.Name : "",
                IsInStock = p.StockQuantity > 0,
                StockQuantity = p.StockQuantity
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (product == null)
            return NotFound();

        return Ok(product);
    }

    /// <summary>
    /// Get categories for portal filter
    /// </summary>
    [HttpGet("categories")]
    [ProducesResponseType(typeof(IEnumerable<PortalCategoryDto>), StatusCodes.Status200OK)]
    [AllowAnonymous]
    public async Task<IActionResult> GetCategories(CancellationToken cancellationToken)
    {
        var categories = await _context.Categories
            .Where(c => !c.IsDeleted)
            .OrderBy(c => c.Name)
            .Select(c => new PortalCategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description ?? "",
                ProductCount = c.Products.Count(p => !p.IsDeleted && p.IsActive)
            })
            .ToListAsync(cancellationToken);

        return Ok(categories);
    }

    /// <summary>
    /// Get manufacturers for portal filter
    /// </summary>
    [HttpGet("manufacturers")]
    [ProducesResponseType(typeof(IEnumerable<PortalManufacturerDto>), StatusCodes.Status200OK)]
    [AllowAnonymous]
    public async Task<IActionResult> GetManufacturers(CancellationToken cancellationToken)
    {
        var manufacturers = await _context.Manufacturers
            .Where(m => !m.IsDeleted)
            .OrderBy(m => m.Name)
            .Select(m => new PortalManufacturerDto
            {
                Id = m.Id,
                Name = m.Name,
                ProductCount = m.Products.Count(p => !p.IsDeleted && p.IsActive)
            })
            .ToListAsync(cancellationToken);

        return Ok(manufacturers);
    }

    /// <summary>
    /// Get featured products for portal home
    /// </summary>
    [HttpGet("products/featured")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<PortalProductDto>>), StatusCodes.Status200OK)]
    [AllowAnonymous]
    public async Task<IActionResult> GetFeaturedProducts([FromQuery] int count = 8, CancellationToken cancellationToken = default)
    {
        var products = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Manufacturer)
            .Where(p => !p.IsDeleted && p.IsActive && p.IsFeatured)
            .OrderBy(p => p.Name)
            .Take(count)
            .Select(p => new PortalProductDto
            {
                Id = p.Id,
                Name = p.Name,
                SKU = p.SKU,
                Description = p.Description ?? "",
                Price = p.UnitPrice,
                ImageUrl = p.ImageUrl,
                CategoryName = p.Category != null ? p.Category.Name : "",
                ManufacturerName = p.Manufacturer != null ? p.Manufacturer.Name : "",
                IsInStock = p.StockQuantity > 0,
                StockQuantity = p.StockQuantity
            })
            .ToListAsync(cancellationToken);

        return Ok(ApiResponse<IEnumerable<PortalProductDto>>.Ok(products));
    }

    /// <summary>
    /// Get new products for portal home
    /// </summary>
    [HttpGet("products/new")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<PortalProductDto>>), StatusCodes.Status200OK)]
    [AllowAnonymous]
    public async Task<IActionResult> GetNewProducts([FromQuery] int count = 8, CancellationToken cancellationToken = default)
    {
        var products = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Manufacturer)
            .Where(p => !p.IsDeleted && p.IsActive)
            .OrderByDescending(p => p.CreatedAt)
            .Take(count)
            .Select(p => new PortalProductDto
            {
                Id = p.Id,
                Name = p.Name,
                SKU = p.SKU,
                Description = p.Description ?? "",
                Price = p.UnitPrice,
                ImageUrl = p.ImageUrl,
                CategoryName = p.Category != null ? p.Category.Name : "",
                ManufacturerName = p.Manufacturer != null ? p.Manufacturer.Name : "",
                IsInStock = p.StockQuantity > 0,
                StockQuantity = p.StockQuantity
            })
            .ToListAsync(cancellationToken);

        return Ok(ApiResponse<IEnumerable<PortalProductDto>>.Ok(products));
    }

    /// <summary>
    /// Get reorder suggestions based on customer's order history
    /// </summary>
    [HttpGet("reorder-suggestions")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<PortalProductDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReorderSuggestions([FromQuery] int count = 6, CancellationToken cancellationToken = default)
    {
        var customerId = await GetCurrentCustomerIdAsync();
        if (!customerId.HasValue)
            return Ok(ApiResponse<IEnumerable<PortalProductDto>>.Ok(new List<PortalProductDto>()));

        // Get products from customer's recent orders
        var recentProductIds = await _context.OrderItems
            .Include(oi => oi.Order)
            .Where(oi => oi.Order.CustomerId == customerId.Value && !oi.Order.IsDeleted)
            .OrderByDescending(oi => oi.Order.OrderDate)
            .Select(oi => oi.ProductId)
            .Distinct()
            .Take(count * 2)
            .ToListAsync(cancellationToken);

        var products = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Manufacturer)
            .Where(p => recentProductIds.Contains(p.Id) && !p.IsDeleted && p.IsActive)
            .Take(count)
            .Select(p => new PortalProductDto
            {
                Id = p.Id,
                Name = p.Name,
                SKU = p.SKU,
                Description = p.Description ?? "",
                Price = p.UnitPrice,
                ImageUrl = p.ImageUrl,
                CategoryName = p.Category != null ? p.Category.Name : "",
                ManufacturerName = p.Manufacturer != null ? p.Manufacturer.Name : "",
                IsInStock = p.StockQuantity > 0,
                StockQuantity = p.StockQuantity
            })
            .ToListAsync(cancellationToken);

        return Ok(ApiResponse<IEnumerable<PortalProductDto>>.Ok(products));
    }

    #endregion

    #region Customer Info

    /// <summary>
    /// Get current customer's profile
    /// </summary>
    [HttpGet("profile")]
    [ProducesResponseType(typeof(ApiResponse<CustomerProfileDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProfile(CancellationToken cancellationToken)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(ApiResponse<object>.Fail("User not found"));

        var customer = await _context.Customers
            .Include(c => c.Addresses)
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.UserId == userId && !c.IsDeleted, cancellationToken);

        if (customer == null)
            return NotFound(ApiResponse<CustomerProfileDto>.Fail("Customer profile not found"));

        var profile = new CustomerProfileDto
        {
            Id = customer.Id,
            CustomerCode = customer.CustomerCode,
            CompanyName = customer.CompanyName ?? "",
            FirstName = customer.FirstName ?? "",
            LastName = customer.LastName ?? "",
            Email = customer.Email ?? customer.User?.Email ?? "",
            Phone = customer.Phone ?? "",
            MobilePhone = customer.MobilePhone ?? "",
            TaxId = customer.TaxId ?? "",
            Tier = customer.Tier.ToString(),
            CreditLimit = customer.CreditLimit,
            CurrentBalance = customer.CurrentBalance,
            PaymentTermsDays = customer.PaymentTermsDays,
            Addresses = customer.Addresses
                .Where(a => !a.IsDeleted)
                .Select(a => new CustomerAddressDto
                {
                    Id = a.Id,
                    Street = a.Street,
                    Street2 = a.Street2 ?? "",
                    City = a.City,
                    PostalCode = a.PostalCode ?? "",
                    IsDefault = a.IsDefault,
                    AddressType = a.AddressType.ToString()
                }).ToList()
        };

        return Ok(ApiResponse<CustomerProfileDto>.Ok(profile));
    }

    #endregion
}

#region Request DTOs

public class CancelOrderRequest
{
    public string Reason { get; set; } = string.Empty;
}

public class CancelClaimRequest
{
    public string Reason { get; set; } = string.Empty;
}

public class CustomerProfileDto
{
    public int Id { get; set; }
    public string CustomerCode { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string MobilePhone { get; set; } = string.Empty;
    public string TaxId { get; set; } = string.Empty;
    public string Tier { get; set; } = string.Empty;
    public decimal CreditLimit { get; set; }
    public decimal CurrentBalance { get; set; }
    public int PaymentTermsDays { get; set; }
    public List<CustomerAddressDto> Addresses { get; set; } = new();
}

public class CustomerAddressDto
{
    public int Id { get; set; }
    public string Street { get; set; } = string.Empty;
    public string Street2 { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
    public string AddressType { get; set; } = string.Empty;
}

public class PortalProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string ManufacturerName { get; set; } = string.Empty;
    public bool IsInStock { get; set; }
    public int StockQuantity { get; set; }
}

public class PortalCategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int ProductCount { get; set; }
}

public class PortalManufacturerDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int ProductCount { get; set; }
}

#endregion
