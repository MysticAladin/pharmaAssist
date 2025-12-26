using Application.DTOs.Orders;
using Domain.Enums;
using FluentValidation;

namespace Application.Validators.Orders;

/// <summary>
/// Validator for CreateOrderDto
/// </summary>
public class CreateOrderValidator : AbstractValidator<CreateOrderDto>
{
    public CreateOrderValidator()
    {
        RuleFor(x => x.CustomerId)
            .GreaterThan(0).WithMessage("Valid customer is required.");

        RuleFor(x => x.ShippingAddressId)
            .GreaterThan(0).WithMessage("Valid shipping address ID is required.")
            .When(x => x.ShippingAddressId.HasValue);

        RuleFor(x => x.BillingAddressId)
            .GreaterThan(0).WithMessage("Valid billing address ID is required.")
            .When(x => x.BillingAddressId.HasValue);

        RuleFor(x => x.RequiredDate)
            .GreaterThan(DateTime.UtcNow.Date).WithMessage("Required date must be in the future.")
            .When(x => x.RequiredDate.HasValue);

        RuleFor(x => x.Notes)
            .MaximumLength(1000).WithMessage("Notes cannot exceed 1000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Notes));

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Order must contain at least one item.");

        RuleForEach(x => x.Items)
            .SetValidator(new CreateOrderItemValidator());
    }
}

/// <summary>
/// Validator for CreatePortalOrderDto
/// </summary>
public class CreatePortalOrderValidator : AbstractValidator<CreatePortalOrderDto>
{
    public CreatePortalOrderValidator()
    {
        RuleFor(x => x.ShippingAddressId)
            .GreaterThan(0).WithMessage("Valid shipping address ID is required.")
            .When(x => x.ShippingAddressId.HasValue);

        RuleFor(x => x.BillingAddressId)
            .GreaterThan(0).WithMessage("Valid billing address ID is required.")
            .When(x => x.BillingAddressId.HasValue);

        RuleFor(x => x.RequiredDate)
            .GreaterThan(DateTime.UtcNow.Date).WithMessage("Required date must be in the future.")
            .When(x => x.RequiredDate.HasValue);

        RuleFor(x => x.Notes)
            .MaximumLength(1000).WithMessage("Notes cannot exceed 1000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Notes));

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Order must contain at least one item.");

        RuleForEach(x => x.Items)
            .SetValidator(new CreateOrderItemValidator());
    }
}

/// <summary>
/// Validator for UpdateOrderDto
/// </summary>
public class UpdateOrderValidator : AbstractValidator<UpdateOrderDto>
{
    public UpdateOrderValidator()
    {
        RuleFor(x => x.ShippingAddressId)
            .GreaterThan(0).WithMessage("Valid shipping address ID is required.")
            .When(x => x.ShippingAddressId.HasValue);

        RuleFor(x => x.BillingAddressId)
            .GreaterThan(0).WithMessage("Valid billing address ID is required.")
            .When(x => x.BillingAddressId.HasValue);

        RuleFor(x => x.RequiredDate)
            .GreaterThan(DateTime.UtcNow.Date).WithMessage("Required date must be in the future.")
            .When(x => x.RequiredDate.HasValue);

        RuleFor(x => x.Notes)
            .MaximumLength(1000).WithMessage("Notes cannot exceed 1000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Notes));

        RuleFor(x => x.InternalNotes)
            .MaximumLength(2000).WithMessage("Internal notes cannot exceed 2000 characters.")
            .When(x => !string.IsNullOrEmpty(x.InternalNotes));
    }
}

/// <summary>
/// Validator for CreateOrderItemDto
/// </summary>
public class CreateOrderItemValidator : AbstractValidator<CreateOrderItemDto>
{
    public CreateOrderItemValidator()
    {
        RuleFor(x => x.ProductId)
            .GreaterThan(0).WithMessage("Valid product is required.");

        RuleFor(x => x.ProductBatchId)
            .GreaterThan(0).WithMessage("Valid product batch ID is required.")
            .When(x => x.ProductBatchId.HasValue);

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than 0.")
            .LessThanOrEqualTo(10000).WithMessage("Quantity cannot exceed 10,000 units.");

        RuleFor(x => x.DiscountPercentage)
            .InclusiveBetween(0, 100).WithMessage("Discount percentage must be between 0% and 100%.")
            .When(x => x.DiscountPercentage.HasValue);

        RuleFor(x => x.PrescriptionId)
            .GreaterThan(0).WithMessage("Valid prescription ID is required.")
            .When(x => x.PrescriptionId.HasValue);
    }
}

/// <summary>
/// Validator for UpdateOrderItemDto
/// </summary>
public class UpdateOrderItemValidator : AbstractValidator<UpdateOrderItemDto>
{
    public UpdateOrderItemValidator()
    {
        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than 0.")
            .LessThanOrEqualTo(10000).WithMessage("Quantity cannot exceed 10,000 units.");

        RuleFor(x => x.DiscountPercentage)
            .InclusiveBetween(0, 100).WithMessage("Discount percentage must be between 0% and 100%.")
            .When(x => x.DiscountPercentage.HasValue);
    }
}

/// <summary>
/// Validator for UpdateOrderStatusDto
/// </summary>
public class UpdateOrderStatusValidator : AbstractValidator<UpdateOrderStatusDto>
{
    public UpdateOrderStatusValidator()
    {
        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Invalid order status.");

        RuleFor(x => x.Notes)
            .MaximumLength(500).WithMessage("Status notes cannot exceed 500 characters.")
            .When(x => !string.IsNullOrEmpty(x.Notes));
    }
}

/// <summary>
/// Validator for UpdatePaymentStatusDto
/// </summary>
public class UpdatePaymentStatusValidator : AbstractValidator<UpdatePaymentStatusDto>
{
    public UpdatePaymentStatusValidator()
    {
        RuleFor(x => x.PaymentStatus)
            .IsInEnum().WithMessage("Invalid payment status.");

        RuleFor(x => x.Notes)
            .MaximumLength(500).WithMessage("Payment notes cannot exceed 500 characters.")
            .When(x => !string.IsNullOrEmpty(x.Notes));
    }
}

/// <summary>
/// Validator for CreatePrescriptionDto
/// </summary>
public class CreatePrescriptionValidator : AbstractValidator<CreatePrescriptionDto>
{
    public CreatePrescriptionValidator()
    {
        RuleFor(x => x.PrescriptionNumber)
            .NotEmpty().WithMessage("Prescription number is required.")
            .MaximumLength(50).WithMessage("Prescription number cannot exceed 50 characters.");

        RuleFor(x => x.DoctorName)
            .NotEmpty().WithMessage("Doctor name is required.")
            .MaximumLength(200).WithMessage("Doctor name cannot exceed 200 characters.");

        RuleFor(x => x.DoctorLicense)
            .MaximumLength(50).WithMessage("Doctor license cannot exceed 50 characters.")
            .When(x => !string.IsNullOrEmpty(x.DoctorLicense));

        RuleFor(x => x.PatientName)
            .MaximumLength(200).WithMessage("Patient name cannot exceed 200 characters.")
            .When(x => !string.IsNullOrEmpty(x.PatientName));

        RuleFor(x => x.IssueDate)
            .LessThanOrEqualTo(DateTime.UtcNow.Date).WithMessage("Issue date cannot be in the future.");

        RuleFor(x => x.ExpiryDate)
            .GreaterThan(x => x.IssueDate).WithMessage("Expiry date must be after issue date.")
            .When(x => x.ExpiryDate.HasValue);

        RuleFor(x => x.ImageUrl)
            .MaximumLength(500).WithMessage("Image URL cannot exceed 500 characters.")
            .When(x => !string.IsNullOrEmpty(x.ImageUrl));

        RuleFor(x => x.Notes)
            .MaximumLength(1000).WithMessage("Notes cannot exceed 1000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Notes));
    }
}

/// <summary>
/// Validator for VerifyPrescriptionDto
/// </summary>
public class VerifyPrescriptionValidator : AbstractValidator<VerifyPrescriptionDto>
{
    public VerifyPrescriptionValidator()
    {
        RuleFor(x => x.Notes)
            .MaximumLength(500).WithMessage("Verification notes cannot exceed 500 characters.")
            .When(x => !string.IsNullOrEmpty(x.Notes));
    }
}
