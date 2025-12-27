using Application.DTOs.Categories;
using Application.DTOs.Common;
using Application.DTOs.Customers;
using Application.DTOs.FeatureFlags;
using Application.DTOs.Inventory;
using Application.DTOs.Locations;
using Application.DTOs.Manufacturers;
using Application.DTOs.Orders;
using Application.DTOs.Products;
using AutoMapper;
using Domain.Entities;
using Domain.Enums;

namespace Application.Mappings;

/// <summary>
/// AutoMapper profile for mapping between entities and DTOs
/// </summary>
public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Product mappings
        CreateProductMappings();
        
        // Category mappings
        CreateCategoryMappings();
        
        // Manufacturer mappings
        CreateManufacturerMappings();
        
        // Customer mappings
        CreateCustomerMappings();
        
        // Order mappings
        CreateOrderMappings();
        
        // Location mappings
        CreateLocationMappings();
        
        // Inventory mappings
        CreateInventoryMappings();
        
        // Feature flag mappings
        CreateFeatureFlagMappings();
    }

    private void CreateProductMappings()
    {
        CreateMap<Product, ProductDto>()
            .ForMember(d => d.CategoryName, opt => opt.MapFrom(s => s.Category != null ? s.Category.Name : null))
            .ForMember(d => d.ManufacturerName, opt => opt.MapFrom(s => s.Manufacturer != null ? s.Manufacturer.Name : null));

        CreateMap<CreateProductDto, Product>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.Category, opt => opt.Ignore())
            .ForMember(d => d.Manufacturer, opt => opt.Ignore())
            .ForMember(d => d.Batches, opt => opt.Ignore())
            .ForMember(d => d.OrderItems, opt => opt.Ignore())
            .ForMember(d => d.IsActive, opt => opt.MapFrom(s => true))
            .ForMember(d => d.CreatedAt, opt => opt.MapFrom(s => DateTime.UtcNow))
            .ForMember(d => d.UpdatedAt, opt => opt.Ignore());

        CreateMap<UpdateProductDto, Product>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.SKU, opt => opt.Ignore()) // SKU cannot be changed
            .ForMember(d => d.Category, opt => opt.Ignore())
            .ForMember(d => d.Manufacturer, opt => opt.Ignore())
            .ForMember(d => d.Batches, opt => opt.Ignore())
            .ForMember(d => d.OrderItems, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.Ignore())
            .ForMember(d => d.UpdatedAt, opt => opt.MapFrom(s => DateTime.UtcNow));

        CreateMap<Product, ProductSummaryDto>()
            .ForMember(d => d.CategoryName, opt => opt.MapFrom(s => s.Category != null ? s.Category.Name : null))
            .ForMember(d => d.ManufacturerName, opt => opt.MapFrom(s => s.Manufacturer != null ? s.Manufacturer.Name : null));

        // ProductBatch mappings
        CreateMap<ProductBatch, ProductBatchDto>()
            .ForMember(d => d.ProductName, opt => opt.MapFrom(s => s.Product != null ? s.Product.Name : null));

        CreateMap<CreateProductBatchDto, ProductBatch>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.Product, opt => opt.Ignore())
            .ForMember(d => d.RemainingQuantity, opt => opt.MapFrom(s => s.InitialQuantity))
            .ForMember(d => d.IsActive, opt => opt.MapFrom(s => true))
            .ForMember(d => d.CreatedAt, opt => opt.MapFrom(s => DateTime.UtcNow))
            .ForMember(d => d.UpdatedAt, opt => opt.Ignore());

        CreateMap<UpdateProductBatchDto, ProductBatch>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.ProductId, opt => opt.Ignore())
            .ForMember(d => d.BatchNumber, opt => opt.Ignore()) // BatchNumber cannot be changed
            .ForMember(d => d.InitialQuantity, opt => opt.Ignore()) // InitialQuantity cannot be changed
            .ForMember(d => d.Product, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.Ignore())
            .ForMember(d => d.UpdatedAt, opt => opt.MapFrom(s => DateTime.UtcNow));
    }

    private void CreateCategoryMappings()
    {
        CreateMap<Category, CategoryDto>()
            .ForMember(d => d.ParentCategoryName, opt => opt.MapFrom(s => s.ParentCategory != null ? s.ParentCategory.Name : null))
            .ForMember(d => d.ProductCount, opt => opt.MapFrom(s => s.Products != null ? s.Products.Count(p => p.IsActive && !p.IsDeleted) : 0))
            .ForMember(d => d.SubCategories, opt => opt.MapFrom(s => s.SubCategories));

        CreateMap<CreateCategoryDto, Category>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.ParentCategory, opt => opt.Ignore())
            .ForMember(d => d.SubCategories, opt => opt.Ignore())
            .ForMember(d => d.Products, opt => opt.Ignore())
            .ForMember(d => d.IsActive, opt => opt.MapFrom(s => true))
            .ForMember(d => d.CreatedAt, opt => opt.MapFrom(s => DateTime.UtcNow))
            .ForMember(d => d.UpdatedAt, opt => opt.Ignore());

        CreateMap<UpdateCategoryDto, Category>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.ParentCategory, opt => opt.Ignore())
            .ForMember(d => d.SubCategories, opt => opt.Ignore())
            .ForMember(d => d.Products, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.Ignore())
            .ForMember(d => d.UpdatedAt, opt => opt.MapFrom(s => DateTime.UtcNow));

        CreateMap<Category, CategoryTreeDto>()
            .ForMember(d => d.Level, opt => opt.Ignore()) // Set manually based on hierarchy depth
            .ForMember(d => d.HasChildren, opt => opt.MapFrom(s => s.SubCategories != null && s.SubCategories.Any()))
            .ForMember(d => d.Children, opt => opt.MapFrom(s => s.SubCategories));
    }

    private void CreateManufacturerMappings()
    {
        CreateMap<Manufacturer, ManufacturerDto>()
            .ForMember(d => d.ProductCount, opt => opt.MapFrom(s => s.Products != null ? s.Products.Count(p => p.IsActive && !p.IsDeleted) : 0));

        CreateMap<CreateManufacturerDto, Manufacturer>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.Products, opt => opt.Ignore())
            .ForMember(d => d.IsActive, opt => opt.MapFrom(s => true))
            .ForMember(d => d.CreatedAt, opt => opt.MapFrom(s => DateTime.UtcNow))
            .ForMember(d => d.UpdatedAt, opt => opt.Ignore());

        CreateMap<UpdateManufacturerDto, Manufacturer>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.Products, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.Ignore())
            .ForMember(d => d.UpdatedAt, opt => opt.MapFrom(s => DateTime.UtcNow));

        CreateMap<Manufacturer, ManufacturerSummaryDto>();
    }

    private void CreateCustomerMappings()
    {
        CreateMap<Customer, CustomerDto>()
            .ForMember(d => d.Name, opt => opt.MapFrom(s => s.FullName))
            .ForMember(d => d.CustomerTypeName, opt => opt.MapFrom(s => s.CustomerType.ToString()))
            .ForMember(d => d.TierName, opt => opt.MapFrom(s => GetTierDisplayName(s.Tier)))
            .ForMember(d => d.Addresses, opt => opt.MapFrom(s => s.Addresses))
            .ForMember(d => d.TaxId, opt => opt.MapFrom(s => s.TaxId))
            .ForMember(d => d.RegistrationNumber, opt => opt.MapFrom(s => s.RegistrationNumber))
            .ForMember(d => d.PharmacyLicense, opt => opt.Ignore()) // Not on entity
            .ForMember(d => d.ContactPerson, opt => opt.Ignore()) // Entity has FirstName/LastName
            .ForMember(d => d.Phone, opt => opt.MapFrom(s => s.Phone))
            .ForMember(d => d.DiscountPercentage, opt => opt.Ignore()) // Not on entity
            .ForMember(d => d.CreditLimit, opt => opt.MapFrom(s => s.CreditLimit))
            .ForMember(d => d.PaymentTermDays, opt => opt.MapFrom(s => s.PaymentTermsDays));

        CreateMap<CreateCustomerDto, Customer>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.UserId, opt => opt.Ignore())
            .ForMember(d => d.CustomerCode, opt => opt.Ignore()) // Generated
            .ForMember(d => d.FirstName, opt => opt.Ignore()) // Set from Name parsing or separately
            .ForMember(d => d.LastName, opt => opt.Ignore()) // Set from Name parsing or separately
            .ForMember(d => d.CompanyName, opt => opt.MapFrom(s => s.Name)) // Use Name as company for B2B
            .ForMember(d => d.MobilePhone, opt => opt.Ignore())
            .ForMember(d => d.Fax, opt => opt.Ignore())
            .ForMember(d => d.CurrentBalance, opt => opt.Ignore())
            .ForMember(d => d.PaymentTermsDays, opt => opt.MapFrom(s => s.PaymentTermDays))
            .ForMember(d => d.IsVerified, opt => opt.Ignore())
            .ForMember(d => d.VerifiedAt, opt => opt.Ignore())
            .ForMember(d => d.VerifiedBy, opt => opt.Ignore())
            .ForMember(d => d.User, opt => opt.Ignore())
            .ForMember(d => d.Addresses, opt => opt.Ignore())
            .ForMember(d => d.Orders, opt => opt.Ignore())
            .ForMember(d => d.Prescriptions, opt => opt.Ignore())
            .ForMember(d => d.IsActive, opt => opt.MapFrom(s => true))
            .ForMember(d => d.CreatedAt, opt => opt.MapFrom(s => DateTime.UtcNow))
            .ForMember(d => d.UpdatedAt, opt => opt.Ignore());

        CreateMap<UpdateCustomerDto, Customer>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.UserId, opt => opt.Ignore())
            .ForMember(d => d.CustomerCode, opt => opt.Ignore())
            .ForMember(d => d.FirstName, opt => opt.Ignore())
            .ForMember(d => d.LastName, opt => opt.Ignore())
            .ForMember(d => d.CompanyName, opt => opt.MapFrom(s => s.Name))
            .ForMember(d => d.MobilePhone, opt => opt.Ignore())
            .ForMember(d => d.Fax, opt => opt.Ignore())
            .ForMember(d => d.CurrentBalance, opt => opt.Ignore())
            .ForMember(d => d.PaymentTermsDays, opt => opt.MapFrom(s => s.PaymentTermDays))
            .ForMember(d => d.IsVerified, opt => opt.Ignore())
            .ForMember(d => d.VerifiedAt, opt => opt.Ignore())
            .ForMember(d => d.VerifiedBy, opt => opt.Ignore())
            .ForMember(d => d.User, opt => opt.Ignore())
            .ForMember(d => d.Addresses, opt => opt.Ignore())
            .ForMember(d => d.Orders, opt => opt.Ignore())
            .ForMember(d => d.Prescriptions, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.Ignore())
            .ForMember(d => d.UpdatedAt, opt => opt.MapFrom(s => DateTime.UtcNow));

        CreateMap<Customer, CustomerSummaryDto>()
            .ForMember(d => d.Name, opt => opt.MapFrom(s => s.FullName))
            .ForMember(d => d.CustomerTypeName, opt => opt.MapFrom(s => s.CustomerType.ToString()))
            .ForMember(d => d.TierName, opt => opt.MapFrom(s => GetTierDisplayName(s.Tier)))
            .ForMember(d => d.City, opt => opt.MapFrom(s => 
                s.Addresses != null && s.Addresses.Any(a => a.IsDefault) 
                    ? s.Addresses.First(a => a.IsDefault).City 
                    : null));

        // CustomerAddress mappings
        CreateMap<CustomerAddress, CustomerAddressDto>()
            .ForMember(d => d.AddressTypeName, opt => opt.MapFrom(s => s.AddressType.ToString()))
            .ForMember(d => d.CityId, opt => opt.Ignore()) // No CityId on entity - City is a string
            .ForMember(d => d.CityName, opt => opt.MapFrom(s => s.City))
            .ForMember(d => d.MunicipalityId, opt => opt.MapFrom(s => s.MunicipalityId ?? 0))
            .ForMember(d => d.MunicipalityName, opt => opt.MapFrom(s => s.Municipality != null ? s.Municipality.Name : string.Empty))
            .ForMember(d => d.CantonId, opt => opt.MapFrom(s => s.CantonId ?? 0))
            .ForMember(d => d.CantonName, opt => opt.MapFrom(s => s.Canton != null ? s.Canton.Name : string.Empty))
            .ForMember(d => d.EntityId, opt => opt.MapFrom(s => s.BiHEntityId ?? 0))
            .ForMember(d => d.EntityName, opt => opt.MapFrom(s => s.BiHEntity != null ? s.BiHEntity.Name : string.Empty))
            .ForMember(d => d.IsPrimary, opt => opt.MapFrom(s => s.IsDefault))
            .ForMember(d => d.BuildingNumber, opt => opt.MapFrom(s => s.Street2))
            .ForMember(d => d.FullAddress, opt => opt.MapFrom(s => GetFullAddress(s)));

        CreateMap<CreateCustomerAddressDto, CustomerAddress>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.CustomerId, opt => opt.Ignore())
            .ForMember(d => d.Customer, opt => opt.Ignore())
            .ForMember(d => d.City, opt => opt.Ignore()) // Will need to resolve from CityId
            .ForMember(d => d.Street2, opt => opt.MapFrom(s => s.BuildingNumber))
            .ForMember(d => d.MunicipalityId, opt => opt.Ignore()) // Will need to resolve from CityId
            .ForMember(d => d.CantonId, opt => opt.Ignore()) // Will need to resolve from CityId
            .ForMember(d => d.BiHEntityId, opt => opt.Ignore()) // Will need to resolve from CityId
            .ForMember(d => d.Municipality, opt => opt.Ignore())
            .ForMember(d => d.Canton, opt => opt.Ignore())
            .ForMember(d => d.BiHEntity, opt => opt.Ignore())
            .ForMember(d => d.ContactName, opt => opt.Ignore())
            .ForMember(d => d.ContactPhone, opt => opt.Ignore())
            .ForMember(d => d.IsDefault, opt => opt.MapFrom(s => s.IsPrimary))
            .ForMember(d => d.IsActive, opt => opt.MapFrom(s => true))
            .ForMember(d => d.CreatedAt, opt => opt.MapFrom(s => DateTime.UtcNow))
            .ForMember(d => d.UpdatedAt, opt => opt.Ignore());

        CreateMap<UpdateCustomerAddressDto, CustomerAddress>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.CustomerId, opt => opt.Ignore())
            .ForMember(d => d.Customer, opt => opt.Ignore())
            .ForMember(d => d.City, opt => opt.Ignore())
            .ForMember(d => d.Street2, opt => opt.MapFrom(s => s.BuildingNumber))
            .ForMember(d => d.MunicipalityId, opt => opt.Ignore())
            .ForMember(d => d.CantonId, opt => opt.Ignore())
            .ForMember(d => d.BiHEntityId, opt => opt.Ignore())
            .ForMember(d => d.Municipality, opt => opt.Ignore())
            .ForMember(d => d.Canton, opt => opt.Ignore())
            .ForMember(d => d.BiHEntity, opt => opt.Ignore())
            .ForMember(d => d.ContactName, opt => opt.Ignore())
            .ForMember(d => d.ContactPhone, opt => opt.Ignore())
            .ForMember(d => d.IsDefault, opt => opt.MapFrom(s => s.IsPrimary))
            .ForMember(d => d.IsActive, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.Ignore())
            .ForMember(d => d.UpdatedAt, opt => opt.MapFrom(s => DateTime.UtcNow));
    }

    private void CreateOrderMappings()
    {
        CreateMap<Order, OrderDto>()
            .ForMember(d => d.CustomerName, opt => opt.MapFrom(s => s.Customer != null ? s.Customer.FullName : string.Empty))
            .ForMember(d => d.CustomerCode, opt => opt.MapFrom(s => s.Customer != null ? s.Customer.CustomerCode : string.Empty))
            .ForMember(d => d.StatusName, opt => opt.MapFrom(s => s.Status.ToString()))
            .ForMember(d => d.PaymentStatusName, opt => opt.MapFrom(s => s.PaymentStatus.ToString()))
            .ForMember(d => d.ShippingAddress, opt => opt.Ignore()) // Set from ShippingAddressId in service
            .ForMember(d => d.BillingAddress, opt => opt.Ignore()) // Set from BillingAddressId in service
            .ForMember(d => d.Items, opt => opt.MapFrom(s => s.OrderItems))
            .ForMember(d => d.Prescriptions, opt => opt.Ignore()); // Order doesn't have direct Prescriptions nav

        CreateMap<Order, OrderSummaryDto>()
            .ForMember(d => d.CustomerName, opt => opt.MapFrom(s => s.Customer != null ? s.Customer.FullName : string.Empty))
            .ForMember(d => d.CustomerCode, opt => opt.MapFrom(s => s.Customer != null ? s.Customer.CustomerCode : string.Empty))
            .ForMember(d => d.StatusName, opt => opt.MapFrom(s => s.Status.ToString()))
            .ForMember(d => d.PaymentStatusName, opt => opt.MapFrom(s => s.PaymentStatus.ToString()))
            .ForMember(d => d.ItemCount, opt => opt.MapFrom(s => s.OrderItems != null ? s.OrderItems.Count : 0));

        CreateMap<CreateOrderDto, Order>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.OrderNumber, opt => opt.Ignore()) // Generated
            .ForMember(d => d.Customer, opt => opt.Ignore())
            .ForMember(d => d.ShippingAddress, opt => opt.Ignore())
            .ForMember(d => d.BillingAddress, opt => opt.Ignore())
            .ForMember(d => d.Status, opt => opt.MapFrom(s => OrderStatus.Pending))
            .ForMember(d => d.PaymentStatus, opt => opt.MapFrom(s => PaymentStatus.Pending))
            .ForMember(d => d.PaymentMethod, opt => opt.MapFrom(s => PaymentMethod.Invoice))
            .ForMember(d => d.OrderDate, opt => opt.MapFrom(s => DateTime.UtcNow))
            .ForMember(d => d.ShippedDate, opt => opt.Ignore())
            .ForMember(d => d.DeliveredDate, opt => opt.Ignore())
            .ForMember(d => d.PaidDate, opt => opt.Ignore())
            .ForMember(d => d.SubTotal, opt => opt.Ignore()) // Calculated
            .ForMember(d => d.DiscountAmount, opt => opt.Ignore()) // Calculated
            .ForMember(d => d.TaxAmount, opt => opt.Ignore()) // Calculated
            .ForMember(d => d.ShippingAmount, opt => opt.Ignore())
            .ForMember(d => d.TotalAmount, opt => opt.Ignore()) // Calculated
            .ForMember(d => d.InternalNotes, opt => opt.Ignore())
            .ForMember(d => d.CancellationReason, opt => opt.Ignore())
            .ForMember(d => d.OrderItems, opt => opt.Ignore()) // Handled separately
            .ForMember(d => d.CreatedAt, opt => opt.MapFrom(s => DateTime.UtcNow))
            .ForMember(d => d.UpdatedAt, opt => opt.Ignore());

        // OrderItem mappings
        CreateMap<OrderItem, OrderItemDto>()
            .ForMember(d => d.ProductName, opt => opt.MapFrom(s => s.Product != null ? s.Product.Name : string.Empty))
            .ForMember(d => d.ProductSku, opt => opt.MapFrom(s => s.Product != null ? s.Product.SKU : string.Empty))
            .ForMember(d => d.BatchNumber, opt => opt.MapFrom(s => s.ProductBatch != null ? s.ProductBatch.BatchNumber : null))
            .ForMember(d => d.DiscountPercentage, opt => opt.MapFrom(s => s.DiscountPercent))
            .ForMember(d => d.DiscountAmount, opt => opt.Ignore()) // Calculated in service
            .ForMember(d => d.TaxAmount, opt => opt.Ignore()); // Calculated in service

        CreateMap<CreateOrderItemDto, OrderItem>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.OrderId, opt => opt.Ignore())
            .ForMember(d => d.Order, opt => opt.Ignore())
            .ForMember(d => d.Product, opt => opt.Ignore())
            .ForMember(d => d.ProductBatch, opt => opt.Ignore())
            .ForMember(d => d.Prescription, opt => opt.Ignore())
            .ForMember(d => d.PrescriptionRequired, opt => opt.Ignore()) // Set from product
            .ForMember(d => d.UnitPrice, opt => opt.Ignore()) // Set from product
            .ForMember(d => d.DiscountPercent, opt => opt.MapFrom(s => s.DiscountPercentage ?? 0))
            .ForMember(d => d.TaxRate, opt => opt.Ignore()) // Set from product
            .ForMember(d => d.LineTotal, opt => opt.Ignore()) // Calculated
            .ForMember(d => d.CreatedAt, opt => opt.MapFrom(s => DateTime.UtcNow))
            .ForMember(d => d.UpdatedAt, opt => opt.Ignore());

        // Prescription mappings
        CreateMap<Prescription, PrescriptionDto>()
            .ForMember(d => d.OrderId, opt => opt.Ignore()) // Prescription doesn't have OrderId directly
            .ForMember(d => d.DoctorLicense, opt => opt.MapFrom(s => s.DoctorLicenseNumber))
            .ForMember(d => d.IssueDate, opt => opt.MapFrom(s => s.IssuedDate))
            .ForMember(d => d.ImageUrl, opt => opt.MapFrom(s => s.ImagePath))
            .ForMember(d => d.IsVerified, opt => opt.MapFrom(s => s.IsUsed))
            .ForMember(d => d.VerifiedAt, opt => opt.MapFrom(s => s.UsedDate))
            .ForMember(d => d.VerifiedBy, opt => opt.Ignore());

        CreateMap<CreatePrescriptionDto, Prescription>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.CustomerId, opt => opt.Ignore()) // Set from order's customer
            .ForMember(d => d.Customer, opt => opt.Ignore())
            .ForMember(d => d.IssuedDate, opt => opt.MapFrom(s => s.IssueDate))
            .ForMember(d => d.DoctorLicenseNumber, opt => opt.MapFrom(s => s.DoctorLicense))
            .ForMember(d => d.MedicalInstitution, opt => opt.Ignore())
            .ForMember(d => d.PatientIdNumber, opt => opt.Ignore())
            .ForMember(d => d.ImagePath, opt => opt.MapFrom(s => s.ImageUrl))
            .ForMember(d => d.IsUsed, opt => opt.MapFrom(s => false))
            .ForMember(d => d.UsedDate, opt => opt.Ignore())
            .ForMember(d => d.OrderItems, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.MapFrom(s => DateTime.UtcNow))
            .ForMember(d => d.UpdatedAt, opt => opt.Ignore());
    }

    private void CreateLocationMappings()
    {
        CreateMap<BiHEntity, BiHEntityDto>()
            .ForMember(d => d.CantonCount, opt => opt.MapFrom(s => s.Cantons != null ? s.Cantons.Count : 0))
            .ForMember(d => d.MunicipalityCount, opt => opt.MapFrom(s => 
                s.Cantons != null ? s.Cantons.SelectMany(c => c.Municipalities ?? new List<Municipality>()).Count() : 0))
            .ForMember(d => d.CityCount, opt => opt.MapFrom(s =>
                s.Cantons != null ? s.Cantons.SelectMany(c => c.Municipalities ?? new List<Municipality>())
                    .SelectMany(m => m.Cities ?? new List<City>()).Count() : 0));

        CreateMap<Canton, CantonDto>()
            .ForMember(d => d.BiHEntityName, opt => opt.MapFrom(s => s.BiHEntity != null ? s.BiHEntity.Name : string.Empty))
            .ForMember(d => d.MunicipalityCount, opt => opt.MapFrom(s => s.Municipalities != null ? s.Municipalities.Count : 0))
            .ForMember(d => d.CityCount, opt => opt.MapFrom(s => 
                s.Municipalities != null ? s.Municipalities.SelectMany(m => m.Cities ?? new List<City>()).Count() : 0));

        CreateMap<Municipality, MunicipalityDto>()
            .ForMember(d => d.CantonName, opt => opt.MapFrom(s => s.Canton != null ? s.Canton.Name : string.Empty))
            .ForMember(d => d.BiHEntityId, opt => opt.MapFrom(s => s.Canton != null ? s.Canton.BiHEntityId : 0))
            .ForMember(d => d.BiHEntityName, opt => opt.MapFrom(s => s.Canton != null && s.Canton.BiHEntity != null ? s.Canton.BiHEntity.Name : string.Empty))
            .ForMember(d => d.CityCount, opt => opt.MapFrom(s => s.Cities != null ? s.Cities.Count : 0));

        CreateMap<City, CityDto>()
            .ForMember(d => d.MunicipalityName, opt => opt.MapFrom(s => s.Municipality != null ? s.Municipality.Name : string.Empty))
            .ForMember(d => d.CantonId, opt => opt.MapFrom(s => s.Municipality != null ? s.Municipality.CantonId : 0))
            .ForMember(d => d.CantonName, opt => opt.MapFrom(s => s.Municipality != null && s.Municipality.Canton != null ? s.Municipality.Canton.Name : string.Empty))
            .ForMember(d => d.BiHEntityId, opt => opt.MapFrom(s => s.Municipality != null && s.Municipality.Canton != null ? s.Municipality.Canton.BiHEntityId : 0))
            .ForMember(d => d.BiHEntityName, opt => opt.MapFrom(s => s.Municipality != null && s.Municipality.Canton != null && s.Municipality.Canton.BiHEntity != null ? s.Municipality.Canton.BiHEntity.Name : string.Empty));

        CreateMap<City, CitySummaryDto>()
            .ForMember(d => d.MunicipalityName, opt => opt.MapFrom(s => s.Municipality != null ? s.Municipality.Name : string.Empty))
            .ForMember(d => d.CantonName, opt => opt.MapFrom(s => s.Municipality != null && s.Municipality.Canton != null ? s.Municipality.Canton.Name : string.Empty));

        // Hierarchy DTOs
        CreateMap<BiHEntity, LocationHierarchyDto>()
            .ForMember(d => d.BiHEntityId, opt => opt.MapFrom(s => s.Id))
            .ForMember(d => d.BiHEntityName, opt => opt.MapFrom(s => s.Name))
            .ForMember(d => d.Cantons, opt => opt.MapFrom(s => s.Cantons));

        CreateMap<Canton, CantonWithMunicipalitiesDto>()
            .ForMember(d => d.Municipalities, opt => opt.MapFrom(s => s.Municipalities));

        CreateMap<Municipality, MunicipalityWithCitiesDto>()
            .ForMember(d => d.Cities, opt => opt.MapFrom(s => s.Cities));
    }

    private void CreateInventoryMappings()
    {
        CreateMap<Warehouse, WarehouseDto>()
            .ForMember(d => d.CityName, opt => opt.MapFrom(s => s.City != null ? s.City.Name : string.Empty))
            .ForMember(d => d.StockItemCount, opt => opt.MapFrom(s => s.InventoryStocks != null ? s.InventoryStocks.Count : 0));

        CreateMap<CreateWarehouseDto, Warehouse>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.City, opt => opt.Ignore())
            .ForMember(d => d.InventoryStocks, opt => opt.Ignore())
            .ForMember(d => d.StockMovements, opt => opt.Ignore())
            .ForMember(d => d.IsActive, opt => opt.MapFrom(s => true))
            .ForMember(d => d.CreatedAt, opt => opt.MapFrom(s => DateTime.UtcNow))
            .ForMember(d => d.UpdatedAt, opt => opt.Ignore());

        CreateMap<UpdateWarehouseDto, Warehouse>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.Code, opt => opt.Ignore()) // Code cannot be changed
            .ForMember(d => d.City, opt => opt.Ignore())
            .ForMember(d => d.InventoryStocks, opt => opt.Ignore())
            .ForMember(d => d.StockMovements, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.Ignore())
            .ForMember(d => d.UpdatedAt, opt => opt.MapFrom(s => DateTime.UtcNow));

        CreateMap<InventoryStock, InventoryStockDto>()
            .ForMember(d => d.WarehouseName, opt => opt.MapFrom(s => s.Warehouse != null ? s.Warehouse.Name : string.Empty))
            .ForMember(d => d.ProductName, opt => opt.MapFrom(s => s.Product != null ? s.Product.Name : string.Empty))
            .ForMember(d => d.ProductSku, opt => opt.MapFrom(s => s.Product != null ? s.Product.SKU : string.Empty))
            .ForMember(d => d.BatchNumber, opt => opt.MapFrom(s => s.ProductBatch != null ? s.ProductBatch.BatchNumber : null))
            .ForMember(d => d.LastUpdated, opt => opt.MapFrom(s => s.UpdatedAt ?? s.CreatedAt));

        CreateMap<StockMovement, StockMovementDto>()
            .ForMember(d => d.WarehouseName, opt => opt.MapFrom(s => s.Warehouse != null ? s.Warehouse.Name : string.Empty))
            .ForMember(d => d.ProductName, opt => opt.MapFrom(s => s.Product != null ? s.Product.Name : string.Empty))
            .ForMember(d => d.BatchNumber, opt => opt.MapFrom(s => s.ProductBatch != null ? s.ProductBatch.BatchNumber : null))
            .ForMember(d => d.MovementTypeName, opt => opt.MapFrom(s => s.MovementType.ToString()))
            .ForMember(d => d.ReferenceType, opt => opt.Ignore()) // Determined from OrderId/PurchaseOrderId
            .ForMember(d => d.ReferenceId, opt => opt.MapFrom(s => s.OrderId ?? s.PurchaseOrderId))
            .ForMember(d => d.CreatedBy, opt => opt.MapFrom(s => s.PerformedByUserId))
            .ForMember(d => d.CreatedAt, opt => opt.MapFrom(s => s.MovementDate));

        CreateMap<CreateStockMovementDto, StockMovement>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.Warehouse, opt => opt.Ignore())
            .ForMember(d => d.Product, opt => opt.Ignore())
            .ForMember(d => d.ProductBatch, opt => opt.Ignore())
            .ForMember(d => d.OrderId, opt => opt.Ignore()) // Set based on ReferenceType
            .ForMember(d => d.PurchaseOrderId, opt => opt.Ignore()) // Set based on ReferenceType
            .ForMember(d => d.Order, opt => opt.Ignore())
            .ForMember(d => d.Reason, opt => opt.MapFrom(s => s.Notes))
            .ForMember(d => d.PerformedByUserId, opt => opt.Ignore())
            .ForMember(d => d.PerformedByUser, opt => opt.Ignore())
            .ForMember(d => d.MovementDate, opt => opt.MapFrom(s => DateTime.UtcNow))
            .ForMember(d => d.CreatedAt, opt => opt.MapFrom(s => DateTime.UtcNow))
            .ForMember(d => d.UpdatedAt, opt => opt.Ignore());
    }

    // Helper methods for custom mappings
    private static string GetTierDisplayName(CustomerTier tier) => tier switch
    {
        CustomerTier.A => "Premium (A)",
        CustomerTier.B => "Standard (B)",
        CustomerTier.C => "Basic (C)",
        _ => tier.ToString()
    };

    private static string GetFullAddress(CustomerAddress address)
    {
        var parts = new List<string>();
        
        if (!string.IsNullOrEmpty(address.Street))
            parts.Add(address.Street);
        
        if (!string.IsNullOrEmpty(address.Street2))
            parts.Add(address.Street2);

        if (!string.IsNullOrEmpty(address.PostalCode))
            parts.Add(address.PostalCode);
            
        if (!string.IsNullOrEmpty(address.City))
            parts.Add(address.City);

        if (address.Canton != null)
            parts.Add(address.Canton.Name);
        
        return string.Join(", ", parts);
    }

    private void CreateFeatureFlagMappings()
    {
        // System Feature Flag mappings
        CreateMap<SystemFeatureFlag, SystemFeatureFlagDto>()
            .ForMember(d => d.ClientOverrideCount, opt => opt.Ignore()); // Set in service

        CreateMap<CreateSystemFlagDto, SystemFeatureFlag>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.ClientOverrides, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.MapFrom(s => DateTime.UtcNow))
            .ForMember(d => d.UpdatedAt, opt => opt.Ignore())
            .ForMember(d => d.CreatedBy, opt => opt.Ignore())
            .ForMember(d => d.UpdatedBy, opt => opt.Ignore())
            .ForMember(d => d.IsDeleted, opt => opt.MapFrom(s => false));

        // Client Feature Flag mappings
        CreateMap<ClientFeatureFlag, ClientFeatureFlagDto>()
            .ForMember(d => d.CustomerName, opt => opt.MapFrom(s => s.Customer != null 
                ? (!string.IsNullOrEmpty(s.Customer.CompanyName) 
                    ? s.Customer.CompanyName 
                    : $"{s.Customer.FirstName} {s.Customer.LastName}")
                : null))
            .ForMember(d => d.FlagKey, opt => opt.MapFrom(s => s.SystemFlag != null ? s.SystemFlag.Key : null))
            .ForMember(d => d.FlagName, opt => opt.MapFrom(s => s.SystemFlag != null ? s.SystemFlag.Name : null));

        CreateMap<SetClientOverrideDto, ClientFeatureFlag>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.Customer, opt => opt.Ignore())
            .ForMember(d => d.SystemFlag, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.MapFrom(s => DateTime.UtcNow))
            .ForMember(d => d.UpdatedAt, opt => opt.Ignore())
            .ForMember(d => d.CreatedBy, opt => opt.Ignore())
            .ForMember(d => d.UpdatedBy, opt => opt.Ignore())
            .ForMember(d => d.IsDeleted, opt => opt.MapFrom(s => false));

        // Feature Flag History mappings
        CreateMap<FeatureFlagHistory, FeatureFlagHistoryDto>()
            .ForMember(d => d.SystemFlagKey, opt => opt.MapFrom(s => s.SystemFlag != null ? s.SystemFlag.Key : null))
            .ForMember(d => d.CustomerName, opt => opt.MapFrom(s => s.Customer != null 
                ? (!string.IsNullOrEmpty(s.Customer.CompanyName) 
                    ? s.Customer.CompanyName 
                    : $"{s.Customer.FirstName} {s.Customer.LastName}")
                : null));
    }
}
