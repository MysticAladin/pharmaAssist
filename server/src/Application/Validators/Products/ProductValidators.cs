using Application.DTOs.Products;
using FluentValidation;

namespace Application.Validators.Products;

/// <summary>
/// Validator for CreateProductDto
/// </summary>
public class CreateProductValidator : AbstractValidator<CreateProductDto>
{
    public CreateProductValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Product name is required.")
            .MaximumLength(200).WithMessage("Product name cannot exceed 200 characters.");

        RuleFor(x => x.NameLocal)
            .MaximumLength(200).WithMessage("Local name cannot exceed 200 characters.")
            .When(x => !string.IsNullOrEmpty(x.NameLocal));

        RuleFor(x => x.GenericName)
            .MaximumLength(200).WithMessage("Generic name cannot exceed 200 characters.")
            .When(x => !string.IsNullOrEmpty(x.GenericName));

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.SKU)
            .NotEmpty().WithMessage("SKU is required.")
            .MaximumLength(50).WithMessage("SKU cannot exceed 50 characters.")
            .Matches(@"^[A-Za-z0-9\-_]+$").WithMessage("SKU can only contain letters, numbers, hyphens, and underscores.");

        RuleFor(x => x.Barcode)
            .MaximumLength(50).WithMessage("Barcode cannot exceed 50 characters.")
            .When(x => !string.IsNullOrEmpty(x.Barcode));

        RuleFor(x => x.ATCCode)
            .MaximumLength(10).WithMessage("ATC code cannot exceed 10 characters.")
            .Matches(@"^[A-Z][0-9]{2}[A-Z]{2}[0-9]{2}$").WithMessage("Invalid ATC code format.")
            .When(x => !string.IsNullOrEmpty(x.ATCCode));

        RuleFor(x => x.CategoryId)
            .GreaterThan(0).WithMessage("Valid category is required.");

        RuleFor(x => x.ManufacturerId)
            .GreaterThan(0).WithMessage("Valid manufacturer is required.");

        RuleFor(x => x.UnitPrice)
            .GreaterThan(0).WithMessage("Unit price must be greater than 0.")
            .LessThanOrEqualTo(1000000).WithMessage("Unit price cannot exceed 1,000,000 KM.");

        RuleFor(x => x.CostPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Cost price cannot be negative.")
            .LessThan(x => x.UnitPrice).WithMessage("Cost price should be less than unit price.")
            .When(x => x.CostPrice.HasValue);

        RuleFor(x => x.TaxRate)
            .InclusiveBetween(0, 100).WithMessage("Tax rate must be between 0% and 100%.");

        RuleFor(x => x.DosageForm)
            .MaximumLength(100).WithMessage("Dosage form cannot exceed 100 characters.")
            .When(x => !string.IsNullOrEmpty(x.DosageForm));

        RuleFor(x => x.Strength)
            .MaximumLength(100).WithMessage("Strength cannot exceed 100 characters.")
            .When(x => !string.IsNullOrEmpty(x.Strength));

        RuleFor(x => x.PackageSize)
            .MaximumLength(100).WithMessage("Package size cannot exceed 100 characters.")
            .When(x => !string.IsNullOrEmpty(x.PackageSize));

        RuleFor(x => x.ReorderLevel)
            .GreaterThanOrEqualTo(0).WithMessage("Reorder level cannot be negative.");

        RuleFor(x => x.ReorderQuantity)
            .GreaterThan(0).WithMessage("Reorder quantity must be greater than 0.");

        RuleFor(x => x.ImageUrl)
            .MaximumLength(500).WithMessage("Image URL cannot exceed 500 characters.")
            .Must(BeAValidUrl).WithMessage("Invalid image URL format.")
            .When(x => !string.IsNullOrEmpty(x.ImageUrl));
    }

    private bool BeAValidUrl(string? url)
    {
        if (string.IsNullOrEmpty(url)) return true;
        return Uri.TryCreate(url, UriKind.Absolute, out var uriResult)
               && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps);
    }
}

/// <summary>
/// Validator for UpdateProductDto
/// </summary>
public class UpdateProductValidator : AbstractValidator<UpdateProductDto>
{
    public UpdateProductValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Product name is required.")
            .MaximumLength(200).WithMessage("Product name cannot exceed 200 characters.");

        RuleFor(x => x.NameLocal)
            .MaximumLength(200).WithMessage("Local name cannot exceed 200 characters.")
            .When(x => !string.IsNullOrEmpty(x.NameLocal));

        RuleFor(x => x.GenericName)
            .MaximumLength(200).WithMessage("Generic name cannot exceed 200 characters.")
            .When(x => !string.IsNullOrEmpty(x.GenericName));

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.CategoryId)
            .GreaterThan(0).WithMessage("Valid category is required.");

        RuleFor(x => x.ManufacturerId)
            .GreaterThan(0).WithMessage("Valid manufacturer is required.");

        RuleFor(x => x.UnitPrice)
            .GreaterThan(0).WithMessage("Unit price must be greater than 0.")
            .LessThanOrEqualTo(1000000).WithMessage("Unit price cannot exceed 1,000,000 KM.");

        RuleFor(x => x.CostPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Cost price cannot be negative.")
            .When(x => x.CostPrice.HasValue);

        RuleFor(x => x.TaxRate)
            .InclusiveBetween(0, 100).WithMessage("Tax rate must be between 0% and 100%.");

        RuleFor(x => x.DosageForm)
            .MaximumLength(100).WithMessage("Dosage form cannot exceed 100 characters.")
            .When(x => !string.IsNullOrEmpty(x.DosageForm));

        RuleFor(x => x.Strength)
            .MaximumLength(100).WithMessage("Strength cannot exceed 100 characters.")
            .When(x => !string.IsNullOrEmpty(x.Strength));

        RuleFor(x => x.PackageSize)
            .MaximumLength(100).WithMessage("Package size cannot exceed 100 characters.")
            .When(x => !string.IsNullOrEmpty(x.PackageSize));

        RuleFor(x => x.ReorderLevel)
            .GreaterThanOrEqualTo(0).WithMessage("Reorder level cannot be negative.");

        RuleFor(x => x.ReorderQuantity)
            .GreaterThan(0).WithMessage("Reorder quantity must be greater than 0.");

        RuleFor(x => x.ImageUrl)
            .MaximumLength(500).WithMessage("Image URL cannot exceed 500 characters.")
            .When(x => !string.IsNullOrEmpty(x.ImageUrl));
    }
}
