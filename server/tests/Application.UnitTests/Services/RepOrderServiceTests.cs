using Application.DTOs.Orders;
using Application.Interfaces;
using Application.Services;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Microsoft.Extensions.Logging;
using Moq;

namespace Application.UnitTests.Services;

/// <summary>
/// Unit tests for RepOrderService - testing sales rep order operations
/// </summary>
public class RepOrderServiceTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IOrderService> _orderServiceMock;
    private readonly Mock<IVisitService> _visitServiceMock;
    private readonly Mock<ILogger<RepOrderService>> _loggerMock;
    private readonly RepOrderService _service;

    public RepOrderServiceTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _orderServiceMock = new Mock<IOrderService>();
        _visitServiceMock = new Mock<IVisitService>();
        _loggerMock = new Mock<ILogger<RepOrderService>>();

        _service = new RepOrderService(
            _unitOfWorkMock.Object,
            _orderServiceMock.Object,
            _visitServiceMock.Object,
            _loggerMock.Object);
    }

    #region CreateOrderAsync Tests

    [Fact]
    public async Task CreateOrder_ReturnsError_WhenUserNotARep()
    {
        // Arrange
        var userId = "user123";
        var dto = new CreateRepOrderDto { CustomerId = 1 };

        _unitOfWorkMock.Setup(u => u.SalesReps.GetByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((SalesRepresentative?)null);

        // Act
        var result = await _service.CreateOrderAsync(userId, dto);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("not registered as a sales representative");
    }

    [Fact]
    public async Task CreateOrder_ReturnsError_WhenCustomerNotAssigned()
    {
        // Arrange
        var userId = "user123";
        var dto = new CreateRepOrderDto { CustomerId = 99 };
        var rep = new SalesRepresentative { Id = 1, UserId = userId };

        _unitOfWorkMock.Setup(u => u.SalesReps.GetByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(rep);
        _unitOfWorkMock.Setup(u => u.SalesReps.GetCustomerAssignmentAsync(rep.Id, dto.CustomerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RepCustomerAssignment?)null);

        // Act
        var result = await _service.CreateOrderAsync(userId, dto);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("not assigned to you");
    }

    [Fact]
    public async Task CreateOrder_ReturnsError_WhenVisitIdInvalid()
    {
        // Arrange
        var userId = "user123";
        var dto = new CreateRepOrderDto { CustomerId = 1, VisitId = 999 };
        var rep = new SalesRepresentative { Id = 1, UserId = userId };
        var assignment = new RepCustomerAssignment { Id = 1, RepId = rep.Id, CustomerId = 1 };

        _unitOfWorkMock.Setup(u => u.SalesReps.GetByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(rep);
        _unitOfWorkMock.Setup(u => u.SalesReps.GetCustomerAssignmentAsync(rep.Id, dto.CustomerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(assignment);
        _visitServiceMock.Setup(v => v.GetExecutedVisitAsync(userId, dto.VisitId!.Value, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Application.DTOs.Visits.ExecutedVisitDto?)null);

        // Act
        var result = await _service.CreateOrderAsync(userId, dto);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("Invalid visit reference");
    }

    [Fact]
    public async Task CreateOrder_Succeeds_WithValidData()
    {
        // Arrange
        var userId = "user123";
        var dto = new CreateRepOrderDto 
        { 
            CustomerId = 1,
            Items = new List<CreateOrderItemDto>
            {
                new() { ProductId = 1, Quantity = 2 }
            }
        };
        var rep = new SalesRepresentative { Id = 1, UserId = userId };
        var assignment = new RepCustomerAssignment { Id = 1, RepId = rep.Id, CustomerId = 1 };
        var orderDto = new OrderDto { Id = 100, OrderNumber = "ORD-100" };
        var order = new Order { Id = 100, OrderNumber = "ORD-100" };

        _unitOfWorkMock.Setup(u => u.SalesReps.GetByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(rep);
        _unitOfWorkMock.Setup(u => u.SalesReps.GetCustomerAssignmentAsync(rep.Id, dto.CustomerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(assignment);
        _orderServiceMock.Setup(o => o.CreateAsync(It.IsAny<CreateOrderDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(DTOs.Common.ApiResponse<OrderDto>.Ok(orderDto));
        _unitOfWorkMock.Setup(u => u.Orders.GetByIdAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _service.CreateOrderAsync(userId, dto);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.OrderNumber.Should().Be("ORD-100");
    }

    [Fact]
    public async Task CreateOrder_SetsRepAttribution()
    {
        // Arrange
        var userId = "user123";
        var deviceId = "device-abc123";
        var offlineDate = DateTime.UtcNow.AddMinutes(-10);
        var dto = new CreateRepOrderDto 
        { 
            CustomerId = 1,
            DeviceId = deviceId,
            OfflineCreatedAt = offlineDate,
            Items = new List<CreateOrderItemDto>
            {
                new() { ProductId = 1, Quantity = 2 }
            }
        };
        var rep = new SalesRepresentative { Id = 5, UserId = userId };
        var assignment = new RepCustomerAssignment { Id = 1, RepId = rep.Id, CustomerId = 1 };
        var orderDto = new OrderDto { Id = 100, OrderNumber = "ORD-100" };
        var order = new Order { Id = 100, OrderNumber = "ORD-100" };

        _unitOfWorkMock.Setup(u => u.SalesReps.GetByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(rep);
        _unitOfWorkMock.Setup(u => u.SalesReps.GetCustomerAssignmentAsync(rep.Id, dto.CustomerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(assignment);
        _orderServiceMock.Setup(o => o.CreateAsync(It.IsAny<CreateOrderDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(DTOs.Common.ApiResponse<OrderDto>.Ok(orderDto));
        _unitOfWorkMock.Setup(u => u.Orders.GetByIdAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        await _service.CreateOrderAsync(userId, dto);

        // Assert
        order.RepId.Should().Be(5);
        order.CreatedViaApp.Should().BeTrue();
        order.RepDeviceId.Should().Be(deviceId);
        order.OfflineCreatedAt.Should().Be(offlineDate);
        order.SyncedAt.Should().NotBeNull();
    }

    #endregion

    #region GetMyOrdersAsync Tests

    [Fact]
    public async Task GetMyOrders_ReturnsEmpty_WhenUserNotARep()
    {
        // Arrange
        var userId = "user123";
        var filter = new RepOrderFilterDto();

        _unitOfWorkMock.Setup(u => u.SalesReps.GetByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((SalesRepresentative?)null);

        // Act
        var result = await _service.GetMyOrdersAsync(userId, filter);

        // Assert
        result.Items.Should().BeEmpty();
    }

    #endregion
}
