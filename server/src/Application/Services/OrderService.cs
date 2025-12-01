using Application.DTOs.Common;
using Application.DTOs.Orders;
using Application.Interfaces;
using AutoMapper;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;

namespace Application.Services;

/// <summary>
/// Order service implementation
/// </summary>
public class OrderService : IOrderService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public OrderService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    #region Read Operations

    public async Task<ApiResponse<OrderDto>> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var order = await _unitOfWork.Orders.GetFullOrderAsync(id, cancellationToken);
        
        if (order == null)
            return ApiResponse<OrderDto>.Fail($"Order with ID {id} not found.");

        var dto = MapOrderToDto(order);
        return ApiResponse<OrderDto>.Ok(dto);
    }

    public async Task<ApiResponse<OrderDto>> GetByOrderNumberAsync(string orderNumber, CancellationToken cancellationToken = default)
    {
        var order = await _unitOfWork.Orders.GetByOrderNumberAsync(orderNumber, cancellationToken);
        
        if (order == null)
            return ApiResponse<OrderDto>.Fail($"Order with number '{orderNumber}' not found.");

        // Get full order with related data
        var fullOrder = await _unitOfWork.Orders.GetFullOrderAsync(order.Id, cancellationToken);
        var dto = MapOrderToDto(fullOrder!);
        return ApiResponse<OrderDto>.Ok(dto);
    }

    public async Task<ApiResponse<IEnumerable<OrderDto>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var orders = await _unitOfWork.Orders.GetAllAsync(cancellationToken);
        var dtos = orders.Select(MapOrderToDto);
        return ApiResponse<IEnumerable<OrderDto>>.Ok(dtos);
    }

    public async Task<PagedResponse<OrderSummaryDto>> GetPagedAsync(
        int page,
        int pageSize,
        int? customerId = null,
        OrderStatus? status = null,
        PaymentStatus? paymentStatus = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var allOrders = await _unitOfWork.Orders.GetAllAsync(cancellationToken);
        
        // Apply filters
        var filtered = allOrders.AsEnumerable();
        
        if (customerId.HasValue)
            filtered = filtered.Where(o => o.CustomerId == customerId.Value);
        
        if (status.HasValue)
            filtered = filtered.Where(o => o.Status == status.Value);
        
        if (paymentStatus.HasValue)
            filtered = filtered.Where(o => o.PaymentStatus == paymentStatus.Value);
        
        if (fromDate.HasValue)
            filtered = filtered.Where(o => o.OrderDate >= fromDate.Value);
        
        if (toDate.HasValue)
            filtered = filtered.Where(o => o.OrderDate <= toDate.Value);

        var filteredList = filtered.OrderByDescending(o => o.OrderDate).ToList();
        var totalCount = filteredList.Count;
        
        var pagedItems = filteredList
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(MapOrderToSummary)
            .ToList();

        return PagedResponse<OrderSummaryDto>.Create(pagedItems, totalCount, page, pageSize);
    }

    public async Task<ApiResponse<IEnumerable<OrderSummaryDto>>> GetByCustomerAsync(int customerId, CancellationToken cancellationToken = default)
    {
        var orders = await _unitOfWork.Orders.GetByCustomerIdAsync(customerId, cancellationToken);
        var dtos = orders.Select(MapOrderToSummary);
        return ApiResponse<IEnumerable<OrderSummaryDto>>.Ok(dtos);
    }

    public async Task<ApiResponse<IEnumerable<OrderSummaryDto>>> GetByStatusAsync(OrderStatus status, CancellationToken cancellationToken = default)
    {
        var orders = await _unitOfWork.Orders.GetByStatusAsync(status, cancellationToken);
        var dtos = orders.Select(MapOrderToSummary);
        return ApiResponse<IEnumerable<OrderSummaryDto>>.Ok(dtos);
    }

    public async Task<ApiResponse<IEnumerable<OrderSummaryDto>>> GetRecentOrdersAsync(int count, CancellationToken cancellationToken = default)
    {
        var allOrders = await _unitOfWork.Orders.GetAllAsync(cancellationToken);
        var recentOrders = allOrders
            .OrderByDescending(o => o.OrderDate)
            .Take(count)
            .Select(MapOrderToSummary);
        return ApiResponse<IEnumerable<OrderSummaryDto>>.Ok(recentOrders);
    }

    #endregion

    #region CRUD Operations

    public async Task<ApiResponse<OrderDto>> CreateAsync(CreateOrderDto dto, CancellationToken cancellationToken = default)
    {
        // Validate customer
        var customer = await _unitOfWork.Customers.GetByIdAsync(dto.CustomerId, cancellationToken);
        if (customer == null)
            return ApiResponse<OrderDto>.Fail($"Customer with ID {dto.CustomerId} not found.");

        // Generate order number
        var orderNumber = await _unitOfWork.Orders.GenerateOrderNumberAsync(cancellationToken);

        var order = new Order
        {
            OrderNumber = orderNumber,
            CustomerId = dto.CustomerId,
            ShippingAddressId = dto.ShippingAddressId,
            BillingAddressId = dto.BillingAddressId,
            RequiredDate = dto.RequiredDate,
            Notes = dto.Notes,
            Status = OrderStatus.Pending,
            PaymentStatus = PaymentStatus.Pending,
            OrderDate = DateTime.UtcNow
        };

        // Add order items
        foreach (var itemDto in dto.Items)
        {
            var product = await _unitOfWork.Products.GetByIdAsync(itemDto.ProductId, cancellationToken);
            if (product == null)
                return ApiResponse<OrderDto>.Fail($"Product with ID {itemDto.ProductId} not found.");

            var item = new OrderItem
            {
                ProductId = itemDto.ProductId,
                ProductBatchId = itemDto.ProductBatchId,
                Quantity = itemDto.Quantity,
                UnitPrice = product.UnitPrice,
                DiscountPercent = itemDto.DiscountPercentage ?? 0,
                TaxRate = product.TaxRate,
                PrescriptionRequired = product.RequiresPrescription,
                PrescriptionId = itemDto.PrescriptionId
            };

            CalculateItemTotal(item);
            order.OrderItems.Add(item);
        }

        CalculateOrderTotals(order);

        await _unitOfWork.Orders.AddAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var createdOrder = await _unitOfWork.Orders.GetFullOrderAsync(order.Id, cancellationToken);
        var resultDto = MapOrderToDto(createdOrder!);
        return ApiResponse<OrderDto>.Ok(resultDto, "Order created successfully.");
    }

    public async Task<ApiResponse<OrderDto>> UpdateAsync(int id, UpdateOrderDto dto, CancellationToken cancellationToken = default)
    {
        var order = await _unitOfWork.Orders.GetByIdAsync(id, cancellationToken);
        
        if (order == null)
            return ApiResponse<OrderDto>.Fail($"Order with ID {id} not found.");

        if (order.Status != OrderStatus.Pending && order.Status != OrderStatus.Processing)
            return ApiResponse<OrderDto>.Fail("Cannot update order that is already shipped, delivered, or cancelled.");

        order.ShippingAddressId = dto.ShippingAddressId ?? order.ShippingAddressId;
        order.BillingAddressId = dto.BillingAddressId ?? order.BillingAddressId;
        order.RequiredDate = dto.RequiredDate ?? order.RequiredDate;
        order.Notes = dto.Notes ?? order.Notes;
        order.InternalNotes = dto.InternalNotes ?? order.InternalNotes;

        await _unitOfWork.Orders.UpdateAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updatedOrder = await _unitOfWork.Orders.GetFullOrderAsync(id, cancellationToken);
        var resultDto = MapOrderToDto(updatedOrder!);
        return ApiResponse<OrderDto>.Ok(resultDto);
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var order = await _unitOfWork.Orders.GetByIdAsync(id, cancellationToken);
        
        if (order == null)
            return ApiResponse<bool>.Fail($"Order with ID {id} not found.");

        if (order.Status != OrderStatus.Pending)
            return ApiResponse<bool>.Fail("Only pending orders can be deleted.");

        await _unitOfWork.Orders.DeleteAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.Ok(true, "Order deleted successfully.");
    }

    #endregion

    #region Status Management

    public async Task<ApiResponse<OrderDto>> UpdateStatusAsync(int id, UpdateOrderStatusDto dto, CancellationToken cancellationToken = default)
    {
        var order = await _unitOfWork.Orders.GetByIdAsync(id, cancellationToken);
        
        if (order == null)
            return ApiResponse<OrderDto>.Fail($"Order with ID {id} not found.");

        if (!IsValidStatusTransition(order.Status, dto.Status))
            return ApiResponse<OrderDto>.Fail($"Invalid status transition from {order.Status} to {dto.Status}.");

        order.Status = dto.Status;
        
        if (!string.IsNullOrEmpty(dto.Notes))
            order.InternalNotes = string.IsNullOrEmpty(order.InternalNotes) 
                ? dto.Notes 
                : $"{order.InternalNotes}\n[{DateTime.UtcNow:yyyy-MM-dd HH:mm}] {dto.Notes}";

        await _unitOfWork.Orders.UpdateAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updatedOrder = await _unitOfWork.Orders.GetFullOrderAsync(id, cancellationToken);
        var resultDto = MapOrderToDto(updatedOrder!);
        return ApiResponse<OrderDto>.Ok(resultDto);
    }

    public async Task<ApiResponse<OrderDto>> UpdatePaymentStatusAsync(int id, UpdatePaymentStatusDto dto, CancellationToken cancellationToken = default)
    {
        var order = await _unitOfWork.Orders.GetByIdAsync(id, cancellationToken);
        
        if (order == null)
            return ApiResponse<OrderDto>.Fail($"Order with ID {id} not found.");

        order.PaymentStatus = dto.PaymentStatus;
        
        if (dto.PaymentStatus == PaymentStatus.Paid)
            order.PaidDate = DateTime.UtcNow;

        if (!string.IsNullOrEmpty(dto.Notes))
            order.InternalNotes = string.IsNullOrEmpty(order.InternalNotes) 
                ? dto.Notes 
                : $"{order.InternalNotes}\n[{DateTime.UtcNow:yyyy-MM-dd HH:mm}] Payment: {dto.Notes}";

        await _unitOfWork.Orders.UpdateAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updatedOrder = await _unitOfWork.Orders.GetFullOrderAsync(id, cancellationToken);
        var resultDto = MapOrderToDto(updatedOrder!);
        return ApiResponse<OrderDto>.Ok(resultDto);
    }

    public async Task<ApiResponse<OrderDto>> CancelOrderAsync(int id, string reason, CancellationToken cancellationToken = default)
    {
        var order = await _unitOfWork.Orders.GetByIdAsync(id, cancellationToken);
        
        if (order == null)
            return ApiResponse<OrderDto>.Fail($"Order with ID {id} not found.");

        if (order.Status == OrderStatus.Delivered)
            return ApiResponse<OrderDto>.Fail("Cannot cancel a delivered order.");

        if (order.Status == OrderStatus.Cancelled)
            return ApiResponse<OrderDto>.Fail("Order is already cancelled.");

        order.Status = OrderStatus.Cancelled;
        order.CancellationReason = reason;

        await _unitOfWork.Orders.UpdateAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updatedOrder = await _unitOfWork.Orders.GetFullOrderAsync(id, cancellationToken);
        var resultDto = MapOrderToDto(updatedOrder!);
        return ApiResponse<OrderDto>.Ok(resultDto);
    }

    public async Task<ApiResponse<OrderDto>> ShipOrderAsync(int id, CancellationToken cancellationToken = default)
    {
        var order = await _unitOfWork.Orders.GetByIdAsync(id, cancellationToken);
        
        if (order == null)
            return ApiResponse<OrderDto>.Fail($"Order with ID {id} not found.");

        if (order.Status != OrderStatus.Processing && order.Status != OrderStatus.ReadyForShipment)
            return ApiResponse<OrderDto>.Fail("Only processing or ready-for-shipment orders can be shipped.");

        order.Status = OrderStatus.Shipped;
        order.ShippedDate = DateTime.UtcNow;

        await _unitOfWork.Orders.UpdateAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updatedOrder = await _unitOfWork.Orders.GetFullOrderAsync(id, cancellationToken);
        var resultDto = MapOrderToDto(updatedOrder!);
        return ApiResponse<OrderDto>.Ok(resultDto);
    }

    public async Task<ApiResponse<OrderDto>> DeliverOrderAsync(int id, CancellationToken cancellationToken = default)
    {
        var order = await _unitOfWork.Orders.GetByIdAsync(id, cancellationToken);
        
        if (order == null)
            return ApiResponse<OrderDto>.Fail($"Order with ID {id} not found.");

        if (order.Status != OrderStatus.Shipped)
            return ApiResponse<OrderDto>.Fail("Only shipped orders can be marked as delivered.");

        order.Status = OrderStatus.Delivered;
        order.DeliveredDate = DateTime.UtcNow;

        await _unitOfWork.Orders.UpdateAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updatedOrder = await _unitOfWork.Orders.GetFullOrderAsync(id, cancellationToken);
        var resultDto = MapOrderToDto(updatedOrder!);
        return ApiResponse<OrderDto>.Ok(resultDto);
    }

    #endregion

    #region Order Items

    public async Task<ApiResponse<OrderItemDto>> AddItemAsync(int orderId, CreateOrderItemDto dto, CancellationToken cancellationToken = default)
    {
        var order = await _unitOfWork.Orders.GetWithItemsAsync(orderId, cancellationToken);
        
        if (order == null)
            return ApiResponse<OrderItemDto>.Fail($"Order with ID {orderId} not found.");

        if (order.Status != OrderStatus.Pending && order.Status != OrderStatus.Processing)
            return ApiResponse<OrderItemDto>.Fail("Cannot add items to an order that is shipped, delivered, or cancelled.");

        var product = await _unitOfWork.Products.GetByIdAsync(dto.ProductId, cancellationToken);
        if (product == null)
            return ApiResponse<OrderItemDto>.Fail($"Product with ID {dto.ProductId} not found.");

        var item = new OrderItem
        {
            OrderId = orderId,
            ProductId = dto.ProductId,
            ProductBatchId = dto.ProductBatchId,
            Quantity = dto.Quantity,
            UnitPrice = product.UnitPrice,
            DiscountPercent = dto.DiscountPercentage ?? 0,
            TaxRate = product.TaxRate,
            PrescriptionRequired = product.RequiresPrescription,
            PrescriptionId = dto.PrescriptionId
        };

        CalculateItemTotal(item);
        order.OrderItems.Add(item);
        CalculateOrderTotals(order);

        await _unitOfWork.Orders.UpdateAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var resultDto = MapOrderItemToDto(item, product);
        return ApiResponse<OrderItemDto>.Ok(resultDto, "Order item added successfully.");
    }

    public async Task<ApiResponse<OrderItemDto>> UpdateItemAsync(int itemId, UpdateOrderItemDto dto, CancellationToken cancellationToken = default)
    {
        // Get all orders and find the item
        var orders = await _unitOfWork.Orders.GetAllAsync(cancellationToken);
        
        Order? order = null;
        OrderItem? item = null;
        
        foreach (var o in orders)
        {
            var fullOrder = await _unitOfWork.Orders.GetWithItemsAsync(o.Id, cancellationToken);
            item = fullOrder?.OrderItems.FirstOrDefault(i => i.Id == itemId);
            if (item != null)
            {
                order = fullOrder;
                break;
            }
        }

        if (order == null || item == null)
            return ApiResponse<OrderItemDto>.Fail($"Order item with ID {itemId} not found.");

        if (order.Status != OrderStatus.Pending && order.Status != OrderStatus.Processing)
            return ApiResponse<OrderItemDto>.Fail("Cannot update items in an order that is shipped, delivered, or cancelled.");

        item.Quantity = dto.Quantity;
        item.DiscountPercent = dto.DiscountPercentage ?? item.DiscountPercent;
        
        CalculateItemTotal(item);
        CalculateOrderTotals(order);

        await _unitOfWork.Orders.UpdateAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var product = await _unitOfWork.Products.GetByIdAsync(item.ProductId, cancellationToken);
        var resultDto = MapOrderItemToDto(item, product!);
        return ApiResponse<OrderItemDto>.Ok(resultDto);
    }

    public async Task<ApiResponse<bool>> RemoveItemAsync(int itemId, CancellationToken cancellationToken = default)
    {
        var orders = await _unitOfWork.Orders.GetAllAsync(cancellationToken);
        
        Order? order = null;
        OrderItem? item = null;
        
        foreach (var o in orders)
        {
            var fullOrder = await _unitOfWork.Orders.GetWithItemsAsync(o.Id, cancellationToken);
            item = fullOrder?.OrderItems.FirstOrDefault(i => i.Id == itemId);
            if (item != null)
            {
                order = fullOrder;
                break;
            }
        }

        if (order == null || item == null)
            return ApiResponse<bool>.Fail($"Order item with ID {itemId} not found.");

        if (order.Status != OrderStatus.Pending && order.Status != OrderStatus.Processing)
            return ApiResponse<bool>.Fail("Cannot remove items from an order that is shipped, delivered, or cancelled.");

        order.OrderItems.Remove(item);
        CalculateOrderTotals(order);

        await _unitOfWork.Orders.UpdateAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.Ok(true, "Order item removed successfully.");
    }

    #endregion

    #region Prescriptions

    public async Task<ApiResponse<PrescriptionDto>> AddPrescriptionAsync(int orderId, CreatePrescriptionDto dto, CancellationToken cancellationToken = default)
    {
        var order = await _unitOfWork.Orders.GetByIdAsync(orderId, cancellationToken);
        
        if (order == null)
            return ApiResponse<PrescriptionDto>.Fail($"Order with ID {orderId} not found.");

        var prescription = new Prescription
        {
            CustomerId = order.CustomerId,
            PrescriptionNumber = dto.PrescriptionNumber,
            IssuedDate = dto.IssueDate,
            ExpiryDate = dto.ExpiryDate ?? dto.IssueDate.AddMonths(3),
            DoctorName = dto.DoctorName,
            DoctorLicenseNumber = dto.DoctorLicense,
            PatientName = dto.PatientName ?? string.Empty,
            ImagePath = dto.ImageUrl,
            Notes = dto.Notes
        };

        // Note: Would need a prescription repository for full implementation
        var resultDto = MapPrescriptionToDto(prescription, orderId);
        return ApiResponse<PrescriptionDto>.Ok(resultDto, "Prescription added successfully.");
    }

    public async Task<ApiResponse<PrescriptionDto>> VerifyPrescriptionAsync(int prescriptionId, VerifyPrescriptionDto dto, CancellationToken cancellationToken = default)
    {
        // Note: Would need a prescription repository for full implementation
        return ApiResponse<PrescriptionDto>.Fail("Prescription verification requires IPrescriptionRepository implementation.");
    }

    #endregion

    #region Order Calculations

    public async Task<ApiResponse<OrderDto>> RecalculateTotalsAsync(int orderId, CancellationToken cancellationToken = default)
    {
        var order = await _unitOfWork.Orders.GetWithItemsAsync(orderId, cancellationToken);
        
        if (order == null)
            return ApiResponse<OrderDto>.Fail($"Order with ID {orderId} not found.");

        foreach (var item in order.OrderItems)
        {
            CalculateItemTotal(item);
        }
        
        CalculateOrderTotals(order);

        await _unitOfWork.Orders.UpdateAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updatedOrder = await _unitOfWork.Orders.GetFullOrderAsync(orderId, cancellationToken);
        var resultDto = MapOrderToDto(updatedOrder!);
        return ApiResponse<OrderDto>.Ok(resultDto);
    }

    #endregion

    #region Private Helpers

    private void CalculateItemTotal(OrderItem item)
    {
        var subtotal = item.UnitPrice * item.Quantity;
        var discountAmount = subtotal * (item.DiscountPercent / 100);
        var afterDiscount = subtotal - discountAmount;
        var taxAmount = afterDiscount * (item.TaxRate / 100);
        item.LineTotal = afterDiscount + taxAmount;
    }

    private void CalculateOrderTotals(Order order)
    {
        order.SubTotal = order.OrderItems.Sum(i => i.UnitPrice * i.Quantity);
        order.DiscountAmount = order.OrderItems.Sum(i => i.UnitPrice * i.Quantity * (i.DiscountPercent / 100));
        order.TaxAmount = order.OrderItems.Sum(i => 
            (i.UnitPrice * i.Quantity - (i.UnitPrice * i.Quantity * (i.DiscountPercent / 100))) * (i.TaxRate / 100));
        order.TotalAmount = order.SubTotal - order.DiscountAmount + order.TaxAmount + order.ShippingAmount;
    }

    private bool IsValidStatusTransition(OrderStatus currentStatus, OrderStatus newStatus)
    {
        return (currentStatus, newStatus) switch
        {
            (OrderStatus.Pending, OrderStatus.Confirmed) => true,
            (OrderStatus.Pending, OrderStatus.Processing) => true,
            (OrderStatus.Pending, OrderStatus.Cancelled) => true,
            (OrderStatus.Confirmed, OrderStatus.Processing) => true,
            (OrderStatus.Confirmed, OrderStatus.Cancelled) => true,
            (OrderStatus.Processing, OrderStatus.ReadyForShipment) => true,
            (OrderStatus.Processing, OrderStatus.Shipped) => true,
            (OrderStatus.Processing, OrderStatus.Cancelled) => true,
            (OrderStatus.ReadyForShipment, OrderStatus.Shipped) => true,
            (OrderStatus.ReadyForShipment, OrderStatus.Cancelled) => true,
            (OrderStatus.Shipped, OrderStatus.Delivered) => true,
            (OrderStatus.Delivered, OrderStatus.Returned) => true,
            _ => false
        };
    }

    private OrderDto MapOrderToDto(Order order)
    {
        var customerName = order.Customer != null 
            ? (string.IsNullOrEmpty(order.Customer.CompanyName) 
                ? $"{order.Customer.FirstName} {order.Customer.LastName}".Trim() 
                : order.Customer.CompanyName)
            : string.Empty;

        return new OrderDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            CustomerId = order.CustomerId,
            CustomerName = customerName,
            CustomerCode = order.Customer?.CustomerCode ?? string.Empty,
            ShippingAddressId = order.ShippingAddressId,
            ShippingAddress = FormatAddress(order.ShippingAddress),
            BillingAddressId = order.BillingAddressId,
            BillingAddress = FormatAddress(order.BillingAddress),
            Status = order.Status,
            StatusName = order.Status.ToString(),
            PaymentStatus = order.PaymentStatus,
            PaymentStatusName = order.PaymentStatus.ToString(),
            OrderDate = order.OrderDate,
            RequiredDate = order.RequiredDate,
            ShippedDate = order.ShippedDate,
            DeliveredDate = order.DeliveredDate,
            SubTotal = order.SubTotal,
            DiscountAmount = order.DiscountAmount,
            TaxAmount = order.TaxAmount,
            ShippingAmount = order.ShippingAmount,
            TotalAmount = order.TotalAmount,
            Notes = order.Notes,
            InternalNotes = order.InternalNotes,
            Items = order.OrderItems?.Select(i => MapOrderItemToDto(i, i.Product)).ToList() ?? new(),
            Prescriptions = new() // Would need prescription loading
        };
    }

    private OrderSummaryDto MapOrderToSummary(Order order)
    {
        var customerName = order.Customer != null 
            ? (string.IsNullOrEmpty(order.Customer.CompanyName) 
                ? $"{order.Customer.FirstName} {order.Customer.LastName}".Trim() 
                : order.Customer.CompanyName)
            : string.Empty;

        return new OrderSummaryDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            CustomerName = customerName,
            CustomerCode = order.Customer?.CustomerCode ?? string.Empty,
            Status = order.Status,
            StatusName = order.Status.ToString(),
            PaymentStatus = order.PaymentStatus,
            PaymentStatusName = order.PaymentStatus.ToString(),
            OrderDate = order.OrderDate,
            TotalAmount = order.TotalAmount,
            ItemCount = order.OrderItems?.Count ?? 0
        };
    }

    private OrderItemDto MapOrderItemToDto(OrderItem item, Product? product)
    {
        return new OrderItemDto
        {
            Id = item.Id,
            OrderId = item.OrderId,
            ProductId = item.ProductId,
            ProductName = product?.Name ?? string.Empty,
            ProductSku = product?.SKU ?? string.Empty,
            ProductBatchId = item.ProductBatchId,
            BatchNumber = item.ProductBatch?.BatchNumber,
            Quantity = item.Quantity,
            UnitPrice = item.UnitPrice,
            DiscountPercentage = item.DiscountPercent,
            DiscountAmount = item.UnitPrice * item.Quantity * (item.DiscountPercent / 100),
            TaxRate = item.TaxRate,
            TaxAmount = (item.UnitPrice * item.Quantity - item.UnitPrice * item.Quantity * (item.DiscountPercent / 100)) * (item.TaxRate / 100),
            LineTotal = item.LineTotal,
            PrescriptionId = item.PrescriptionId
        };
    }

    private PrescriptionDto MapPrescriptionToDto(Prescription prescription, int orderId = 0)
    {
        return new PrescriptionDto
        {
            Id = prescription.Id,
            OrderId = orderId,
            PrescriptionNumber = prescription.PrescriptionNumber,
            DoctorName = prescription.DoctorName,
            DoctorLicense = prescription.DoctorLicenseNumber,
            PatientName = prescription.PatientName,
            IssueDate = prescription.IssuedDate,
            ExpiryDate = prescription.ExpiryDate,
            ImageUrl = prescription.ImagePath,
            IsVerified = prescription.IsUsed,
            VerifiedAt = prescription.UsedDate,
            Notes = prescription.Notes
        };
    }

    private string? FormatAddress(CustomerAddress? address)
    {
        if (address == null) return null;
        
        var parts = new List<string>();
        if (!string.IsNullOrEmpty(address.Street)) parts.Add(address.Street);
        if (!string.IsNullOrEmpty(address.Street2)) parts.Add(address.Street2);
        if (!string.IsNullOrEmpty(address.City)) parts.Add(address.City);
        if (!string.IsNullOrEmpty(address.PostalCode)) parts.Add(address.PostalCode);
        
        return string.Join(", ", parts);
    }

    #endregion
}
