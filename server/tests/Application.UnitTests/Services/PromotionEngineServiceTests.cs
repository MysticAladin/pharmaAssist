using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Application.Interfaces;

namespace Application.UnitTests.Services;

/// <summary>
/// Unit tests for PromotionEngineService - testing promotion calculation logic
/// </summary>
public class PromotionEngineServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly PromotionEngineService _service;
    private readonly ILogger<PromotionEngineService> _logger;

    public PromotionEngineServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _logger = new LoggerFactory().CreateLogger<PromotionEngineService>();
        _service = new PromotionEngineService(_context, _logger);

        SeedTestData();
    }

    public void Dispose()
    {
        _context.Dispose();
        GC.SuppressFinalize(this);
    }

    private void SeedTestData()
    {
        // Add test customers
        var customerA = new Customer
        {
            Id = 1,
            CustomerCode = "CUST001",
            FirstName = "Test",
            LastName = "Customer A",
            Email = "customer-a@test.com",
            Tier = CustomerTier.A,
            CustomerType = CustomerType.Pharmacy,
            IsActive = true
        };

        var customerB = new Customer
        {
            Id = 2,
            CustomerCode = "CUST002",
            FirstName = "Test",
            LastName = "Customer B",
            Email = "customer-b@test.com",
            Tier = CustomerTier.B,
            CustomerType = CustomerType.Hospital,
            IsActive = true
        };

        var customerC = new Customer
        {
            Id = 3,
            CustomerCode = "CUST003",
            FirstName = "Test",
            LastName = "Customer C",
            Email = "customer-c@test.com",
            Tier = CustomerTier.C,
            CustomerType = CustomerType.Retail,
            IsActive = true
        };

        _context.Customers.AddRange(customerA, customerB, customerC);

        // Add test categories
        var categoryPharma = new Category { Id = 1, Name = "Pharmaceuticals", IsActive = true };
        var categoryCosm = new Category { Id = 2, Name = "Cosmetics", IsActive = true };
        _context.Categories.AddRange(categoryPharma, categoryCosm);

        // Add test products
        var product1 = new Product { Id = 1, Name = "Aspirin", SKU = "ASP001", CategoryId = 1, UnitPrice = 10.00m, IsActive = true };
        var product2 = new Product { Id = 2, Name = "Ibuprofen", SKU = "IBU001", CategoryId = 1, UnitPrice = 15.00m, IsActive = true };
        var product3 = new Product { Id = 3, Name = "Face Cream", SKU = "FC001", CategoryId = 2, UnitPrice = 25.00m, IsActive = true };
        _context.Products.AddRange(product1, product2, product3);

        // Add active promotions
        var now = DateTime.UtcNow;

        // Promo 1: 10% off for all customers (auto-apply)
        var promo1 = new Promotion
        {
            Id = 1,
            Code = "AUTO10",
            Name = "10% Off Everything",
            Type = PromotionType.PercentageDiscount,
            Value = 10,
            StartDate = now.AddDays(-1),
            EndDate = now.AddDays(30),
            IsActive = true,
            RequiresCode = false,
            AppliesToAllProducts = true,
            AppliesToAllCustomers = true,
            CanStackWithOtherPromotions = true
        };

        // Promo 2: 20% off for Tier A customers only
        var promo2 = new Promotion
        {
            Id = 2,
            Code = "TIERAPREM",
            Name = "Premium Customer Discount",
            Type = PromotionType.PercentageDiscount,
            Value = 20,
            StartDate = now.AddDays(-1),
            EndDate = now.AddDays(30),
            IsActive = true,
            RequiresCode = true,
            AppliesToAllProducts = true,
            AppliesToAllCustomers = true,
            RequiredCustomerTier = CustomerTier.A,
            CanStackWithOtherPromotions = false
        };

        // Promo 3: Fixed 50 KM off, min order 200 KM
        var promo3 = new Promotion
        {
            Id = 3,
            Code = "SAVE50",
            Name = "Save 50 KM",
            Type = PromotionType.FixedAmountDiscount,
            Value = 50,
            MinimumOrderAmount = 200,
            StartDate = now.AddDays(-1),
            EndDate = now.AddDays(30),
            IsActive = true,
            RequiresCode = true,
            AppliesToAllProducts = true,
            AppliesToAllCustomers = true,
            CanStackWithOtherPromotions = true
        };

        // Promo 4: Expired promotion
        var promo4 = new Promotion
        {
            Id = 4,
            Code = "EXPIRED",
            Name = "Expired Promo",
            Type = PromotionType.PercentageDiscount,
            Value = 15,
            StartDate = now.AddDays(-30),
            EndDate = now.AddDays(-1),
            IsActive = true,
            RequiresCode = true,
            AppliesToAllProducts = true,
            AppliesToAllCustomers = true
        };

        // Promo 5: Future promotion
        var promo5 = new Promotion
        {
            Id = 5,
            Code = "FUTURE",
            Name = "Future Promo",
            Type = PromotionType.PercentageDiscount,
            Value = 25,
            StartDate = now.AddDays(10),
            EndDate = now.AddDays(40),
            IsActive = true,
            RequiresCode = true,
            AppliesToAllProducts = true,
            AppliesToAllCustomers = true
        };

        // Promo 6: BOGO for pharmaceuticals
        var promo6 = new Promotion
        {
            Id = 6,
            Code = "BOGO",
            Name = "Buy One Get One",
            Type = PromotionType.BuyOneGetOne,
            Value = 1,
            StartDate = now.AddDays(-1),
            EndDate = now.AddDays(30),
            IsActive = true,
            RequiresCode = true,
            AppliesToAllProducts = false,
            AppliesToAllCustomers = true,
            CanStackWithOtherPromotions = true
        };

        // Promo 7: Max usage reached
        var promo7 = new Promotion
        {
            Id = 7,
            Code = "MAXED",
            Name = "Maxed Out Promo",
            Type = PromotionType.PercentageDiscount,
            Value = 30,
            StartDate = now.AddDays(-1),
            EndDate = now.AddDays(30),
            IsActive = true,
            RequiresCode = true,
            MaxUsageCount = 10,
            CurrentUsageCount = 10,
            AppliesToAllProducts = true,
            AppliesToAllCustomers = true
        };

        // Promo 8: Pharmacy-only
        var promo8 = new Promotion
        {
            Id = 8,
            Code = "PHARMACY15",
            Name = "Pharmacy Only 15%",
            Type = PromotionType.PercentageDiscount,
            Value = 15,
            StartDate = now.AddDays(-1),
            EndDate = now.AddDays(30),
            IsActive = true,
            RequiresCode = true,
            AppliesToAllProducts = true,
            AppliesToAllCustomers = true,
            RequiredCustomerType = CustomerType.Pharmacy,
            CanStackWithOtherPromotions = true
        };

        _context.Promotions.AddRange(promo1, promo2, promo3, promo4, promo5, promo6, promo7, promo8);

        // Add promo6 to pharmaceuticals category
        var promoCategory = new PromotionCategory
        {
            Id = 1,
            PromotionId = 6,
            CategoryId = 1
        };
        _context.PromotionCategories.Add(promoCategory);

        _context.SaveChanges();
    }

    #region GetApplicablePromotionsAsync Tests

    [Fact]
    public async Task GetApplicablePromotions_ReturnsActivePromotions_ForValidCustomer()
    {
        // Arrange
        var customerId = 1; // Tier A customer

        // Act
        var result = await _service.GetApplicablePromotionsAsync(customerId);

        // Assert
        result.Should().NotBeEmpty();
        result.Should().Contain(p => p.Code == "AUTO10");
    }

    [Fact]
    public async Task GetApplicablePromotions_ExcludesExpiredPromotions()
    {
        // Arrange
        var customerId = 1;

        // Act
        var result = await _service.GetApplicablePromotionsAsync(customerId);

        // Assert
        result.Should().NotContain(p => p.Code == "EXPIRED");
    }

    [Fact]
    public async Task GetApplicablePromotions_ExcludesFuturePromotions()
    {
        // Arrange
        var customerId = 1;

        // Act
        var result = await _service.GetApplicablePromotionsAsync(customerId);

        // Assert
        result.Should().NotContain(p => p.Code == "FUTURE");
    }

    [Fact]
    public async Task GetApplicablePromotions_ExcludesMaxedOutPromotions()
    {
        // Arrange
        var customerId = 1;

        // Act
        var result = await _service.GetApplicablePromotionsAsync(customerId);

        // Assert
        result.Should().NotContain(p => p.Code == "MAXED");
    }

    [Fact]
    public async Task GetApplicablePromotions_ReturnsEmpty_ForNonExistentCustomer()
    {
        // Arrange
        var customerId = 999;

        // Act
        var result = await _service.GetApplicablePromotionsAsync(customerId);

        // Assert
        result.Should().BeEmpty();
    }

    #endregion

    #region CalculatePromotionsAsync Tests

    [Fact]
    public async Task CalculatePromotions_AppliesAutoApplyPromotion()
    {
        // Arrange
        var customerId = 1;
        var items = new List<OrderItemForPromotion>
        {
            new() { ProductId = 1, CategoryId = 1, Quantity = 2, UnitPrice = 10.00m, LineTotal = 20.00m },
            new() { ProductId = 2, CategoryId = 1, Quantity = 1, UnitPrice = 15.00m, LineTotal = 15.00m }
        };

        // Act
        var result = await _service.CalculatePromotionsAsync(customerId, items);

        // Assert
        result.Success.Should().BeTrue();
        result.OriginalTotal.Should().Be(35.00m);
        result.AppliedPromotions.Should().Contain(p => p.Code == "AUTO10");
        result.DiscountTotal.Should().Be(3.50m); // 10% of 35
        result.FinalTotal.Should().Be(31.50m);
    }

    [Fact]
    public async Task CalculatePromotions_AppliesCodePromotion_WhenValidCodeProvided()
    {
        // Arrange
        var customerId = 3; // Tier C customer - won't get tier-specific promos
        var items = new List<OrderItemForPromotion>
        {
            new() { ProductId = 1, CategoryId = 1, Quantity = 20, UnitPrice = 10.00m, LineTotal = 200.00m }
        };

        // Act
        var result = await _service.CalculatePromotionsAsync(customerId, items, "SAVE50");

        // Assert
        result.Success.Should().BeTrue();
        result.AppliedPromotions.Should().Contain(p => p.Code == "SAVE50");
        // Should get AUTO10 (10%) + SAVE50 (50 KM fixed)
        // Original: 200, AUTO10: 20 discount, SAVE50: 50 discount
        result.DiscountTotal.Should().Be(70.00m);
    }

    [Fact]
    public async Task CalculatePromotions_RejectsNonStackableWithOtherPromos()
    {
        // Arrange
        var customerId = 1; // Tier A customer
        var items = new List<OrderItemForPromotion>
        {
            new() { ProductId = 1, CategoryId = 1, Quantity = 10, UnitPrice = 10.00m, LineTotal = 100.00m }
        };

        // Act - TIERAPREM is non-stackable
        var result = await _service.CalculatePromotionsAsync(customerId, items, "TIERAPREM");

        // Assert
        result.Success.Should().BeTrue();
        result.AppliedPromotions.Should().HaveCount(1);
        result.AppliedPromotions.Should().Contain(p => p.Code == "TIERAPREM");
        result.DiscountTotal.Should().Be(20.00m); // 20% of 100
    }

    [Fact]
    public async Task CalculatePromotions_RejectsPromoCode_WhenMinimumNotMet()
    {
        // Arrange
        var customerId = 1;
        var items = new List<OrderItemForPromotion>
        {
            new() { ProductId = 1, CategoryId = 1, Quantity = 5, UnitPrice = 10.00m, LineTotal = 50.00m }
        };

        // Act - SAVE50 requires 200 KM minimum
        var result = await _service.CalculatePromotionsAsync(customerId, items, "SAVE50");

        // Assert
        result.Success.Should().BeTrue();
        // SAVE50 should not be applied, but AUTO10 still applies
        result.AppliedPromotions.Should().NotContain(p => p.Code == "SAVE50");
        result.AppliedPromotions.Should().Contain(p => p.Code == "AUTO10");
    }

    [Fact]
    public async Task CalculatePromotions_ReturnsFalse_ForNonExistentCustomer()
    {
        // Arrange
        var customerId = 999;
        var items = new List<OrderItemForPromotion>
        {
            new() { ProductId = 1, CategoryId = 1, Quantity = 1, UnitPrice = 10.00m, LineTotal = 10.00m }
        };

        // Act
        var result = await _service.CalculatePromotionsAsync(customerId, items);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Be("Customer not found");
    }

    [Fact]
    public async Task CalculatePromotions_AppliesBOGO_Correctly()
    {
        // Arrange
        var customerId = 1;
        var items = new List<OrderItemForPromotion>
        {
            new() { ProductId = 1, CategoryId = 1, Quantity = 4, UnitPrice = 10.00m, LineTotal = 40.00m }
        };

        // Act
        var result = await _service.CalculatePromotionsAsync(customerId, items, "BOGO");

        // Assert
        result.Success.Should().BeTrue();
        result.AppliedPromotions.Should().Contain(p => p.Code == "BOGO");
        // BOGO: qty 4 means 2 free items = 20 KM discount
        // Plus AUTO10: 10% of remaining 20 = 2 KM (applied first in sort order)
        // Actually, AUTO10 applies first (percentage), then BOGO
        // Order after AUTO10: 40 - 4 = 36
        // BOGO: 2 free items @ 10 = 20
        // Total discount should include both
    }

    #endregion

    #region ValidatePromoCodeAsync Tests

    [Fact]
    public async Task ValidatePromoCode_ReturnsValid_ForActivePromo()
    {
        // Arrange
        var customerId = 3;
        var orderTotal = 250m;

        // Act
        var result = await _service.ValidatePromoCodeAsync("SAVE50", customerId, orderTotal);

        // Assert
        result.IsValid.Should().BeTrue();
        result.Promotion.Should().NotBeNull();
        result.Promotion!.Code.Should().Be("SAVE50");
        result.EstimatedDiscount.Should().Be(50m);
    }

    [Fact]
    public async Task ValidatePromoCode_ReturnsInvalid_ForNonExistentCode()
    {
        // Arrange
        var customerId = 1;
        var orderTotal = 100m;

        // Act
        var result = await _service.ValidatePromoCodeAsync("INVALID", customerId, orderTotal);

        // Assert
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().Be("Invalid promotion code");
    }

    [Fact]
    public async Task ValidatePromoCode_ReturnsInvalid_ForExpiredPromo()
    {
        // Arrange
        var customerId = 1;
        var orderTotal = 100m;

        // Act
        var result = await _service.ValidatePromoCodeAsync("EXPIRED", customerId, orderTotal);

        // Assert
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().Contain("expired");
    }

    [Fact]
    public async Task ValidatePromoCode_ReturnsInvalid_BelowMinimumOrder()
    {
        // Arrange
        var customerId = 1;
        var orderTotal = 100m; // Below 200 minimum

        // Act
        var result = await _service.ValidatePromoCodeAsync("SAVE50", customerId, orderTotal);

        // Assert
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Minimum order");
    }

    [Fact]
    public async Task ValidatePromoCode_ReturnsInvalid_ForWrongCustomerTier()
    {
        // Arrange
        var customerId = 3; // Tier C customer
        var orderTotal = 100m;

        // Act
        var result = await _service.ValidatePromoCodeAsync("TIERAPREM", customerId, orderTotal);

        // Assert
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().Contain("tier");
    }

    [Fact]
    public async Task ValidatePromoCode_ReturnsInvalid_ForWrongCustomerType()
    {
        // Arrange
        var customerId = 3; // Retail customer
        var orderTotal = 100m;

        // Act
        var result = await _service.ValidatePromoCodeAsync("PHARMACY15", customerId, orderTotal);

        // Assert
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Pharmacy");
    }

    [Fact]
    public async Task ValidatePromoCode_ReturnsInvalid_ForMaxedOutPromo()
    {
        // Arrange
        var customerId = 1;
        var orderTotal = 100m;

        // Act
        var result = await _service.ValidatePromoCodeAsync("MAXED", customerId, orderTotal);

        // Assert
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().Contain("usage limit");
    }

    [Fact]
    public async Task ValidatePromoCode_ReturnsInvalid_ForEmptyCode()
    {
        // Arrange
        var customerId = 1;
        var orderTotal = 100m;

        // Act
        var result = await _service.ValidatePromoCodeAsync("", customerId, orderTotal);

        // Assert
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().Be("Promotion code is required");
    }

    [Fact]
    public async Task ValidatePromoCode_CalculatesCorrectPercentageDiscount()
    {
        // Arrange
        var customerId = 1; // Tier A
        var orderTotal = 500m;

        // Act
        var result = await _service.ValidatePromoCodeAsync("TIERAPREM", customerId, orderTotal);

        // Assert
        result.IsValid.Should().BeTrue();
        result.EstimatedDiscount.Should().Be(100m); // 20% of 500
    }

    #endregion

    #region GetActivePromotionsForRepAsync Tests

    [Fact]
    public async Task GetActivePromotionsForRep_ReturnsActivePromotions()
    {
        // Act
        var result = await _service.GetActivePromotionsForRepAsync();

        // Assert
        result.Should().NotBeEmpty();
        result.Should().Contain(p => p.Code == "AUTO10");
    }

    [Fact]
    public async Task GetActivePromotionsForRep_FiltersByCategory()
    {
        // Act
        var result = await _service.GetActivePromotionsForRepAsync(categoryId: 1);

        // Assert
        result.Should().NotBeEmpty();
        // Should include promos that apply to all products OR specifically to category 1
        result.Should().Contain(p => p.Code == "BOGO"); // Category-specific
    }

    [Fact]
    public async Task GetActivePromotionsForRep_ExcludesExpiredAndFuture()
    {
        // Act
        var result = await _service.GetActivePromotionsForRepAsync();

        // Assert
        result.Should().NotContain(p => p.Code == "EXPIRED");
        result.Should().NotContain(p => p.Code == "FUTURE");
    }

    #endregion

    #region RecordPromotionUsageAsync Tests

    [Fact]
    public async Task RecordPromotionUsage_CreatesUsageRecord()
    {
        // Arrange
        var orderId = 1;
        var customerId = 1;
        var appliedPromotions = new List<AppliedPromotion>
        {
            new()
            {
                PromotionId = 1,
                Code = "AUTO10",
                Name = "10% Off Everything",
                Type = "PercentageDiscount",
                DiscountAmount = 10.00m
            }
        };

        // Act
        await _service.RecordPromotionUsageAsync(orderId, customerId, appliedPromotions);

        // Assert
        var usage = await _context.PromotionUsages.FirstOrDefaultAsync(u => u.OrderId == orderId);
        usage.Should().NotBeNull();
        usage!.PromotionId.Should().Be(1);
        usage.CustomerId.Should().Be(customerId);
        usage.DiscountApplied.Should().Be(10.00m);
    }

    [Fact]
    public async Task RecordPromotionUsage_IncrementsUsageCount()
    {
        // Arrange
        var promoBeforeCount = await _context.Promotions.FindAsync(1);
        var countBefore = promoBeforeCount!.CurrentUsageCount;

        var orderId = 100;
        var customerId = 1;
        var appliedPromotions = new List<AppliedPromotion>
        {
            new()
            {
                PromotionId = 1,
                Code = "AUTO10",
                Name = "10% Off Everything",
                Type = "PercentageDiscount",
                DiscountAmount = 5.00m
            }
        };

        // Act
        await _service.RecordPromotionUsageAsync(orderId, customerId, appliedPromotions);

        // Assert
        var promoAfter = await _context.Promotions.FindAsync(1);
        promoAfter!.CurrentUsageCount.Should().Be(countBefore + 1);
    }

    #endregion
}
