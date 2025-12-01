using Application.DTOs.Customers;
using Domain.Enums;
using FluentValidation;

namespace Application.Validators.Customers;

/// <summary>
/// Validator for CreateCustomerDto
/// </summary>
public class CreateCustomerValidator : AbstractValidator<CreateCustomerDto>
{
    public CreateCustomerValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Customer name is required.")
            .MaximumLength(200).WithMessage("Customer name cannot exceed 200 characters.");

        RuleFor(x => x.CustomerType)
            .IsInEnum().WithMessage("Invalid customer type.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Invalid email address format.")
            .MaximumLength(255).WithMessage("Email cannot exceed 255 characters.");

        RuleFor(x => x.Phone)
            .MaximumLength(50).WithMessage("Phone number cannot exceed 50 characters.")
            .Matches(@"^\+?[0-9\s\-\(\)]+$").WithMessage("Invalid phone number format.")
            .When(x => !string.IsNullOrEmpty(x.Phone));

        RuleFor(x => x.TaxId)
            .MaximumLength(20).WithMessage("Tax ID cannot exceed 20 characters.")
            .Matches(@"^[0-9]+$").WithMessage("Tax ID should only contain numbers.")
            .When(x => !string.IsNullOrEmpty(x.TaxId));

        RuleFor(x => x.RegistrationNumber)
            .MaximumLength(50).WithMessage("Registration number cannot exceed 50 characters.")
            .When(x => !string.IsNullOrEmpty(x.RegistrationNumber));

        RuleFor(x => x.PharmacyLicense)
            .NotEmpty().WithMessage("Pharmacy license is required for pharmacy customers.")
            .MaximumLength(50).WithMessage("Pharmacy license cannot exceed 50 characters.")
            .When(x => x.CustomerType == CustomerType.Pharmacy);

        RuleFor(x => x.ContactPerson)
            .MaximumLength(100).WithMessage("Contact person name cannot exceed 100 characters.")
            .When(x => !string.IsNullOrEmpty(x.ContactPerson));

        RuleFor(x => x.Tier)
            .IsInEnum().WithMessage("Invalid customer tier.");

        RuleFor(x => x.DiscountPercentage)
            .InclusiveBetween(0, 100).WithMessage("Discount percentage must be between 0 and 100.");

        RuleFor(x => x.CreditLimit)
            .GreaterThanOrEqualTo(0).WithMessage("Credit limit cannot be negative.")
            .LessThanOrEqualTo(10000000).WithMessage("Credit limit cannot exceed 10,000,000 KM.");

        RuleFor(x => x.PaymentTermDays)
            .InclusiveBetween(0, 365).WithMessage("Payment term must be between 0 and 365 days.");

        RuleFor(x => x.PrimaryAddress)
            .SetValidator(new CreateCustomerAddressValidator()!)
            .When(x => x.PrimaryAddress != null);
    }
}

/// <summary>
/// Validator for UpdateCustomerDto
/// </summary>
public class UpdateCustomerValidator : AbstractValidator<UpdateCustomerDto>
{
    public UpdateCustomerValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Customer name is required.")
            .MaximumLength(200).WithMessage("Customer name cannot exceed 200 characters.");

        RuleFor(x => x.CustomerType)
            .IsInEnum().WithMessage("Invalid customer type.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Invalid email address format.")
            .MaximumLength(255).WithMessage("Email cannot exceed 255 characters.");

        RuleFor(x => x.Phone)
            .MaximumLength(50).WithMessage("Phone number cannot exceed 50 characters.")
            .Matches(@"^\+?[0-9\s\-\(\)]+$").WithMessage("Invalid phone number format.")
            .When(x => !string.IsNullOrEmpty(x.Phone));

        RuleFor(x => x.TaxId)
            .MaximumLength(20).WithMessage("Tax ID cannot exceed 20 characters.")
            .Matches(@"^[0-9]+$").WithMessage("Tax ID should only contain numbers.")
            .When(x => !string.IsNullOrEmpty(x.TaxId));

        RuleFor(x => x.RegistrationNumber)
            .MaximumLength(50).WithMessage("Registration number cannot exceed 50 characters.")
            .When(x => !string.IsNullOrEmpty(x.RegistrationNumber));

        RuleFor(x => x.PharmacyLicense)
            .NotEmpty().WithMessage("Pharmacy license is required for pharmacy customers.")
            .MaximumLength(50).WithMessage("Pharmacy license cannot exceed 50 characters.")
            .When(x => x.CustomerType == CustomerType.Pharmacy);

        RuleFor(x => x.ContactPerson)
            .MaximumLength(100).WithMessage("Contact person name cannot exceed 100 characters.")
            .When(x => !string.IsNullOrEmpty(x.ContactPerson));

        RuleFor(x => x.Tier)
            .IsInEnum().WithMessage("Invalid customer tier.");

        RuleFor(x => x.DiscountPercentage)
            .InclusiveBetween(0, 100).WithMessage("Discount percentage must be between 0 and 100.");

        RuleFor(x => x.CreditLimit)
            .GreaterThanOrEqualTo(0).WithMessage("Credit limit cannot be negative.")
            .LessThanOrEqualTo(10000000).WithMessage("Credit limit cannot exceed 10,000,000 KM.");

        RuleFor(x => x.PaymentTermDays)
            .InclusiveBetween(0, 365).WithMessage("Payment term must be between 0 and 365 days.");
    }
}

/// <summary>
/// Validator for CreateCustomerAddressDto
/// </summary>
public class CreateCustomerAddressValidator : AbstractValidator<CreateCustomerAddressDto>
{
    public CreateCustomerAddressValidator()
    {
        RuleFor(x => x.AddressType)
            .IsInEnum().WithMessage("Invalid address type.");

        RuleFor(x => x.Street)
            .NotEmpty().WithMessage("Street is required.")
            .MaximumLength(200).WithMessage("Street cannot exceed 200 characters.");

        RuleFor(x => x.BuildingNumber)
            .MaximumLength(20).WithMessage("Building number cannot exceed 20 characters.")
            .When(x => !string.IsNullOrEmpty(x.BuildingNumber));

        RuleFor(x => x.PostalCode)
            .NotEmpty().WithMessage("Postal code is required.")
            .MaximumLength(10).WithMessage("Postal code cannot exceed 10 characters.")
            .Matches(@"^\d{5}$").WithMessage("Postal code must be 5 digits (BiH format).");

        RuleFor(x => x.CityId)
            .GreaterThan(0).WithMessage("City is required.");

        RuleFor(x => x.Notes)
            .MaximumLength(500).WithMessage("Notes cannot exceed 500 characters.")
            .When(x => !string.IsNullOrEmpty(x.Notes));
    }
}

/// <summary>
/// Validator for UpdateCustomerAddressDto
/// </summary>
public class UpdateCustomerAddressValidator : AbstractValidator<UpdateCustomerAddressDto>
{
    public UpdateCustomerAddressValidator()
    {
        RuleFor(x => x.AddressType)
            .IsInEnum().WithMessage("Invalid address type.");

        RuleFor(x => x.Street)
            .NotEmpty().WithMessage("Street is required.")
            .MaximumLength(200).WithMessage("Street cannot exceed 200 characters.");

        RuleFor(x => x.BuildingNumber)
            .MaximumLength(20).WithMessage("Building number cannot exceed 20 characters.")
            .When(x => !string.IsNullOrEmpty(x.BuildingNumber));

        RuleFor(x => x.PostalCode)
            .NotEmpty().WithMessage("Postal code is required.")
            .MaximumLength(10).WithMessage("Postal code cannot exceed 10 characters.")
            .Matches(@"^\d{5}$").WithMessage("Postal code must be 5 digits (BiH format).");

        RuleFor(x => x.CityId)
            .GreaterThan(0).WithMessage("City is required.");

        RuleFor(x => x.Notes)
            .MaximumLength(500).WithMessage("Notes cannot exceed 500 characters.")
            .When(x => !string.IsNullOrEmpty(x.Notes));
    }
}
