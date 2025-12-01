using Application.DTOs.Inventory;
using Domain.Enums;
using FluentValidation;

namespace Application.Validators.Inventory;

/// <summary>
/// Validator for CreateWarehouseDto
/// </summary>
public class CreateWarehouseValidator : AbstractValidator<CreateWarehouseDto>
{
    public CreateWarehouseValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Warehouse name is required.")
            .MaximumLength(100).WithMessage("Warehouse name cannot exceed 100 characters.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Warehouse code is required.")
            .MaximumLength(20).WithMessage("Code cannot exceed 20 characters.")
            .Matches(@"^[A-Z0-9\-]+$").WithMessage("Code can only contain uppercase letters, numbers, and hyphens.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters.")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.CityId)
            .GreaterThan(0).WithMessage("Valid city is required.");

        RuleFor(x => x.Address)
            .NotEmpty().WithMessage("Address is required.")
            .MaximumLength(200).WithMessage("Address cannot exceed 200 characters.");

        RuleFor(x => x.ContactPerson)
            .MaximumLength(100).WithMessage("Contact person name cannot exceed 100 characters.")
            .When(x => !string.IsNullOrEmpty(x.ContactPerson));

        RuleFor(x => x.ContactPhone)
            .MaximumLength(50).WithMessage("Contact phone cannot exceed 50 characters.")
            .Matches(@"^\+?[0-9\s\-\(\)]+$").WithMessage("Invalid phone number format.")
            .When(x => !string.IsNullOrEmpty(x.ContactPhone));
    }
}

/// <summary>
/// Validator for UpdateWarehouseDto
/// </summary>
public class UpdateWarehouseValidator : AbstractValidator<UpdateWarehouseDto>
{
    public UpdateWarehouseValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Warehouse name is required.")
            .MaximumLength(100).WithMessage("Warehouse name cannot exceed 100 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters.")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.CityId)
            .GreaterThan(0).WithMessage("Valid city is required.");

        RuleFor(x => x.Address)
            .NotEmpty().WithMessage("Address is required.")
            .MaximumLength(200).WithMessage("Address cannot exceed 200 characters.");

        RuleFor(x => x.ContactPerson)
            .MaximumLength(100).WithMessage("Contact person name cannot exceed 100 characters.")
            .When(x => !string.IsNullOrEmpty(x.ContactPerson));

        RuleFor(x => x.ContactPhone)
            .MaximumLength(50).WithMessage("Contact phone cannot exceed 50 characters.")
            .Matches(@"^\+?[0-9\s\-\(\)]+$").WithMessage("Invalid phone number format.")
            .When(x => !string.IsNullOrEmpty(x.ContactPhone));
    }
}

/// <summary>
/// Validator for CreateStockMovementDto
/// </summary>
public class CreateStockMovementValidator : AbstractValidator<CreateStockMovementDto>
{
    public CreateStockMovementValidator()
    {
        RuleFor(x => x.WarehouseId)
            .GreaterThan(0).WithMessage("Valid warehouse is required.");

        RuleFor(x => x.ProductId)
            .GreaterThan(0).WithMessage("Valid product is required.");

        RuleFor(x => x.ProductBatchId)
            .GreaterThan(0).WithMessage("Valid product batch ID is required.")
            .When(x => x.ProductBatchId.HasValue);

        RuleFor(x => x.MovementType)
            .IsInEnum().WithMessage("Invalid movement type.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than 0.")
            .LessThanOrEqualTo(100000).WithMessage("Quantity cannot exceed 100,000 units.");

        RuleFor(x => x.ReferenceNumber)
            .MaximumLength(50).WithMessage("Reference number cannot exceed 50 characters.")
            .When(x => !string.IsNullOrEmpty(x.ReferenceNumber));

        RuleFor(x => x.ReferenceType)
            .MaximumLength(50).WithMessage("Reference type cannot exceed 50 characters.")
            .When(x => !string.IsNullOrEmpty(x.ReferenceType));

        RuleFor(x => x.ReferenceId)
            .GreaterThan(0).WithMessage("Valid reference ID is required.")
            .When(x => x.ReferenceId.HasValue);

        RuleFor(x => x.Notes)
            .MaximumLength(500).WithMessage("Notes cannot exceed 500 characters.")
            .When(x => !string.IsNullOrEmpty(x.Notes));
    }
}

/// <summary>
/// Validator for StockAdjustmentDto
/// </summary>
public class StockAdjustmentValidator : AbstractValidator<StockAdjustmentDto>
{
    public StockAdjustmentValidator()
    {
        RuleFor(x => x.WarehouseId)
            .GreaterThan(0).WithMessage("Valid warehouse is required.");

        RuleFor(x => x.ProductId)
            .GreaterThan(0).WithMessage("Valid product is required.");

        RuleFor(x => x.ProductBatchId)
            .GreaterThan(0).WithMessage("Valid product batch ID is required.")
            .When(x => x.ProductBatchId.HasValue);

        RuleFor(x => x.NewQuantity)
            .GreaterThanOrEqualTo(0).WithMessage("New quantity cannot be negative.")
            .LessThanOrEqualTo(1000000).WithMessage("Quantity cannot exceed 1,000,000 units.");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Adjustment reason is required.")
            .MaximumLength(200).WithMessage("Reason cannot exceed 200 characters.");

        RuleFor(x => x.Notes)
            .MaximumLength(500).WithMessage("Notes cannot exceed 500 characters.")
            .When(x => !string.IsNullOrEmpty(x.Notes));
    }
}

/// <summary>
/// Validator for StockTransferDto
/// </summary>
public class StockTransferValidator : AbstractValidator<StockTransferDto>
{
    public StockTransferValidator()
    {
        RuleFor(x => x.SourceWarehouseId)
            .GreaterThan(0).WithMessage("Valid source warehouse is required.");

        RuleFor(x => x.DestinationWarehouseId)
            .GreaterThan(0).WithMessage("Valid destination warehouse is required.")
            .NotEqual(x => x.SourceWarehouseId).WithMessage("Source and destination warehouses must be different.");

        RuleFor(x => x.ProductId)
            .GreaterThan(0).WithMessage("Valid product is required.");

        RuleFor(x => x.ProductBatchId)
            .GreaterThan(0).WithMessage("Valid product batch ID is required.")
            .When(x => x.ProductBatchId.HasValue);

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Transfer quantity must be greater than 0.")
            .LessThanOrEqualTo(100000).WithMessage("Transfer quantity cannot exceed 100,000 units.");

        RuleFor(x => x.Notes)
            .MaximumLength(500).WithMessage("Notes cannot exceed 500 characters.")
            .When(x => !string.IsNullOrEmpty(x.Notes));
    }
}
