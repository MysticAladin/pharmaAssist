using Application.DTOs.Claims;
using Application.DTOs.Common;
using Application.DTOs.Dashboard;
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
    private readonly IPdfService _pdfService;
    private readonly IClaimService _claimService;
    private readonly IPricingService _pricingService;
    private readonly ILogger<PortalController> _logger;

    public PortalController(
        ApplicationDbContext context,
        IOrderService orderService,
        IPdfService pdfService,
        IClaimService claimService,
        IPricingService pricingService,
        ILogger<PortalController> logger)
    {
        _context = context;
        _orderService = orderService;
        _pdfService = pdfService;
        _claimService = claimService;
        _pricingService = pricingService;
        _logger = logger;
    }

    private static string FormatAddress(Domain.Entities.CustomerAddress? address)
    {
        if (address == null) return string.Empty;

        var street = string.IsNullOrWhiteSpace(address.Street2)
            ? address.Street
            : $"{address.Street}, {address.Street2}";

        var cityLine = string.IsNullOrWhiteSpace(address.PostalCode)
            ? address.City
            : $"{address.PostalCode} {address.City}";

        return string.Join(", ", new[] { street, cityLine }.Where(s => !string.IsNullOrWhiteSpace(s)));
    }

    private async Task<int?> GetCurrentCustomerIdAsync()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return null;

        // Preferred mapping: user -> CustomerId (supports many users per branch/customer)
        var userCustomerId = await _context.Users
            .Where(u => u.Id == userId)
            .Select(u => u.CustomerId)
            .FirstOrDefaultAsync();

        if (userCustomerId.HasValue)
        {
            var exists = await _context.Customers
                .AnyAsync(c => c.Id == userCustomerId.Value && !c.IsDeleted);
            if (exists)
                return userCustomerId.Value;
        }

        var customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.UserId == userId && !c.IsDeleted);
        return customer?.Id;
    }

    /// <summary>
    /// Get the canton ID for the current customer's default address
    /// </summary>
    private async Task<int?> GetCurrentCustomerCantonIdAsync(int? customerId)
    {
        if (!customerId.HasValue) return null;

        // Get canton from customer's default address
        var cantonId = await _context.CustomerAddresses
            .Where(a => a.CustomerId == customerId.Value && a.IsDefault && !a.IsDeleted)
            .Select(a => a.CantonId)
            .FirstOrDefaultAsync();

        return cantonId;
    }

    #region Dashboard Stats

    /// <summary>
    /// Get dashboard statistics for the current customer
    /// </summary>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(ApiResponse<PortalDashboardStatsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboardStats(CancellationToken cancellationToken = default)
    {
        var customerId = await GetCurrentCustomerIdAsync();
        if (!customerId.HasValue)
            return Unauthorized(ApiResponse<object>.Fail("Customer not found"));

        var pendingOrders = await _context.Orders
            .Where(o => o.CustomerId == customerId.Value && !o.IsDeleted)
            .Where(o => o.Status == OrderStatus.Pending || o.Status == OrderStatus.Processing || o.Status == OrderStatus.Shipped)
            .CountAsync(cancellationToken);

        var totalOrders = await _context.Orders
            .Where(o => o.CustomerId == customerId.Value && !o.IsDeleted)
            .CountAsync(cancellationToken);

        var stats = new PortalDashboardStatsDto
        {
            PendingOrders = pendingOrders,
            TotalOrders = totalOrders,
            FavoriteCount = 0, // TODO: Implement when favorites feature is ready
            CartItemCount = 0  // Cart is managed client-side
        };

        return Ok(ApiResponse<PortalDashboardStatsDto>.Ok(stats));
    }

    #endregion

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

        var result = await _orderService.GetPagedAsync(
            page: page,
            pageSize: pageSize,
            searchTerm: null,
            customerId: customerId,
            status: status,
            paymentStatus: null,
            fromDate: fromDate,
            toDate: toDate,
            sortBy: null,
            sortDescending: true,
            cancellationToken: cancellationToken);
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
    public async Task<IActionResult> CreateOrder([FromBody] CreatePortalOrderDto dto, CancellationToken cancellationToken)
    {
        var customerId = await GetCurrentCustomerIdAsync();
        if (!customerId.HasValue)
            return Unauthorized(ApiResponse<object>.Fail("Customer not found"));

        var createDto = new CreateOrderDto
        {
            CustomerId = customerId.Value,
            ShippingAddressId = dto.ShippingAddressId,
            BillingAddressId = dto.BillingAddressId,
            PaymentMethod = dto.PaymentMethod,
            RequiredDate = dto.RequiredDate,
            Notes = dto.Notes,
            Items = dto.Items
        };

        var result = await _orderService.CreateAsync(createDto, cancellationToken);
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

    /// <summary>
    /// Download invoice PDF for an order (customer must own the order)
    /// </summary>
    [HttpGet("orders/{id:int}/invoice")]
    [Produces("application/pdf")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadInvoice(int id, CancellationToken cancellationToken)
    {
        var customerId = await GetCurrentCustomerIdAsync();
        if (!customerId.HasValue)
            return Unauthorized(ApiResponse<object>.Fail("Customer not found"));

        var order = await _context.Orders
            .Include(o => o.Customer)
            .Include(o => o.BillingAddress)
            .Include(o => o.ShippingAddress)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .FirstOrDefaultAsync(o => o.Id == id && o.CustomerId == customerId.Value, cancellationToken);

        if (order == null)
            return NotFound(ApiResponse<object>.Fail("Order not found"));

        var buyerAddress = FormatAddress(order.BillingAddress) ?? FormatAddress(order.ShippingAddress);
        var invoiceDate = order.OrderDate;
        var dueDate = invoiceDate.AddDays(Math.Max(0, order.Customer.PaymentTermsDays));

        var request = new InvoicePdfRequest
        {
            InvoiceNumber = order.OrderNumber,
            InvoiceDate = invoiceDate,
            DueDate = dueDate,

            BuyerName = order.Customer.FullName,
            BuyerAddress = buyerAddress,
            BuyerTaxId = order.Customer.TaxId ?? string.Empty,
            BuyerEmail = order.Customer.Email,

            Items = order.OrderItems.Select((item, index) => new InvoiceLineItem
            {
                LineNumber = index + 1,
                ProductCode = item.Product.SKU,
                ProductName = item.Product.Name,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                DiscountPercent = item.DiscountPercent,
                TaxPercent = item.TaxRate,
                LineTotal = item.LineTotal,
                IsEssential = item.PriceType == Domain.Enums.PriceType.Essential
            }).ToList(),

            SubTotal = order.SubTotal,
            TaxAmount = order.TaxAmount,
            DiscountAmount = order.DiscountAmount,
            TotalAmount = order.TotalAmount,

            PaymentTerms = order.Customer.PaymentTermsDays > 0 ? $"Net {order.Customer.PaymentTermsDays}" : string.Empty,
            Notes = order.Notes ?? string.Empty
        };

        var pdfBytes = await _pdfService.GenerateInvoicePdfAsync(request);
        return File(pdfBytes, "application/pdf", $"Faktura-{order.OrderNumber}.pdf");
    }

    /// <summary>
    /// Download split invoice PDF for an order (Commercial or Essential items only)
    /// </summary>
    /// <param name="id">Order ID</param>
    /// <param name="priceType">1 = Commercial, 2 = Essential</param>
    [HttpGet("orders/{id:int}/invoice/split/{priceType:int}")]
    [Produces("application/pdf")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DownloadSplitInvoice(int id, int priceType, CancellationToken cancellationToken)
    {
        if (priceType < 1 || priceType > 2)
            return BadRequest(ApiResponse<object>.Fail("Invalid price type. Use 1 for Commercial or 2 for Essential."));

        var customerId = await GetCurrentCustomerIdAsync();
        if (!customerId.HasValue)
            return Unauthorized(ApiResponse<object>.Fail("Customer not found"));

        var order = await _context.Orders
            .Include(o => o.Customer)
            .Include(o => o.BillingAddress)
            .Include(o => o.ShippingAddress)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .FirstOrDefaultAsync(o => o.Id == id && o.CustomerId == customerId.Value, cancellationToken);

        if (order == null)
            return NotFound(ApiResponse<object>.Fail("Order not found"));

        var targetPriceType = (Domain.Enums.PriceType)priceType;
        var filteredItems = order.OrderItems.Where(i => i.PriceType == targetPriceType).ToList();

        if (!filteredItems.Any())
            return NotFound(ApiResponse<object>.Fail($"No items found with price type {(priceType == 1 ? "Commercial" : "Essential")}"));

        var buyerAddress = FormatAddress(order.BillingAddress) ?? FormatAddress(order.ShippingAddress);
        var invoiceDate = order.OrderDate;
        var dueDate = invoiceDate.AddDays(Math.Max(0, order.Customer.PaymentTermsDays));

        // Calculate totals for filtered items only
        var subTotal = filteredItems.Sum(i => i.LineTotal);
        var taxAmount = filteredItems.Sum(i => i.LineTotal * (i.TaxRate / 100));
        var discountAmount = filteredItems.Sum(i => i.LineTotal * (i.DiscountPercent / 100));
        var totalAmount = subTotal + taxAmount - discountAmount;

        var priceTypeSuffix = priceType == 1 ? "K" : "E"; // K = Komercijalna, E = Esencijalna
        var priceTypeName = priceType == 1 ? "Komercijalna" : "Esencijalna";

        var request = new InvoicePdfRequest
        {
            InvoiceNumber = $"{order.OrderNumber}-{priceTypeSuffix}",
            InvoiceDate = invoiceDate,
            DueDate = dueDate,

            BuyerName = order.Customer.FullName,
            BuyerAddress = buyerAddress,
            BuyerTaxId = order.Customer.TaxId ?? string.Empty,
            BuyerEmail = order.Customer.Email,

            Items = filteredItems.Select((item, index) => new InvoiceLineItem
            {
                LineNumber = index + 1,
                ProductCode = item.Product.SKU,
                ProductName = item.Product.Name,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                DiscountPercent = item.DiscountPercent,
                TaxPercent = item.TaxRate,
                LineTotal = item.LineTotal,
                IsEssential = priceType == 2
            }).ToList(),

            SubTotal = subTotal,
            TaxAmount = taxAmount,
            DiscountAmount = discountAmount,
            TotalAmount = totalAmount,

            PaymentTerms = order.Customer.PaymentTermsDays > 0 ? $"Net {order.Customer.PaymentTermsDays}" : string.Empty,
            Notes = $"Faktura za {priceTypeName.ToLower()}e artikle. {order.Notes ?? string.Empty}".Trim()
        };

        var pdfBytes = await _pdfService.GenerateInvoicePdfAsync(request);
        return File(pdfBytes, "application/pdf", $"Faktura-{order.OrderNumber}-{priceTypeName}.pdf");
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

    private async Task<int?> GetCentralWarehouseIdAsync(CancellationToken cancellationToken)
    {
        // Prefer the configured fulfillment warehouse; fallback to explicit CENTRAL code.
        var id = await _context.Warehouses
            .Where(w => !w.IsDeleted && w.IsActive && w.CanFulfillOrders)
            .Select(w => (int?)w.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (id.HasValue)
            return id;

        return await _context.Warehouses
            .Where(w => !w.IsDeleted && w.IsActive && w.Code.ToUpper() == "CENTRAL")
            .Select(w => (int?)w.Id)
            .FirstOrDefaultAsync(cancellationToken);
    }

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
        var centralWarehouseId = await GetCentralWarehouseIdAsync(cancellationToken);

        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.Manufacturer)
            .Where(p => !p.IsDeleted && p.IsActive);

        // Portal requirement: only list products that exist in the Central (fulfillment) warehouse.
        if (centralWarehouseId.HasValue)
        {
            var wid = centralWarehouseId.Value;
            query = query.Where(p => _context.InventoryStocks.Any(s =>
                !s.IsDeleted && s.ProductId == p.Id && s.WarehouseId == wid));
        }

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
        {
            // Check ProductBatches (source of truth) for stock availability
            query = query.Where(p => _context.ProductBatches.Any(b =>
                b.ProductId == p.Id && b.IsActive && !b.IsDeleted && b.RemainingQuantity > 0));
        }

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

        // Get customer and canton info for pricing
        var customerId = await GetCurrentCustomerIdAsync();
        var cantonId = await GetCurrentCustomerCantonIdAsync(customerId);
        var now = DateTime.UtcNow;

        if (centralWarehouseId.HasValue)
        {
            var wid = centralWarehouseId.Value;
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new PortalProductDto
                {
                    Id = p.Id,
                    Code = p.SKU,
                    Name = p.Name,
                    GenericName = p.GenericName,
                    Description = p.Description ?? "",
                    UnitPrice = p.UnitPrice,
                    ImageUrl = p.ImageUrl,
                    Category = p.Category != null ? p.Category.Name : "",
                    CategoryId = p.CategoryId.ToString(),
                    Manufacturer = p.Manufacturer != null ? p.Manufacturer.Name : "",
                    ManufacturerId = p.ManufacturerId.ToString(),
                    // Read stock from ProductBatches (source of truth)
                    StockQuantity = _context.ProductBatches
                        .Where(b => b.ProductId == p.Id && b.IsActive && !b.IsDeleted && b.RemainingQuantity > 0)
                        .Sum(b => b.RemainingQuantity),
                    IsAvailable = _context.ProductBatches.Any(b =>
                        b.ProductId == p.Id && b.IsActive && !b.IsDeleted && b.RemainingQuantity > 0),
                    RequiresPrescription = p.RequiresPrescription,
                    EarliestExpiryDate = _context.ProductBatches
                        .Where(b => b.ProductId == p.Id && b.IsActive && b.RemainingQuantity > 0 && b.ExpiryDate >= DateTime.UtcNow)
                        .Select(b => (DateTime?)b.ExpiryDate)
                        .Min(),
                    DosageForm = p.DosageForm,
                    Strength = p.Strength,
                    PackSize = p.PackageSize
                })
                .ToListAsync(cancellationToken);

            // Enrich items with commercial and essential pricing
            await EnrichProductsWithPricingAsync(items, customerId, cantonId, now, cancellationToken);

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

        var fallbackItems = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new PortalProductDto
            {
                Id = p.Id,
                Code = p.SKU,
                Name = p.Name,
                GenericName = p.GenericName,
                Description = p.Description ?? "",
                UnitPrice = p.UnitPrice,
                ImageUrl = p.ImageUrl,
                Category = p.Category != null ? p.Category.Name : "",
                CategoryId = p.CategoryId.ToString(),
                Manufacturer = p.Manufacturer != null ? p.Manufacturer.Name : "",
                ManufacturerId = p.ManufacturerId.ToString(),
                // Read stock from ProductBatches (source of truth)
                StockQuantity = _context.ProductBatches
                    .Where(b => b.ProductId == p.Id && b.IsActive && !b.IsDeleted && b.RemainingQuantity > 0)
                    .Sum(b => b.RemainingQuantity),
                IsAvailable = _context.ProductBatches.Any(b =>
                    b.ProductId == p.Id && b.IsActive && !b.IsDeleted && b.RemainingQuantity > 0),
                RequiresPrescription = p.RequiresPrescription,
                EarliestExpiryDate = _context.ProductBatches
                    .Where(b => b.ProductId == p.Id && b.IsActive && b.RemainingQuantity > 0 && b.ExpiryDate >= DateTime.UtcNow)
                    .Select(b => (DateTime?)b.ExpiryDate)
                    .Min(),
                DosageForm = p.DosageForm,
                Strength = p.Strength,
                PackSize = p.PackageSize
            })
            .ToListAsync(cancellationToken);

        // Enrich items with commercial and essential pricing
        await EnrichProductsWithPricingAsync(fallbackItems, customerId, cantonId, now, cancellationToken);

        return Ok(new
        {
            items = fallbackItems,
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
        // ProductBatches is source of truth - no need to filter by warehouse for stock
        var productQuery = _context.Products
            .Include(p => p.Category)
            .Include(p => p.Manufacturer)
            .Where(p => p.Id == id && !p.IsDeleted && p.IsActive);

        var product = await productQuery
            .Select(p => new PortalProductDto
            {
                Id = p.Id,
                Code = p.SKU,
                Name = p.Name,
                GenericName = p.GenericName,
                Description = p.Description ?? "",
                UnitPrice = p.UnitPrice,
                ImageUrl = p.ImageUrl,
                Category = p.Category != null ? p.Category.Name : "",
                CategoryId = p.CategoryId.ToString(),
                Manufacturer = p.Manufacturer != null ? p.Manufacturer.Name : "",
                ManufacturerId = p.ManufacturerId.ToString(),
                // Read stock from ProductBatches (source of truth)
                StockQuantity = _context.ProductBatches
                    .Where(b => b.ProductId == p.Id && b.IsActive && !b.IsDeleted && b.RemainingQuantity > 0)
                    .Sum(b => b.RemainingQuantity),
                IsAvailable = _context.ProductBatches.Any(b =>
                    b.ProductId == p.Id && b.IsActive && !b.IsDeleted && b.RemainingQuantity > 0),
                RequiresPrescription = p.RequiresPrescription,
                EarliestExpiryDate = _context.ProductBatches
                    .Where(b => b.ProductId == p.Id && b.IsActive && b.RemainingQuantity > 0 && b.ExpiryDate >= DateTime.UtcNow)
                    .Select(b => (DateTime?)b.ExpiryDate)
                    .Min(),
                DosageForm = p.DosageForm,
                Strength = p.Strength,
                PackSize = p.PackageSize
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (product == null)
            return NotFound();

        return Ok(product);
    }

    /// <summary>
    /// Get paginated product batches for portal catalog
    /// </summary>
    [HttpGet("product-batches")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [AllowAnonymous]
    public async Task<IActionResult> GetProductBatches(
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
        var centralWarehouseId = await GetCentralWarehouseIdAsync(cancellationToken);
        var today = DateTime.UtcNow;

        var query = _context.ProductBatches
            .Include(b => b.Product)
                .ThenInclude(p => p.Category)
            .Include(b => b.Product)
                .ThenInclude(p => p.Manufacturer)
            .Where(b => b.IsActive && 
                        b.RemainingQuantity > 0 && 
                        b.ExpiryDate >= today &&
                        !b.Product.IsDeleted && 
                        b.Product.IsActive);

        // Portal requirement: only list batches for products in the Central warehouse
        if (centralWarehouseId.HasValue)
        {
            var wid = centralWarehouseId.Value;
            query = query.Where(b => _context.InventoryStocks.Any(s =>
                !s.IsDeleted && s.ProductId == b.ProductId && s.WarehouseId == wid));
        }

        // Apply filters
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(b => 
                b.Product.Name.ToLower().Contains(searchLower) ||
                b.Product.SKU.ToLower().Contains(searchLower) ||
                b.BatchNumber.ToLower().Contains(searchLower) ||
                (b.Product.Description != null && b.Product.Description.ToLower().Contains(searchLower)));
        }

        // Filter by category ID or category name/slug
        if (categoryId.HasValue)
        {
            query = query.Where(b => b.Product.CategoryId == categoryId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(category))
        {
            var categorySlugMappings = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
            {
                { "medications", new[] { "Prescription Medicines", "OTC Medicines", "Antibiotics", "Cardiovascular", "Diabetes", "Neurological", "Respiratory", "Gastroenterology", "Pain Relief", "Cold & Flu", "Allergies", "First Aid" } },
                { "medical-supplies", new[] { "Medical Devices", "Diagnostic Equipment", "Mobility Aids" } },
                { "equipment", new[] { "Medical Devices", "Diagnostic Equipment", "Mobility Aids" } }
            };

            if (categorySlugMappings.TryGetValue(category, out var mappedCategories))
            {
                query = query.Where(b => b.Product.Category != null && mappedCategories.Contains(b.Product.Category.Name));
            }
            else
            {
                var categoryLower = category.ToLower().Replace("-", " ").Replace("_", " ");
                query = query.Where(b => b.Product.Category != null && 
                    (b.Product.Category.Name.ToLower() == categoryLower ||
                     b.Product.Category.Name.ToLower().Replace(" ", "-") == category.ToLower() ||
                     b.Product.Category.Name.ToLower().Replace(" ", "_") == category.ToLower()));
            }
        }

        if (manufacturerId.HasValue)
            query = query.Where(b => b.Product.ManufacturerId == manufacturerId.Value);

        if (minPrice.HasValue)
            query = query.Where(b => b.Product.UnitPrice >= minPrice.Value);

        if (maxPrice.HasValue)
            query = query.Where(b => b.Product.UnitPrice <= maxPrice.Value);

        if (inStockOnly == true)
        {
            query = query.Where(b => b.RemainingQuantity > 0);
        }

        if (requiresPrescription.HasValue)
            query = query.Where(b => b.Product.RequiresPrescription == requiresPrescription.Value);

        // Apply sorting
        query = (sortBy?.ToLower(), sortOrder?.ToLower()) switch
        {
            ("name", "desc") => query.OrderByDescending(b => b.Product.Name).ThenBy(b => b.ExpiryDate),
            ("name", _) => query.OrderBy(b => b.Product.Name).ThenBy(b => b.ExpiryDate),
            ("price", "desc") => query.OrderByDescending(b => b.Product.UnitPrice).ThenBy(b => b.ExpiryDate),
            ("price", _) => query.OrderBy(b => b.Product.UnitPrice).ThenBy(b => b.ExpiryDate),
            ("expiry", "desc") or ("expirydate", "desc") => query.OrderByDescending(b => b.ExpiryDate),
            ("expiry", _) or ("expirydate", _) => query.OrderBy(b => b.ExpiryDate),
            ("date", "desc") or ("createdat", "desc") => query.OrderByDescending(b => b.CreatedAt),
            ("date", _) or ("createdat", _) => query.OrderBy(b => b.CreatedAt),
            _ => query.OrderBy(b => b.Product.Name).ThenBy(b => b.ExpiryDate)
        };

        var totalCount = await query.CountAsync(cancellationToken);
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new PortalProductBatchDto
            {
                Id = b.Id,
                ProductId = b.ProductId,
                ProductCode = b.Product.SKU,
                ProductName = b.Product.Name,
                GenericName = b.Product.GenericName,
                BatchNumber = b.BatchNumber,
                ExpiryDate = b.ExpiryDate,
                ManufactureDate = b.ManufactureDate,
                StockQuantity = b.RemainingQuantity,
                IsAvailable = b.RemainingQuantity > 0,
                DaysUntilExpiry = (int)(b.ExpiryDate - today).TotalDays,
                IsExpiringSoon = b.ExpiryDate < today.AddDays(90),
                UnitPrice = b.Product.UnitPrice,
                ImageUrl = b.Product.ImageUrl,
                Category = b.Product.Category != null ? b.Product.Category.Name : "",
                CategoryId = b.Product.CategoryId.ToString(),
                Manufacturer = b.Product.Manufacturer != null ? b.Product.Manufacturer.Name : "",
                ManufacturerId = b.Product.ManufacturerId.ToString(),
                Description = b.Product.Description ?? "",
                RequiresPrescription = b.Product.RequiresPrescription,
                DosageForm = b.Product.DosageForm,
                Strength = b.Product.Strength,
                PackSize = b.Product.PackageSize
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
    /// Get all batches for a specific product
    /// </summary>
    [HttpGet("products/{productId:int}/batches")]
    [ProducesResponseType(typeof(IEnumerable<PortalProductBatchDto>), StatusCodes.Status200OK)]
    [AllowAnonymous]
    public async Task<IActionResult> GetProductBatchesById(int productId, CancellationToken cancellationToken)
    {
        var today = DateTime.UtcNow;

        var batches = await _context.ProductBatches
            .Include(b => b.Product)
                .ThenInclude(p => p.Category)
            .Include(b => b.Product)
                .ThenInclude(p => p.Manufacturer)
            .Where(b => b.ProductId == productId && 
                        b.IsActive && 
                        b.RemainingQuantity > 0 && 
                        b.ExpiryDate >= today &&
                        !b.Product.IsDeleted)
            .OrderByDescending(b => b.ExpiryDate)
            .Select(b => new PortalProductBatchDto
            {
                Id = b.Id,
                ProductId = b.ProductId,
                ProductCode = b.Product.SKU,
                ProductName = b.Product.Name,
                GenericName = b.Product.GenericName,
                BatchNumber = b.BatchNumber,
                ExpiryDate = b.ExpiryDate,
                ManufactureDate = b.ManufactureDate,
                StockQuantity = b.RemainingQuantity,
                IsAvailable = b.RemainingQuantity > 0,
                DaysUntilExpiry = (int)(b.ExpiryDate - today).TotalDays,
                IsExpiringSoon = b.ExpiryDate < today.AddDays(90),
                UnitPrice = b.Product.UnitPrice,
                ImageUrl = b.Product.ImageUrl,
                Category = b.Product.Category != null ? b.Product.Category.Name : "",
                CategoryId = b.Product.CategoryId.ToString(),
                Manufacturer = b.Product.Manufacturer != null ? b.Product.Manufacturer.Name : "",
                ManufacturerId = b.Product.ManufacturerId.ToString(),
                Description = b.Product.Description ?? "",
                RequiresPrescription = b.Product.RequiresPrescription,
                DosageForm = b.Product.DosageForm,
                Strength = b.Product.Strength,
                PackSize = b.Product.PackageSize
            })
            .ToListAsync(cancellationToken);

        return Ok(batches);
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
                Code = p.SKU,
                Name = p.Name,
                GenericName = p.GenericName,
                Description = p.Description ?? "",
                UnitPrice = p.UnitPrice,
                ImageUrl = p.ImageUrl,
                Category = p.Category != null ? p.Category.Name : "",
                CategoryId = p.CategoryId.ToString(),
                Manufacturer = p.Manufacturer != null ? p.Manufacturer.Name : "",
                ManufacturerId = p.ManufacturerId.ToString(),
                IsAvailable = p.StockQuantity > 0,
                StockQuantity = p.StockQuantity,
                RequiresPrescription = p.RequiresPrescription,
                EarliestExpiryDate = _context.ProductBatches
                    .Where(b => b.ProductId == p.Id && b.IsActive && b.RemainingQuantity > 0 && b.ExpiryDate >= DateTime.UtcNow)
                    .Select(b => (DateTime?)b.ExpiryDate)
                    .Min(),
                DosageForm = p.DosageForm,
                Strength = p.Strength,
                PackSize = p.PackageSize
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
                Code = p.SKU,
                Name = p.Name,
                GenericName = p.GenericName,
                Description = p.Description ?? "",
                UnitPrice = p.UnitPrice,
                ImageUrl = p.ImageUrl,
                Category = p.Category != null ? p.Category.Name : "",
                CategoryId = p.CategoryId.ToString(),
                Manufacturer = p.Manufacturer != null ? p.Manufacturer.Name : "",
                ManufacturerId = p.ManufacturerId.ToString(),
                IsAvailable = p.StockQuantity > 0,
                StockQuantity = p.StockQuantity,
                RequiresPrescription = p.RequiresPrescription,
                EarliestExpiryDate = _context.ProductBatches
                    .Where(b => b.ProductId == p.Id && b.IsActive && b.RemainingQuantity > 0 && b.ExpiryDate >= DateTime.UtcNow)
                    .Select(b => (DateTime?)b.ExpiryDate)
                    .Min(),
                DosageForm = p.DosageForm,
                Strength = p.Strength,
                PackSize = p.PackageSize
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
                Code = p.SKU,
                Name = p.Name,
                GenericName = p.GenericName,
                Description = p.Description ?? "",
                UnitPrice = p.UnitPrice,
                ImageUrl = p.ImageUrl,
                Category = p.Category != null ? p.Category.Name : "",
                CategoryId = p.CategoryId.ToString(),
                Manufacturer = p.Manufacturer != null ? p.Manufacturer.Name : "",
                ManufacturerId = p.ManufacturerId.ToString(),
                IsAvailable = p.StockQuantity > 0,
                StockQuantity = p.StockQuantity,
                RequiresPrescription = p.RequiresPrescription,
                DosageForm = p.DosageForm,
                Strength = p.Strength,
                PackSize = p.PackageSize
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

    #region Pricing Helpers

    /// <summary>
    /// Enrich product DTOs with commercial and essential pricing
    /// </summary>
    private async Task EnrichProductsWithPricingAsync(
        List<PortalProductDto> items,
        int? customerId,
        int? cantonId,
        DateTime now,
        CancellationToken cancellationToken)
    {
        if (items.Count == 0) return;

        var productIds = items.Select(i => i.Id).ToList();

        // Get all active prices for these products
        var allPrices = await _context.ProductPrices
            .Where(p => productIds.Contains(p.ProductId) &&
                       p.IsActive &&
                       !p.IsDeleted &&
                       p.ValidFrom <= now &&
                       (p.ValidTo == null || p.ValidTo >= now))
            .Select(p => new
            {
                p.ProductId,
                p.PriceType,
                p.UnitPrice,
                p.CantonId,
                p.CustomerId,
                p.Priority
            })
            .ToListAsync(cancellationToken);

        foreach (var item in items)
        {
            var productPrices = allPrices.Where(p => p.ProductId == item.Id).ToList();

            // Find best commercial price (PriceType = 1)
            var commercialPrices = productPrices
                .Where(p => p.PriceType == PriceType.Commercial)
                .ToList();

            // Priority: customer-specific > canton-specific > global
            var commercialPrice = commercialPrices
                .Where(p => customerId.HasValue && p.CustomerId == customerId)
                .OrderByDescending(p => p.Priority)
                .FirstOrDefault();

            if (commercialPrice == null && cantonId.HasValue)
            {
                commercialPrice = commercialPrices
                    .Where(p => p.CantonId == cantonId && p.CustomerId == null)
                    .OrderByDescending(p => p.Priority)
                    .FirstOrDefault();
            }

            if (commercialPrice == null)
            {
                commercialPrice = commercialPrices
                    .Where(p => p.CantonId == null && p.CustomerId == null)
                    .OrderByDescending(p => p.Priority)
                    .FirstOrDefault();
            }

            // Find best essential price (PriceType = 2)
            var essentialPrices = productPrices
                .Where(p => p.PriceType == PriceType.Essential)
                .ToList();

            // Priority: customer-specific > canton-specific > global
            var essentialPrice = essentialPrices
                .Where(p => customerId.HasValue && p.CustomerId == customerId)
                .OrderByDescending(p => p.Priority)
                .FirstOrDefault();

            if (essentialPrice == null && cantonId.HasValue)
            {
                essentialPrice = essentialPrices
                    .Where(p => p.CantonId == cantonId && p.CustomerId == null)
                    .OrderByDescending(p => p.Priority)
                    .FirstOrDefault();
            }

            if (essentialPrice == null)
            {
                essentialPrice = essentialPrices
                    .Where(p => p.CantonId == null && p.CustomerId == null)
                    .OrderByDescending(p => p.Priority)
                    .FirstOrDefault();
            }

            // Set pricing on DTO
            item.CommercialPrice = commercialPrice?.UnitPrice ?? item.UnitPrice;
            item.EssentialPrice = essentialPrice?.UnitPrice;
            item.HasEssentialPrice = essentialPrice != null;
            item.CustomerPrice = item.CommercialPrice; // Default customer price is commercial
        }
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
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? GenericName { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal? CustomerPrice { get; set; }
    /// <summary>
    /// Commercial price for this product (standard pricing)
    /// </summary>
    public decimal? CommercialPrice { get; set; }
    /// <summary>
    /// Essential price for this product (canton-specific regulated pricing, if available)
    /// </summary>
    public decimal? EssentialPrice { get; set; }
    /// <summary>
    /// Whether essential pricing is available for this product in customer's canton
    /// </summary>
    public bool HasEssentialPrice { get; set; }
    public string? ImageUrl { get; set; }
    public string Category { get; set; } = string.Empty;
    public string? CategoryId { get; set; }
    public string Manufacturer { get; set; } = string.Empty;
    public string? ManufacturerId { get; set; }
    public bool IsAvailable { get; set; }
    public int StockQuantity { get; set; }
    public DateTime? EarliestExpiryDate { get; set; }
    public bool RequiresPrescription { get; set; }
    public string? DosageForm { get; set; }
    public string? Strength { get; set; }
    public string? PackSize { get; set; }
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

public class PortalProductBatchDto
{
    public int Id { get; set; } // Batch ID
    public int ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string? GenericName { get; set; }
    public string BatchNumber { get; set; } = string.Empty;
    public DateTime ExpiryDate { get; set; }
    public DateTime? ManufactureDate { get; set; }
    public int StockQuantity { get; set; }
    public bool IsAvailable { get; set; }
    public bool IsExpiringSoon { get; set; }
    public int DaysUntilExpiry { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal? CustomerPrice { get; set; }
    public string? PriceType { get; set; }
    public string? ImageUrl { get; set; }
    public string Category { get; set; } = string.Empty;
    public string? CategoryId { get; set; }
    public string Manufacturer { get; set; } = string.Empty;
    public string? ManufacturerId { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool RequiresPrescription { get; set; }
    public string? DosageForm { get; set; }
    public string? Strength { get; set; }
    public string? PackSize { get; set; }
}

#endregion
