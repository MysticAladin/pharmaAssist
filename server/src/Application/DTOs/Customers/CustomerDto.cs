using Domain.Enums;

namespace Application.DTOs.Customers;

/// <summary>
/// Customer response DTO
/// </summary>
public class CustomerDto
{
    public int Id { get; set; }
    public int? ParentCustomerId { get; set; }
    public string? BranchCode { get; set; }
    public bool IsHeadquarters { get; set; }
    public string CustomerCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public CustomerType CustomerType { get; set; }
    public string CustomerTypeName { get; set; } = string.Empty;
    public string? TaxId { get; set; }
    public string? RegistrationNumber { get; set; }
    public string? PharmacyLicense { get; set; }
    public string? ContactPerson { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public CustomerTier Tier { get; set; }
    public string TierName { get; set; } = string.Empty;
    public decimal DiscountPercentage { get; set; }
    public decimal CreditLimit { get; set; }
    public int PaymentTermDays { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<CustomerAddressDto> Addresses { get; set; } = new();
}

/// <summary>
/// Customer summary for lists and dropdowns
/// </summary>
public class CustomerSummaryDto
{
    public int Id { get; set; }
    public int? ParentCustomerId { get; set; }
    public string? BranchCode { get; set; }
    public bool IsHeadquarters { get; set; }
    public string CustomerCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public CustomerType CustomerType { get; set; }
    public string CustomerTypeName { get; set; } = string.Empty;
    public CustomerTier Tier { get; set; }
    public string TierName { get; set; } = string.Empty;
    public string? City { get; set; }
    public bool IsActive { get; set; }
}

/// <summary>
/// Create branch (child customer) under a headquarters customer
/// </summary>
public class CreateBranchDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? BranchCode { get; set; }
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// Update branch (child customer) under a headquarters customer
/// </summary>
public class UpdateBranchDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? BranchCode { get; set; }
    public bool IsActive { get; set; }
}

/// <summary>
/// Create customer request DTO
/// </summary>
public class CreateCustomerDto
{
    public string Name { get; set; } = string.Empty;
    public CustomerType CustomerType { get; set; }
    public string? TaxId { get; set; }
    public string? RegistrationNumber { get; set; }
    public string? PharmacyLicense { get; set; }
    public string? ContactPerson { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public CustomerTier Tier { get; set; } = CustomerTier.C;
    public decimal DiscountPercentage { get; set; }
    public decimal CreditLimit { get; set; }
    public int PaymentTermDays { get; set; } = 30;
    public CreateCustomerAddressDto? PrimaryAddress { get; set; }
}

/// <summary>
/// Update customer request DTO
/// </summary>
public class UpdateCustomerDto
{
    public string Name { get; set; } = string.Empty;
    public CustomerType CustomerType { get; set; }
    public string? TaxId { get; set; }
    public string? RegistrationNumber { get; set; }
    public string? PharmacyLicense { get; set; }
    public string? ContactPerson { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public CustomerTier Tier { get; set; }
    public decimal DiscountPercentage { get; set; }
    public decimal CreditLimit { get; set; }
    public int PaymentTermDays { get; set; }
    public bool IsActive { get; set; }
}

/// <summary>
/// Customer address response DTO
/// </summary>
public class CustomerAddressDto
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public AddressType AddressType { get; set; }
    public string AddressTypeName { get; set; } = string.Empty;
    public string Street { get; set; } = string.Empty;
    public string? BuildingNumber { get; set; }
    public string PostalCode { get; set; } = string.Empty;
    public int CityId { get; set; }
    public string CityName { get; set; } = string.Empty;
    public int MunicipalityId { get; set; }
    public string MunicipalityName { get; set; } = string.Empty;
    public int CantonId { get; set; }
    public string CantonName { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string EntityName { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public string? Notes { get; set; }
    public string FullAddress { get; set; } = string.Empty;
}

/// <summary>
/// Create customer address request DTO
/// </summary>
public class CreateCustomerAddressDto
{
    public AddressType AddressType { get; set; } = AddressType.Billing;
    public string Street { get; set; } = string.Empty;
    public string? BuildingNumber { get; set; }
    public string PostalCode { get; set; } = string.Empty;
    public int CityId { get; set; }
    public bool IsPrimary { get; set; } = false;
    public string? Notes { get; set; }
}

/// <summary>
/// Update customer address request DTO
/// </summary>
public class UpdateCustomerAddressDto
{
    public AddressType AddressType { get; set; }
    public string Street { get; set; } = string.Empty;
    public string? BuildingNumber { get; set; }
    public string PostalCode { get; set; } = string.Empty;
    public int CityId { get; set; }
    public bool IsPrimary { get; set; }
    public string? Notes { get; set; }
}
